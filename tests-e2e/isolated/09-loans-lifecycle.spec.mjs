import { test, expect } from '@playwright/test';
import { cfg, fineract, login, runId, date } from './helpers.mjs';

const state = { officeId:null, clientId:null, staffId:null, productId:null, loanId:null, repaymentTxId:null };
const suffix=String(runId).replace(/\D/g,'').slice(-8);
const unique=label=>`FC-${label}-${runId}`.slice(0,50);
const rows=v=>v?.pageItems||(Array.isArray(v)?v:[]);
async function raw(request,method,path,data){return request.fetch(`${cfg.url}/fineract-provider/api/v1${path}`,{method,data,ignoreHTTPSErrors:true,headers:{'Fineract-Platform-TenantId':cfg.tenant,Authorization:`Basic ${Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64')}`,'Content-Type':'application/json'}})}
async function optional(request,method,path,data){const r=await raw(request,method,path,data);const t=await r.text();let body={};try{body=t?JSON.parse(t):{}}catch{body={raw:t}}return{supported:r.ok(),status:r.status(),body}}
const money=amount=>({transactionDate:date(),transactionAmount:amount,paymentTypeId:1,dateFormat:'dd MM yyyy',locale:'en'});
const productBody=overrides=>({name:`FinCraft Loan ${runId}`.slice(0,90),shortName:`FCL${suffix}`.slice(0,20),description:'Module 06 isolated loan product',currencyCode:'USD',digitsAfterDecimal:2,inMultiplesOf:1,principal:1000,minPrincipal:100,maxPrincipal:10000,numberOfRepayments:12,minNumberOfRepayments:1,maxNumberOfRepayments:36,repaymentEvery:1,repaymentFrequencyType:2,interestRatePerPeriod:12,minInterestRatePerPeriod:0,maxInterestRatePerPeriod:60,interestRateFrequencyType:3,amortizationType:1,interestType:0,interestCalculationPeriodType:1,transactionProcessingStrategyCode:'mifos-standard-strategy',accountingRule:1,daysInYearType:365,daysInMonthType:30,canDefineInstallmentAmount:true,isInterestRecalculationEnabled:false,...overrides});
async function createLoan(request,label='MAIN'){const r=await fineract(request,'POST','/loans',{clientId:state.clientId,productId:state.productId,loanType:'individual',principal:1000,numberOfRepayments:12,repaymentEvery:1,repaymentFrequencyType:2,interestRatePerPeriod:12,amortizationType:1,interestType:0,interestCalculationPeriodType:1,transactionProcessingStrategyCode:'mifos-standard-strategy',submittedOnDate:date(),expectedDisbursementDate:date(),externalId:unique(`LOAN-${label}`),dateFormat:'dd MM yyyy',locale:'en'});return r.loanId||r.resourceId}
async function current(request,id=state.loanId,assoc='all'){return fineract(request,'GET',`/loans/${id}?associations=${assoc}`)}

test.describe.serial('module 06 - loans lifecycle',()=>{
 test('create client, officer, product, and load loan template',async({request})=>{
  state.officeId=rows(await fineract(request,'GET','/offices'))[0]?.id;expect(state.officeId).toBeTruthy();
  const c=await fineract(request,'POST','/clients',{officeId:state.officeId,firstname:'FinCraft',lastname:`Loan ${runId}`.slice(0,45),legalFormId:1,externalId:unique('LOAN-CLIENT'),active:true,activationDate:date(),submittedOnDate:date(),dateFormat:'dd MM yyyy',locale:'en'});state.clientId=c.clientId||c.resourceId;
  const s=await fineract(request,'POST','/staff',{officeId:state.officeId,firstname:'FinCraft',lastname:`Loan Officer ${runId}`.slice(0,45),isLoanOfficer:true,isActive:true});state.staffId=s.resourceId;
  const p=await fineract(request,'POST','/loanproducts',productBody());state.productId=p.resourceId;
  expect(state.clientId&&state.staffId&&state.productId).toBeTruthy();
  expect(await fineract(request,'GET',`/loans/template?templateType=individual&clientId=${state.clientId}&productId=${state.productId}&activeOnly=true`)).toBeDefined();
 });
 test('submit, retrieve, update, and calculate schedule for loan application',async({request})=>{
  state.loanId=await createLoan(request);expect(state.loanId).toBeTruthy();
  await fineract(request,'PUT',`/loans/${state.loanId}`,{clientId:state.clientId,productId:state.productId,loanType:'individual',principal:1200,numberOfRepayments:12,repaymentEvery:1,repaymentFrequencyType:2,interestRatePerPeriod:12,amortizationType:1,interestType:0,interestCalculationPeriodType:1,transactionProcessingStrategyCode:'mifos-standard-strategy',submittedOnDate:date(),expectedDisbursementDate:date(),externalId:unique('LOAN-MAIN-UPD'),dateFormat:'dd MM yyyy',locale:'en'});
  const saved=await current(request);expect(Number(saved.principal)).toBe(1200);expect(saved.externalId).toBe(unique('LOAN-MAIN-UPD'));
  const schedule=await current(request,state.loanId,'repaymentSchedule');expect(schedule.repaymentSchedule?.periods?.length).toBeGreaterThan(1);
 });
 test('assign and remove loan officer',async({request})=>{
  await fineract(request,'POST',`/loans/${state.loanId}?command=assignLoanOfficer`,{loanOfficerId:state.staffId,assignmentDate:date(),dateFormat:'dd MM yyyy',locale:'en'});
  expect((await current(request)).loanOfficerId||(await current(request)).loanOfficer?.id).toBe(state.staffId);
  await fineract(request,'POST',`/loans/${state.loanId}?command=unassignLoanOfficer`,{loanOfficerId:state.staffId,unassignedDate:date(),dateFormat:'dd MM yyyy',locale:'en'});
 });
 test('approve and disburse loan',async({request})=>{
  expect(await fineract(request,'GET',`/loans/${state.loanId}/template?templateType=approval`)).toBeDefined();
  await fineract(request,'POST',`/loans/${state.loanId}?command=approve`,{approvedOnDate:date(),approvedLoanAmount:1200,dateFormat:'dd MM yyyy',locale:'en'});
  expect((await current(request)).status?.approved).toBeTruthy();
  await fineract(request,'POST',`/loans/${state.loanId}?command=disburse`,{actualDisbursementDate:date(),transactionAmount:1200,paymentTypeId:1,dateFormat:'dd MM yyyy',locale:'en'});
  const saved=await current(request);expect(saved.status?.active).toBeTruthy();expect(Number(saved.summary?.principalDisbursed)).toBeCloseTo(1200,2);
 });
 test('retrieve repayment and original schedules plus transaction template',async({request})=>{
  expect((await current(request,state.loanId,'repaymentSchedule')).repaymentSchedule?.periods?.length).toBeGreaterThan(1);
  const original=await optional(request,'GET',`/loans/${state.loanId}?associations=originalSchedule`);test.info().annotations.push({type:'original-schedule',description:original.supported?'SUPPORTED':`UNSUPPORTED HTTP ${original.status}`});
  expect(await fineract(request,'GET',`/loans/${state.loanId}/transactions/template?command=repayment`)).toBeDefined();
 });
 test('post repayment and verify balances and transaction',async({request})=>{
  const r=await fineract(request,'POST',`/loans/${state.loanId}/transactions?command=repayment`,money(150));state.repaymentTxId=r.resourceId;expect(state.repaymentTxId).toBeTruthy();
  const tx=await fineract(request,'GET',`/loans/${state.loanId}/transactions/${state.repaymentTxId}`);expect(Number(tx.amount)).toBeCloseTo(150,2);
  expect(Number((await current(request)).summary?.totalRepayment)).toBeGreaterThanOrEqual(150);
 });
 test('reverse repayment and verify reversal, then repay again',async({request})=>{
  await fineract(request,'POST',`/loans/${state.loanId}/transactions/${state.repaymentTxId}?command=reverse`,{transactionDate:date(),dateFormat:'dd MM yyyy',locale:'en',note:'Module 06 reversal'});
  const tx=await fineract(request,'GET',`/loans/${state.loanId}/transactions/${state.repaymentTxId}`);expect(tx.reversed||tx.manuallyReversed).toBeTruthy();
  const r=await fineract(request,'POST',`/loans/${state.loanId}/transactions?command=repayment`,money(150));expect(r.resourceId).toBeTruthy();
 });
 test('retrieve charges, collateral, guarantor, delinquency, and lifecycle surfaces',async({request})=>{
  await fineract(request,'GET',`/loans/${state.loanId}/charges`);
  const paths=[`/loans/${state.loanId}/collaterals`,`/loans/${state.loanId}/guarantors`,`/loans/${state.loanId}/delinquency-actions`,`/loans/${state.loanId}/delinquencytags`,`/rescheduleloans?loanId=${state.loanId}&command=pending`,`/loans/${state.loanId}/interest-pauses`,`/loans/${state.loanId}/buydown-fees`,`/loans/${state.loanId}/capitalized-incomes`,`/loans/${state.loanId}/deferredincome`,`/loans/${state.loanId}/postdatedchecks`,`/loans/${state.loanId}/originators`];
  for(const path of paths){const r=await optional(request,'GET',path);test.info().annotations.push({type:path,description:r.supported?'SUPPORTED':`UNSUPPORTED HTTP ${r.status}`})}
 });
 test('loan list and detail render through FinCraft',async({page})=>{
  await login(page);await page.evaluate(async()=>{const r=await import('/js/router.js');r.navigate('loans')});await expect(page.locator('#contentArea')).toContainText(/Loans|FinCraft/i,{timeout:30000});
  await page.evaluate(async id=>{const r=await import('/js/router.js');r.navigate('loan-detail',{id})},state.loanId);await expect(page.locator('#contentArea')).toContainText(/Loan|FinCraft/i,{timeout:30000});await expect(page.locator('#contentArea')).not.toContainText(/Cannot read properties|is not defined|innerHTML of null/i);
 });
 test('undo approval on separate approved application',async({request})=>{const id=await createLoan(request,'UNDO-APP');await fineract(request,'POST',`/loans/${id}?command=approve`,{approvedOnDate:date(),approvedLoanAmount:1000,dateFormat:'dd MM yyyy',locale:'en'});await fineract(request,'POST',`/loans/${id}?command=undoApproval`,{});expect((await current(request,id)).status?.pendingApproval).toBeTruthy();await fineract(request,'DELETE',`/loans/${id}`)});
 test('undo disbursement on separate active loan',async({request})=>{const id=await createLoan(request,'UNDO-DISB');await fineract(request,'POST',`/loans/${id}?command=approve`,{approvedOnDate:date(),approvedLoanAmount:1000,dateFormat:'dd MM yyyy',locale:'en'});await fineract(request,'POST',`/loans/${id}?command=disburse`,{actualDisbursementDate:date(),transactionAmount:1000,paymentTypeId:1,dateFormat:'dd MM yyyy',locale:'en'});await fineract(request,'POST',`/loans/${id}?command=undoDisbursal`,{});expect((await current(request,id)).status?.approved).toBeTruthy()});
 test('reject and withdraw separate loan applications',async({request})=>{
  const rejectId=await createLoan(request,'REJECT');await fineract(request,'POST',`/loans/${rejectId}?command=reject`,{rejectedOnDate:date(),dateFormat:'dd MM yyyy',locale:'en',note:'Module 06 rejection'});expect((await current(request,rejectId)).status?.code).toMatch(/rejected/i);
  const withdrawId=await createLoan(request,'WITHDRAW');await fineract(request,'POST',`/loans/${withdrawId}?command=withdrawnByApplicant`,{withdrawnOnDate:date(),dateFormat:'dd MM yyyy',locale:'en',note:'Module 06 withdrawal'});expect((await current(request,withdrawId)).status?.code).toMatch(/withdrawn/i);
 });
 test('reject duplicate external ID and delete disposable application',async({request})=>{
  const duplicate=await raw(request,'POST','/loans',{clientId:state.clientId,productId:state.productId,loanType:'individual',principal:1000,numberOfRepayments:12,repaymentEvery:1,repaymentFrequencyType:2,interestRatePerPeriod:12,amortizationType:1,interestType:0,interestCalculationPeriodType:1,transactionProcessingStrategyCode:'mifos-standard-strategy',submittedOnDate:date(),expectedDisbursementDate:date(),externalId:unique('LOAN-MAIN-UPD'),dateFormat:'dd MM yyyy',locale:'en'});expect(duplicate.ok()).toBeFalsy();
  const id=await createLoan(request,'DELETE');await fineract(request,'DELETE',`/loans/${id}`);expect((await raw(request,'GET',`/loans/${id}`)).ok()).toBeFalsy();
 });
});
