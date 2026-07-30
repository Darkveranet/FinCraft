import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId } from './helpers.mjs';

const state = { reportId: null, reportName: `FinCraft Reporting ${runId}`.slice(0, 100), mailingJobId: null };
const rows = value => value?.pageItems || (Array.isArray(value) ? value : []);

async function raw(request, method, path, data) {
  return request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, {
    method, data, ignoreHTTPSErrors: true,
    headers: {
      'Fineract-Platform-TenantId': cfg.tenant,
      Authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`,
      'Content-Type': 'application/json'
    }
  });
}
async function optional(request, method, path, data) {
  const response = await raw(request, method, path, data);
  const text = await response.text();
  let body = {}; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { supported: response.ok(), status: response.status(), body, headers: response.headers() };
}

function reportPayload(overrides = {}) {
  return {
    reportName: state.reportName,
    reportType: 'Table',
    reportCategory: 'Client',
    reportSubType: 'Module13',
    description: 'Module 13 isolated reporting lifecycle',
    reportSql: "SELECT 1 AS module_number, 'FinCraft' AS application_name",
    useReport: true,
    ...overrides
  };
}

test.describe.serial('module 13 - reporting lifecycle', () => {
  test('load report catalogue and report template', async ({ request }) => {
    const [list, template] = await Promise.all([
      fineract(request, 'GET', '/reports'), fineract(request, 'GET', '/reports/template')
    ]);
    expect(Array.isArray(list)).toBeTruthy();
    expect(template).toBeDefined();
    test.info().annotations.push({ type: 'report-catalogue', description: `${list.length} report definition(s) available` });
  });

  test('create, retrieve, update, and list custom report definition', async ({ request }) => {
    const created = await fineract(request, 'POST', '/reports', reportPayload());
    state.reportId = created.resourceId;
    expect(state.reportId).toBeTruthy();
    let report = await fineract(request, 'GET', `/reports/${state.reportId}`);
    expect(report.reportName).toBe(state.reportName);
    expect(report.reportType).toBe('Table');

    await fineract(request, 'PUT', `/reports/${state.reportId}`, reportPayload({
      reportCategory: 'Loan', description: 'Module 13 reporting lifecycle updated',
      reportSql: "SELECT 13 AS module_number, 'Reporting' AS module_name"
    }));
    report = await fineract(request, 'GET', `/reports/${state.reportId}`);
    expect(report.reportCategory).toBe('Loan');
    expect(report.description).toContain('updated');
    expect((await fineract(request, 'GET', '/reports')).some(x => x.id === state.reportId)).toBeTruthy();
  });

  test('reject invalid and duplicate report definitions', async ({ request }) => {
    const missingSql = await raw(request, 'POST', '/reports', {
      reportName: `Invalid ${runId}`, reportType: 'Table', useReport: true
    });
    expect(missingSql.ok()).toBeFalsy();
    expect([400, 403, 409, 422]).toContain(missingSql.status());

    const duplicate = await raw(request, 'POST', '/reports', reportPayload());
    expect(duplicate.ok()).toBeFalsy();
    expect([400, 403, 409, 422]).toContain(duplicate.status());
  });

  test('run custom report as JSON and validate schema and data', async ({ request }) => {
    const encoded = encodeURIComponent(state.reportName);
    const result = await fineract(request, 'GET', `/runreports/${encoded}?output-type=JSON&genericResultSet=true`);
    expect(Array.isArray(result.columnHeaders)).toBeTruthy();
    expect(Array.isArray(result.data)).toBeTruthy();
    expect(result.columnHeaders.length).toBeGreaterThanOrEqual(2);
    expect(result.data.length).toBeGreaterThanOrEqual(1);
    const names = result.columnHeaders.map(x => String(x.columnName || '').toLowerCase());
    expect(names.some(x => x.includes('module'))).toBeTruthy();
  });

  test('query available exports and probe CSV, XLS, and PDF outputs', async ({ request }) => {
    const encoded = encodeURIComponent(state.reportName);
    const exportsResult = await optional(request, 'GET', `/runreports/availableExports/${encoded}`);
    test.info().annotations.push({ type: 'available-exports', description: exportsResult.supported ? JSON.stringify(exportsResult.body) : `UNSUPPORTED HTTP ${exportsResult.status}` });

    for (const outputType of ['CSV', 'XLS', 'PDF']) {
      const result = await optional(request, 'GET', `/runreports/${encoded}?output-type=${outputType}`);
      test.info().annotations.push({ type: `export-${outputType}`, description: result.supported ? `SUPPORTED content-type=${result.headers['content-type'] || 'unknown'}` : `UNSUPPORTED HTTP ${result.status}` });
    }
  });

  test('run representative core reports with parameter-aware capability reporting', async ({ request }) => {
    const catalogue = await fineract(request, 'GET', '/reports');
    const preferred = ['Portfolio at a glance', 'ActiveLoansInArrears', 'PortfolioAtRisk'];
    const available = preferred.filter(name => catalogue.some(x => x.reportName === name));
    expect(available.length).toBeGreaterThanOrEqual(1);
    for (const reportName of available) {
      const result = await optional(request, 'GET', `/runreports/${encodeURIComponent(reportName)}?output-type=JSON&genericResultSet=true&R_officeId=-1`);
      test.info().annotations.push({ type: `core-report-${reportName}`, description: result.supported ? `${(result.body.data || []).length} row(s)` : `REQUIRES PARAMETERS/UNAVAILABLE HTTP ${result.status}` });
    }
  });

  test('report mailing template, lifecycle, and run history are capability-tested', async ({ request }) => {
    const template = await optional(request, 'GET', '/reportmailingjobs/template');
    if (!template.supported) test.skip(true, `Report mailing unavailable: HTTP ${template.status}`);
    const startDateTime = new Date(Date.now() + 86400000).toISOString().replace('T', ' ').slice(0, 19);
    const created = await optional(request, 'POST', '/reportmailingjobs', {
      name: `FinCraft Mailing ${runId}`.slice(0, 100), stretchyReportId: state.reportId,
      emailRecipients: 'ci-report@example.invalid', emailSubject: 'FinCraft CI report',
      emailMessage: 'Automated isolated reporting test', emailAttachmentFileFormatId: 'csv',
      startDateTime, recurrence: 'FREQ=DAILY;INTERVAL=1', isActive: false,
      dateFormat: 'yyyy-MM-dd HH:mm:ss', locale: 'en'
    });
    if (!created.supported) test.skip(true, `Mailing job creation unavailable: HTTP ${created.status}`);
    state.mailingJobId = created.body.resourceId;
    expect(state.mailingJobId).toBeTruthy();
    await fineract(request, 'GET', `/reportmailingjobs/${state.mailingJobId}`);
    await fineract(request, 'PUT', `/reportmailingjobs/${state.mailingJobId}`, {
      name: `FinCraft Mailing Updated ${runId}`.slice(0, 100), stretchyReportId: state.reportId,
      emailRecipients: 'ci-report@example.invalid', emailSubject: 'Updated FinCraft CI report',
      emailMessage: 'Updated automated reporting test', emailAttachmentFileFormatId: 'csv',
      startDateTime, recurrence: 'FREQ=WEEKLY;INTERVAL=1', isActive: false,
      dateFormat: 'yyyy-MM-dd HH:mm:ss', locale: 'en'
    });
    expect(rows(await fineract(request, 'GET', '/reportmailingjobs?limit=200')).some(x => x.id === state.mailingJobId)).toBeTruthy();
    const history = await optional(request, 'GET', `/reportmailingjobrunhistory?reportMailingJobId=${state.mailingJobId}&limit=100`);
    expect(history.supported).toBeTruthy();
    await fineract(request, 'DELETE', `/reportmailingjobs/${state.mailingJobId}`);
    state.mailingJobId = null;
  });

  test('reports and report-mailing pages render through FinCraft', async ({ page }) => {
    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('reports'); });
    const content = page.locator('#contentArea');
    await expect(content).toContainText(/Reports|Report|FinCraft/i, { timeout: 30_000 });
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);

    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('report-mailing'); });
    await expect(content).toContainText(/Report|Mailing|FinCraft/i, { timeout: 30_000 });
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('delete disposable custom report definition', async ({ request }) => {
    await fineract(request, 'DELETE', `/reports/${state.reportId}`);
    const response = await raw(request, 'GET', `/reports/${state.reportId}`);
    expect(response.ok()).toBeFalsy();
    expect([404, 410]).toContain(response.status());
  });
});
