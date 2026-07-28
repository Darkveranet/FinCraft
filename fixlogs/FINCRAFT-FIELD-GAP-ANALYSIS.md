# FinCraft ↔ Fineract — Field Gap Analysis (Log/Inventory)

_Compares each FinCraft form module against the canonical field set extracted from the Fineract reference web-app. Wizard modules (clients/loans/savings) are matched semantically via an alias map, so coverage is approximate for those._


## Coverage summary

| FinCraft module | Fineract source | Ref fields | FinCraft fields | Coverage | Missing |
|---|---|---:|---:|---:|---:|
| clients | clients | 72 | 64 | 38% | 45 |
| groups-centers | groups, centers | 21 | 7 | 24% | 16 |
| loans | loans | 128 | 55 | 41% | 75 |
| savings | savings | 50 | 18 | 14% | 43 |
| savings-deposits | savings, deposits | 79 | 29 | 28% | 57 |
| shares | shares | 19 | 7 | 26% | 14 |
| products | products | 236 | 38 | 30% | 166 |
| organization | organization | 101 | 22 | 27% | 74 |
| accounting | accounting | 37 | 26 | 62% | 14 |
| system | system | 64 | 2 | 3% | 62 |
| admin | users, system | 73 | 14 | 16% | 61 |
| integrations | system | 64 | 23 | 5% | 61 |

## Missing fields per module (fix backlog)


### clients  —  38% covered, 45 missing

Missing (candidate additions): `{{ datatableInput.controlName }}`, `mainBusinessLineId`, `addSavings`, `savingsProductId`, `qualification`, `age`, `isDependent`, `relationshipId`, `professionId`, `maritalStatusId`, `accountNo`, `note`, `selected`, `documentTypeId`, `status`, `documentKey`, `description`, `fileName`, `rejectionDate`, `rejectionReasonId`, `reopenedDate`, `collateralId`, `name`, `quality`, `unitType`, `basePrice`, `pctToBase`, `quantity`, `totalValue`, `totalCollateralValue`, `transferDate`, `savingsAccountId`, `withdrawalDate`, `withdrawalReasonId`, `templateId`, `closureDate`, `closureReasonId`, `chargeId`, `amount`, `chargeCalculationType`, `chargeTimeType`, `dueDate`, `feeOnMonthDay`, `feeInterval`, `transactionDate`


### groups-centers  —  24% covered, 16 missing

Missing (candidate additions): `clientId`, `role`, `frequency`, `interval`, `repeatsOnDay`, `startDate`, `closureDate`, `closureReasonId`, `clients`, `inheritDestinationGroupLoanOfficer`, `destinationGroupId`, `presentMeetingDate`, `newMeetingDate`, `activationDate`, `repeating`, `active`


### loans  —  41% covered, 75 missing

Missing (candidate additions): `startDate`, `endDate`, `rejectedOnDate`, `outstandingInterestPortion`, `outstandingFeeChargesPortion`, `outstandingPenaltyChargesPortion`, `settlementDate`, `purchasePriceRatio`, `classificationId`, `accountNumber`, `checkNumber`, `routingCode`, `bankNumber`, `skipInterestRefund`, `originatorId`, `assignmentDate`, `chargeId`, `chargeCalculation`, `chargeTime`, `withdrawnOnDate`, `reAgeInterestHandling`, `reasonCodeValueId`, `rescheduleReasonComment`, `extraTerms`, `chargeOffReasonId`, `collateralTypeId`, `value`, `description`, `fixedEmiAmount`, `reAmortizationInterestHandling`, `writeoffReasonId`, `templateId`, `name`, `savingsId`, `lastname`, `dob`, `addressLine1`, `addressLine2`, `city`, `zip`, `mobileNumber`, `housePhoneNumber`, `approvedOnDate`, `toDate`, `nearBreachFrequencyType`, `minimumPaymentType`, `{{ datatableInput.controlName }}`, `totalPaymentVolume`, `discount`, `periodPaymentRate`, `delinquencyGraceDays`, `delinquencyStartType`, `breachId`, `nearBreachId`, `breachGraceDays`, `loanTermFrequency`, `loanTermFrequencyType`, `fixedLength`, `interestChargedFromDate`, `enableDownPayment`, `isEqualAmortization`, `transactionProcessingStrategyCode`, `allowPartialPeriodInterestCalculation`, `inArrearsTolerance`, `graceOnInterestCharged`, `enableInstallmentLevelDelinquency`, `isTopup`, `allowFullTermForTranche`, `maxOutstandingLoanBalance`, `startNewPeriod`, `collateral`, `quantity`, `totalValue`, `totalCollateralValue`, `minimumPayment`


### savings  —  14% covered, 43 missing

Missing (candidate additions): `externalId`, `currencyCode`, `decimal`, `nominalAnnualInterestRate`, `interestCompoundingPeriodType`, `interestPostingPeriodType`, `interestCalculationType`, `interestCalculationDaysInYearType`, `withdrawalFeeForTransfers`, `allowOverdraft`, `minOverdraftForInterestCalculation`, `nominalAnnualInterestRateOverdraft`, `overdraftLimit`, `enforceMinRequiredBalance`, `minRequiredBalance`, `minBalanceForInterestCalculation`, `activatedOnDate`, `chargeId`, `amount`, `chargeCalculationType`, `chargeTimeType`, `dueDate`, `feeOnMonthDay`, `feeInterval`, `rejectedOnDate`, `note`, `transactionDate`, `closedOnDate`, `withdrawBalance`, `postInterestValidationOnClosure`, `paymentTypeId`, `accountNumber`, `checkNumber`, `routingCode`, `receiptNumber`, `bankNumber`, `withdrawnOnDate`, `unassignedDate`, `assignmentDate`, `reasonForBlock`, `approvedOnDate`, `fromDate`, `toDate`


### savings-deposits  —  28% covered, 57 missing

Missing (candidate additions): `currencyCode`, `decimal`, `interestCompoundingPeriodType`, `interestPostingPeriodType`, `interestCalculationType`, `interestCalculationDaysInYearType`, `withdrawalFeeForTransfers`, `minOverdraftForInterestCalculation`, `enforceMinRequiredBalance`, `minRequiredBalance`, `minBalanceForInterestCalculation`, `activatedOnDate`, `chargeId`, `chargeCalculationType`, `chargeTimeType`, `dueDate`, `feeOnMonthDay`, `feeInterval`, `rejectedOnDate`, `closedOnDate`, `withdrawBalance`, `postInterestValidationOnClosure`, `routingCode`, `bankNumber`, `withdrawnOnDate`, `unassignedDate`, `toSavingsOfficerId`, `assignmentDate`, `reasonForBlock`, `approvedOnDate`, `fromDate`, `toDate`, `maturityAmount`, `onAccountClosureId`, `toSavingsAccountId`, `transferDescription`, `minDepositTerm`, `minDepositTermTypeId`, `inMultiplesOfDepositTerm`, `inMultiplesOfDepositTermTypeId`, `maxDepositTerm`, `maxDepositTermTypeId`, `transferInterestToSavings`, `linkAccountId`, `transferToSavingsId`, `preClosurePenalApplicable`, `preClosurePenalInterest`, `preClosurePenalInterestOnTypeId`, `withHoldTax`, `taxGroupId`, `chequeNumber`, `isMandatoryDeposit`, `adjustAdvanceTowardsFuturePayments`, `allowWithdrawal`, `isCalendarInherited`, `recurringFrequency`, `recurringFrequencyType`


### shares  —  26% covered, 14 missing

Missing (candidate additions): `currencyCode`, `savingsAccountId`, `applicationDate`, `allowDividendCalculationForInactiveClients`, `minimumActivePeriod`, `minimumActivePeriodFrequencyType`, `lockinPeriodFrequency`, `lockinPeriodFrequencyType`, `requestedDate`, `rejectedDate`, `note`, `approvedDate`, `activatedDate`, `closedDate`


### products  —  30% covered, 166 missing

Missing (candidate additions): `productId`, `restrictedProducts`, `attributeName`, `conditionType`, `attributeValue`, `incentiveType`, `isBaseLendingRate`, `fromDate`, `isDifferentialToBaseLendingRate`, `enableLockinPeriod`, `lockinPeriodFrequency`, `lockinPeriodFrequencyType`, `minBalanceForInterestCalculation`, `enforceMinRequiredBalance`, `minRequiredBalance`, `withHoldTax`, `taxGroupId`, `allowOverdraft`, `minOverdraftForInterestCalculation`, `overdraftLimit`, `daysToDormancy`, `daysToEscheat`, `setMultiples`, `inMultiplesOf`, `quality`, `unitType`, `basePrice`, `pctToBase`, `chargePaymentMode`, `percentage`, `creditAccountType`, `creditAccount`, `startDate`, `debitAccountType`, `transferType`, `transferMode`, `feeType`, `feeValue`, `feeCurrency`, `thresholdFeeValue`, `exchangeRateRequired`, `nearBreachName`, `nearBreachFrequencyType`, `nearBreachThreshold`, `breachFrequencyType`, `supportedInterestRefundTypes`, `enableIncomeCapitalization`, `capitalizedIncomeCalculationType`, `capitalizedIncomeStrategy`, `capitalizedIncomeType`, `enableBuyDownFee`, `buyDownFeeCalculationType`, `buyDownFeeStrategy`, `buyDownFeeIncomeType`, `merchantBuyDownFee`, `npvDayCount`, `delinquencyGraceDays`, `delinquencyStartType`, `delinquencyBucketId`, `breachId`, `nearBreachId`, `breachGraceDays`, `nearBreachEvalFrequencyType`, `isEqualAmortization`, `allowPartialPeriodInterestCalculation`, `loanScheduleType`, `loanScheduleProcessingType`, `multiDisburseLoan`, `maxTrancheCount`, `outstandingLoanBalance`, `disallowExpectedDisbursements`, `allowFullTermForTranche`, `enableDownPayment`, `enableAutoRepaymentForDownPayment`, `chargeOffBehaviour`, `enableInstallmentLevelDelinquency`, `graceOnInterestCharged`, `inArrearsTolerance`, `daysInYearCustomStrategy`, `daysInMonthType`, `graceOnArrearsAgeing`, `overdueDaysForNPA`, `accountMovesOutOfNPAOnlyOnArrearsCompletion`, `allowVariableInstallments`, `minimumGap`, `maximumGap`, `canUseForTopup`, `isInterestRecalculationEnabled`, `preClosureInterestCalculationStrategy`, `rescheduleStrategyMethod`, `interestRecalculationCompoundingMethod`, `recalculationCompoundingFrequencyInterval`, `recalculationRestFrequencyInterval`, `recalculationCompoundingFrequencyType`, `recalculationCompoundingFrequencyNthDayType`, `recalculationCompoundingFrequencyDayOfWeekType`, `recalculationCompoundingFrequencyOnDayType`, `recalculationRestFrequencyType`, `recalculationRestFrequencyNthDayType`, `recalculationRestFrequencyDayOfWeekType`, `recalculationRestFrequencyOnDayType`, `isArrearsBasedOnOriginalSchedule`, `disallowInterestCalculationOnPastDue`, `holdGuaranteeFunds`, `mandatoryGuarantee`, `minimumGuaranteeFromOwnFunds`, `minimumGuaranteeFromGuarantor`, `useDueForRepaymentsConfigurations`, `dueDaysForRepaymentEvent`, `overDueDaysForRepaymentEvent`, `allowAttributeConfiguration`, `breach`, `delinquencyBucketClassification`, `discountDefault`, `periodPaymentFrequency`, `periodPaymentFrequencyType`, `overAppliedCalculationType`, `overAppliedNumber`, `minPeriodPaymentRate`, `periodPaymentRate`, `maxPeriodPaymentRate`, `discount`, `repaymentStartDateType`, `interestRecognitionOnDisbursementDate`, `isLinkedToFloatingInterestRates`, `floatingRatesId`, `interestRateDifferential`, `isFloatingInterestRateCalculationAllowed`, `minDifferentialLendingRate`, `defaultDifferentialLendingRate`, `maxDifferentialLendingRate`, `useBorrowerCycle`, `fixedLength`, `minimumDaysBetweenDisbursalAndFirstRepayment`, `enableAccrualActivityPosting`, `externalId`, `closeDate`, `fundId`, `includeInBorrowerCycle`, `minimumShares`, `nominalShares`, `maximumShares`, `totalShares`, `sharesIssued`, `unitPrice`, `shareCapital`, `dividendPeriodStartDate`, `dividendPeriodEndDate`, `isMandatoryDeposit`, `adjustAdvanceTowardsFuturePayments`, `allowWithdrawal`, `minDepositTerm`, `minDepositTermTypeId`, `inMultiplesOfDepositTerm`, `inMultiplesOfDepositTermTypeId`, `maxDepositTerm`, `maxDepositTermTypeId`, `preClosurePenalApplicable`, `preClosurePenalInterest`, `preClosurePenalInterestOnTypeId`, `endDate`, `classification`, `minimumAgeDays`, `maximumAgeDays`, `minimumPayment`, `minimumPaymentType`


### organization  —  27% covered, 74 missing

Missing (candidate additions): `staffId`, `legalForm`, `entity`, `datatableName`, `productId`, `assignmentDate`, `fromLoanOfficerId`, `toLoanOfficerId`, `campaignName`, `providerId`, `triggerType`, `isNotification`, `frequency`, `interval`, `repeatsOnDay`, `runReportId`, `loanProducts`, `loanDateOption`, `includeOutStandingAmountPercentage`, `outStandingAmountPercentageCondition`, `minOutStandingAmountPercentage`, `outStandingAmountPercentage`, `maxOutStandingAmountPercentage`, `includeOutstandingAmount`, `outstandingAmountCondition`, `minOutstandingAmount`, `outstandingAmount`, `maxOutstandingAmount`, `originatorTypeId`, `channelTypeId`, `currency`, `criteriaName`, `enabled`, `openingTime`, `closingTime`, `repaymentRescheduleType`, `extendTermForDailyRepayments`, `hourStartTime`, `minStartTime`, `hourEndTime`, `minEndTime`, `isFullDay`, `tellerName`, `cashier`, `assignmentPeriod`, `txnDate`, `currencyCode`, `txnAmount`, `txnNote`, `query`, `tableName`, `tableFields`, `email`, `reportRunFrequency`, `reportRunEvery`, `sourceCurrency`, `targetCurrency`, `latest`, `rateDate`, `sourceCurrencyCode`, `targetCurrencyCode`, `amount`, `conversionDate`, `buyIndicatorCode`, `sellIndicatorCode`, `buyRate`, `sellRate`, `referenceRate`, `validationPolicyId`, `clientName`, `clientId`, `transferType`, `fromAccountType`, `fromAccountId`


### accounting  —  62% covered, 14 missing

Missing (candidate additions): `accountingRule`, `amount`, `closingDate`, `externalAssetOwner`, `date`, `createjournalentries`, `tillDate`, `tagId`, `debitRuleType`, `accountToDebit`, `debitTags`, `creditRuleType`, `accountToCredit`, `creditTags`


### system  —  3% covered, 62 missing

Missing (candidate additions): `key`, `name`, `countryCode`, `description`, `text`, `value`, `displayName`, `cronExpression`, `active`, `selected`, `server_key`, `gcm_end_point`, `fcm_end_point`, `s3_bucket_name`, `s3_access_key`, `s3_secret_key`, `host_name`, `port_number`, `end_point`, `tenant_app_key`, `username`, `password`, `host`, `port`, `useTLS`, `fromEmail`, `fromName`, `position`, `isActive`, `businessDate`, `cobDate`, `stringValue`, `dateValue`, `contentType`, `phoneNumber`, `payloadUrl`, `smsProvider`, `smsProviderAccountId`, `smsProviderToken`, `grouping`, `action`, `parameterName`, `reportParameterName`, `reportName`, `reportType`, `reportSubType`, `reportCategory`, `useReport`, `reportSql`, `accountType`, `prefixType`, `type`, `length`, `code`, `mandatory`, `unique`, `indexed`, `datatableName`, `apptableName`, `multiRow`, `mappingFirstParamId`, `mappingSecondParamId`


### admin  —  16% covered, 61 missing

Missing (candidate additions): `key`, `name`, `countryCode`, `description`, `text`, `value`, `displayName`, `cronExpression`, `active`, `selected`, `server_key`, `gcm_end_point`, `fcm_end_point`, `s3_bucket_name`, `s3_access_key`, `s3_secret_key`, `host_name`, `port_number`, `end_point`, `tenant_app_key`, `host`, `port`, `useTLS`, `fromName`, `position`, `isActive`, `businessDate`, `cobDate`, `stringValue`, `dateValue`, `contentType`, `phoneNumber`, `payloadUrl`, `smsProvider`, `smsProviderAccountId`, `smsProviderToken`, `grouping`, `entity`, `action`, `parameterName`, `reportParameterName`, `reportName`, `reportType`, `reportSubType`, `reportCategory`, `useReport`, `reportSql`, `accountType`, `prefixType`, `type`, `length`, `code`, `mandatory`, `unique`, `indexed`, `datatableName`, `apptableName`, `entitySubType`, `multiRow`, `mappingFirstParamId`, `mappingSecondParamId`


### integrations  —  5% covered, 61 missing

Missing (candidate additions): `key`, `countryCode`, `text`, `value`, `displayName`, `cronExpression`, `active`, `selected`, `server_key`, `gcm_end_point`, `fcm_end_point`, `s3_bucket_name`, `s3_access_key`, `s3_secret_key`, `host_name`, `port_number`, `end_point`, `tenant_app_key`, `username`, `password`, `host`, `port`, `useTLS`, `fromEmail`, `fromName`, `position`, `isActive`, `businessDate`, `cobDate`, `stringValue`, `dateValue`, `contentType`, `phoneNumber`, `payloadUrl`, `smsProvider`, `smsProviderAccountId`, `smsProviderToken`, `grouping`, `entity`, `action`, `parameterName`, `reportParameterName`, `reportName`, `reportType`, `reportSubType`, `reportCategory`, `useReport`, `reportSql`, `prefixType`, `type`, `length`, `code`, `mandatory`, `unique`, `indexed`, `datatableName`, `apptableName`, `entitySubType`, `multiRow`, `mappingFirstParamId`, `mappingSecondParamId`
