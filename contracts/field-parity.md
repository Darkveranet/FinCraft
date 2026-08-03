# FinCraft — Field-Parity Report (informational, not a CI gate)

_Generated 2026-08-03T08:34:46.462Z_

See the header of `tools/api-automation/field-parity.mjs` for why this is a report, not a gate.

Scanned **217** matched CREATE/UPDATE operations, **1570** non-boilerplate fields total, **336** not found as an identifier anywhere in `js/pages/**`, `js/ui/**`, or `js/api/**` (excluding generated files).

A field not found is a CANDIDATE to review, not a confirmed gap — see the exclusion list in the script header.

## By resource (sorted by missing-field count)

| Tag | Ops | Fields | Missing | Missing % |
|---|---:|---:|---:|---:|
| Loan Products | 2 | 267 | 108 | 40% |
| Untagged | 4 | 109 | 69 | 63% |
| Loans | 7 | 133 | 31 | 23% |
| Inter Operation | 3 | 39 | 18 | 46% |
| Loan Transactions | 3 | 32 | 12 | 38% |
| Search API | 1 | 10 | 10 | 100% |
| Survey | 1 | 11 | 10 | 91% |
| Clients Address | 2 | 36 | 8 | 22% |
| Savings Account Transactions | 3 | 15 | 6 | 40% |
| Guarantors | 2 | 34 | 6 | 18% |
| Data Tables | 3 | 15 | 4 | 27% |
| Users | 3 | 28 | 4 | 14% |
| Delinquency Range and Buckets Management | 4 | 14 | 4 | 29% |
| External Asset Owner Loan Product Attributes | 2 | 4 | 4 | 100% |
| Instance Mode | 1 | 4 | 4 | 100% |
| Interest Rate Slab (A.K.A interest bands) | 2 | 19 | 3 | 16% |
| Recurring Deposit Account | 2 | 11 | 3 | 27% |
| Charges | 2 | 36 | 2 | 6% |
| Client | 3 | 29 | 2 | 7% |
| External Asset Owners | 3 | 10 | 2 | 20% |
| Payment Type | 2 | 12 | 2 | 17% |
| Rate | 2 | 8 | 2 | 25% |
| Reschedule Loans | 2 | 14 | 2 | 14% |
| Products | 2 | 22 | 2 | 9% |
| Staff | 2 | 20 | 2 | 10% |
| Spm-Surveys | 2 | 18 | 2 | 11% |
| SCHEDULER JOB | 4 | 8 | 2 | 25% |
| Credit Bureau Integration | 1 | 1 | 1 | 100% |
| Loan Collateral | 2 | 2 | 1 | 50% |
| Loan Charges | 3 | 19 | 1 | 5% |
| Provisioning Entries | 2 | 3 | 1 | 33% |
| Report Mailing Jobs | 2 | 11 | 1 | 9% |
| Savings Product | 2 | 22 | 1 | 5% |
| Inline Job | 1 | 1 | 1 | 100% |
| Collection Sheet | 1 | 4 | 1 | 25% |
| Savings Account | 3 | 11 | 1 | 9% |
| LoansPointInTime | 1 | 2 | 1 | 50% |
| repayment with post dated checks | 1 | 5 | 1 | 20% |
| Working days | 1 | 4 | 1 | 25% |
| Loan Disbursement Details | 1 | 2 | 0 | 0% |
| Client Collateral Management | 2 | 3 | 0 | 0% |
| Notes | 2 | 2 | 0 | 0% |
| Teller Cash Management | 6 | 29 | 0 | 0% |
| Accounting Rules | 2 | 10 | 0 | 0% |
| Account number format | 2 | 3 | 0 | 0% |
| Account Transfers | 2 | 22 | 0 | 0% |
| AdhocQuery Api | 2 | 18 | 0 | 0% |
| Calendar | 1 | 7 | 0 | 0% |
| Centers | 3 | 6 | 0 | 0% |
| Client Charges | 2 | 6 | 0 | 0% |
| Client Family Member | 2 | 30 | 0 | 0% |
| Client Identifier | 2 | 8 | 0 | 0% |
| Codes | 2 | 2 | 0 | 0% |
| Code Values | 4 | 16 | 0 | 0% |
| Collateral Management | 2 | 12 | 0 | 0% |
| Documents | 2 | 6 | 0 | 0% |
| Entity Data Table | 1 | 4 | 0 | 0% |
| Fixed Deposit Account | 2 | 7 | 0 | 0% |
| Fixed Deposit Product | 2 | 22 | 0 | 0% |
| Floating Rates | 2 | 8 | 0 | 0% |
| Funds | 2 | 4 | 0 | 0% |
| General Ledger Account | 2 | 17 | 0 | 0% |
| Mapping Financial Activities to Accounts | 2 | 4 | 0 | 0% |
| Accounting Closure | 2 | 4 | 0 | 0% |
| Journal Entries | 2 | 17 | 0 | 0% |
| Groups | 4 | 7 | 0 | 0% |
| Holidays | 2 | 9 | 0 | 0% |
| Hooks | 2 | 13 | 0 | 0% |
| Interest Rate Chart | 2 | 6 | 0 | 0% |
| Loan Interest Pause | 2 | 4 | 0 | 0% |
| Loan Originators | 2 | 9 | 0 | 0% |
| SPM API - LookUp Table | 1 | 3 | 0 | 0% |
| Meetings | 3 | 8 | 0 | 0% |
| Offices | 2 | 7 | 0 | 0% |
| Product Mix | 2 | 4 | 0 | 0% |
| Provisioning Criteria | 2 | 6 | 0 | 0% |
| Recurring Deposit Product | 2 | 25 | 0 | 0% |
| Reports | 2 | 9 | 0 | 0% |
| Roles | 3 | 4 | 0 | 0% |
| Savings Charges | 3 | 7 | 0 | 0% |
| Score Card | 1 | 7 | 0 | 0% |
| Share Account | 3 | 24 | 0 | 0% |
| SMS | 2 | 6 | 0 | 0% |
| Standing Instructions | 2 | 33 | 0 | 0% |
| Tax Components | 2 | 10 | 0 | 0% |
| Tax Group | 2 | 4 | 0 | 0% |
| templates | 2 | 10 | 0 | 0% |
| Periodic Accrual Accounting | 1 | 1 | 0 | 0% |
| Password Management | 1 | 1 | 0 | 0% |
| Fixed Deposit Account Transactions | 1 | 3 | 0 | 0% |
| Recurring Deposit Account Transactions | 2 | 16 | 0 | 0% |
| Cache | 1 | 1 | 0 | 0% |
| Business Date Management | 1 | 2 | 0 | 0% |
| Global Configuration | 2 | 8 | 0 | 0% |
| Currency | 1 | 1 | 0 | 0% |
| External event configuration | 1 | 1 | 0 | 0% |
| External Services | 1 | 2 | 0 | 0% |
| Business Step Configuration | 1 | 1 | 0 | 0% |
| Mix Mapping | 1 | 4 | 0 | 0% |
| Password preferences | 1 | 1 | 0 | 0% |
| Permissions | 1 | 1 | 0 | 0% |

## Detail (only operations with at least one missing field)

### Loan Products

- `POST /v1/loanproducts` (createLoanProduct) — missing: allowCompoundingOnEod, allowFullTermForTranche, buyDownExpenseAccountId, buyDownFeeCalculationType, buyDownFeeIncomeType, buyDownFeeStrategy, buydownfeeClassificationToIncomeAccountMappings, capitalizedIncomeCalculationType, capitalizedIncomeClassificationToIncomeAccountMappings, capitalizedIncomeStrategy, capitalizedIncomeType, chargeOffBehaviour, chargeOffExpenseAccountId, chargeOffFraudExpenseAccountId, chargeOffReasonToExpenseAccountMappings, creditAllocation, daysInYearCustomStrategy, deferredIncomeLiabilityAccountId, disallowExpectedDisbursements, disallowInterestCalculationOnPastDue, dueDaysForRepaymentEvent, enableBuyDownFee, enableIncomeCapitalization, enableInstallmentLevelDelinquency, feeToIncomeAccountMappings, fixedLength, fixedPrincipalPercentagePerInstallment, goodwillCreditAccountId, incomeFromBuyDownAccountId, incomeFromCapitalizationAccountId, incomeFromChargeOffFeesAccountId, incomeFromChargeOffInterestAccountId, incomeFromChargeOffPenaltyAccountId, incomeFromGoodwillCreditFeesAccountId, incomeFromGoodwillCreditInterestAccountId, incomeFromGoodwillCreditPenaltyAccountId, interestRateVariationsForBorrowerCycle, interestRecognitionOnDisbursementDate, isCompoundingToBePostedAsTransaction, loanScheduleProcessingType, loanScheduleType, merchantBuyDownFee, numberOfRepaymentVariationsForBorrowerCycle, overDueDaysForRepaymentEvent, paymentAllocation, paymentChannelToFundSourceMappings, penaltyToIncomeAccountMappings, principalVariationsForBorrowerCycle, recalculationCompoundingFrequencyInterval, recalculationCompoundingFrequencyOnDayType, recalculationCompoundingFrequencyType, supportedInterestRefundTypes, useBorrowerCycle, writeOffReasonsToExpenseMappings
- `PUT /v1/loanproducts/{productId}` (updateLoanProduct) — missing: allowCompoundingOnEod, allowFullTermForTranche, buyDownExpenseAccountId, buyDownFeeCalculationType, buyDownFeeIncomeType, buyDownFeeStrategy, buydownfeeClassificationToIncomeAccountMappings, capitalizedIncomeCalculationType, capitalizedIncomeClassificationToIncomeAccountMappings, capitalizedIncomeStrategy, capitalizedIncomeType, chargeOffBehaviour, chargeOffExpenseAccountId, chargeOffFraudExpenseAccountId, chargeOffReasonToExpenseAccountMappings, creditAllocation, daysInYearCustomStrategy, deferredIncomeLiabilityAccountId, disallowExpectedDisbursements, disallowInterestCalculationOnPastDue, dueDaysForRepaymentEvent, enableBuyDownFee, enableIncomeCapitalization, enableInstallmentLevelDelinquency, feeToIncomeAccountMappings, fixedLength, fixedPrincipalPercentagePerInstallment, goodwillCreditAccountId, incomeFromBuyDownAccountId, incomeFromCapitalizationAccountId, incomeFromChargeOffFeesAccountId, incomeFromChargeOffInterestAccountId, incomeFromChargeOffPenaltyAccountId, incomeFromGoodwillCreditFeesAccountId, incomeFromGoodwillCreditInterestAccountId, incomeFromGoodwillCreditPenaltyAccountId, interestRateVariationsForBorrowerCycle, interestRecognitionOnDisbursementDate, isCompoundingToBePostedAsTransaction, loanScheduleProcessingType, loanScheduleType, merchantBuyDownFee, numberOfRepaymentVariationsForBorrowerCycle, overDueDaysForRepaymentEvent, paymentAllocation, paymentChannelToFundSourceMappings, penaltyToIncomeAccountMappings, principalVariationsForBorrowerCycle, recalculationCompoundingFrequencyInterval, recalculationCompoundingFrequencyOnDayType, recalculationCompoundingFrequencyType, supportedInterestRefundTypes, useBorrowerCycle, writeOffReasonsToExpenseMappings

### Untagged

- `POST /v1/smscampaigns` (createSmsCampaign) — missing: cacheResource, changePasswordOperation, commandId, createDatatable, currencyResource, datatableResource, deleteDatatable, deleteMultiple, deleteOneToOne, deleteOperation, fullFilSurvey, idempotencyKey, interestPauseCreateResource, interestPauseDeleteResource, interestPauseResource, interestPauseUpdateResource, loanDisburseDetailResource, loanExternalId, noteResource, passwordPreferencesResource, permissionResource, registerDatatable, registerSurvey, sanitizeJsonKeys, subentityId, surveyResource, taskPermissionName, updateDatatable, updateDisbursementDate, updateMultiple, updateOneToOne, updateOperation, userResource, workingDaysResource
- `POST /v1/smscampaigns/preview` (previewSmsCampaign) — missing: paramValue
- `PUT /v1/smscampaigns/{campaignId}` (updateSmsCampaign) — missing: cacheResource, changePasswordOperation, commandId, createDatatable, currencyResource, datatableResource, deleteDatatable, deleteMultiple, deleteOneToOne, deleteOperation, fullFilSurvey, idempotencyKey, interestPauseCreateResource, interestPauseDeleteResource, interestPauseResource, interestPauseUpdateResource, loanDisburseDetailResource, loanExternalId, noteResource, passwordPreferencesResource, permissionResource, registerDatatable, registerSurvey, sanitizeJsonKeys, subentityId, surveyResource, taskPermissionName, updateDatatable, updateDisbursementDate, updateMultiple, updateOneToOne, updateOperation, userResource, workingDaysResource

### Loans

- `POST /v1/loans` (calculateOrSubmitLoanApplication) — missing: allowFullTermForTranche, buyDownFeeCalculationType, buyDownFeeIncomeType, buyDownFeeStrategy, capitalizedIncomeCalculationType, capitalizedIncomeStrategy, capitalizedIncomeType, daysInYearCustomStrategy, enableBuyDownFee, enableIncomeCapitalization, enableInstallmentLevelDelinquency, fixedLength, fixedPrincipalPercentagePerInstallment, interestRecognitionOnDisbursementDate, loanScheduleProcessingType, loanTermFrequency, loanTermFrequencyType
- `POST /v1/loans/glimAccount/{glimId}` (handleCommandsGlimLoan) — missing: adjustRepaymentDate, fromLoanOfficerId
- `POST /v1/loans/{loanId}` (handleCommandsLoan) — missing: adjustRepaymentDate, fromLoanOfficerId
- `PUT /v1/loans/{loanId}` (updateLoanApplication) — missing: allowFullTermForTranche, enableInstallmentLevelDelinquency, fixedLength, fixedPrincipalPercentagePerInstallment, interestRecognitionOnDisbursementDate, loanScheduleProcessingType, loanTermFrequency, loanTermFrequencyType, repaymentFrequencyDayOfWeekType, repaymentFrequencyNthDayType

### Inter Operation

- `POST /v1/interoperation/quotes` (createQuote) — missing: amountType, expiration, expirationLocalDate, extensionList, geoCode, transactionRole
- `POST /v1/interoperation/requests` (createTransactionRequest) — missing: expiration, expirationLocalDate, extensionList, geoCode, transactionRole
- `POST /v1/interoperation/transfers` (performTransfer) — missing: expiration, expirationLocalDate, extensionList, fspCommission, fspFee, geoCode, transactionRole

### Loan Transactions

- `POST /v1/loans/{loanId}/transactions/{transactionId}` (adjustLoanTransaction) — missing: reversalExternalId
- `POST /v1/loans/{loanId}/transactions` (handleCommandsLoanTransaction) — missing: classificationId, frequencyNumber, frequencyType, interestRefundCalculation, loanChargeId, numberOfInstallments, reAgeInterestHandling, reAmortizationInterestHandling, reasonCodeValueId, reversalExternalId, writeoffReasonId

### Search API

- `POST /v1/search/advance` (advancedSearch) — missing: includeOutStandingAmountPercentage, includeOutstandingAmount, loanDateOption, loanFromDate, loanToDate, maxOutstandingAmount, minOutstandingAmount, outStandingAmountPercentage, outStandingAmountPercentageCondition, outstandingAmountCondition

### Survey

- `POST /v1/survey/{surveyName}/{apptableId}` (createSurveyEntry) — missing: ppi_businessoccupation_cd_q3_businessoccupation, ppi_floortype_cd_q5_floortype, ppi_fryingpans_cd_q10_fryingpans, ppi_habitablerooms_cd_q4_habitablerooms, ppi_highestschool_cd_q2_highestschool, ppi_household_members_cd_q1_householdmembers, ppi_irons_cd_q7_irons, ppi_lightingsource_cd_q6_lightingsource, ppi_mosquitonets_cd_q8_mosquitonets, ppi_towels_cd_q9_towels

### Clients Address

- `POST /v1/client/{clientid}/addresses` (createClientAddress) — missing: addressId, latitude, longitude, updatedBy
- `PUT /v1/client/{clientid}/addresses` (updateClientAddress) — missing: addressId, latitude, longitude, updatedBy

### Savings Account Transactions

- `POST /v1/savingsaccounts/{savingsId}/transactions/{transactionId}` (adjustSavingsAccountTransaction) — missing: isBulk
- `POST /v1/savingsaccounts/{savingsId}/transactions/query` (advancedQuerySavingsAccountTransactions) — missing: dateTimeFormat, localeObject, sorts
- `POST /v1/savingsaccounts/{savingsId}/transactions` (createSavingsAccountTransaction) — missing: isPostInterestAsOn, lienAllowed

### Guarantors

- `POST /v1/loans/{loanId}/guarantors` (createGuarantor) — missing: clientRelationshipTypeId, housePhoneNumber, zip
- `PUT /v1/loans/{loanId}/guarantors/{guarantorId}` (updateGuarantor) — missing: clientRelationshipTypeId, housePhoneNumber, zip

### Data Tables

- `POST /v1/datatables/{datatable}/query` (advancedQuery) — missing: dateTimeFormat, localeObject, sorts
- `PUT /v1/datatables/{datatableName}` (updateDatatable) — missing: changeColumns

### Users

- `POST /v1/users` (createUser) — missing: isLoginRetriesEnabled, isPasswordResetAllowed
- `PUT /v1/users/{userId}` (updateUser) — missing: isLoginRetriesEnabled, isPasswordResetAllowed

### Delinquency Range and Buckets Management

- `POST /v1/delinquency/buckets` (createBucket) — missing: bucketType, minimumPaymentPeriodAndRule
- `PUT /v1/delinquency/buckets/{delinquencyBucketId}` (updateBucket) — missing: bucketType, minimumPaymentPeriodAndRule

### External Asset Owner Loan Product Attributes

- `POST /v1/external-asset-owners/loan-product/{loanProductId}/attributes` (createExternalAssetOwnerLoanProductAttribute) — missing: attributeKey, attributeValue
- `PUT /v1/external-asset-owners/loan-product/{loanProductId}/attributes/{id}` (updateExternalAssetOwnerLoanProductAttribute) — missing: attributeKey, attributeValue

### Instance Mode

- `PUT /v1/instance-mode` (updateInstanceMode) — missing: batchManagerEnabled, batchWorkerEnabled, readEnabled, writeEnabled

### Interest Rate Slab (A.K.A interest bands)

- `POST /v1/interestratecharts/{chartId}/chartslabs` (createInterestRateChartSlab) — missing: chartSlabId, incentives
- `PUT /v1/interestratecharts/{chartId}/chartslabs/{chartSlabId}` (updateInterestRateChartSlab) — missing: incentives

### Recurring Deposit Account

- `POST /v1/recurringdepositaccounts` (submitApplicationRecurringDepositAccount) — missing: isCalendarInherited, recurringFrequency, recurringFrequencyType

### Charges

- `POST /v1/charges` (createCharge) — missing: enablePaymentType
- `PUT /v1/charges/{chargeId}` (updateCharge) — missing: enablePaymentType

### Client

- `POST /v1/clients/{clientId}` (handleCommandClient) — missing: reopenedDate
- `PUT /v1/clients/{clientId}` (updateClient) — missing: resourceExternalId

### External Asset Owners

- `POST /v1/external-asset-owners/search` (searchInvestorData) — missing: sorts
- `POST /v1/external-asset-owners/transfers/loans/{loanId}` (transferRequestWithLoanId) — missing: transferExternalGroupId

### Payment Type

- `POST /v1/paymenttypes` (createPaymentType) — missing: isSystemDefined
- `PUT /v1/paymenttypes/{paymentTypeId}` (updatePaymentType) — missing: isSystemDefined

### Rate

- `POST /v1/rates` (createRate) — missing: productApply
- `PUT /v1/rates/{rateId}` (updateRate) — missing: productApply

### Reschedule Loans

- `POST /v1/rescheduleloans` (createRescheduleLoan) — missing: graceOnInterest, graceOnPrincipal

### Products

- `POST /v1/products/{type}` (createShareProduct) — missing: chargesSelected, minimumactiveperiodFrequencyType

### Staff

- `POST /v1/staff` (createStaff) — missing: forceStatus
- `PUT /v1/staff/{staffId}` (updateStaff) — missing: forceStatus

### Spm-Surveys

- `POST /v1/surveys` (createSurvey) — missing: componentDatas
- `PUT /v1/surveys/{id}` (editSurvey) — missing: componentDatas

### SCHEDULER JOB

- `POST /v1/jobs/{jobId}` (executeJob) — missing: jobParameters
- `POST /v1/jobs/short-name/{shortName}` (executeJobByShortName) — missing: jobParameters

### Credit Bureau Integration

- `POST /v1/creditBureauIntegration/addCreditReport` (addCreditReport) — missing: uploadedInputStream

### Loan Collateral

- `POST /v1/loans/{loanId}/collaterals` (createCollateral) — missing: collateralTypeId

### Loan Charges

- `POST /v1/loans/{loanId}/charges/{loanChargeId}` (executeLoanChargeOnExistingCharge) — missing: installmentNumber

### Provisioning Entries

- `POST /v1/provisioningentries` (createProvisioningEntries) — missing: createjournalentries

### Report Mailing Jobs

- `POST /v1/reportmailingjobs` (createReportMailingJob) — missing: stretchyReportParamMap

### Savings Product

- `POST /v1/savingsproducts` (createSavingsProduct) — missing: accountMappingForPayment

### Inline Job

- `POST /v1/jobs/{jobName}/inline` (executeInlineJob) — missing: loanIds

### Collection Sheet

- `POST /v1/collectionsheet` (generateCollectionSheet) — missing: bulkDisbursementTransactions

### Savings Account

- `POST /v1/savingsaccounts/{accountId}` (handleCommandsSavingsAccount) — missing: withdrawBalance

### LoansPointInTime

- `POST /v1/loans/at-date/search` (retrieveLoansPointInTime) — missing: loanIds

### repayment with post dated checks

- `PUT /v1/loans/{loanId}/postdatedchecks/{postDatedCheckId}` (updatePostDatedChecks) — missing: repaymentDate

### Working days

- `PUT /v1/workingdays` (updateWorkingDay) — missing: extendTermForRepaymentsOnHolidays
