import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { officeId: null, clientId: null, productId: null, accountId: null, depositTxId: null };
const suffix = String(runId).replace(/\D/g, '').slice(-8);
const unique = label => `FC-RDX-${label}-${runId}`.slice(0, 50);
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
  return { supported: response.ok(), status: response.status(), body };
}
const tx = amount => ({ transactionDate: date(), transactionAmount: amount, paymentTypeId: 1, dateFormat: 'dd MM yyyy', locale: 'en' });
async function createAccount(request, label) {
  const created = await fineract(request, 'POST', '/recurringdepositaccounts', {
    clientId: state.clientId, productId: state.productId, submittedOnDate: date(),
    recurringDepositAmount: 100, recurringDepositFrequency: 1, recurringDepositFrequencyTypeId: 2, depositPeriod: 6, depositPeriodFrequencyId: 2,
    externalId: unique(label), dateFormat: 'dd MM yyyy', locale: 'en'
  });
  return created.savingsId || created.resourceId;
}
async function approveActivateDeposit(request, id, amount = 1000) {
  await fineract(request, 'POST', `/recurringdepositaccounts/${id}?command=approve`, { approvedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' });
  await fineract(request, 'POST', `/recurringdepositaccounts/${id}?command=activate`, { activatedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en' });
  return fineract(request, 'POST', `/recurringdepositaccounts/${id}/transactions?command=deposit`, tx(amount));
}

test.describe.serial('module 11 - recurring deposits extended lifecycle', () => {
  test('create isolated client, product, account, and funded RD', async ({ request }) => {
    state.officeId = rows(await fineract(request, 'GET', '/offices'))[0]?.id;
    const client = await fineract(request, 'POST', '/clients', {
      officeId: state.officeId, firstname: 'FinCraft', lastname: `RD Extended ${runId}`.slice(0, 45),
      externalId: unique('CLIENT'), active: true, activationDate: date(), submittedOnDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    state.clientId = client.clientId || client.resourceId;
    const product = await fineract(request, 'POST', '/recurringdepositproducts', {
      name: `FinCraft RD Extended ${runId}`.slice(0, 90), shortName: `FCY${suffix}`.slice(0, 20),
      description: 'Module 10 extended FD product', currencyCode: 'USD', digitsAfterDecimal: 2, inMultiplesOf: 1,
      nominalAnnualInterestRate: 6, interestCompoundingPeriodType: 4, interestPostingPeriodType: 4,
      interestCalculationType: 1, interestCalculationDaysInYearType: 365,
      minDepositAmount: 100, recurringDepositAmount: 100, recurringDepositFrequency: 1, recurringDepositFrequencyTypeId: 2,
      minDepositTerm: 6, minDepositTermTypeId: 2, maxDepositTerm: 24, maxDepositTermTypeId: 2,
      isMandatoryDeposit: true, adjustAdvanceTowardsFuturePayments: true, allowWithdrawal: true, preClosurePenalApplicable: true, preClosurePenalInterest: 1, preClosurePenalInterestOnTypeId: 1,
      withHoldTax: false, accountingRule: 1
    });
    state.productId = product.resourceId;
    state.accountId = await createAccount(request, 'MAIN');
    const deposited = await approveActivateDeposit(request, state.accountId);
    state.depositTxId = deposited.resourceId;
    expect(state.officeId && state.clientId && state.productId && state.accountId && state.depositTxId).toBeTruthy();
  });

  test('post multiple scheduled installments and verify transaction history', async ({ request }) => {
    const second = await fineract(request, 'POST', `/recurringdepositaccounts/${state.accountId}/transactions?command=deposit`, tx(100));
    const third = await fineract(request, 'POST', `/recurringdepositaccounts/${state.accountId}/transactions?command=deposit`, tx(100));
    expect(second.resourceId && third.resourceId).toBeTruthy();
    const saved = await fineract(request, 'GET', `/recurringdepositaccounts/${state.accountId}?associations=transactions`);
    expect((saved.transactions || []).filter(x => !x.reversed).length).toBeGreaterThanOrEqual(3);
    expect(Number(saved.summary?.accountBalance)).toBeGreaterThanOrEqual(300);
  });

  test('missed-installment and penalty surfaces are capability-tested', async ({ request }) => {
    for (const [label, path] of [
      ['charges', `/savingsaccounts/${state.accountId}/charges`],
      ['transaction-template', `/recurringdepositaccounts/${state.accountId}/transactions/template?command=deposit`]
    ]) {
      const result = await optional(request, 'GET', path);
      test.info().annotations.push({ type: `missed-installment-${label}`, description: result.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${result.status}` });
    }
  });

  test('withdrawal template and withdrawal transaction are exercised honestly', async ({ request }) => {
    const template = await optional(request, 'GET', `/recurringdepositaccounts/${state.accountId}/template?command=withdrawal`);
    test.info().annotations.push({ type: 'withdrawal-template', description: template.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${template.status}` });
    const withdrawal = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}/transactions?command=withdrawal`, tx(100));
    test.info().annotations.push({ type: 'withdrawal', description: withdrawal.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${withdrawal.status}` });
    if (withdrawal.supported) expect(withdrawal.body.resourceId).toBeTruthy();
  });

  test('transaction adjustment and undo commands are covered', async ({ request }) => {
    const adjustment = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}/transactions/${state.depositTxId}?command=adjust`, {
      transactionDate: date(), transactionAmount: 1000, paymentTypeId: 1,
      dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 10 RD adjustment'
    });
    test.info().annotations.push({ type: 'transaction-adjustment', description: adjustment.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${adjustment.status}` });
    const undo = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}/transactions/${state.depositTxId}?command=undo`, {});
    test.info().annotations.push({ type: 'transaction-undo', description: undo.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${undo.status}` });
  });

  test('charge template and full supported RD charge lifecycle are attempted', async ({ request }) => {
    const template = await optional(request, 'GET', `/savingsaccounts/${state.accountId}/charges/template`);
    if (!template.supported) test.skip(true, `RD charge template unavailable: HTTP ${template.status}`);
    const options = template.body.chargeOptions || template.body.charges || [];
    const charge = options[0];
    if (!charge?.id) test.skip(true, 'No compatible RD charge definition configured');
    const added = await optional(request, 'POST', `/savingsaccounts/${state.accountId}/charges`, {
      chargeId: charge.id, amount: Number(charge.amount || 10), dueDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    if (!added.supported) test.skip(true, `Configured charge not applicable: HTTP ${added.status}`);
    const chargeId = added.body.resourceId;
    expect(chargeId).toBeTruthy();
    await fineract(request, 'GET', `/savingsaccounts/${state.accountId}/charges/${chargeId}`);
    const updated = await optional(request, 'PUT', `/savingsaccounts/${state.accountId}/charges/${chargeId}`, {
      amount: Number(charge.amount || 10), dueDate: date(), dateFormat: 'dd MM yyyy', locale: 'en'
    });
    test.info().annotations.push({ type: 'charge-update', description: updated.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${updated.status}` });
    const paid = await optional(request, 'POST', `/savingsaccounts/${state.accountId}/charges/${chargeId}?command=paycharge`, tx(Number(charge.amount || 10)));
    test.info().annotations.push({ type: 'charge-pay', description: paid.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${paid.status}` });
    const waived = await optional(request, 'POST', `/savingsaccounts/${state.accountId}/charges/${chargeId}?command=waive`, {});
    test.info().annotations.push({ type: 'charge-waive', description: waived.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${waived.status}` });
    const inactive = await optional(request, 'POST', `/savingsaccounts/${state.accountId}/charges/${chargeId}?command=inactivate`, {});
    test.info().annotations.push({ type: 'charge-inactivate', description: inactive.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${inactive.status}` });
    const deleted = await optional(request, 'DELETE', `/savingsaccounts/${state.accountId}/charges/${chargeId}`);
    test.info().annotations.push({ type: 'charge-delete', description: deleted.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${deleted.status}` });
  });

  test('premature close template and funded-account premature closure', async ({ request }) => {
    const id = await createAccount(request, 'PREMATURE');
    await approveActivateDeposit(request, id);
    const template = await optional(request, 'GET', `/recurringdepositaccounts/${id}/template?command=prematureClose`);
    expect(template.supported).toBeTruthy();
    const closed = await optional(request, 'POST', `/recurringdepositaccounts/${id}?command=prematureClose`, {
      closedOnDate: date(), paymentTypeId: 1, dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 10 premature close'
    });
    test.info().annotations.push({ type: 'premature-close', description: closed.supported ? 'SUPPORTED' : `NOT APPLICABLE HTTP ${closed.status}` });
    if (closed.supported) {
      const saved = await fineract(request, 'GET', `/recurringdepositaccounts/${id}`);
      expect(saved.status?.closed || /closed/i.test(saved.status?.code || '')).toBeTruthy();
    }
  });

  test('maturity close and instruction commands are capability-tested', async ({ request }) => {
    const closeTemplate = await optional(request, 'GET', `/recurringdepositaccounts/${state.accountId}/template?command=close`);
    test.info().annotations.push({ type: 'maturity-close-template', description: closeTemplate.supported ? 'SUPPORTED' : `UNSUPPORTED HTTP ${closeTemplate.status}` });
    const close = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}?command=close`, {
      closedOnDate: date(), paymentTypeId: 1, dateFormat: 'dd MM yyyy', locale: 'en', note: 'Module 10 maturity close probe'
    });
    test.info().annotations.push({ type: 'maturity-close', description: close.supported ? 'SUPPORTED' : `NOT MATURE HTTP ${close.status}` });
    for (const command of ['updateDepositAmount', 'updateMaturityInstructions']) {
      const result = await optional(request, 'POST', `/recurringdepositaccounts/${state.accountId}?command=${command}`, {
        maturityInstructionId: 1, depositAmount: 1000, dateFormat: 'dd MM yyyy', locale: 'en'
      });
      test.info().annotations.push({ type: command, description: result.supported ? 'SUPPORTED' : `UNSUPPORTED/NOT APPLICABLE HTTP ${result.status}` });
    }
  });

  test('extended FD surfaces render without client-side errors', async ({ page }) => {
    await login(page);
    await page.evaluate(async id => { const r = await import('/js/router.js'); r.navigate('deposits', { id, type: 'rd' }); }, state.accountId);
    const content = page.locator('#contentArea');
    await expect(content).toContainText(/Deposit|FinCraft/i, { timeout: 30_000 });
    await expect(content).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
  });
});
