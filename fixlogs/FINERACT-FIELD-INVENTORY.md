# Fineract Reference — Field Inventory

_Auto-extracted from reference Angular web-app. 292 form templates, 1556 field bindings._


## Field counts per module

| Module | Form templates | Unique fields |
|---|---|---|
| account-transfers | 4 | 29 |
| accounting | 13 | 37 |
| centers | 8 | 16 |
| clients | 25 | 72 |
| collaterals | 1 | 4 |
| collections | 2 | 6 |
| deposits | 25 | 60 |
| groups | 10 | 21 |
| loans | 41 | 128 |
| login | 3 | 5 |
| organization | 38 | 101 |
| products | 54 | 236 |
| remittances | 3 | 10 |
| savings | 17 | 50 |
| shared | 5 | 5 |
| shares | 8 | 19 |
| system | 28 | 64 |
| tasks | 1 | 5 |
| templates | 1 | 3 |
| users | 2 | 11 |
| zitadel | 3 | 16 |

## Per-module unique field list


### account-transfers

`transferDate`, `toBank`, `toClientId`, `toAccountType`, `toAccountId`, `transferAmount`, `transferDescription`, `name`, `applicant`, `transferType`, `priority`, `status`, `fromAccountType`, `fromAccountId`, `destination`, `toOfficeId`, `instructionType`, `amount`, `validFrom`, `validTill`, `recurrenceType`, `recurrenceInterval`, `recurrenceFrequency`, `recurrenceOnMonthDay`, `phoneNumber`, `type`, `fromAccount`, `toOffice`, `toAccount`


### accounting

`officeId`, `accountingRule`, `currencyCode`, `glAccountId`, `amount`, `referenceNumber`, `transactionDate`, `paymentTypeId`, `accountNumber`, `checkNumber`, `routingCode`, `receiptNumber`, `bankNumber`, `comments`, `closingDate`, `externalAssetOwner`, `debit`, `credit`, `date`, `createjournalentries`, `tillDate`, `type`, `name`, `usage`, `glCode`, `tagId`, `manualEntriesAllowed`, `description`, `debitRuleType`, `accountToDebit`, `debitTags`, `allowMultipleDebitEntries`, `creditRuleType`, `accountToCredit`, `creditTags`, `allowMultipleCreditEntries`, `financialActivityId`


### centers

`name`, `officeId`, `staffId`, `active`, `activationDate`, `externalId`, `submittedOnDate`, `startDate`, `repeating`, `frequency`, `interval`, `repeatsOnDay`, `presentMeetingDate`, `newMeetingDate`, `closureDate`, `closureReasonId`


### clients

`{{ datatableInput.controlName }}`, `officeId`, `legalFormId`, `externalId`, `fullname`, `firstname`, `middlename`, `lastname`, `dateOfBirth`, `constitutionId`, `mainBusinessLineId`, `incorpValidityTillDate`, `incorpNumber`, `remarks`, `genderId`, `staffId`, `isStaff`, `mobileNo`, `emailAddress`, `clientTypeId`, `clientClassificationId`, `submittedOnDate`, `active`, `activationDate`, `addSavings`, `savingsProductId`, `firstName`, `middleName`, `lastName`, `qualification`, `age`, `isDependent`, `relationshipId`, `professionId`, `maritalStatusId`, `accountNo`, `note`, `selected`, `documentTypeId`, `status`, `documentKey`, `description`, `fileName`, `rejectionDate`, `rejectionReasonId`, `reopenedDate`, `collateralId`, `name`, `quality`, `unitType`, `basePrice`, `pctToBase`, `quantity`, `totalValue`, `totalCollateralValue`, `transferDate`, `savingsAccountId`, `destinationOfficeId`, `withdrawalDate`, `withdrawalReasonId`, `templateId`, `reactivationDate`, `closureDate`, `closureReasonId`, `chargeId`, `amount`, `chargeCalculationType`, `chargeTimeType`, `dueDate`, `feeOnMonthDay`, `feeInterval`, `transactionDate`


### collaterals

`name`, `quantity`, `total`, `totalCollateral`


### collections

`officeId`, `transactionDate`, `staffId`, `meetingDate`, `groupId`, `centerId`


### deposits

`closedOnDate`, `maturityAmount`, `onAccountClosureId`, `toSavingsAccountId`, `transferDescription`, `note`, `withdrawnOnDate`, `activatedOnDate`, `approvedOnDate`, `transactionDate`, `paymentTypeId`, `accountNumber`, `checkNumber`, `routingCode`, `receiptNumber`, `bankNumber`, `chargeId`, `amount`, `chargeCalculationType`, `chargeTimeType`, `dueDate`, `feeOnMonthDay`, `feeInterval`, `rejectedOnDate`, `depositPeriod`, `depositPeriodFrequencyId`, `interestCompoundingPeriodType`, `interestPostingPeriodType`, `interestCalculationType`, `interestCalculationDaysInYearType`, `productId`, `submittedOnDate`, `fieldOfficerId`, `externalId`, `lockinPeriodFrequency`, `lockinPeriodFrequencyType`, `minDepositTerm`, `minDepositTermTypeId`, `inMultiplesOfDepositTerm`, `inMultiplesOfDepositTermTypeId`, `maxDepositTerm`, `maxDepositTermTypeId`, `transferInterestToSavings`, `linkAccountId`, `maturityInstructionId`, `transferToSavingsId`, `preClosurePenalApplicable`, `preClosurePenalInterest`, `preClosurePenalInterestOnTypeId`, `withHoldTax`, `taxGroupId`, `chequeNumber`, `isMandatoryDeposit`, `adjustAdvanceTowardsFuturePayments`, `allowWithdrawal`, `isCalendarInherited`, `expectedFirstDepositOnDate`, `recurringFrequency`, `recurringFrequencyType`, `minBalanceForInterestCalculation`


### groups

`clientId`, `role`, `frequency`, `interval`, `repeatsOnDay`, `startDate`, `closureDate`, `closureReasonId`, `clients`, `inheritDestinationGroupLoanOfficer`, `destinationGroupId`, `presentMeetingDate`, `newMeetingDate`, `staffId`, `activationDate`, `repeating`, `name`, `officeId`, `submittedOnDate`, `active`, `externalId`


### loans

`startDate`, `endDate`, `rejectedOnDate`, `note`, `transactionDate`, `outstandingPrincipalPortion`, `outstandingInterestPortion`, `outstandingFeeChargesPortion`, `outstandingPenaltyChargesPortion`, `transactionAmount`, `settlementDate`, `purchasePriceRatio`, `ownerExternalId`, `transferExternalId`, `externalId`, `classificationId`, `paymentTypeId`, `accountNumber`, `checkNumber`, `routingCode`, `receiptNumber`, `bankNumber`, `skipInterestRefund`, `originatorId`, `toLoanOfficerId`, `assignmentDate`, `chargeId`, `amount`, `chargeCalculation`, `chargeTime`, `dueDate`, `withdrawnOnDate`, `frequencyType`, `reAgeInterestHandling`, `reasonCodeValueId`, `rescheduleFromDate`, `rescheduleReasonId`, `submittedOnDate`, `rescheduleReasonComment`, `adjustedDueDate`, `graceOnPrincipal`, `graceOnInterest`, `extraTerms`, `newInterestRate`, `chargeOffReasonId`, `collateralTypeId`, `value`, `description`, `actualDisbursementDate`, `fixedEmiAmount`, `reAmortizationInterestHandling`, `writeoffReasonId`, `discountExternalId`, `templateId`, `existingClient`, `name`, `clientRelationshipTypeId`, `savingsId`, `firstname`, `lastname`, `dob`, `addressLine1`, `addressLine2`, `city`, `zip`, `mobileNumber`, `housePhoneNumber`, `approvedOnDate`, `expectedDisbursementDate`, `fromDate`, `toDate`, `nearBreachFrequencyType`, `minimumPaymentType`, `productId`, `originatorExternalId`, `loanOfficerId`, `loanPurposeId`, `fundId`, `linkAccountId`, `createStandingInstructionAtDisbursement`, `{{ datatableInput.controlName }}`, `totalPaymentVolume`, `discount`, `periodPaymentRate`, `repaymentEvery`, `repaymentFrequencyType`, `delinquencyGraceDays`, `delinquencyStartType`, `breachId`, `nearBreachId`, `breachGraceDays`, `loanTermFrequency`, `loanTermFrequencyType`, `fixedLength`, `numberOfRepayments`, `repaymentsStartingFromDate`, `interestChargedFromDate`, `repaymentFrequencyNthDayType`, `repaymentFrequencyDayOfWeekType`, `enableDownPayment`, `interestRatePerPeriod`, `interestRateFrequencyType`, `interestType`, `amortizationType`, `fixedPrincipalPercentagePerInstallment`, `isEqualAmortization`, `isFloatingInterestRate`, `transactionProcessingStrategyCode`, `interestCalculationPeriodType`, `allowPartialPeriodInterestCalculation`, `interestRecognitionOnDisbursementDate`, `inArrearsTolerance`, `graceOnInterestCharged`, `graceOnPrincipalPayment`, `graceOnInterestPayment`, `graceOnArrearsAgeing`, `enableInstallmentLevelDelinquency`, `isTopup`, `loanIdToClose`, `allowFullTermForTranche`, `maxOutstandingLoanBalance`, `startNewPeriod`, `collateral`, `quantity`, `totalValue`, `totalCollateralValue`, `minimumPayment`, `frequency`


### login

`username`, `password`, `twoFactorAuthenticationDeliveryMethod`, `otp`, `repeatPassword`


### organization

`officeId`, `staffId`, `legalForm`, `entity`, `status`, `datatableName`, `productId`, `assignmentDate`, `fromLoanOfficerId`, `toLoanOfficerId`, `fromDate`, `toDate`, `campaignName`, `providerId`, `triggerType`, `isNotification`, `recurrenceStartDate`, `frequency`, `interval`, `repeatsOnDay`, `runReportId`, `loanStatus`, `loanProducts`, `offices`, `loanDateOption`, `loanFromDate`, `loanToDate`, `includeOutStandingAmountPercentage`, `outStandingAmountPercentageCondition`, `minOutStandingAmountPercentage`, `outStandingAmountPercentage`, `maxOutStandingAmountPercentage`, `includeOutstandingAmount`, `outstandingAmountCondition`, `minOutstandingAmount`, `outstandingAmount`, `maxOutstandingAmount`, `name`, `externalId`, `originatorTypeId`, `channelTypeId`, `currency`, `criteriaName`, `parentId`, `openingDate`, `enabled`, `openingTime`, `closingTime`, `reschedulingType`, `repaymentsRescheduledTo`, `description`, `repaymentRescheduleType`, `extendTermForDailyRepayments`, `startDate`, `endDate`, `hourStartTime`, `minStartTime`, `hourEndTime`, `minEndTime`, `isFullDay`, `office`, `tellerName`, `cashier`, `assignmentPeriod`, `txnDate`, `currencyCode`, `txnAmount`, `txnNote`, `query`, `tableName`, `tableFields`, `email`, `reportRunFrequency`, `reportRunEvery`, `isActive`, `sourceCurrency`, `targetCurrency`, `latest`, `rateDate`, `sourceCurrencyCode`, `targetCurrencyCode`, `amount`, `conversionDate`, `buyIndicatorCode`, `sellIndicatorCode`, `buyRate`, `sellRate`, `referenceRate`, `firstname`, `lastname`, `isLoanOfficer`, `mobileNo`, `joiningDate`, `validationPolicyId`, `clientName`, `clientId`, `transferType`, `fromAccountType`, `fromAccountId`, `isCashPayment`, `position`


### products

`productId`, `restrictedProducts`, `attributeName`, `conditionType`, `attributeValue`, `incentiveType`, `amount`, `name`, `isBaseLendingRate`, `isActive`, `fromDate`, `interestRate`, `isDifferentialToBaseLendingRate`, `minRequiredOpeningBalance`, `enableLockinPeriod`, `lockinPeriodFrequency`, `lockinPeriodFrequencyType`, `withdrawalFeeForTransfers`, `minBalanceForInterestCalculation`, `enforceMinRequiredBalance`, `minRequiredBalance`, `withHoldTax`, `taxGroupId`, `allowOverdraft`, `minOverdraftForInterestCalculation`, `nominalAnnualInterestRateOverdraft`, `overdraftLimit`, `isDormancyTrackingActive`, `daysToInactive`, `daysToDormancy`, `daysToEscheat`, `shortName`, `description`, `nominalAnnualInterestRate`, `interestCompoundingPeriodType`, `interestPostingPeriodType`, `interestCalculationType`, `interestCalculationDaysInYearType`, `accountingRule`, `advancedAccountingRules`, `currencyCode`, `digitsAfterDecimal`, `setMultiples`, `inMultiplesOf`, `quality`, `unitType`, `basePrice`, `pctToBase`, `currency`, `chargeAppliesTo`, `chargeTimeType`, `chargeCalculationType`, `chargePaymentMode`, `addFeeFrequency`, `feeInterval`, `feeFrequency`, `feeOnMonthDay`, `minCap`, `maxCap`, `active`, `penalty`, `percentage`, `creditAccountType`, `creditAccount`, `startDate`, `debitAccountType`, `transferType`, `transferMode`, `feeType`, `feeValue`, `feeCurrency`, `thresholdAmount`, `thresholdFeeValue`, `exchangeRateRequired`, `nearBreachName`, `nearBreachFrequencyType`, `nearBreachThreshold`, `breachFrequencyType`, `breachAmountCalculationType`, `breachAmount`, `supportedInterestRefundTypes`, `enableIncomeCapitalization`, `capitalizedIncomeCalculationType`, `capitalizedIncomeStrategy`, `capitalizedIncomeType`, `enableBuyDownFee`, `buyDownFeeCalculationType`, `buyDownFeeStrategy`, `buyDownFeeIncomeType`, `merchantBuyDownFee`, `amortizationType`, `npvDayCount`, `delinquencyGraceDays`, `delinquencyStartType`, `delinquencyBucketId`, `breachId`, `nearBreachId`, `breachGraceDays`, `nearBreachEvalFrequencyType`, `interestType`, `interestCalculationPeriodType`, `isEqualAmortization`, `allowPartialPeriodInterestCalculation`, `loanScheduleType`, `transactionProcessingStrategyCode`, `loanScheduleProcessingType`, `multiDisburseLoan`, `maxTrancheCount`, `outstandingLoanBalance`, `disallowExpectedDisbursements`, `allowFullTermForTranche`, `enableDownPayment`, `disbursedAmountPercentageForDownPayment`, `enableAutoRepaymentForDownPayment`, `chargeOffBehaviour`, `graceOnPrincipalPayment`, `graceOnInterestPayment`, `enableInstallmentLevelDelinquency`, `graceOnInterestCharged`, `inArrearsTolerance`, `daysInYearType`, `daysInYearCustomStrategy`, `daysInMonthType`, `canDefineInstallmentAmount`, `graceOnArrearsAgeing`, `overdueDaysForNPA`, `accountMovesOutOfNPAOnlyOnArrearsCompletion`, `principalThresholdForLastInstallment`, `allowVariableInstallments`, `minimumGap`, `maximumGap`, `canUseForTopup`, `isInterestRecalculationEnabled`, `preClosureInterestCalculationStrategy`, `rescheduleStrategyMethod`, `interestRecalculationCompoundingMethod`, `recalculationCompoundingFrequencyInterval`, `recalculationRestFrequencyInterval`, `recalculationCompoundingFrequencyType`, `recalculationCompoundingFrequencyNthDayType`, `recalculationCompoundingFrequencyDayOfWeekType`, `recalculationCompoundingFrequencyOnDayType`, `recalculationRestFrequencyType`, `recalculationRestFrequencyNthDayType`, `recalculationRestFrequencyDayOfWeekType`, `recalculationRestFrequencyOnDayType`, `isArrearsBasedOnOriginalSchedule`, `disallowInterestCalculationOnPastDue`, `holdGuaranteeFunds`, `mandatoryGuarantee`, `minimumGuaranteeFromOwnFunds`, `minimumGuaranteeFromGuarantor`, `useDueForRepaymentsConfigurations`, `dueDaysForRepaymentEvent`, `overDueDaysForRepaymentEvent`, `allowAttributeConfiguration`, `repaymentEvery`, `graceOnPrincipalAndInterestPayment`, `breach`, `delinquencyBucketClassification`, `discountDefault`, `periodPaymentFrequency`, `periodPaymentFrequencyType`, `minPrincipal`, `principal`, `maxPrincipal`, `allowApprovedDisbursedAmountsOverApplied`, `overAppliedCalculationType`, `overAppliedNumber`, `minPeriodPaymentRate`, `periodPaymentRate`, `maxPeriodPaymentRate`, `discount`, `repaymentStartDateType`, `minNumberOfRepayments`, `numberOfRepayments`, `maxNumberOfRepayments`, `interestRecognitionOnDisbursementDate`, `isLinkedToFloatingInterestRates`, `minInterestRatePerPeriod`, `interestRatePerPeriod`, `maxInterestRatePerPeriod`, `interestRateFrequencyType`, `floatingRatesId`, `interestRateDifferential`, `isFloatingInterestRateCalculationAllowed`, `minDifferentialLendingRate`, `defaultDifferentialLendingRate`, `maxDifferentialLendingRate`, `useBorrowerCycle`, `repaymentFrequencyType`, `fixedLength`, `minimumDaysBetweenDisbursalAndFirstRepayment`, `enableAccrualActivityPosting`, `externalId`, `closeDate`, `fundId`, `includeInBorrowerCycle`, `installmentAmountInMultiplesOf`, `minimumShares`, `nominalShares`, `maximumShares`, `minimumActivePeriodForDividends`, `minimumactiveperiodFrequencyType`, `allowDividendCalculationForInactiveClients`, `totalShares`, `sharesIssued`, `unitPrice`, `shareCapital`, `dividendPeriodStartDate`, `dividendPeriodEndDate`, `dividendAmount`, `isMandatoryDeposit`, `adjustAdvanceTowardsFuturePayments`, `allowWithdrawal`, `minDepositTerm`, `minDepositTermTypeId`, `inMultiplesOfDepositTerm`, `inMultiplesOfDepositTermTypeId`, `maxDepositTerm`, `maxDepositTermTypeId`, `preClosurePenalApplicable`, `preClosurePenalInterest`, `preClosurePenalInterestOnTypeId`, `minDepositAmount`, `depositAmount`, `maxDepositAmount`, `endDate`, `isPrimaryGroupingByAmount`, `classification`, `minimumAgeDays`, `maximumAgeDays`, `frequency`, `frequencyType`, `minimumPayment`, `minimumPaymentType`


### remittances

`remittanceNumber`, `averageAmount`, `senderCount`, `senderRegistry`, `givenName`, `lastName`, `documentType`, `documentNumber`, `vendor`, `externalId`


### savings

`productId`, `submittedOnDate`, `fieldOfficerId`, `externalId`, `currencyCode`, `decimal`, `nominalAnnualInterestRate`, `interestCompoundingPeriodType`, `interestPostingPeriodType`, `interestCalculationType`, `interestCalculationDaysInYearType`, `minRequiredOpeningBalance`, `withdrawalFeeForTransfers`, `lockinPeriodFrequency`, `lockinPeriodFrequencyType`, `allowOverdraft`, `minOverdraftForInterestCalculation`, `nominalAnnualInterestRateOverdraft`, `overdraftLimit`, `enforceMinRequiredBalance`, `minRequiredBalance`, `minBalanceForInterestCalculation`, `activatedOnDate`, `chargeId`, `amount`, `chargeCalculationType`, `chargeTimeType`, `dueDate`, `feeOnMonthDay`, `feeInterval`, `rejectedOnDate`, `note`, `transactionDate`, `closedOnDate`, `withdrawBalance`, `postInterestValidationOnClosure`, `paymentTypeId`, `accountNumber`, `checkNumber`, `routingCode`, `receiptNumber`, `bankNumber`, `withdrawnOnDate`, `unassignedDate`, `toSavingsOfficerId`, `assignmentDate`, `reasonForBlock`, `approvedOnDate`, `fromDate`, `toDate`


### shared

`password`, `repeatPassword`, `note`, `url`, `controlSelect`


### shares

`productId`, `submittedDate`, `externalId`, `currencyCode`, `unitPrice`, `requestedShares`, `savingsAccountId`, `applicationDate`, `allowDividendCalculationForInactiveClients`, `minimumActivePeriod`, `minimumActivePeriodFrequencyType`, `lockinPeriodFrequency`, `lockinPeriodFrequencyType`, `requestedDate`, `rejectedDate`, `note`, `approvedDate`, `activatedDate`, `closedDate`


### system

`key`, `name`, `countryCode`, `description`, `text`, `value`, `displayName`, `cronExpression`, `active`, `selected`, `server_key`, `gcm_end_point`, `fcm_end_point`, `s3_bucket_name`, `s3_access_key`, `s3_secret_key`, `host_name`, `port_number`, `end_point`, `tenant_app_key`, `username`, `password`, `host`, `port`, `useTLS`, `fromEmail`, `fromName`, `position`, `isActive`, `businessDate`, `cobDate`, `stringValue`, `dateValue`, `contentType`, `phoneNumber`, `payloadUrl`, `smsProvider`, `smsProviderAccountId`, `smsProviderToken`, `grouping`, `entity`, `action`, `parameterName`, `reportParameterName`, `reportName`, `reportType`, `reportSubType`, `reportCategory`, `useReport`, `reportSql`, `accountType`, `prefixType`, `type`, `length`, `code`, `mandatory`, `unique`, `indexed`, `datatableName`, `apptableName`, `entitySubType`, `multiRow`, `mappingFirstParamId`, `mappingSecondParamId`


### tasks

`makerDateTimeFrom`, `makerDateTimeto`, `actionName`, `entityName`, `resourceId`


### templates

`entity`, `type`, `name`


### users

`username`, `email`, `firstname`, `lastname`, `passwordNeverExpires`, `officeId`, `staffId`, `roles`, `sendPasswordToEmail`, `password`, `repeatPassword`


### zitadel

`username`, `email`, `firstname`, `lastname`, `countryCode`, `phoneNumber`, `gender`, `preferredLanguage`, `officeId`, `staffId`, `roles`, `firstName`, `lastName`, `password`, `repeatPassword`, `currentPassword`
