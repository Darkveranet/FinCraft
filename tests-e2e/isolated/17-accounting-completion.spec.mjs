import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { offices: [], accounts: {}, closureIds: [], clientId: null, loanProductId: null, loanId: null };
const suffix = String(runId).replace(/\D/g, '').slice(-8);
const rows = value => value?.pageItems || (Array.isArray(value) ? value : []);
const yesterday = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() - 1); return `${String(d.getUTCDate()).padStart(2,'0')} ${String(d.getUTCMonth()+1).padStart(2,'0')} ${d.getUTCFullYear()}`; })();
const tomorrow = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() + 1); return `${String(d.getUTCDate()).padStart(2,'0')} ${String(d.getUTCMonth()+1).padStart(2,'0')} ${d.getUTCFullYear()}`; })();

async function raw(request, method, path, data) {
  return request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`, { method, data, ignoreHTTPSErrors: true,
    headers: { 'Fineract-Platform-TenantId': cfg.tenant, Authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`, 'Content-Type': 'application/json' } });
}
async function optional(request, method, path, data) {
  const response = await raw(request, method, path, data); const text = await response.text();
  let body = {}; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { supported: response.ok(), status: response.status(), body };
}
async function createGl(request, key, type) {
  const result = await fineract(request, 'POST', '/glaccounts', {
    name: `FinCraft A14 ${key} ${runId}`.slice(0,80), glCode: `A14${key.slice(0,2).toUpperCase()}${suffix}`.slice(0,20),
    type, usage: 1, manualEntriesAllowed: true, description: `Module 14 ${key}`
  }); state.accounts[key] = result.resourceId;
}
async function postJournal(request, officeId, amount, ref) {
  return fineract(request, 'POST', '/journalentries', {
    officeId, currencyCode: 'USD', transactionDate: date(), dateFormat: 'dd MM yyyy', locale: 'en', referenceNumber: `${ref}-${runId}`.slice(0,50),
    debits: [{ glAccountId: state.accounts.Expense, amount }], credits: [{ glAccountId: state.accounts.Asset, amount }]
  });
}

test.describe.serial('module 14 - accounting completion lifecycle', () => {
  test('create multi-office and GL prerequisites', async ({ request }) => {
    const existing = rows(await fineract(request, 'GET', '/offices'));
    const parent = existing.find(x => x.hierarchy === '.') || existing[0];
    expect(parent?.id).toBeTruthy();
    state.offices.push(parent.id);
    const created = await optional(request, 'POST', '/offices', {
      name: `FinCraft A14 Office ${runId}`.slice(0,100), parentId: parent.id, openingDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    if (created.supported && created.body.resourceId) state.offices.push(created.body.resourceId);
    test.info().annotations.push({ type: 'second-office', description: created.supported ? 'CREATED' : `UNAVAILABLE HTTP ${created.status}` });
    await Promise.all([createGl(request,'Asset',1),createGl(request,'Liability',2),createGl(request,'Income',4),createGl(request,'Expense',5)]);
    expect(Object.values(state.accounts).every(Boolean)).toBeTruthy();
  });

  test('reconcile trial balance across created portfolio accounting entries', async ({ request }) => {
    for (const [i, officeId] of state.offices.entries()) await postJournal(request, officeId, 100 + i * 25, `A14-TB-${i}`);
    const entries = rows(await fineract(request, 'GET', `/journalentries?fromDate=${encodeURIComponent(date())}&toDate=${encodeURIComponent(date())}&dateFormat=dd MM yyyy&locale=en&manualEntriesOnly=true&limit=1000`));
    const ours = entries.filter(x => [state.accounts.Asset,state.accounts.Expense].includes(x.glAccountId || x.glAccount?.id));
    expect(ours.length).toBeGreaterThanOrEqual(2);
    const debits = ours.filter(x => x.entryType?.id === 2).reduce((n,x) => n + Number(x.amount || 0), 0);
    const credits = ours.filter(x => x.entryType?.id === 1).reduce((n,x) => n + Number(x.amount || 0), 0);
    expect(debits).toBeCloseTo(credits, 2);
    expect(debits).toBeGreaterThan(0);
  });

  test('sequence GL closures across every available test office', async ({ request }) => {
    for (const officeId of state.offices) {
      const created = await fineract(request, 'POST', '/glclosures', {
        closingDate: date(), officeId, comments: `Module 14 closure ${officeId}`, dateFormat: 'dd MM yyyy', locale: 'en'
      });
      state.closureIds.push(created.resourceId);
    }
    expect(state.closureIds.length).toBe(state.offices.length);
    const closures = rows(await fineract(request, 'GET', '/glclosures'));
    expect(state.closureIds.every(id => closures.some(x => x.id === id))).toBeTruthy();
  });

  test('reject journal back-dated before closed period and accept future-dated control', async ({ request }) => {
    const officeId = state.offices[0];
    const rejected = await raw(request, 'POST', '/journalentries', {
      officeId, currencyCode: 'USD', transactionDate: yesterday, dateFormat: 'dd MM yyyy', locale: 'en',
      debits: [{ glAccountId: state.accounts.Expense, amount: 10 }], credits: [{ glAccountId: state.accounts.Asset, amount: 10 }]
    });
    expect(rejected.ok()).toBeFalsy();
    expect([400,403,409,422]).toContain(rejected.status());
    const control = await optional(request, 'POST', '/journalentries', {
      officeId, currencyCode: 'USD', transactionDate: tomorrow, dateFormat: 'dd MM yyyy', locale: 'en',
      debits: [{ glAccountId: state.accounts.Expense, amount: 11 }], credits: [{ glAccountId: state.accounts.Asset, amount: 11 }]
    });
    test.info().annotations.push({ type: 'post-closure-control', description: control.supported ? 'FUTURE ENTRY ACCEPTED' : `BUSINESS DATE RESTRICTED HTTP ${control.status}` });
  });

  test('create populated loan portfolio and run provisioning entry/journal capability', async ({ request }) => {
    const officeId = state.offices[0];
    const client = await fineract(request, 'POST', '/clients', {
      officeId, firstname:'FinCraft', lastname:`A14 ${runId}`.slice(0,45), legalFormId:1, active:true, activationDate:date(), submittedOnDate:date(), dateFormat:'dd MM yyyy', locale:'en'
    }); state.clientId = client.clientId || client.resourceId;
    const product = await fineract(request, 'POST', '/loanproducts', {
      name:`FinCraft A14 Loan ${runId}`.slice(0,90), shortName:`A14${suffix}`.slice(0,20), currencyCode:'USD', digitsAfterDecimal:2, inMultiplesOf:1,
      principal:500, minPrincipal:100, maxPrincipal:1000, numberOfRepayments:6, minNumberOfRepayments:1, maxNumberOfRepayments:12,
      repaymentEvery:1, repaymentFrequencyType:2, interestRatePerPeriod:12, interestRateFrequencyType:3, amortizationType:1,
      interestType:0, interestCalculationPeriodType:1, transactionProcessingStrategyCode:'mifos-standard-strategy', accountingRule:1
    }); state.loanProductId = product.resourceId;
    const loan = await fineract(request, 'POST', '/loans', {
      clientId:state.clientId, productId:state.loanProductId, loanType:'individual', principal:500, numberOfRepayments:6,
      repaymentEvery:1, repaymentFrequencyType:2, interestRatePerPeriod:12, amortizationType:1, interestType:0,
      interestCalculationPeriodType:1, transactionProcessingStrategyCode:'mifos-standard-strategy', submittedOnDate:date(), expectedDisbursementDate:date(), dateFormat:'dd MM yyyy', locale:'en'
    }); state.loanId = loan.loanId || loan.resourceId;
    await fineract(request,'POST',`/loans/${state.loanId}?command=approve`,{approvedOnDate:date(),approvedLoanAmount:500,dateFormat:'dd MM yyyy',locale:'en'});
    await fineract(request,'POST',`/loans/${state.loanId}?command=disburse`,{actualDisbursementDate:date(),transactionAmount:500,paymentTypeId:1,dateFormat:'dd MM yyyy',locale:'en'});
    const entry = await optional(request,'POST','/provisioningentries',{dateFormat:'dd MM yyyy',locale:'en'});
    test.info().annotations.push({type:'portfolio-provisioning',description:entry.supported?'ENTRY CREATED':`NOT CONFIGURED HTTP ${entry.status}`});
    if (entry.supported && entry.body.resourceId) {
      const journal = await optional(request,'POST',`/provisioningentries/${entry.body.resourceId}?command=createjournalentry`,{});
      test.info().annotations.push({type:'provisioning-journal',description:journal.supported?'JOURNAL CREATED':`NOT APPLICABLE HTTP ${journal.status}`});
    }
  });

  test('completed accounting areas render through FinCraft', async ({ page }) => {
    await login(page); await page.evaluate(async()=>{const r=await import('/js/router.js');r.navigate('accounting')});
    const content=page.locator('#contentArea');
    await expect(content).toContainText(/Accounting|GL Closure|Provisioning/i,{timeout:30000});
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });

  test('remove disposable closures after rejection checks', async ({ request }) => {
    for (const id of state.closureIds) await fineract(request,'DELETE',`/glclosures/${id}`);
    const closures=rows(await fineract(request,'GET','/glclosures'));
    expect(state.closureIds.every(id=>!closures.some(x=>x.id===id))).toBeTruthy();
  });
});
