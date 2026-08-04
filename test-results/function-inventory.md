# FinCraft E2E Function Inventory

Generated: 2026-08-03T21:27:53.269Z

- Source files: 295
- Functions discovered: 3106
- Referenced by E2E specs: 1010
- Not referenced by E2E specs: 2096

> REFERENCED is evidence of test ownership, not proof that every branch executed. PASS/FAIL comes from Playwright/JUnit results.

## Module summary

| Module | Functions | Referenced | Untested |
|---|---:|---:|---:|
| js/api/accounting.js | 71 | 46 | 25 |
| js/api/admin.js | 85 | 55 | 30 |
| js/api/auth-account.js | 20 | 11 | 9 |
| js/api/clients.js | 53 | 19 | 34 |
| js/api/core.js | 13 | 3 | 10 |
| js/api/credit-bureau.js | 19 | 2 | 17 |
| js/api/generated/aliases.generated.js | 1 | 0 | 1 |
| js/api/generated/builders.generated.js | 1 | 0 | 1 |
| js/api/generated/client.generated.js | 1121 | 316 | 805 |
| js/api/generated/contracts.generated.js | 1 | 0 | 1 |
| js/api/generated/templates.generated.js | 2 | 0 | 2 |
| js/api/generated/validators.generated.js | 8 | 3 | 5 |
| js/api/groups-centers.js | 54 | 38 | 16 |
| js/api/index.js | 2 | 0 | 2 |
| js/api/integrations.js | 68 | 51 | 17 |
| js/api/interest-rate-charts.js | 13 | 6 | 7 |
| js/api/interoperation.js | 17 | 4 | 13 |
| js/api/loans.js | 169 | 54 | 115 |
| js/api/misc.js | 78 | 48 | 30 |
| js/api/mix-xbrl.js | 5 | 2 | 3 |
| js/api/office-transactions.js | 5 | 4 | 1 |
| js/api/operation-runner.js | 9 | 4 | 5 |
| js/api/organization.js | 79 | 47 | 32 |
| js/api/products.js | 52 | 43 | 9 |
| js/api/report-mailing.js | 8 | 6 | 2 |
| js/api/reports.js | 43 | 25 | 18 |
| js/api/savings-deposits.js | 129 | 73 | 56 |
| js/api/shares.js | 24 | 13 | 11 |
| js/api/social-performance.js | 23 | 8 | 15 |
| js/api/treasury.js | 10 | 0 | 10 |
| js/pages/accounting/actions/balances.js | 2 | 0 | 2 |
| js/pages/accounting/actions/coa.js | 7 | 0 | 7 |
| js/pages/accounting/actions/journal.js | 6 | 0 | 6 |
| js/pages/accounting/actions/provisioning.js | 5 | 0 | 5 |
| js/pages/accounting/index.js | 1 | 1 | 0 |
| js/pages/accounting/loaders/coa.js | 8 | 0 | 8 |
| js/pages/accounting/loaders/period.js | 4 | 0 | 4 |
| js/pages/accounting/loaders/rules.js | 2 | 0 | 2 |
| js/pages/accounting/shared.js | 8 | 1 | 7 |
| js/pages/analytics.js | 11 | 1 | 10 |
| js/pages/centers/actions.js | 6 | 0 | 6 |
| js/pages/centers/detail.js | 13 | 3 | 10 |
| js/pages/centers/index.js | 1 | 1 | 0 |
| js/pages/centers/list.js | 5 | 1 | 4 |
| js/pages/centers/shared.js | 1 | 0 | 1 |
| js/pages/charges/actions.js | 1 | 0 | 1 |
| js/pages/charges/detail.js | 6 | 2 | 4 |
| js/pages/charges/index.js | 1 | 1 | 0 |
| js/pages/charges/list.js | 3 | 1 | 2 |
| js/pages/charges/shared.js | 1 | 0 | 1 |
| js/pages/clients/actions/charges.js | 2 | 0 | 2 |
| js/pages/clients/actions/identity.js | 7 | 0 | 7 |
| js/pages/clients/actions/lifecycle.js | 6 | 0 | 6 |
| js/pages/clients/detail/accounts.js | 7 | 0 | 7 |
| js/pages/clients/detail/identity.js | 6 | 0 | 6 |
| js/pages/clients/detail/index.js | 13 | 7 | 6 |
| js/pages/clients/detail/notes-docs.js | 4 | 0 | 4 |
| js/pages/clients/index.js | 1 | 1 | 0 |
| js/pages/clients/list.js | 5 | 0 | 5 |
| js/pages/clients/new.js | 11 | 4 | 7 |
| js/pages/clients/shared.js | 6 | 0 | 6 |
| js/pages/collateral/actions.js | 1 | 0 | 1 |
| js/pages/collateral/detail.js | 6 | 1 | 5 |
| js/pages/collateral/index.js | 1 | 1 | 0 |
| js/pages/collateral/list.js | 3 | 1 | 2 |
| js/pages/collateral/shared.js | 1 | 0 | 1 |
| js/pages/collections.js | 1 | 1 | 0 |
| js/pages/credit-bureau.js | 6 | 1 | 5 |
| js/pages/dashboard/charts.js | 15 | 0 | 15 |
| js/pages/dashboard/data.js | 18 | 0 | 18 |
| js/pages/dashboard/index.js | 12 | 1 | 11 |
| js/pages/dashboard/shared.js | 2 | 0 | 2 |
| js/pages/datatables/actions.js | 7 | 0 | 7 |
| js/pages/datatables/detail.js | 3 | 0 | 3 |
| js/pages/datatables/index.js | 1 | 1 | 0 |
| js/pages/datatables/list.js | 4 | 1 | 3 |
| js/pages/datatables/shared.js | 1 | 0 | 1 |
| js/pages/deposits/actions/charges.js | 2 | 0 | 2 |
| js/pages/deposits/actions/lifecycle.js | 3 | 0 | 3 |
| js/pages/deposits/actions/transactions.js | 3 | 0 | 3 |
| js/pages/deposits/detail/closure.js | 1 | 0 | 1 |
| js/pages/deposits/detail/index.js | 7 | 3 | 4 |
| js/pages/deposits/detail/notes-docs.js | 2 | 0 | 2 |
| js/pages/deposits/detail/transactions.js | 3 | 0 | 3 |
| js/pages/deposits/index.js | 1 | 1 | 0 |
| js/pages/deposits/list.js | 5 | 0 | 5 |
| js/pages/deposits/shared.js | 1 | 0 | 1 |
| js/pages/groups/actions/lifecycle.js | 3 | 0 | 3 |
| js/pages/groups/actions/meetings.js | 2 | 0 | 2 |
| js/pages/groups/actions/members.js | 8 | 1 | 7 |
| js/pages/groups/detail/index.js | 9 | 5 | 4 |
| js/pages/groups/detail/meetings-charges.js | 3 | 0 | 3 |
| js/pages/groups/detail/members.js | 4 | 0 | 4 |
| js/pages/groups/detail/notes-docs.js | 2 | 0 | 2 |
| js/pages/groups/index.js | 1 | 1 | 0 |
| js/pages/groups/list.js | 5 | 1 | 4 |
| js/pages/groups/shared.js | 1 | 0 | 1 |
| js/pages/interest-rate-charts.js | 10 | 2 | 8 |
| js/pages/interoperation.js | 3 | 2 | 1 |
| js/pages/loans/actions/approval.js | 4 | 0 | 4 |
| js/pages/loans/actions/charges.js | 4 | 0 | 4 |
| js/pages/loans/actions/closure.js | 4 | 0 | 4 |
| js/pages/loans/actions/collateral-guarantors.js | 6 | 0 | 6 |
| js/pages/loans/actions/disbursement.js | 3 | 0 | 3 |
| js/pages/loans/actions/repayment.js | 9 | 0 | 9 |
| js/pages/loans/actions/restructuring.js | 7 | 0 | 7 |
| js/pages/loans/actions/schedule.js | 1 | 0 | 1 |
| js/pages/loans/detail/collateral-guarantors.js | 4 | 0 | 4 |
| js/pages/loans/detail/index.js | 9 | 3 | 6 |
| js/pages/loans/detail/lifecycle.js | 3 | 0 | 3 |
| js/pages/loans/detail/notes-docs.js | 2 | 0 | 2 |
| js/pages/loans/detail/schedule.js | 2 | 0 | 2 |
| js/pages/loans/detail/transactions.js | 4 | 0 | 4 |
| js/pages/loans/index.js | 1 | 1 | 0 |
| js/pages/loans/list.js | 10 | 1 | 9 |
| js/pages/loans/new.js | 10 | 5 | 5 |
| js/pages/loans/shared.js | 1 | 0 | 1 |
| js/pages/misc/index.js | 1 | 1 | 0 |
| js/pages/misc/navigation.js | 1 | 1 | 0 |
| js/pages/misc/profile.js | 1 | 0 | 1 |
| js/pages/misc/remittances.js | 1 | 0 | 1 |
| js/pages/misc/settings.js | 1 | 1 | 0 |
| js/pages/mix-xbrl.js | 3 | 3 | 0 |
| js/pages/notifications/activity.js | 1 | 0 | 1 |
| js/pages/notifications/audit.js | 3 | 0 | 3 |
| js/pages/notifications/feed.js | 4 | 0 | 4 |
| js/pages/notifications/index.js | 1 | 1 | 0 |
| js/pages/notifications/shared.js | 6 | 0 | 6 |
| js/pages/office-transactions.js | 3 | 2 | 1 |
| js/pages/organization/actions/calendar.js | 1 | 0 | 1 |
| js/pages/organization/actions/finance.js | 3 | 0 | 3 |
| js/pages/organization/actions/integrations.js | 4 | 0 | 4 |
| js/pages/organization/actions/offices-staff.js | 8 | 0 | 8 |
| js/pages/organization/actions/reporting.js | 2 | 0 | 2 |
| js/pages/organization/actions/si.js | 1 | 0 | 1 |
| js/pages/organization/index.js | 3 | 1 | 2 |
| js/pages/organization/loaders/calendar.js | 2 | 0 | 2 |
| js/pages/organization/loaders/finance.js | 3 | 0 | 3 |
| js/pages/organization/loaders/group-hierarchy.js | 1 | 0 | 1 |
| js/pages/organization/loaders/integrations/imports-sms.js | 3 | 0 | 3 |
| js/pages/organization/loaders/integrations/loan-eao.js | 2 | 0 | 2 |
| js/pages/organization/loaders/offices-staff.js | 3 | 0 | 3 |
| js/pages/organization/loaders/reporting.js | 2 | 0 | 2 |
| js/pages/organization/loaders/si.js | 1 | 0 | 1 |
| js/pages/organization/shared.js | 1 | 0 | 1 |
| js/pages/products/actions/config.js | 5 | 0 | 5 |
| js/pages/products/actions/loan-products.js | 6 | 1 | 5 |
| js/pages/products/actions/rates.js | 1 | 0 | 1 |
| js/pages/products/actions/savings-products.js | 9 | 1 | 8 |
| js/pages/products/actions/share-products.js | 5 | 0 | 5 |
| js/pages/products/index.js | 48 | 12 | 36 |
| js/pages/products/loaders.js | 1 | 0 | 1 |
| js/pages/products/shared.js | 12 | 3 | 9 |
| js/pages/report-mailing.js | 4 | 2 | 2 |
| js/pages/reports/index.js | 1 | 1 | 0 |
| js/pages/reports/manage-reports.js | 4 | 0 | 4 |
| js/pages/reports/run-reports.js | 4 | 0 | 4 |
| js/pages/reports/shared.js | 7 | 0 | 7 |
| js/pages/savings/actions/charges.js | 3 | 0 | 3 |
| js/pages/savings/actions/interest.js | 2 | 0 | 2 |
| js/pages/savings/actions/lifecycle.js | 5 | 0 | 5 |
| js/pages/savings/actions/statements.js | 1 | 0 | 1 |
| js/pages/savings/actions/transactions.js | 4 | 0 | 4 |
| js/pages/savings/detail/index.js | 7 | 4 | 3 |
| js/pages/savings/detail/notes-docs.js | 2 | 0 | 2 |
| js/pages/savings/detail/si.js | 1 | 0 | 1 |
| js/pages/savings/detail/transactions.js | 4 | 0 | 4 |
| js/pages/savings/index.js | 1 | 1 | 0 |
| js/pages/savings/list.js | 9 | 1 | 8 |
| js/pages/savings/new.js | 9 | 5 | 4 |
| js/pages/savings/shared.js | 1 | 0 | 1 |
| js/pages/scheduler.js | 3 | 1 | 2 |
| js/pages/search.js | 8 | 1 | 7 |
| js/pages/self-service/beneficiaries.js | 2 | 0 | 2 |
| js/pages/self-service/index.js | 1 | 1 | 0 |
| js/pages/self-service/portal-users.js | 5 | 0 | 5 |
| js/pages/self-service/shared.js | 1 | 0 | 1 |
| js/pages/shares/actions.js | 5 | 0 | 5 |
| js/pages/shares/detail.js | 14 | 3 | 11 |
| js/pages/shares/index.js | 1 | 1 | 0 |
| js/pages/shares/list.js | 5 | 1 | 4 |
| js/pages/shares/shared.js | 1 | 0 | 1 |
| js/pages/surveys-spm.js | 5 | 1 | 4 |
| js/pages/system/actions/audit.js | 2 | 0 | 2 |
| js/pages/system/actions/config.js | 7 | 0 | 7 |
| js/pages/system/actions/data-mgmt.js | 5 | 0 | 5 |
| js/pages/system/actions/integrations.js | 3 | 0 | 3 |
| js/pages/system/index.js | 1 | 1 | 0 |
| js/pages/system/loaders/access.js | 1 | 0 | 1 |
| js/pages/system/loaders/audit.js | 2 | 0 | 2 |
| js/pages/system/loaders/config.js | 3 | 0 | 3 |
| js/pages/system/loaders/data-mgmt.js | 4 | 0 | 4 |
| js/pages/system/loaders/info.js | 1 | 0 | 1 |
| js/pages/system/loaders/integrations.js | 4 | 0 | 4 |
| js/pages/system/loaders/oidc.js | 2 | 1 | 1 |
| js/pages/system/shared.js | 1 | 0 | 1 |
| js/pages/tasks/checker-inbox.js | 31 | 3 | 28 |
| js/pages/tasks/index.js | 2 | 1 | 1 |
| js/pages/tasks/shared.js | 1 | 0 | 1 |
| js/pages/templates/actions.js | 5 | 0 | 5 |
| js/pages/templates/detail.js | 1 | 0 | 1 |
| js/pages/templates/index.js | 1 | 1 | 0 |
| js/pages/templates/list.js | 4 | 1 | 3 |
| js/pages/templates/shared.js | 1 | 0 | 1 |
| js/pages/transfers.js | 5 | 2 | 3 |
| js/pages/treasury/borrowings.js | 13 | 1 | 12 |
| js/pages/treasury/cash-allocation.js | 4 | 1 | 3 |
| js/pages/treasury/dashboard.js | 5 | 1 | 4 |
| js/pages/treasury/expenses.js | 13 | 1 | 12 |
| js/pages/treasury/index.js | 1 | 1 | 0 |
| js/pages/treasury/loan-disbursement.js | 6 | 1 | 5 |
| js/pages/treasury/reconciliation.js | 12 | 1 | 11 |
| js/pages/treasury/settings.js | 3 | 1 | 2 |
| js/pages/treasury/shared.js | 9 | 0 | 9 |
| js/pages/treasury/teller-console.js | 4 | 0 | 4 |
| js/pages/users/account/detail.js | 3 | 0 | 3 |
| js/pages/users/account/list.js | 3 | 0 | 3 |
| js/pages/users/index.js | 1 | 1 | 0 |
| js/pages/users/roles.js | 5 | 0 | 5 |
| js/pages/users/security.js | 2 | 0 | 2 |
| js/pages/users/shared.js | 1 | 0 | 1 |
| js/treasury/bootstrap.js | 6 | 0 | 6 |
| js/treasury/borrowing-schedule.js | 5 | 0 | 5 |
| js/treasury/borrowings.js | 12 | 1 | 11 |
| js/treasury/dashboard.js | 4 | 0 | 4 |
| js/treasury/errors.js | 1 | 0 | 1 |
| js/treasury/expenses.js | 9 | 0 | 9 |
| js/treasury/health.js | 2 | 0 | 2 |
| js/treasury/liquidity-status.js | 1 | 0 | 1 |
| js/treasury/loan-disbursement.js | 4 | 0 | 4 |
| js/treasury/reconciliation.js | 6 | 1 | 5 |
| js/treasury/segregation.js | 3 | 0 | 3 |
| js/treasury/teller-balance.js | 4 | 0 | 4 |
| js/treasury/teller-events.js | 8 | 0 | 8 |
| js/treasury/thresholds.js | 4 | 0 | 4 |
| js/treasury/vault-control.js | 4 | 0 | 4 |

## Untested functions

- `js/api/accounting.js` — `openingBalances`
- `js/api/accounting.js` — `makeJournalEntriesAPI`
- `js/api/accounting.js` — `getBalance`
- `js/api/accounting.js` — `listWithBalances`
- `js/api/accounting.js` — `computeOfficeBalance`
- `js/api/accounting.js` — `makeGlAccountsAPI`
- `js/api/accounting.js` — `makeGlClosuresAPI`
- `js/api/accounting.js` — `makeAccountingRulesAPI`
- `js/api/accounting.js` — `entriesFiltered`
- `js/api/accounting.js` — `getEntry`
- `js/api/accounting.js` — `criteriaTemplate`
- `js/api/accounting.js` — `getCriteria`
- `js/api/accounting.js` — `createCriteria`
- `js/api/accounting.js` — `updateCriteria`
- `js/api/accounting.js` — `deleteCriteria`
- `js/api/accounting.js` — `createEntry`
- `js/api/accounting.js` — `createJournal`
- `js/api/accounting.js` — `recreateEntry`
- `js/api/accounting.js` — `makeProvisioningAPI`
- `js/api/accounting.js` — `makeProvisioningCategoryAPI`
- `js/api/accounting.js` — `makeRunAccrualsAPI`
- `js/api/accounting.js` — `makeOpeningBalancesAPI`
- `js/api/accounting.js` — `makeFinancialActivityAccountsAPI`
- `js/api/accounting.js` — `makeTaxComponentsAPI`
- `js/api/accounting.js` — `makeTaxGroupsAPI`
- `js/api/admin.js` — `makeUsersAPI`
- `js/api/admin.js` — `updatePermissions`
- `js/api/admin.js` — `makeRolesAPI`
- `js/api/admin.js` — `makePermissionsAPI`
- `js/api/admin.js` — `runJob`
- `js/api/admin.js` — `businessJobNames`
- `js/api/admin.js` — `availableSteps`
- `js/api/admin.js` — `updateSteps`
- `js/api/admin.js` — `executeInline`
- `js/api/admin.js` — `getByShortName`
- `js/api/admin.js` — `executeByShortName`
- `js/api/admin.js` — `updateByShortName`
- `js/api/admin.js` — `historyByShortName`
- `js/api/admin.js` — `makeJobsAPI`
- `js/api/admin.js` — `searchTemplate`
- `js/api/admin.js` — `makeAuditsAPI`
- `js/api/admin.js` — `makeMakercheckerAPI`
- `js/api/admin.js` — `getById`
- `js/api/admin.js` — `updateByName`
- `js/api/admin.js` — `makeConfigurationsAPI`
- `js/api/admin.js` — `deactivate`
- `js/api/admin.js` — `makeSurveysAdminAPI`
- `js/api/admin.js` — `getMapping`
- `js/api/admin.js` — `makeEntityToEntityMappingsAPI`
- `js/api/admin.js` — `start`
- `js/api/admin.js` — `stop`
- `js/api/admin.js` — `makeSchedulerAPI`
- `js/api/admin.js` — `makeInstanceModeAPI`
- `js/api/admin.js` — `makeFieldConfigurationAPI`
- `js/api/admin.js` — `makeAccountNumberPreferencesAPI`
- `js/api/auth-account.js` — `makeUserDetailsAPI`
- `js/api/auth-account.js` — `forgot`
- `js/api/auth-account.js` — `change`
- `js/api/auth-account.js` — `preferencesTemplate`
- `js/api/auth-account.js` — `updatePreferences`
- `js/api/auth-account.js` — `makePasswordAPI`
- `js/api/auth-account.js` — `invalidate`
- `js/api/auth-account.js` — `makeTwoFactorAPI`
- `js/api/auth-account.js` — `makeTenantOidcAPI`
- `js/api/clients.js` — `undoTransfer`
- `js/api/clients.js` — `getCollateral`
- `js/api/clients.js` — `collateralTemplate`
- `js/api/clients.js` — `addCollateral`
- `js/api/clients.js` — `updateCollateral`
- `js/api/clients.js` — `deleteCollateral`
- `js/api/clients.js` — `getTransaction`
- `js/api/clients.js` — `undoTransaction`
- `js/api/clients.js` — `waiveCharge`
- `js/api/clients.js` — `payCharge`
- `js/api/clients.js` — `deleteCharge`
- `js/api/clients.js` — `chargeTemplate`
- `js/api/clients.js` — `getCharge`
- `js/api/clients.js` — `reactivate`
- `js/api/clients.js` — `acceptTransfer`
- `js/api/clients.js` — `rejectTransfer`
- `js/api/clients.js` — `addCharge`
- `js/api/clients.js` — `identifierTemplate`
- `js/api/clients.js` — `getIdentifier`
- `js/api/clients.js` — `createIdentifier`
- `js/api/clients.js` — `updateIdentifier`
- `js/api/clients.js` — `deleteIdentifier`
- `js/api/clients.js` — `createAddress`
- `js/api/clients.js` — `updateAddress`
- `js/api/clients.js` — `addressTemplate`
- `js/api/clients.js` — `familyMembers`
- `js/api/clients.js` — `familyMemberTemplate`
- `js/api/clients.js` — `getFamilyMember`
- `js/api/clients.js` — `createFamilyMember`
- `js/api/clients.js` — `updateFamilyMember`
- `js/api/clients.js` — `deleteFamilyMember`
- `js/api/clients.js` — `obligeeDetails`
- `js/api/clients.js` — `transferProposalDate`
- `js/api/clients.js` — `makeClientsAPI`
- `js/api/core.js` — `constructor`
- `js/api/core.js` — `onUnauthorized`
- `js/api/core.js` — `_url`
- `js/api/core.js` — `_headers`
- `js/api/core.js` — `_req`
- `js/api/core.js` — `_g`
- `js/api/core.js` — `_p`
- `js/api/core.js` — `_u`
- `js/api/core.js` — `_d`
- `js/api/core.js` — `any`
- `js/api/credit-bureau.js` — `organisationBureaus`
- `js/api/credit-bureau.js` — `updateOrganisationBureau`
- `js/api/credit-bureau.js` — `addOrganisationBureau`
- `js/api/credit-bureau.js` — `getConfiguration`
- `js/api/credit-bureau.js` — `createConfiguration`
- `js/api/credit-bureau.js` — `updateConfiguration`
- `js/api/credit-bureau.js` — `loanProducts`
- `js/api/credit-bureau.js` — `mappingByLoanProduct`
- `js/api/credit-bureau.js` — `updateMapping`
- `js/api/credit-bureau.js` — `createMapping`
- `js/api/credit-bureau.js` — `makeCreditBureauConfigAPI`
- `js/api/credit-bureau.js` — `fetchReport`
- `js/api/credit-bureau.js` — `addReport`
- `js/api/credit-bureau.js` — `saveReport`
- `js/api/credit-bureau.js` — `getSavedReport`
- `js/api/credit-bureau.js` — `deleteReport`
- `js/api/credit-bureau.js` — `makeCreditBureauIntegrationAPI`
- `js/api/generated/aliases.generated.js` — `toCommands`
- `js/api/generated/builders.generated.js` — `buildPayload`
- `js/api/generated/client.generated.js` — `retrieveOneAccountNumberFormat`
- `js/api/generated/client.generated.js` — `makeAccountNumberFormatAPI`
- `js/api/generated/client.generated.js` — `operation`
- `js/api/generated/client.generated.js` — `retrieveOneAccountTransfer`
- `js/api/generated/client.generated.js` — `refundByTransfer`
- `js/api/generated/client.generated.js` — `makeAccountTransfersAPI`
- `js/api/generated/client.generated.js` — `createGLClosure`
- `js/api/generated/client.generated.js` — `retrieveOneGLClosure`
- `js/api/generated/client.generated.js` — `updateGLClosure`
- `js/api/generated/client.generated.js` — `deleteGLClosure`
- `js/api/generated/client.generated.js` — `makeAccountingClosureAPI`
- `js/api/generated/client.generated.js` — `retrieveOneAccountingRule`
- `js/api/generated/client.generated.js` — `makeAccountingRulesAPI`
- `js/api/generated/client.generated.js` — `retrieveAll1`
- `js/api/generated/client.generated.js` — `createAdHocQuery`
- `js/api/generated/client.generated.js` — `retrieveAdHocQuery`
- `js/api/generated/client.generated.js` — `deleteAdHocQuery`
- `js/api/generated/client.generated.js` — `makeAdhocQueryApiAPI`
- `js/api/generated/client.generated.js` — `getWadl`
- `js/api/generated/client.generated.js` — `getExternalGrammar`
- `js/api/generated/client.generated.js` — `makeApplicationWadlAPI`
- `js/api/generated/client.generated.js` — `retrieveEntries`
- `js/api/generated/client.generated.js` — `retrieveEntry`
- `js/api/generated/client.generated.js` — `retrieveSearchTemplate`
- `js/api/generated/client.generated.js` — `makeAuditsAPI`
- `js/api/generated/client.generated.js` — `makeAuthenticationHTTPBasicAPI`
- `js/api/generated/client.generated.js` — `handleBatchRequests`
- `js/api/generated/client.generated.js` — `makeBatchAPIAPI`
- `js/api/generated/client.generated.js` — `makeBulkImportAPI`
- `js/api/generated/client.generated.js` — `loanReassignment`
- `js/api/generated/client.generated.js` — `makeBulkLoansAPI`
- `js/api/generated/client.generated.js` — `getBusinessDate`
- `js/api/generated/client.generated.js` — `makeBusinessDateManagementAPI`
- `js/api/generated/client.generated.js` — `retrieveAllAvailableBusinessStep`
- `js/api/generated/client.generated.js` — `retrieveAllConfiguredBusinessStep`
- `js/api/generated/client.generated.js` — `updateJobBusinessStepConfig`
- `js/api/generated/client.generated.js` — `makeBusinessStepConfigurationAPI`
- `js/api/generated/client.generated.js` — `retrieveAll2`
- `js/api/generated/client.generated.js` — `makeCacheAPI`
- `js/api/generated/client.generated.js` — `retrievesByEntityId`
- `js/api/generated/client.generated.js` — `retrieveTemplateCalendar`
- `js/api/generated/client.generated.js` — `makeCalendarAPI`
- `js/api/generated/client.generated.js` — `makeCashierJournalsAPI`
- `js/api/generated/client.generated.js` — `makeCashiersAPI`
- `js/api/generated/client.generated.js` — `retrieveOneCenter`
- `js/api/generated/client.generated.js` — `handleCommandsCenter`
- `js/api/generated/client.generated.js` — `retrieveGroupAccountsCenter`
- `js/api/generated/client.generated.js` — `getBulkTemplateCenter`
- `js/api/generated/client.generated.js` — `postBulkTemplateCenter`
- `js/api/generated/client.generated.js` — `makeCentersAPI`
- `js/api/generated/client.generated.js` — `retrieveOneCharge`
- `js/api/generated/client.generated.js` — `makeChargesAPI`
- `js/api/generated/client.generated.js` — `retrieveOneClient`
- `js/api/generated/client.generated.js` — `handleCommandClient`
- `js/api/generated/client.generated.js` — `retrieveAllClientAccounts`
- `js/api/generated/client.generated.js` — `retrieveObligeeDetails`
- `js/api/generated/client.generated.js` — `retrieveTransferTemplate`
- `js/api/generated/client.generated.js` — `getTemplate`
- `js/api/generated/client.generated.js` — `retrieveOneClientByExternalId`
- `js/api/generated/client.generated.js` — `updateByExternalId`
- `js/api/generated/client.generated.js` — `handleCommandClientByExternalId`
- `js/api/generated/client.generated.js` — `deleteByExternalId`
- `js/api/generated/client.generated.js` — `retrieveAllClientAccountsByExternalId`
- `js/api/generated/client.generated.js` — `retrieveObligeeDetailsByExternalId`
- `js/api/generated/client.generated.js` — `retrieveTransferTemplateByExternalId`
- `js/api/generated/client.generated.js` — `postTemplate`
- `js/api/generated/client.generated.js` — `makeClientAPI`
- `js/api/generated/client.generated.js` — `retrieveAllClientCharges`
- `js/api/generated/client.generated.js` — `retrieveOneClientCharge`
- `js/api/generated/client.generated.js` — `payOrWaiveClientCharge`
- `js/api/generated/client.generated.js` — `retrieveTemplateClientCharge`
- `js/api/generated/client.generated.js` — `makeClientChargesAPI`
- `js/api/generated/client.generated.js` — `getClientCollateralProducts`
- `js/api/generated/client.generated.js` — `addClientCollateral`
- `js/api/generated/client.generated.js` — `getClientCollateralData`
- `js/api/generated/client.generated.js` — `updateClientCollateral`
- `js/api/generated/client.generated.js` — `deleteClientCollateral`
- `js/api/generated/client.generated.js` — `getClientCollateralTemplate`
- `js/api/generated/client.generated.js` — `makeClientCollateralManagementAPI`
- `js/api/generated/client.generated.js` — `retrieveAllClientFamilyMembers`
- `js/api/generated/client.generated.js` — `retrieveOneClientFamilyMember`
- `js/api/generated/client.generated.js` — `retrieveTemplateClientFamilyMember`
- `js/api/generated/client.generated.js` — `makeClientFamilyMemberAPI`
- `js/api/generated/client.generated.js` — `retrieveAllClientIdentifiers`
- `js/api/generated/client.generated.js` — `retrieveOneClientIdentifier`
- `js/api/generated/client.generated.js` — `retrieveTemplateClientIdentifier`
- `js/api/generated/client.generated.js` — `makeClientIdentifierAPI`
- `js/api/generated/client.generated.js` — `retrieveAllClientTransactions`
- `js/api/generated/client.generated.js` — `undoClientTransaction`
- `js/api/generated/client.generated.js` — `retrieveByTransactionExternalId`
- `js/api/generated/client.generated.js` — `undoClientTransactionByTransactionExternalId`
- `js/api/generated/client.generated.js` — `retrieveAllClientTransactionsByClientExternalId`
- `js/api/generated/client.generated.js` — `retrieveByClientExternalId`
- `js/api/generated/client.generated.js` — `undoClientTransactionByClientExternalId`
- `js/api/generated/client.generated.js` — `retrieveByClientAndTransactionExternalId`
- `js/api/generated/client.generated.js` — `undoClientTransactionByClientAndTransactionExternalId`
- `js/api/generated/client.generated.js` — `makeClientTransactionAPI`
- `js/api/generated/client.generated.js` — `retrieveAllClientAddresses`
- `js/api/generated/client.generated.js` — `updateClientAddress`
- `js/api/generated/client.generated.js` — `createClientAddress`
- `js/api/generated/client.generated.js` — `makeClientsAddressAPI`
- `js/api/generated/client.generated.js` — `searchClientsByText`
- `js/api/generated/client.generated.js` — `makeClientSearchV2API`
- `js/api/generated/client.generated.js` — `retrieveAllCodeValues`
- `js/api/generated/client.generated.js` — `retrieveAllCodeValuesByCodeName`
- `js/api/generated/client.generated.js` — `createByCodeName`
- `js/api/generated/client.generated.js` — `retrieve1`
- `js/api/generated/client.generated.js` — `updateByCodeName`
- `js/api/generated/client.generated.js` — `delete1`
- `js/api/generated/client.generated.js` — `makeCodeValuesAPI`
- `js/api/generated/client.generated.js` — `retrieveOneCode`
- `js/api/generated/client.generated.js` — `retrieveOneCodeByName`
- `js/api/generated/client.generated.js` — `makeCodesAPI`
- `js/api/generated/client.generated.js` — `createCollateral1`
- `js/api/generated/client.generated.js` — `getCollateral`
- `js/api/generated/client.generated.js` — `updateCollateral1`
- `js/api/generated/client.generated.js` — `deleteCollateral1`
- `js/api/generated/client.generated.js` — `makeCollateralManagementAPI`
- `js/api/generated/client.generated.js` — `generateCollectionSheet`
- `js/api/generated/client.generated.js` — `makeCollectionSheetAPI`
- `js/api/generated/client.generated.js` — `getConfiguration`
- `js/api/generated/client.generated.js` — `fetchMappingByLoanProductId`
- `js/api/generated/client.generated.js` — `updateCreditBureauLoanProductMapping`
- `js/api/generated/client.generated.js` — `createCreditBureauLoanProductMapping`
- `js/api/generated/client.generated.js` — `updateCreditBureau`
- `js/api/generated/client.generated.js` — `addOrganisationCreditBureau`
- `js/api/generated/client.generated.js` — `makeCreditBureauConfigurationAPI`
- `js/api/generated/client.generated.js` — `addCreditReport`
- `js/api/generated/client.generated.js` — `fetchCreditReport`
- `js/api/generated/client.generated.js` — `getSavedCreditReport`
- `js/api/generated/client.generated.js` — `deleteCreditReport`
- `js/api/generated/client.generated.js` — `saveCreditReport`
- `js/api/generated/client.generated.js` — `makeCreditBureauIntegrationAPI`
- `js/api/generated/client.generated.js` — `makeCurrencyAPI`
- `js/api/generated/client.generated.js` — `gets`
- `js/api/generated/client.generated.js` — `getEntries`
- `js/api/generated/client.generated.js` — `updateEntryOnetoOne`
- `js/api/generated/client.generated.js` — `createEntry`
- `js/api/generated/client.generated.js` — `deleteEntries`
- `js/api/generated/client.generated.js` — `getManyEntry`
- `js/api/generated/client.generated.js` — `updateEntryOneToMany`
- `js/api/generated/client.generated.js` — `deleteEntry`
- `js/api/generated/client.generated.js` — `queryValues`
- `js/api/generated/client.generated.js` — `advancedQuery`
- `js/api/generated/client.generated.js` — `deregisterDatatable`
- `js/api/generated/client.generated.js` — `registerDatatable`
- `js/api/generated/client.generated.js` — `makeDataTablesAPI`
- `js/api/generated/client.generated.js` — `createBucket`
- `js/api/generated/client.generated.js` — `getBucket`
- `js/api/generated/client.generated.js` — `updateBucket`
- `js/api/generated/client.generated.js` — `deleteBucket`
- `js/api/generated/client.generated.js` — `createRange`
- `js/api/generated/client.generated.js` — `getRange`
- `js/api/generated/client.generated.js` — `updateRange`
- `js/api/generated/client.generated.js` — `deleteRange`
- `js/api/generated/client.generated.js` — `makeDelinquencyRangeAndBucketsManagementAPI`
- `js/api/generated/client.generated.js` — `retrieveAllDepositAccountOnHoldFundTransactions`
- `js/api/generated/client.generated.js` — `makeDepositAccountOnHoldFundTransactionsAPI`
- `js/api/generated/client.generated.js` — `retrieveAllDocuments`
- `js/api/generated/client.generated.js` — `downloadFile`
- `js/api/generated/client.generated.js` — `makeDocumentsAPI`
- `js/api/generated/client.generated.js` — `createCheck`
- `js/api/generated/client.generated.js` — `deleteCheck`
- `js/api/generated/client.generated.js` — `makeEntityDataTableAPI`
- `js/api/generated/client.generated.js` — `getAddresses`
- `js/api/generated/client.generated.js` — `makeEntityFieldConfigurationAPI`
- `js/api/generated/client.generated.js` — `retrieveAllExternalAssetOwnerLoanProductAttributes`
- `js/api/generated/client.generated.js` — `makeExternalAssetOwnerLoanProductAttributesAPI`
- `js/api/generated/client.generated.js` — `retrieves`
- `js/api/generated/client.generated.js` — `getJournalEntriesOfOwner`
- `js/api/generated/client.generated.js` — `searchInvestorData`
- `js/api/generated/client.generated.js` — `transferRequestWithId`
- `js/api/generated/client.generated.js` — `getJournalEntriesOfTransfer`
- `js/api/generated/client.generated.js` — `transferRequestWithIdByExternalId`
- `js/api/generated/client.generated.js` — `transferRequestWithLoanId`
- `js/api/generated/client.generated.js` — `transferRequestWithLoanExternalId`
- `js/api/generated/client.generated.js` — `makeExternalAssetOwnersAPI`
- `js/api/generated/client.generated.js` — `gets`
- `js/api/generated/client.generated.js` — `updates`
- `js/api/generated/client.generated.js` — `makeExternalEventConfigurationAPI`
- `js/api/generated/client.generated.js` — `retrievesConfiguration`
- `js/api/generated/client.generated.js` — `updatesConfiguration`
- `js/api/generated/client.generated.js` — `makeExternalServicesAPI`
- `js/api/generated/client.generated.js` — `makeFetchAuthenticatedUserDetailsAPI`
- `js/api/generated/client.generated.js` — `retrieveAll3`
- `js/api/generated/client.generated.js` — `retrieveOne`
- `js/api/generated/client.generated.js` — `updateMap`
- `js/api/generated/client.generated.js` — `getEntityToEntityMappings`
- `js/api/generated/client.generated.js` — `createMap`
- `js/api/generated/client.generated.js` — `makeFineractEntityAPI`
- `js/api/generated/client.generated.js` — `retrieveOneFixedDepositAccount`
- `js/api/generated/client.generated.js` — `handleCommandsFixedDepositAccount`
- `js/api/generated/client.generated.js` — `accountClosureTemplate`
- `js/api/generated/client.generated.js` — `getFixedDepositTemplate`
- `js/api/generated/client.generated.js` — `getFixedDepositTransactionTemplate`
- `js/api/generated/client.generated.js` — `postFixedDepositTransactionTemplate`
- `js/api/generated/client.generated.js` — `postFixedDepositTemplate`
- `js/api/generated/client.generated.js` — `makeFixedDepositAccountAPI`
- `js/api/generated/client.generated.js` — `retrieveAllFixedDepositAccountTransactions`
- `js/api/generated/client.generated.js` — `retrieveOneFixedDepositAccountTransaction`
- `js/api/generated/client.generated.js` — `handleCommandsFixedDepositAccountTransaction`
- `js/api/generated/client.generated.js` — `retrieveTemplateFixedDepositAccountTransaction`
- `js/api/generated/client.generated.js` — `makeFixedDepositAccountTransactionsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneFixedDepositProduct`
- `js/api/generated/client.generated.js` — `makeFixedDepositProductAPI`
- `js/api/generated/client.generated.js` — `retrieveOneFloatingRate`
- `js/api/generated/client.generated.js` — `makeFloatingRatesAPI`
- `js/api/generated/client.generated.js` — `retrieves`
- `js/api/generated/client.generated.js` — `makeFundsAPI`
- `js/api/generated/client.generated.js` — `createGLAccount`
- `js/api/generated/client.generated.js` — `retreiveAccount`
- `js/api/generated/client.generated.js` — `updateGLAccount`
- `js/api/generated/client.generated.js` — `deleteGLAccount`
- `js/api/generated/client.generated.js` — `getGlAccountsTemplate`
- `js/api/generated/client.generated.js` — `postGlAccountsTemplate`
- `js/api/generated/client.generated.js` — `makeGeneralLedgerAccountAPI`
- `js/api/generated/client.generated.js` — `retrieveOneGlobalConfiguration`
- `js/api/generated/client.generated.js` — `updateConfigurationByName`
- `js/api/generated/client.generated.js` — `retrieveOneByName`
- `js/api/generated/client.generated.js` — `makeGlobalConfigurationAPI`
- `js/api/generated/client.generated.js` — `retrieveOneGroup`
- `js/api/generated/client.generated.js` — `handleCommandsGroup`
- `js/api/generated/client.generated.js` — `retrieveAccountsGroup`
- `js/api/generated/client.generated.js` — `unassignLoanOfficerGroup`
- `js/api/generated/client.generated.js` — `retrieveGlimAccountsGroup`
- `js/api/generated/client.generated.js` — `retrieveGsimAccountsGroup`
- `js/api/generated/client.generated.js` — `getBulkTemplateGroup`
- `js/api/generated/client.generated.js` — `postBulkTemplateGroup`
- `js/api/generated/client.generated.js` — `makeGroupsAPI`
- `js/api/generated/client.generated.js` — `makeGroupsLevelAPI`
- `js/api/generated/client.generated.js` — `retrieveDetails`
- `js/api/generated/client.generated.js` — `retrieveDetails1`
- `js/api/generated/client.generated.js` — `accountsTemplate`
- `js/api/generated/client.generated.js` — `getTemplate`
- `js/api/generated/client.generated.js` — `newGuarantorTemplate`
- `js/api/generated/client.generated.js` — `postTemplate`
- `js/api/generated/client.generated.js` — `makeGuarantorsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneHoliday`
- `js/api/generated/client.generated.js` — `handleCommandsHoliday`
- `js/api/generated/client.generated.js` — `makeHolidaysAPI`
- `js/api/generated/client.generated.js` — `retrieveOneHook`
- `js/api/generated/client.generated.js` — `makeHooksAPI`
- `js/api/generated/client.generated.js` — `executeInlineJob`
- `js/api/generated/client.generated.js` — `makeInlineJobAPI`
- `js/api/generated/client.generated.js` — `makeInstanceModeAPI`
- `js/api/generated/client.generated.js` — `getAccountDetails`
- `js/api/generated/client.generated.js` — `getAccountIdentifiers`
- `js/api/generated/client.generated.js` — `getClientKyc`
- `js/api/generated/client.generated.js` — `getAccountTransactions`
- `js/api/generated/client.generated.js` — `getAccountByIdentifier`
- `js/api/generated/client.generated.js` — `registerAccountIdentifier`
- `js/api/generated/client.generated.js` — `deleteAccountIdentifier`
- `js/api/generated/client.generated.js` — `getAccountByIdentifier1`
- `js/api/generated/client.generated.js` — `registerAccountIdentifier1`
- `js/api/generated/client.generated.js` — `deleteAccountIdentifier1`
- `js/api/generated/client.generated.js` — `disburseLoan`
- `js/api/generated/client.generated.js` — `loanRepayment`
- `js/api/generated/client.generated.js` — `getQuote`
- `js/api/generated/client.generated.js` — `getTransactionRequest`
- `js/api/generated/client.generated.js` — `getTransfer`
- `js/api/generated/client.generated.js` — `makeInterOperationAPI`
- `js/api/generated/client.generated.js` — `retrieveOneInterestRateChart`
- `js/api/generated/client.generated.js` — `makeInterestRateChartAPI`
- `js/api/generated/client.generated.js` — `retrieveAllInterestRateChartSlabs`
- `js/api/generated/client.generated.js` — `createInterestRateChartSlab`
- `js/api/generated/client.generated.js` — `retrieveOneInterestRateChartSlab`
- `js/api/generated/client.generated.js` — `updateInterestRateChartSlab`
- `js/api/generated/client.generated.js` — `deleteInterestRateChartSlab`
- `js/api/generated/client.generated.js` — `retrieveTemplateInterestRateChartSlab`
- `js/api/generated/client.generated.js` — `makeInterestRateSlabAKAInterestBandsAPI`
- `js/api/generated/client.generated.js` — `updateLoanCobLastDate`
- `js/api/generated/client.generated.js` — `loanReprocess`
- `js/api/generated/client.generated.js` — `getCobPartitions`
- `js/api/generated/client.generated.js` — `makeInternalCOBAPI`
- `js/api/generated/client.generated.js` — `createGLJournalEntry`
- `js/api/generated/client.generated.js` — `retrieveJournalEntryById`
- `js/api/generated/client.generated.js` — `createReversalJournalEntry`
- `js/api/generated/client.generated.js` — `getsTemplate`
- `js/api/generated/client.generated.js` — `retrieves`
- `js/api/generated/client.generated.js` — `postsTemplate`
- `js/api/generated/client.generated.js` — `makeJournalEntriesAPI`
- `js/api/generated/client.generated.js` — `retrieveAll5`
- `js/api/generated/client.generated.js` — `retrieve1`
- `js/api/generated/client.generated.js` — `update2`
- `js/api/generated/client.generated.js` — `makeLikelihoodAPI`
- `js/api/generated/client.generated.js` — `makeListReportMailingJobHistoryAPI`
- `js/api/generated/client.generated.js` — `placeLockOnLoanAccount`
- `js/api/generated/client.generated.js` — `makeLoanAccountLockAPI`
- `js/api/generated/client.generated.js` — `retrieveAmortizationDetails`
- `js/api/generated/client.generated.js` — `retrieveBuyDownFeesAllocationData`
- `js/api/generated/client.generated.js` — `getBuyDownFeesAllocationDataByTransactionExternalId`
- `js/api/generated/client.generated.js` — `retrieveAmortizationDetailsByExternalId`
- `js/api/generated/client.generated.js` — `getBuyDownFeesAllocationDataByLoanExternalId`
- `js/api/generated/client.generated.js` — `getBuyDownFeesAllocationDataByExternalIds`
- `js/api/generated/client.generated.js` — `makeLoanBuyDownFeesAPI`
- `js/api/generated/client.generated.js` — `fetchCapitalizedIncomeDetails`
- `js/api/generated/client.generated.js` — `retrieveCapitalizedIncomeAllocationData`
- `js/api/generated/client.generated.js` — `getCapitalizedIncomeAllocationDataByTransactionExternalId`
- `js/api/generated/client.generated.js` — `fetchLoanCapitalizedIncomeData`
- `js/api/generated/client.generated.js` — `fetchCapitalizedIncomeDetailsByExternalId`
- `js/api/generated/client.generated.js` — `getCapitalizedIncomeAllocationDataByLoanExternalId`
- `js/api/generated/client.generated.js` — `getCapitalizedIncomeAllocationDataByExternalIds`
- `js/api/generated/client.generated.js` — `fetchLoanCapitalizedIncomeDataByExternalId`
- `js/api/generated/client.generated.js` — `makeLoanCapitalizedIncomeAPI`
- `js/api/generated/client.generated.js` — `retrieveAllLoanCharges`
- `js/api/generated/client.generated.js` — `createOrPayLoanCharge`
- `js/api/generated/client.generated.js` — `retrieveOneLoanCharge`
- `js/api/generated/client.generated.js` — `executeLoanChargeOnExistingCharge`
- `js/api/generated/client.generated.js` — `retrieveOneLoanChargeByChargeExternalId`
- `js/api/generated/client.generated.js` — `updateByChargeExternalId`
- `js/api/generated/client.generated.js` — `executeLoanChargeByChargeExternalId`
- `js/api/generated/client.generated.js` — `deleteByChargeExternalId`
- `js/api/generated/client.generated.js` — `retrieveTemplateLoanCharge`
- `js/api/generated/client.generated.js` — `retrieveAllLoanChargesByLoanExternalId`
- `js/api/generated/client.generated.js` — `executeLoanChargeByLoanExternalId`
- `js/api/generated/client.generated.js` — `retrieveOneLoanChargeByLoanExternalId`
- `js/api/generated/client.generated.js` — `updateByLoanExternalId`
- `js/api/generated/client.generated.js` — `executeLoanChargeByLoanExternalIdOnExistingCharge`
- `js/api/generated/client.generated.js` — `deleteByLoanExternalId`
- `js/api/generated/client.generated.js` — `retrieveOneLoanChargeByLoanAndChargeExternalId`
- `js/api/generated/client.generated.js` — `updateByLoanAndChargeExternalId`
- `js/api/generated/client.generated.js` — `executeLoanChargeByLoanAndChargeExternalId`
- `js/api/generated/client.generated.js` — `deleteByLoanAndChargeExternalId`
- `js/api/generated/client.generated.js` — `retrieveTemplateLoanChargeByLoanExternalId`
- `js/api/generated/client.generated.js` — `makeLoanChargesAPI`
- `js/api/generated/client.generated.js` — `executeLoanCOBCatchUp`
- `js/api/generated/client.generated.js` — `makeLoanCOBCatchUpAPI`
- `js/api/generated/client.generated.js` — `retrieveCollateralDetails`
- `js/api/generated/client.generated.js` — `createCollateral`
- `js/api/generated/client.generated.js` — `retrieveCollateralDetails1`
- `js/api/generated/client.generated.js` — `updateCollateral`
- `js/api/generated/client.generated.js` — `deleteCollateral`
- `js/api/generated/client.generated.js` — `newCollateralTemplate`
- `js/api/generated/client.generated.js` — `makeLoanCollateralAPI`
- `js/api/generated/client.generated.js` — `getLoanCollateral`
- `js/api/generated/client.generated.js` — `deleteLoanCollateral`
- `js/api/generated/client.generated.js` — `makeLoanCollateralManagementAPI`
- `js/api/generated/client.generated.js` — `retriveDetail`
- `js/api/generated/client.generated.js` — `updateDisbursementDate`
- `js/api/generated/client.generated.js` — `addAndDeleteDisbursementDetail`
- `js/api/generated/client.generated.js` — `makeLoanDisbursementDetailsAPI`
- `js/api/generated/client.generated.js` — `retrieveAllLoanInterestPauses`
- `js/api/generated/client.generated.js` — `retrieveAllLoanInterestPausesByExternalId`
- `js/api/generated/client.generated.js` — `createByExternalId`
- `js/api/generated/client.generated.js` — `updateByExternalId`
- `js/api/generated/client.generated.js` — `deleteByExternalId`
- `js/api/generated/client.generated.js` — `makeLoanInterestPauseAPI`
- `js/api/generated/client.generated.js` — `retrieveOneLoanOriginator`
- `js/api/generated/client.generated.js` — `retrieveByExternalId`
- `js/api/generated/client.generated.js` — `updateByExternalId`
- `js/api/generated/client.generated.js` — `deleteByExternalId`
- `js/api/generated/client.generated.js` — `retrieveOriginatorsByLoanId`
- `js/api/generated/client.generated.js` — `attachOriginatorToLoan`
- `js/api/generated/client.generated.js` — `detachOriginatorFromLoan`
- `js/api/generated/client.generated.js` — `attachOriginatorToLoanByOriginatorExternalId`
- `js/api/generated/client.generated.js` — `detachOriginatorFromLoanByOriginatorExternalId`
- `js/api/generated/client.generated.js` — `retrieveOriginatorsByLoanExternalId`
- `js/api/generated/client.generated.js` — `attachOriginatorToLoanByLoanExternalId`
- `js/api/generated/client.generated.js` — `detachOriginatorFromLoanByLoanExternalId`
- `js/api/generated/client.generated.js` — `attachOriginatorToLoanByExternalIds`
- `js/api/generated/client.generated.js` — `detachOriginatorFromLoanByExternalIds`
- `js/api/generated/client.generated.js` — `makeLoanOriginatorsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneLoanProduct`
- `js/api/generated/client.generated.js` — `retrieveDetailsByExternalId`
- `js/api/generated/client.generated.js` — `updateByExternalId`
- `js/api/generated/client.generated.js` — `makeLoanProductsAPI`
- `js/api/generated/client.generated.js` — `makeLoanProductsDetailsAPI`
- `js/api/generated/client.generated.js` — `handleCommandsLoanSchedule`
- `js/api/generated/client.generated.js` — `makeLoanReschedulingAPI`
- `js/api/generated/client.generated.js` — `retrieveAllLoanTransactions`
- `js/api/generated/client.generated.js` — `handleCommandsLoanTransaction`
- `js/api/generated/client.generated.js` — `retrieveOneLoanTransaction`
- `js/api/generated/client.generated.js` — `undoWaiveChargeLoanTransaction`
- `js/api/generated/client.generated.js` — `adjustLoanTransaction`
- `js/api/generated/client.generated.js` — `retrieveOneLoanTransactionByExternalId`
- `js/api/generated/client.generated.js` — `adjustLoanTransactionByTransactionExternalId`
- `js/api/generated/client.generated.js` — `undoWaiveChargeLoanTransactionByTransactionExternalId`
- `js/api/generated/client.generated.js` — `previewReAgeLoanSchedule`
- `js/api/generated/client.generated.js` — `previewReAmortizeLoanSchedule`
- `js/api/generated/client.generated.js` — `retrieveTemplateLoanTransaction`
- `js/api/generated/client.generated.js` — `retrieveAllLoanTransactionsByExternalId`
- `js/api/generated/client.generated.js` — `handleCommandsLoanTransactionByLoanExternalId`
- `js/api/generated/client.generated.js` — `retrieveOneLoanTransactionByLoanExternalId`
- `js/api/generated/client.generated.js` — `undoWaiveChargeLoanTransactionByLoanExternalId`
- `js/api/generated/client.generated.js` — `adjustLoanTransactionByLoanExternalId`
- `js/api/generated/client.generated.js` — `retrieveOneLoanTransactionByLoanExternalIdAndTransactionExternalId`
- `js/api/generated/client.generated.js` — `adjustLoanTransactionByLoanAndTransactionExternalId`
- `js/api/generated/client.generated.js` — `undoWaiveChargeLoanTransactionByLoanAndTransactionExternalId`
- `js/api/generated/client.generated.js` — `previewReAgeLoanScheduleByLoanExternalId`
- `js/api/generated/client.generated.js` — `previewReAmortizeLoanScheduleByLoanExternalId`
- `js/api/generated/client.generated.js` — `retrieveTemplateLoanTransactionByLoanExternalId`
- `js/api/generated/client.generated.js` — `makeLoanTransactionsAPI`
- `js/api/generated/client.generated.js` — `calculateOrSubmitLoanApplication`
- `js/api/generated/client.generated.js` — `retrieveOneLoan`
- `js/api/generated/client.generated.js` — `updateApplication`
- `js/api/generated/client.generated.js` — `handleCommandsLoan`
- `js/api/generated/client.generated.js` — `deleteApplication`
- `js/api/generated/client.generated.js` — `retrieveApprovedAmountHistoryLoan`
- `js/api/generated/client.generated.js` — `updateApprovedAmountLoan`
- `js/api/generated/client.generated.js` — `updateAvailableDisbursementAmountLoan`
- `js/api/generated/client.generated.js` — `retrieveDelinquencyActionsLoan`
- `js/api/generated/client.generated.js` — `createDelinquencyActionLoan`
- `js/api/generated/client.generated.js` — `retrieveDelinquencyTagHistoryLoan`
- `js/api/generated/client.generated.js` — `retrieveApprovalTemplate`
- `js/api/generated/client.generated.js` — `getsTemplate`
- `js/api/generated/client.generated.js` — `retrieveOneLoanByExternalId`
- `js/api/generated/client.generated.js` — `updateApplicationByExternalId`
- `js/api/generated/client.generated.js` — `handleCommandsLoanByExternalId`
- `js/api/generated/client.generated.js` — `deleteApplicationByExternalId`
- `js/api/generated/client.generated.js` — `retrieveApprovedAmountHistoryLoanByExternalId`
- `js/api/generated/client.generated.js` — `updateApprovedAmountLoanByExternalId`
- `js/api/generated/client.generated.js` — `updateAvailableDisbursementAmountLoanByExternalId`
- `js/api/generated/client.generated.js` — `retrieveDelinquencyActionsLoanByExternalId`
- `js/api/generated/client.generated.js` — `createDelinquencyActionLoanByExternalId`
- `js/api/generated/client.generated.js` — `retrieveDelinquencyTagHistoryLoanByExternalId`
- `js/api/generated/client.generated.js` — `retrieveApprovalTemplateByExternalId`
- `js/api/generated/client.generated.js` — `getGlimRepaymentTemplate`
- `js/api/generated/client.generated.js` — `handleCommandsGlimLoan`
- `js/api/generated/client.generated.js` — `getRepaymentTemplate`
- `js/api/generated/client.generated.js` — `postRepaymentTemplate`
- `js/api/generated/client.generated.js` — `postTemplate`
- `js/api/generated/client.generated.js` — `makeLoansAPI`
- `js/api/generated/client.generated.js` — `retrieveLoanPointInTime`
- `js/api/generated/client.generated.js` — `retrieveLoanPointInTimeByExternalId`
- `js/api/generated/client.generated.js` — `retrieveByExternalIds`
- `js/api/generated/client.generated.js` — `makeLoansPointInTimeAPI`
- `js/api/generated/client.generated.js` — `approveMakerCheckerEntry`
- `js/api/generated/client.generated.js` — `deleteMakerCheckerEntry`
- `js/api/generated/client.generated.js` — `retrieveAuditSearchTemplate1`
- `js/api/generated/client.generated.js` — `makeMakerCheckerOr4EyeFunctionalityAPI`
- `js/api/generated/client.generated.js` — `createGLAccountMappingFinancialActivityAccount`
- `js/api/generated/client.generated.js` — `retreive`
- `js/api/generated/client.generated.js` — `updateGLAccountMappingFinancialActivityAccount`
- `js/api/generated/client.generated.js` — `deleteGLAccountMappingFinancialActivityAccount`
- `js/api/generated/client.generated.js` — `makeMappingFinancialActivitiesToAccountsAPI`
- `js/api/generated/client.generated.js` — `retrieveAllMeetings`
- `js/api/generated/client.generated.js` — `retrieveOneMeeting`
- `js/api/generated/client.generated.js` — `updateAttendance`
- `js/api/generated/client.generated.js` — `retrieveTemplateMeeting`
- `js/api/generated/client.generated.js` — `makeMeetingsAPI`
- `js/api/generated/client.generated.js` — `updateMixTaxonomyMapping`
- `js/api/generated/client.generated.js` — `makeMixMappingAPI`
- `js/api/generated/client.generated.js` — `makeMixReportAPI`
- `js/api/generated/client.generated.js` — `makeMixTaxonomyAPI`
- `js/api/generated/client.generated.js` — `retrievesByResource`
- `js/api/generated/client.generated.js` — `addNewNote`
- `js/api/generated/client.generated.js` — `makeNotesAPI`
- `js/api/generated/client.generated.js` — `updateReadStatus`
- `js/api/generated/client.generated.js` — `makeNotificationAPI`
- `js/api/generated/client.generated.js` — `retrieveOneOffice`
- `js/api/generated/client.generated.js` — `getTemplate`
- `js/api/generated/client.generated.js` — `retrieveOneOfficeByExternalId`
- `js/api/generated/client.generated.js` — `updateByExternalId`
- `js/api/generated/client.generated.js` — `postTemplate`
- `js/api/generated/client.generated.js` — `makeOfficesAPI`
- `js/api/generated/client.generated.js` — `forgotPassword`
- `js/api/generated/client.generated.js` — `makePasswordManagementAPI`
- `js/api/generated/client.generated.js` — `updates`
- `js/api/generated/client.generated.js` — `makePasswordPreferencesAPI`
- `js/api/generated/client.generated.js` — `retrieveOnePaymentType`
- `js/api/generated/client.generated.js` — `deleteCodePaymentType`
- `js/api/generated/client.generated.js` — `makePaymentTypeAPI`
- `js/api/generated/client.generated.js` — `executePeriodicAccrualAccounting`
- `js/api/generated/client.generated.js` — `makePeriodicAccrualAccountingAPI`
- `js/api/generated/client.generated.js` — `updates`
- `js/api/generated/client.generated.js` — `makePermissionsAPI`
- `js/api/generated/client.generated.js` — `retrieveAll6`
- `js/api/generated/client.generated.js` — `retrieveAll7`
- `js/api/generated/client.generated.js` — `makePovertyLineAPI`
- `js/api/generated/client.generated.js` — `retrieveTemplateProductMix`
- `js/api/generated/client.generated.js` — `makeProductMixAPI`
- `js/api/generated/client.generated.js` — `retrieveAllShareProducts`
- `js/api/generated/client.generated.js` — `createShareProduct`
- `js/api/generated/client.generated.js` — `retrieveOneShareProduct`
- `js/api/generated/client.generated.js` — `updateShareProduct`
- `js/api/generated/client.generated.js` — `handleCommandsShareProduct`
- `js/api/generated/client.generated.js` — `retrieveTemplateShareProduct`
- `js/api/generated/client.generated.js` — `makeProductsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneInternalProgressiveLoan`
- `js/api/generated/client.generated.js` — `updateInternalProgressiveLoan`
- `js/api/generated/client.generated.js` — `deleteInternalProgressiveLoan`
- `js/api/generated/client.generated.js` — `makeProgressiveLoanAPI`
- `js/api/generated/client.generated.js` — `retrieveAll8`
- `js/api/generated/client.generated.js` — `makeProvisioningCategoryAPI`
- `js/api/generated/client.generated.js` — `retrieveOneProvisioningCriteria`
- `js/api/generated/client.generated.js` — `retrieveTemplate1`
- `js/api/generated/client.generated.js` — `makeProvisioningCriteriaAPI`
- `js/api/generated/client.generated.js` — `creates`
- `js/api/generated/client.generated.js` — `retrieveOneProvisioningEntry`
- `js/api/generated/client.generated.js` — `modifyProvisioningEntry`
- `js/api/generated/client.generated.js` — `retrievesLoanProducts`
- `js/api/generated/client.generated.js` — `makeProvisioningEntriesAPI`
- `js/api/generated/client.generated.js` — `retrieveOneRate`
- `js/api/generated/client.generated.js` — `makeRateAPI`
- `js/api/generated/client.generated.js` — `submitApplicationRecurringDepositAccount`
- `js/api/generated/client.generated.js` — `retrieveOneRecurringDepositAccount`
- `js/api/generated/client.generated.js` — `handleCommandsRecurringDepositAccount`
- `js/api/generated/client.generated.js` — `accountClosureTemplateRecurringDepositAccount`
- `js/api/generated/client.generated.js` — `getRecurringDepositTemplate`
- `js/api/generated/client.generated.js` — `getRecurringDepositTransactionTemplate`
- `js/api/generated/client.generated.js` — `postRecurringDepositTransactionsTemplate`
- `js/api/generated/client.generated.js` — `postRecurringDepositTemplate`
- `js/api/generated/client.generated.js` — `makeRecurringDepositAccountAPI`
- `js/api/generated/client.generated.js` — `transactionRecurringDepositAccountTransaction`
- `js/api/generated/client.generated.js` — `retrieveOneRecurringDepositAccountTransaction`
- `js/api/generated/client.generated.js` — `handleCommandsRecurringDepositAccountTransaction`
- `js/api/generated/client.generated.js` — `retrieveTemplateRecurringDepositAccountTransaction`
- `js/api/generated/client.generated.js` — `makeRecurringDepositAccountTransactionsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneRecurringDepositProduct`
- `js/api/generated/client.generated.js` — `makeRecurringDepositProductAPI`
- `js/api/generated/client.generated.js` — `getPostDatedChecks`
- `js/api/generated/client.generated.js` — `getPostDatedCheck`
- `js/api/generated/client.generated.js` — `updatePostDatedChecks`
- `js/api/generated/client.generated.js` — `deletePostDatedCheck`
- `js/api/generated/client.generated.js` — `makeRepaymentWithPostDatedChecksAPI`
- `js/api/generated/client.generated.js` — `retrieveOneReportMailingJob`
- `js/api/generated/client.generated.js` — `makeReportMailingJobsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneReport`
- `js/api/generated/client.generated.js` — `makeReportsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneRescheduleLoan`
- `js/api/generated/client.generated.js` — `makeRescheduleLoansAPI`
- `js/api/generated/client.generated.js` — `retrieveOneRole`
- `js/api/generated/client.generated.js` — `handleCommandsRole`
- `js/api/generated/client.generated.js` — `retrievePermissions`
- `js/api/generated/client.generated.js` — `updatePermissions`
- `js/api/generated/client.generated.js` — `makeRolesAPI`
- `js/api/generated/client.generated.js` — `retrieveAllAvailableExports`
- `js/api/generated/client.generated.js` — `makeRunReportsAPI`
- `js/api/generated/client.generated.js` — `submitSavingsApplication`
- `js/api/generated/client.generated.js` — `handleCommandsSavingsAccount`
- `js/api/generated/client.generated.js` — `getSavingsTemplate`
- `js/api/generated/client.generated.js` — `retrieveByExternalId`
- `js/api/generated/client.generated.js` — `updateByExternalId`
- `js/api/generated/client.generated.js` — `handleCommandsSavingsAccountByExternalId`
- `js/api/generated/client.generated.js` — `deleteByExternalId`
- `js/api/generated/client.generated.js` — `submitGSIMApplication`
- `js/api/generated/client.generated.js` — `updateGsim`
- `js/api/generated/client.generated.js` — `handleGSIMCommands`
- `js/api/generated/client.generated.js` — `getSavingsTransactionTemplate`
- `js/api/generated/client.generated.js` — `postSavingsTransactionTemplate`
- `js/api/generated/client.generated.js` — `postSavingsTemplate`
- `js/api/generated/client.generated.js` — `makeSavingsAccountAPI`
- `js/api/generated/client.generated.js` — `retrieveOneSavingsAccountTransaction`
- `js/api/generated/client.generated.js` — `adjustSavingsAccountTransaction`
- `js/api/generated/client.generated.js` — `retrieveOneSavingsAccountTransactionByExternalId`
- `js/api/generated/client.generated.js` — `adjustSavingsAccountTransactionByExternalId`
- `js/api/generated/client.generated.js` — `advancedQuerySavingsAccountTransactions`
- `js/api/generated/client.generated.js` — `searchSavingsAccountTransactions`
- `js/api/generated/client.generated.js` — `retrieveTemplateSavingsAccountTransaction`
- `js/api/generated/client.generated.js` — `createBySavingsExternalId`
- `js/api/generated/client.generated.js` — `retrieveOneSavingsAccountTransactionBySavingsExternalId`
- `js/api/generated/client.generated.js` — `adjustSavingsAccountTransactionBySavingsExternalId`
- `js/api/generated/client.generated.js` — `retrieveOneSavingsAccountTransactionBySavingsAndTransactionExternalId`
- `js/api/generated/client.generated.js` — `adjustSavingsAccountTransactionBySavingsAndTransactionExternalId`
- `js/api/generated/client.generated.js` — `advancedQuerySavingsAccountTransactionsBySavingsExternalId`
- `js/api/generated/client.generated.js` — `searchSavingsAccountTransactionsBySavingsExternalId`
- `js/api/generated/client.generated.js` — `retrieveTemplateSavingsAccountTransactionBySavingsExternalId`
- `js/api/generated/client.generated.js` — `makeSavingsAccountTransactionsAPI`
- `js/api/generated/client.generated.js` — `retrieveAllSavingsAccountCharges`
- `js/api/generated/client.generated.js` — `createSavingsAccountCharge`
- `js/api/generated/client.generated.js` — `retrieveOneSavingsAccountCharge`
- `js/api/generated/client.generated.js` — `updateSavingsAccountCharge`
- `js/api/generated/client.generated.js` — `handleCommandsSavingsAccountCharge`
- `js/api/generated/client.generated.js` — `deleteSavingsAccountCharge`
- `js/api/generated/client.generated.js` — `retrieveTemplateSavingsAccountCharge`
- `js/api/generated/client.generated.js` — `makeSavingsChargesAPI`
- `js/api/generated/client.generated.js` — `retrieveOneSavingsProduct`
- `js/api/generated/client.generated.js` — `makeSavingsProductAPI`
- `js/api/generated/client.generated.js` — `retrieveStatus`
- `js/api/generated/client.generated.js` — `handleCommandsScheduler`
- `js/api/generated/client.generated.js` — `makeSchedulerAPI`
- `js/api/generated/client.generated.js` — `retrieveOneSchedulerJob`
- `js/api/generated/client.generated.js` — `updateJobDetail`
- `js/api/generated/client.generated.js` — `executeJob`
- `js/api/generated/client.generated.js` — `retrieveHistory`
- `js/api/generated/client.generated.js` — `retrieveByShortName`
- `js/api/generated/client.generated.js` — `updateJobDetailByShortName`
- `js/api/generated/client.generated.js` — `executeJobByShortName`
- `js/api/generated/client.generated.js` — `retrieveHistoryByShortName`
- `js/api/generated/client.generated.js` — `makeSCHEDULERJOBAPI`
- `js/api/generated/client.generated.js` — `findBySurvey`
- `js/api/generated/client.generated.js` — `findBySurveyAndClient`
- `js/api/generated/client.generated.js` — `findByClient`
- `js/api/generated/client.generated.js` — `makeScoreCardAPI`
- `js/api/generated/client.generated.js` — `advancedSearch`
- `js/api/generated/client.generated.js` — `makeSearchAPIAPI`
- `js/api/generated/client.generated.js` — `retrieveAllShareDividends`
- `js/api/generated/client.generated.js` — `createShareDividend`
- `js/api/generated/client.generated.js` — `retrieveOneShareDividend`
- `js/api/generated/client.generated.js` — `updateShareDividend`
- `js/api/generated/client.generated.js` — `deleteShareDividend`
- `js/api/generated/client.generated.js` — `makeSelfDividendAPI`
- `js/api/generated/client.generated.js` — `retrieveAllShareAccounts`
- `js/api/generated/client.generated.js` — `retrieveOneShareAccount`
- `js/api/generated/client.generated.js` — `handleCommandsShareAccount`
- `js/api/generated/client.generated.js` — `getTemplate`
- `js/api/generated/client.generated.js` — `retrieveTemplateShareAccount`
- `js/api/generated/client.generated.js` — `postTemplate`
- `js/api/generated/client.generated.js` — `makeShareAccountAPI`
- `js/api/generated/client.generated.js` — `retrieveAllSmsByStatus`
- `js/api/generated/client.generated.js` — `retrieveOneSms`
- `js/api/generated/client.generated.js` — `makeSMSAPI`
- `js/api/generated/client.generated.js` — `fetchLookupTables`
- `js/api/generated/client.generated.js` — `createLookupTable`
- `js/api/generated/client.generated.js` — `findLookupTable`
- `js/api/generated/client.generated.js` — `makeSPMAPILookUpTableAPI`
- `js/api/generated/client.generated.js` — `createSurvey`
- `js/api/generated/client.generated.js` — `findSurvey`
- `js/api/generated/client.generated.js` — `editSurvey`
- `js/api/generated/client.generated.js` — `activateOrDeactivateSurvey`
- `js/api/generated/client.generated.js` — `makeSpmSurveysAPI`
- `js/api/generated/client.generated.js` — `retrieveOneStaff`
- `js/api/generated/client.generated.js` — `getBulkTemplateStaff`
- `js/api/generated/client.generated.js` — `postTemplate`
- `js/api/generated/client.generated.js` — `makeStaffAPI`
- `js/api/generated/client.generated.js` — `retrieveOneStandingInstruction`
- `js/api/generated/client.generated.js` — `makeStandingInstructionsAPI`
- `js/api/generated/client.generated.js` — `makeStandingInstructionsHistoryAPI`
- `js/api/generated/client.generated.js` — `retrieveOneSurvey`
- `js/api/generated/client.generated.js` — `createEntry`
- `js/api/generated/client.generated.js` — `getClientSurveyOverview`
- `js/api/generated/client.generated.js` — `getEntry`
- `js/api/generated/client.generated.js` — `deleteDatatableEntries1`
- `js/api/generated/client.generated.js` — `register`
- `js/api/generated/client.generated.js` — `makeSurveyAPI`
- `js/api/generated/client.generated.js` — `retrieveOneTaxComponent`
- `js/api/generated/client.generated.js` — `makeTaxComponentsAPI`
- `js/api/generated/client.generated.js` — `retrieveOneTaxGroup`
- `js/api/generated/client.generated.js` — `makeTaxGroupAPI`
- `js/api/generated/client.generated.js` — `createTeller`
- `js/api/generated/client.generated.js` — `retrieveOneTeller`
- `js/api/generated/client.generated.js` — `updateTeller`
- `js/api/generated/client.generated.js` — `deleteTeller`
- `js/api/generated/client.generated.js` — `retrieveAllCashiersForTeller`
- `js/api/generated/client.generated.js` — `createCashierForTeller`
- `js/api/generated/client.generated.js` — `retrieveOneCashierForTeller`
- `js/api/generated/client.generated.js` — `updateCashierForTeller`
- `js/api/generated/client.generated.js` — `deleteCashierForTeller`
- `js/api/generated/client.generated.js` — `allocateCashToCashier`
- `js/api/generated/client.generated.js` — `settleCashFromCashier`
- `js/api/generated/client.generated.js` — `retrieveCashierTransactionsWithSummary`
- `js/api/generated/client.generated.js` — `retrieveCashierTransactions`
- `js/api/generated/client.generated.js` — `retrieveTemplateCashierTransaction`
- `js/api/generated/client.generated.js` — `retrieveCashierTemplateForTeller`
- `js/api/generated/client.generated.js` — `retrieveAllJournalsForTeller`
- `js/api/generated/client.generated.js` — `retrieveAllTransactionsForTeller`
- `js/api/generated/client.generated.js` — `retrieveOneTransactionForTeller`
- `js/api/generated/client.generated.js` — `makeTellerCashManagementAPI`
- `js/api/generated/client.generated.js` — `retrieveOneTemplate`
- `js/api/generated/client.generated.js` — `saveTemplate`
- `js/api/generated/client.generated.js` — `mergeTemplate`
- `js/api/generated/client.generated.js` — `retrieveById`
- `js/api/generated/client.generated.js` — `retrieveDetails`
- `js/api/generated/client.generated.js` — `makeTemplatesAPI`
- `js/api/generated/client.generated.js` — `update1`
- `js/api/generated/client.generated.js` — `delete1`
- `js/api/generated/client.generated.js` — `makeTenantOIDCConfigurationAPI`
- `js/api/generated/client.generated.js` — `requestToken`
- `js/api/generated/client.generated.js` — `updateConfiguration`
- `js/api/generated/client.generated.js` — `makeTwoFactorAPI`
- `js/api/generated/client.generated.js` — `retrieveOneUser`
- `js/api/generated/client.generated.js` — `changePasswordUser`
- `js/api/generated/client.generated.js` — `getBulkTemplateUser`
- `js/api/generated/client.generated.js` — `postBulkTemplateUser`
- `js/api/generated/client.generated.js` — `makeUsersAPI`
- `js/api/generated/client.generated.js` — `retrieveImage`
- `js/api/generated/client.generated.js` — `updateImage1`
- `js/api/generated/client.generated.js` — `createImage1`
- `js/api/generated/client.generated.js` — `deleteImage`
- `js/api/generated/client.generated.js` — `createEmail`
- `js/api/generated/client.generated.js` — `retrieveOneEmail`
- `js/api/generated/client.generated.js` — `updateEmail`
- `js/api/generated/client.generated.js` — `deleteEmail`
- `js/api/generated/client.generated.js` — `createEmailCampaign`
- `js/api/generated/client.generated.js` — `retrieveOneEmailCampaign`
- `js/api/generated/client.generated.js` — `updateEmailCampaign`
- `js/api/generated/client.generated.js` — `handleCommandsEmailCampaign`
- `js/api/generated/client.generated.js` — `deleteEmailCampaign`
- `js/api/generated/client.generated.js` — `previewEmailCampaign`
- `js/api/generated/client.generated.js` — `retrieveOneTemplateEmailCampaign`
- `js/api/generated/client.generated.js` — `updateEmailConfiguration`
- `js/api/generated/client.generated.js` — `getInternalClientAuditFields`
- `js/api/generated/client.generated.js` — `updateInternalGlobalConfiguration`
- `js/api/generated/client.generated.js` — `getAllExternalEvents`
- `js/api/generated/client.generated.js` — `deleteAllExternalEvents`
- `js/api/generated/client.generated.js` — `getAdvancedPaymentAllocationRulesOfLoan`
- `js/api/generated/client.generated.js` — `getLoanAuditFields`
- `js/api/generated/client.generated.js` — `getLoanTransactionAuditFields`
- `js/api/generated/client.generated.js` — `getMaxTransactionDateOfActiveLoans`
- `js/api/generated/client.generated.js` — `getLoansByStatus`
- `js/api/generated/client.generated.js` — `getSavingsAccountsByStatus`
- `js/api/generated/client.generated.js` — `transferMoneyFrom`
- `js/api/generated/client.generated.js` — `delete2`
- `js/api/generated/client.generated.js` — `createSmsCampaign`
- `js/api/generated/client.generated.js` — `updateSmsCampaign`
- `js/api/generated/client.generated.js` — `handleCommandsSmsCampaign`
- `js/api/generated/client.generated.js` — `deleteSmsCampaign`
- `js/api/generated/client.generated.js` — `retrieveOneSmsCampaign`
- `js/api/generated/client.generated.js` — `previewSmsCampaign`
- `js/api/generated/client.generated.js` — `retrieveAll4`
- `js/api/generated/client.generated.js` — `updateConfiguration1`
- `js/api/generated/client.generated.js` — `makeV1API`
- `js/api/generated/client.generated.js` — `retrieveAllWorkingCapitalBreaches`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalBreachAPI`
- `js/api/generated/client.generated.js` — `placeLockOnWorkingCapitalLoanAccount`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanAccountLockAPI`
- `js/api/generated/client.generated.js` — `retrieveBreachActions`
- `js/api/generated/client.generated.js` — `createBreachAction`
- `js/api/generated/client.generated.js` — `retrieveBreachActionsByExternalId`
- `js/api/generated/client.generated.js` — `createBreachActionByExternalId`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanBreachActionsAPI`
- `js/api/generated/client.generated.js` — `retrieveBreachSchedule`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanBreachScheduleAPI`
- `js/api/generated/client.generated.js` — `retrieveAllWorkingCapitalLoanChargesByLoanId`
- `js/api/generated/client.generated.js` — `createLoanCharge`
- `js/api/generated/client.generated.js` — `adjustLoanCharge`
- `js/api/generated/client.generated.js` — `retrieveByChargeExternalId`
- `js/api/generated/client.generated.js` — `adjustLoanChargeByChargeExternalId`
- `js/api/generated/client.generated.js` — `retrieveTemplateWorkingCapitalLoanCharge`
- `js/api/generated/client.generated.js` — `retrieveAllWorkingCapitalLoanChargesByLoanExternalId`
- `js/api/generated/client.generated.js` — `executeWorkingCapitalLoanChargeByLoanExternalId`
- `js/api/generated/client.generated.js` — `retrieveByLoanExternalId`
- `js/api/generated/client.generated.js` — `adjustLoanChargeByLoanExternalId`
- `js/api/generated/client.generated.js` — `retrieveByLoanAndChargeExternalId`
- `js/api/generated/client.generated.js` — `adjustLoanChargeByLoanAndChargeExternalId`
- `js/api/generated/client.generated.js` — `retrieveTemplateWorkingCapitalLoanChargeByLoanExternalId`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanChargesAPI`
- `js/api/generated/client.generated.js` — `executeLoanCOBCatchUp1`
- `js/api/generated/client.generated.js` — `isCatchUpRunning1`
- `js/api/generated/client.generated.js` — `getOldestCOBProcessedLoan1`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanCOBCatchUpAPI`
- `js/api/generated/client.generated.js` — `retrieveDelinquencyActions`
- `js/api/generated/client.generated.js` — `createDelinquencyAction`
- `js/api/generated/client.generated.js` — `retrieveDelinquencyActionsByExternalId`
- `js/api/generated/client.generated.js` — `createDelinquencyActionByExternalId`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanDelinquencyActionsAPI`
- `js/api/generated/client.generated.js` — `retrieveDelinquencyRangeSchedule`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanDelinquencyRangeScheduleAPI`
- `js/api/generated/client.generated.js` — `getLastCobRun`
- `js/api/generated/client.generated.js` — `deleteLastCobRun`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanInternalCOBApiAPI`
- `js/api/generated/client.generated.js` — `getsById`
- `js/api/generated/client.generated.js` — `createById`
- `js/api/generated/client.generated.js` — `getsByExternalId`
- `js/api/generated/client.generated.js` — `createByExternalId`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanNearBreachActionsAPI`
- `js/api/generated/client.generated.js` — `retrieveOriginatorsByWorkingCapitalLoanId`
- `js/api/generated/client.generated.js` — `attachOriginatorToWorkingCapitalLoan`
- `js/api/generated/client.generated.js` — `detachOriginatorFromWorkingCapitalLoan`
- `js/api/generated/client.generated.js` — `attachOriginatorToWorkingCapitalLoanByOriginatorExternalId`
- `js/api/generated/client.generated.js` — `detachOriginatorFromWorkingCapitalLoanByOriginatorExternalId`
- `js/api/generated/client.generated.js` — `retrieveOriginatorsByWorkingCapitalLoanExternalId`
- `js/api/generated/client.generated.js` — `attachOriginatorToWorkingCapitalLoanByLoanExternalId`
- `js/api/generated/client.generated.js` — `detachOriginatorFromWorkingCapitalLoanByLoanExternalId`
- `js/api/generated/client.generated.js` — `attachOriginatorToWorkingCapitalLoanByBothExternalIds`
- `js/api/generated/client.generated.js` — `detachOriginatorFromWorkingCapitalLoanByBothExternalIds`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanOriginatorsAPI`
- `js/api/generated/client.generated.js` — `retrieveAllWorkingCapitalLoanProducts`
- `js/api/generated/client.generated.js` — `retrieveOneWorkingCapitalLoanProduct`
- `js/api/generated/client.generated.js` — `retrieveOneWorkingCapitalLoanProductByExternalId`
- `js/api/generated/client.generated.js` — `updateByExternalId`
- `js/api/generated/client.generated.js` — `deleteByExternalId`
- `js/api/generated/client.generated.js` — `retrieveTemplateWorkingCapitalLoanProduct`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanProductsAPI`
- `js/api/generated/client.generated.js` — `retrieveWorkingCapitalLoanActionTemplate`
- `js/api/generated/client.generated.js` — `retrievesById`
- `js/api/generated/client.generated.js` — `executeWorkingCapitalLoanTransactionById`
- `js/api/generated/client.generated.js` — `retrieveById`
- `js/api/generated/client.generated.js` — `executeWorkingCapitalLoanTransactionCommandByLoanIdTransactionId`
- `js/api/generated/client.generated.js` — `retrieveByExternalTransactionId`
- `js/api/generated/client.generated.js` — `executeWorkingCapitalLoanTransactionCommandByLoanIdTransactionExternalId`
- `js/api/generated/client.generated.js` — `retrievesByExternalId`
- `js/api/generated/client.generated.js` — `executeWorkingCapitalLoanTransactionByExternalId`
- `js/api/generated/client.generated.js` — `retrieveByExternalLoanIdAndTransactionId`
- `js/api/generated/client.generated.js` — `executeWorkingCapitalLoanTransactionCommandByLoanExternalIdTransactionId`
- `js/api/generated/client.generated.js` — `retrieveByExternalLoanIdAndExternalTransactionId`
- `js/api/generated/client.generated.js` — `executeWorkingCapitalLoanTransactionCommandByLoanExternalIdTransactionExternalId`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoanTransactionsAPI`
- `js/api/generated/client.generated.js` — `activateLoan`
- `js/api/generated/client.generated.js` — `generateAmortizationSchedule`
- `js/api/generated/client.generated.js` — `generateNextDelinquencyPeriod`
- `js/api/generated/client.generated.js` — `retrieveAllWorkingCapitalLoans`
- `js/api/generated/client.generated.js` — `submitWorkingCapitalLoanApplication`
- `js/api/generated/client.generated.js` — `retrieveById`
- `js/api/generated/client.generated.js` — `modifyWorkingCapitalLoanApplicationById`
- `js/api/generated/client.generated.js` — `stateTransitionWorkingCapitalLoanById`
- `js/api/generated/client.generated.js` — `deleteApplication`
- `js/api/generated/client.generated.js` — `retrieveAmortizationSchedule`
- `js/api/generated/client.generated.js` — `getDelinquencyRangeScheduleTagHistoryById`
- `js/api/generated/client.generated.js` — `updateDiscountById`
- `js/api/generated/client.generated.js` — `updateRateById`
- `js/api/generated/client.generated.js` — `getRateChangeHistoryById`
- `js/api/generated/client.generated.js` — `getDelinquencyRangeScheduleTagHistoryByExternalId`
- `js/api/generated/client.generated.js` — `retrieveByExternalId`
- `js/api/generated/client.generated.js` — `modifyWorkingCapitalLoanApplicationByExternalId`
- `js/api/generated/client.generated.js` — `stateTransitionWorkingCapitalLoanByExternalId`
- `js/api/generated/client.generated.js` — `deleteApplicationByExternalId`
- `js/api/generated/client.generated.js` — `updateDiscountByExternalId`
- `js/api/generated/client.generated.js` — `updateRateByExternalId`
- `js/api/generated/client.generated.js` — `getRateChangeHistoryByExternalId`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalLoansAPI`
- `js/api/generated/client.generated.js` — `retrieveAllWorkingCapitalNearBreaches`
- `js/api/generated/client.generated.js` — `makeWorkingCapitalNearBreachAPI`
- `js/api/generated/client.generated.js` — `makeWorkingDaysAPI`
- `js/api/generated/client.generated.js` — `mountGenerated`
- `js/api/generated/contracts.generated.js` — `contractFor`
- `js/api/generated/templates.generated.js` — `templatesFor`
- `js/api/generated/templates.generated.js` — `loadOptions`
- `js/api/generated/validators.generated.js` — `string`
- `js/api/generated/validators.generated.js` — `integer`
- `js/api/generated/validators.generated.js` — `array`
- `js/api/generated/validators.generated.js` — `validateRequest`
- `js/api/generated/validators.generated.js` — `assertValid`
- `js/api/groups-centers.js` — `unassignStaffCommand`
- `js/api/groups-centers.js` — `assignRole`
- `js/api/groups-centers.js` — `updateRole`
- `js/api/groups-centers.js` — `unassignRole`
- `js/api/groups-centers.js` — `generateCollectionSheet`
- `js/api/groups-centers.js` — `saveCollectionSheet`
- `js/api/groups-centers.js` — `glimAccounts`
- `js/api/groups-centers.js` — `gsimAccounts`
- `js/api/groups-centers.js` — `makeGroupsAPI`
- `js/api/groups-centers.js` — `generateCollectionSheet`
- `js/api/groups-centers.js` — `saveCollectionSheet`
- `js/api/groups-centers.js` — `makeCentersAPI`
- `js/api/groups-centers.js` — `makeCalendarsAPI`
- `js/api/groups-centers.js` — `saveAttendance`
- `js/api/groups-centers.js` — `makeMeetingsAPI`
- `js/api/groups-centers.js` — `makeGroupLevelsAPI`
- `js/api/index.js` — `constructor`
- `js/api/index.js` — `configureAPI`
- `js/api/integrations.js` — `markAllRead`
- `js/api/integrations.js` — `makeNotificationsAPI`
- `js/api/integrations.js` — `makeHooksAPI`
- `js/api/integrations.js` — `makeExternalServicesAPI`
- `js/api/integrations.js` — `updateConfig`
- `js/api/integrations.js` — `makeExternalEventsAPI`
- `js/api/integrations.js` — `reactivate`
- `js/api/integrations.js` — `makeSmsCampaignsAPI`
- `js/api/integrations.js` — `messagesByStatus`
- `js/api/integrations.js` — `makeSmsAPI`
- `js/api/integrations.js` — `byStatus`
- `js/api/integrations.js` — `makeEmailAPI`
- `js/api/integrations.js` — `templateDetail`
- `js/api/integrations.js` — `operate`
- `js/api/integrations.js` — `reactivate`
- `js/api/integrations.js` — `makeEmailCampaignsAPI`
- `js/api/integrations.js` — `makeEmailConfigurationAPI`
- `js/api/interest-rate-charts.js` — `slabs`
- `js/api/interest-rate-charts.js` — `slabTemplate`
- `js/api/interest-rate-charts.js` — `getSlab`
- `js/api/interest-rate-charts.js` — `createSlab`
- `js/api/interest-rate-charts.js` — `updateSlab`
- `js/api/interest-rate-charts.js` — `deleteSlab`
- `js/api/interest-rate-charts.js` — `makeInterestRateChartsAPI`
- `js/api/interoperation.js` — `getAccount`
- `js/api/interoperation.js` — `accountIdentifiers`
- `js/api/interoperation.js` — `accountKyc`
- `js/api/interoperation.js` — `accountTransactions`
- `js/api/interoperation.js` — `getParty`
- `js/api/interoperation.js` — `registerParty`
- `js/api/interoperation.js` — `deleteParty`
- `js/api/interoperation.js` — `getQuote`
- `js/api/interoperation.js` — `getTransactionRequest`
- `js/api/interoperation.js` — `getTransfer`
- `js/api/interoperation.js` — `disburseLoan`
- `js/api/interoperation.js` — `loanRepayment`
- `js/api/interoperation.js` — `makeInteroperationAPI`
- `js/api/loans.js` — `getWithParams`
- `js/api/loans.js` — `approvalTemplate`
- `js/api/loans.js` — `withdrawApplication`
- `js/api/loans.js` — `writeOff`
- `js/api/loans.js` — `chargeOff`
- `js/api/loans.js` — `undoChargeOff`
- `js/api/loans.js` — `closeAsRescheduled`
- `js/api/loans.js` — `foreclose`
- `js/api/loans.js` — `reagePreview`
- `js/api/loans.js` — `undoReAge`
- `js/api/loans.js` — `reamortizePreview`
- `js/api/loans.js` — `undoReAmortize`
- `js/api/loans.js` — `transactionTemplate`
- `js/api/loans.js` — `markAsFraud`
- `js/api/loans.js` — `recoverGuarantees`
- `js/api/loans.js` — `assignOfficer`
- `js/api/loans.js` — `removeOfficer`
- `js/api/loans.js` — `downPayment`
- `js/api/loans.js` — `recoverPayment`
- `js/api/loans.js` — `goodwillCredit`
- `js/api/loans.js` — `chargeRefund`
- `js/api/loans.js` — `interestPaymentWaiver`
- `js/api/loans.js` — `merchantIssued`
- `js/api/loans.js` — `payoutRefund`
- `js/api/loans.js` — `refundByTransfer`
- `js/api/loans.js` — `waiveInterest`
- `js/api/loans.js` — `chargebackTx`
- `js/api/loans.js` — `reverseTransaction`
- `js/api/loans.js` — `undoTransaction`
- `js/api/loans.js` — `adjustTransaction`
- `js/api/loans.js` — `undoWaiveCharge`
- `js/api/loans.js` — `modifyTransaction`
- `js/api/loans.js` — `calculateSchedule`
- `js/api/loans.js` — `submitVariableSchedule`
- `js/api/loans.js` — `addCharge`
- `js/api/loans.js` — `chargeTemplate`
- `js/api/loans.js` — `getCharge`
- `js/api/loans.js` — `updateCharge`
- `js/api/loans.js` — `waiveCharge`
- `js/api/loans.js` — `payCharge`
- `js/api/loans.js` — `chargeAdjustment`
- `js/api/loans.js` — `listCharges`
- `js/api/loans.js` — `deleteCharge`
- `js/api/loans.js` — `listCollaterals`
- `js/api/loans.js` — `getGlimAccount`
- `js/api/loans.js` — `glimAccountCommand`
- `js/api/loans.js` — `collateralTemplate`
- `js/api/loans.js` — `getCollateral`
- `js/api/loans.js` — `addCollateral`
- `js/api/loans.js` — `updateCollateral`
- `js/api/loans.js` — `deleteCollateral`
- `js/api/loans.js` — `guarantorTemplate`
- `js/api/loans.js` — `getGuarantor`
- `js/api/loans.js` — `guarantorAccountsTemplate`
- `js/api/loans.js` — `addGuarantor`
- `js/api/loans.js` — `updateGuarantor`
- `js/api/loans.js` — `deleteGuarantor`
- `js/api/loans.js` — `updateDisbursement`
- `js/api/loans.js` — `editDisbursements`
- `js/api/loans.js` — `addDelinquencyAction`
- `js/api/loans.js` — `delinquencyTags`
- `js/api/loans.js` — `getApprovedAmountHistory`
- `js/api/loans.js` — `updateApprovedAmount`
- `js/api/loans.js` — `updateAvailableDisbursementAmount`
- `js/api/loans.js` — `standingInstructions`
- `js/api/loans.js` — `interestPauses`
- `js/api/loans.js` — `interestPause`
- `js/api/loans.js` — `updateInterestPause`
- `js/api/loans.js` — `deleteInterestPause`
- `js/api/loans.js` — `buyDownFees`
- `js/api/loans.js` — `buyDownFeeAllocation`
- `js/api/loans.js` — `capitalizedIncomes`
- `js/api/loans.js` — `deferredIncome`
- `js/api/loans.js` — `rescheduleTemplate`
- `js/api/loans.js` — `rescheduleRequests`
- `js/api/loans.js` — `rescheduleRequest`
- `js/api/loans.js` — `approveReschedule`
- `js/api/loans.js` — `rejectReschedule`
- `js/api/loans.js` — `postDatedChecks`
- `js/api/loans.js` — `postDatedCheck`
- `js/api/loans.js` — `updatePostDatedCheck`
- `js/api/loans.js` — `deletePostDatedCheck`
- `js/api/loans.js` — `eaoList`
- `js/api/loans.js` — `eaoTransfer`
- `js/api/loans.js` — `eaoBuyBack`
- `js/api/loans.js` — `attachOriginator`
- `js/api/loans.js` — `detachOriginator`
- `js/api/loans.js` — `bulkReassign`
- `js/api/loans.js` — `loanReassignTemplate`
- `js/api/loans.js` — `loanAtDate`
- `js/api/loans.js` — `glimAccounts`
- `js/api/loans.js` — `catchUp`
- `js/api/loans.js` — `oldestCobClosed`
- `js/api/loans.js` — `lockedAccounts`
- `js/api/loans.js` — `pointInTimeSearch`
- `js/api/loans.js` — `capitalizedIncomeAllocation`
- `js/api/loans.js` — `makeLoansAPI`
- `js/api/loans.js` — `makeLoanCollateralManagementAPI`
- `js/api/loans.js` — `bucketTemplate`
- `js/api/loans.js` — `range`
- `js/api/loans.js` — `createRange`
- `js/api/loans.js` — `updateRange`
- `js/api/loans.js` — `deleteRange`
- `js/api/loans.js` — `loanTagHistory`
- `js/api/loans.js` — `makeDelinquencyBucketsAPI`
- `js/api/loans.js` — `makeLoanOriginatorsAPI`
- `js/api/loans.js` — `journalEntries`
- `js/api/loans.js` — `ownerJournalEntriesByExternalId`
- `js/api/loans.js` — `activeTransfer`
- `js/api/loans.js` — `loanProductAttributes`
- `js/api/loans.js` — `createLoanProductAttribute`
- `js/api/loans.js` — `updateLoanProductAttribute`
- `js/api/loans.js` — `transferAsset`
- `js/api/loans.js` — `makeExternalAssetOwnersAPI`
- `js/api/loans.js` — `makeCollateralManagementAPI`
- `js/api/misc.js` — `listByAppliesTo`
- `js/api/misc.js` — `makeChargesAPI`
- `js/api/misc.js` — `templateForEdit`
- `js/api/misc.js` — `makeTemplatesAPI`
- `js/api/misc.js` — `register`
- `js/api/misc.js` — `resetPassword`
- `js/api/misc.js` — `beneficiaries`
- `js/api/misc.js` — `addBeneficiary`
- `js/api/misc.js` — `updateBeneficiary`
- `js/api/misc.js` — `deleteBeneficiary`
- `js/api/misc.js` — `makeSelfServiceAPI`
- `js/api/misc.js` — `makeSearchAPI`
- `js/api/misc.js` — `makeBatchAPI`
- `js/api/misc.js` — `upload`
- `js/api/misc.js` — `makeDocumentsAPI`
- `js/api/misc.js` — `upload`
- `js/api/misc.js` — `makeImagesAPI`
- `js/api/misc.js` — `makeNotesAPI`
- `js/api/misc.js` — `refundTemplate`
- `js/api/misc.js` — `operate`
- `js/api/misc.js` — `makeTransfersAPI`
- `js/api/misc.js` — `makeStandingInstructionsAPI`
- `js/api/misc.js` — `updateConfig`
- `js/api/misc.js` — `getByType`
- `js/api/misc.js` — `catchUp`
- `js/api/misc.js` — `makeCobAPI`
- `js/api/misc.js` — `upload`
- `js/api/misc.js` — `outputTemplateLocation`
- `js/api/misc.js` — `outputTemplate`
- `js/api/misc.js` — `makeBulkImportsAPI`
- `js/api/mix-xbrl.js` — `taxonomies`
- `js/api/mix-xbrl.js` — `updateMapping`
- `js/api/mix-xbrl.js` — `makeMixXbrlAPI`
- `js/api/office-transactions.js` — `makeOfficeTransactionsAPI`
- `js/api/operation-runner.js` — `fieldInput`
- `js/api/operation-runner.js` — `coerce`
- `js/api/operation-runner.js` — `collect`
- `js/api/operation-runner.js` — `runOperation`
- `js/api/operation-runner.js` — `openOperationModal`
- `js/api/organization.js` — `makeOfficesAPI`
- `js/api/organization.js` — `makeStaffAPI`
- `js/api/organization.js` — `allCashiers`
- `js/api/organization.js` — `getCashier`
- `js/api/organization.js` — `cashierTemplate`
- `js/api/organization.js` — `allocateCashier`
- `js/api/organization.js` — `updateCashier`
- `js/api/organization.js` — `deleteCashier`
- `js/api/organization.js` — `settleCashier`
- `js/api/organization.js` — `allocateCashTo`
- `js/api/organization.js` — `cashierTransactions`
- `js/api/organization.js` — `cashierSummary`
- `js/api/organization.js` — `cashierTxTemplate`
- `js/api/organization.js` — `getTransaction`
- `js/api/organization.js` — `makeTellersAPI`
- `js/api/organization.js` — `makeTellerJournalAPI`
- `js/api/organization.js` — `makeHolidaysAPI`
- `js/api/organization.js` — `makeWorkingDaysAPI`
- `js/api/organization.js` — `makeFundsAPI`
- `js/api/organization.js` — `getByName`
- `js/api/organization.js` — `getValue`
- `js/api/organization.js` — `createValue`
- `js/api/organization.js` — `updateValue`
- `js/api/organization.js` — `deleteValue`
- `js/api/organization.js` — `valuesByName`
- `js/api/organization.js` — `getValueByName`
- `js/api/organization.js` — `createValueByName`
- `js/api/organization.js` — `updateValueByName`
- `js/api/organization.js` — `deleteValueByName`
- `js/api/organization.js` — `makeCodesAPI`
- `js/api/organization.js` — `makeCurrenciesAPI`
- `js/api/organization.js` — `makePaymentTypesAPI`
- `js/api/products.js` — `basicDetails`
- `js/api/products.js` — `makeLoanProductsAPI`
- `js/api/products.js` — `makeSavingsProductsAPI`
- `js/api/products.js` — `makeShareProductsAPI`
- `js/api/products.js` — `makeFdProductsAPI`
- `js/api/products.js` — `makeRdProductsAPI`
- `js/api/products.js` — `makeProductMixAPI`
- `js/api/products.js` — `makeFloatingRatesAPI`
- `js/api/products.js` — `makeRatesAPI`
- `js/api/report-mailing.js` — `runHistory`
- `js/api/report-mailing.js` — `makeReportMailingJobsAPI`
- `js/api/reports.js` — `makeReportsAPI`
- `js/api/reports.js` — `makeRunReportsAPI`
- `js/api/reports.js` — `save`
- `js/api/reports.js` — `makeCollectionSheetAPI`
- `js/api/reports.js` — `runAll`
- `js/api/reports.js` — `makeAdhocQueriesAPI`
- `js/api/reports.js` — `makeEntityDatatableChecksAPI`
- `js/api/reports.js` — `register`
- `js/api/reports.js` — `deregister`
- `js/api/reports.js` — `updateSchema`
- `js/api/reports.js` — `deleteTable`
- `js/api/reports.js` — `createEntry`
- `js/api/reports.js` — `getEntry`
- `js/api/reports.js` — `updateEntryOneToMany`
- `js/api/reports.js` — `deleteEntry`
- `js/api/reports.js` — `advancedQuery`
- `js/api/reports.js` — `advancedQueryPost`
- `js/api/reports.js` — `makeDataTablesAPI`
- `js/api/savings-deposits.js` — `createGsim`
- `js/api/savings-deposits.js` — `updateGsim`
- `js/api/savings-deposits.js` — `gsimCommand`
- `js/api/savings-deposits.js` — `withdrawApplication`
- `js/api/savings-deposits.js` — `reverseTransaction`
- `js/api/savings-deposits.js` — `onHoldTransactions`
- `js/api/savings-deposits.js` — `waiveCharge`
- `js/api/savings-deposits.js` — `payCharge`
- `js/api/savings-deposits.js` — `inactivateCharge`
- `js/api/savings-deposits.js` — `updateCharge`
- `js/api/savings-deposits.js` — `deleteCharge`
- `js/api/savings-deposits.js` — `adjustTransaction`
- `js/api/savings-deposits.js` — `undoTransaction`
- `js/api/savings-deposits.js` — `addCharge`
- `js/api/savings-deposits.js` — `chargeTemplate`
- `js/api/savings-deposits.js` — `getCharge`
- `js/api/savings-deposits.js` — `transactionTemplate`
- `js/api/savings-deposits.js` — `getTransaction`
- `js/api/savings-deposits.js` — `searchTransactions`
- `js/api/savings-deposits.js` — `queryTransactions`
- `js/api/savings-deposits.js` — `makeSavingsAPI`
- `js/api/savings-deposits.js` — `calculateInterestPreview`
- `js/api/savings-deposits.js` — `withdrawApplication`
- `js/api/savings-deposits.js` — `prematureTemplate`
- `js/api/savings-deposits.js` — `withdrawalTemplate`
- `js/api/savings-deposits.js` — `transactionTemplate`
- `js/api/savings-deposits.js` — `interestTx`
- `js/api/savings-deposits.js` — `prematureTx`
- `js/api/savings-deposits.js` — `adjustTransaction`
- `js/api/savings-deposits.js` — `undoTransaction`
- `js/api/savings-deposits.js` — `chargeTemplate`
- `js/api/savings-deposits.js` — `getCharge`
- `js/api/savings-deposits.js` — `addCharge`
- `js/api/savings-deposits.js` — `updateCharge`
- `js/api/savings-deposits.js` — `payCharge`
- `js/api/savings-deposits.js` — `waiveCharge`
- `js/api/savings-deposits.js` — `inactivateCharge`
- `js/api/savings-deposits.js` — `deleteCharge`
- `js/api/savings-deposits.js` — `makeFixedDepositsAPI`
- `js/api/savings-deposits.js` — `withdrawApplication`
- `js/api/savings-deposits.js` — `prematureTemplate`
- `js/api/savings-deposits.js` — `withdrawalTemplate`
- `js/api/savings-deposits.js` — `transactionTemplate`
- `js/api/savings-deposits.js` — `interestTx`
- `js/api/savings-deposits.js` — `prematureTx`
- `js/api/savings-deposits.js` — `adjustTransaction`
- `js/api/savings-deposits.js` — `undoTransaction`
- `js/api/savings-deposits.js` — `chargeTemplate`
- `js/api/savings-deposits.js` — `getCharge`
- `js/api/savings-deposits.js` — `addCharge`
- `js/api/savings-deposits.js` — `updateCharge`
- `js/api/savings-deposits.js` — `payCharge`
- `js/api/savings-deposits.js` — `waiveCharge`
- `js/api/savings-deposits.js` — `inactivateCharge`
- `js/api/savings-deposits.js` — `deleteCharge`
- `js/api/savings-deposits.js` — `makeRecurringDepositsAPI`
- `js/api/shares.js` — `withdrawApplication`
- `js/api/shares.js` — `applyAdditional`
- `js/api/shares.js` — `approveShareReq`
- `js/api/shares.js` — `rejectShareReq`
- `js/api/shares.js` — `dividends`
- `js/api/shares.js` — `getDividend`
- `js/api/shares.js` — `postDividend`
- `js/api/shares.js` — `updateDividend`
- `js/api/shares.js` — `approveDividend`
- `js/api/shares.js` — `deleteDividend`
- `js/api/shares.js` — `makeSharesAPI`
- `js/api/social-performance.js` — `byClient`
- `js/api/social-performance.js` — `bySurvey`
- `js/api/social-performance.js` — `bySurveyAndClient`
- `js/api/social-performance.js` — `lookupTables`
- `js/api/social-performance.js` — `createLookupTable`
- `js/api/social-performance.js` — `getLookupTable`
- `js/api/social-performance.js` — `makeScorecardsAPI`
- `js/api/social-performance.js` — `register`
- `js/api/social-performance.js` — `createEntry`
- `js/api/social-performance.js` — `clientOverview`
- `js/api/social-performance.js` — `getEntry`
- `js/api/social-performance.js` — `deleteEntry`
- `js/api/social-performance.js` — `makeSurveyDataAPI`
- `js/api/social-performance.js` — `makeLikelihoodAPI`
- `js/api/social-performance.js` — `makePovertyLineAPI`
- `js/api/treasury.js` — `isMultiRow`
- `js/api/treasury.js` — `ensureTreasuryDatatables`
- `js/api/treasury.js` — `queryRows`
- `js/api/treasury.js` — `createRow`
- `js/api/treasury.js` — `getRow`
- `js/api/treasury.js` — `updateRow`
- `js/api/treasury.js` — `deleteRow`
- `js/api/treasury.js` — `updateConfig`
- `js/api/treasury.js` — `deleteConfig`
- `js/api/treasury.js` — `makeTreasuryAPI`
- `js/pages/accounting/actions/balances.js` — `openingBalanceRow`
- `js/pages/accounting/actions/balances.js` — `submitOpeningBalances`
- `js/pages/accounting/actions/coa.js` — `deleteGLAccountConfirm`
- `js/pages/accounting/actions/coa.js` — `buildTagOpts`
- `js/pages/accounting/actions/coa.js` — `openGLAccountModal`
- `js/pages/accounting/actions/coa.js` — `sync`
- `js/pages/accounting/actions/coa.js` — `wireMode`
- `js/pages/accounting/actions/coa.js` — `getTags`
- `js/pages/accounting/actions/coa.js` — `openAccountingRuleModal`
- `js/pages/accounting/actions/journal.js` — `openJournalEntryDetailModal`
- `js/pages/accounting/actions/journal.js` — `openReverseJEModal`
- `js/pages/accounting/actions/journal.js` — `openFrequentPostingModal`
- `js/pages/accounting/actions/journal.js` — `rowTpl`
- `js/pages/accounting/actions/journal.js` — `collectRows`
- `js/pages/accounting/actions/journal.js` — `openJournalEntryModal`
- `js/pages/accounting/actions/provisioning.js` — `openProvisioningModal`
- `js/pages/accounting/actions/provisioning.js` — `glOpts`
- `js/pages/accounting/actions/provisioning.js` — `provRow`
- `js/pages/accounting/actions/provisioning.js` — `openProvisioningCategoryModal`
- `js/pages/accounting/actions/provisioning.js` — `openFAModal`
- `js/pages/accounting/loaders/coa.js` — `glRowActions`
- `js/pages/accounting/loaders/coa.js` — `wireGlRowActions`
- `js/pages/accounting/loaders/coa.js` — `renderGrouped`
- `js/pages/accounting/loaders/coa.js` — `treeNode`
- `js/pages/accounting/loaders/coa.js` — `renderTree`
- `js/pages/accounting/loaders/coa.js` — `loadChartOfAccounts`
- `js/pages/accounting/loaders/coa.js` — `loadJournalEntries`
- `js/pages/accounting/loaders/coa.js` — `loadFrequentPostings`
- `js/pages/accounting/loaders/period.js` — `loadRunAccruals`
- `js/pages/accounting/loaders/period.js` — `loadGLClosure`
- `js/pages/accounting/loaders/period.js` — `loadProvisioning`
- `js/pages/accounting/loaders/period.js` — `loadFinancialActivities`
- `js/pages/accounting/loaders/rules.js` — `loadAccountingRules`
- `js/pages/accounting/loaders/rules.js` — `loadOpeningBalances`
- `js/pages/accounting/shared.js` — `can`
- `js/pages/accounting/shared.js` — `glList`
- `js/pages/accounting/shared.js` — `populateJEFilters`
- `js/pages/accounting/shared.js` — `vi`
- `js/pages/accounting/shared.js` — `vf`
- `js/pages/accounting/shared.js` — `dynModal`
- `js/pages/accounting/shared.js` — `resetGlCache`
- `js/pages/analytics.js` — `val`
- `js/pages/analytics.js` — `warn`
- `js/pages/analytics.js` — `countFor`
- `js/pages/analytics.js` — `loadAll`
- `js/pages/analytics.js` — `computeNplFromPar`
- `js/pages/analytics.js` — `computeAgingBuckets`
- `js/pages/analytics.js` — `computeArrearsByOfficer`
- `js/pages/analytics.js` — `loadChartJs`
- `js/pages/analytics.js` — `destroyChart`
- `js/pages/analytics.js` — `renderAgingChart`
- `js/pages/centers/actions.js` — `disassociateSelectedGroups`
- `js/pages/centers/actions.js` — `refreshSelected`
- `js/pages/centers/actions.js` — `openAddGroupsModal`
- `js/pages/centers/actions.js` — `openScheduleMeetingModal`
- `js/pages/centers/actions.js` — `openEditCenterModal`
- `js/pages/centers/actions.js` — `openCloseCenterModal`
- `js/pages/centers/detail.js` — `meetings`
- `js/pages/centers/detail.js` — `notes`
- `js/pages/centers/detail.js` — `switchTab`
- `js/pages/centers/detail.js` — `renderDetail`
- `js/pages/centers/detail.js` — `loadGroups`
- `js/pages/centers/detail.js` — `loadMeetings`
- `js/pages/centers/detail.js` — `initCollectionSheet`
- `js/pages/centers/detail.js` — `renderCollectionSheet`
- `js/pages/centers/detail.js` — `loadNotes`
- `js/pages/centers/detail.js` — `loadDocuments`
- `js/pages/centers/list.js` — `onChange`
- `js/pages/centers/list.js` — `drawPagination`
- `js/pages/centers/list.js` — `draw`
- `js/pages/centers/list.js` — `renderList`
- `js/pages/centers/shared.js` — `can`
- `js/pages/charges/actions.js` — `openChargeFormModal`
- `js/pages/charges/detail.js` — `switchTab`
- `js/pages/charges/detail.js` — `renderDetail`
- `js/pages/charges/detail.js` — `loadChargeUsage`
- `js/pages/charges/detail.js` — `loadChargeTaxLinkage`
- `js/pages/charges/list.js` — `draw`
- `js/pages/charges/list.js` — `renderList`
- `js/pages/charges/shared.js` — `can`
- `js/pages/clients/actions/charges.js` — `openApplyChargeModal`
- `js/pages/clients/actions/charges.js` — `openPayChargeModal`
- `js/pages/clients/actions/identity.js` — `openAddIdentifierModal`
- `js/pages/clients/actions/identity.js` — `updatePreview`
- `js/pages/clients/actions/identity.js` — `openAddClientCollateralModal`
- `js/pages/clients/actions/identity.js` — `openEditClientCollateralModal`
- `js/pages/clients/actions/identity.js` — `openAddFamilyModal`
- `js/pages/clients/actions/identity.js` — `openAddAddressModal`
- `js/pages/clients/actions/identity.js` — `openEditAddressModal`
- `js/pages/clients/actions/lifecycle.js` — `openEditClientModal`
- `js/pages/clients/actions/lifecycle.js` — `openCloseClientModal`
- `js/pages/clients/actions/lifecycle.js` — `openRejectClientModal`
- `js/pages/clients/actions/lifecycle.js` — `openWithdrawClientModal`
- `js/pages/clients/actions/lifecycle.js` — `openTransferModal`
- `js/pages/clients/actions/lifecycle.js` — `openAssignStaffModal`
- `js/pages/clients/detail/accounts.js` — `loadClientOverviewStats`
- `js/pages/clients/detail/accounts.js` — `loadClientLoansOnly`
- `js/pages/clients/detail/accounts.js` — `tableSection`
- `js/pages/clients/detail/accounts.js` — `loadClientAccounts`
- `js/pages/clients/detail/accounts.js` — `loadClientCharges`
- `js/pages/clients/detail/accounts.js` — `loadClientTransactions`
- `js/pages/clients/detail/accounts.js` — `loadClientStandingInstructions`
- `js/pages/clients/detail/identity.js` — `loadClientNextOfKin`
- `js/pages/clients/detail/identity.js` — `loadClientIdentifiers`
- `js/pages/clients/detail/identity.js` — `loadClientFamilyMembers`
- `js/pages/clients/detail/identity.js` — `loadClientCollateral`
- `js/pages/clients/detail/identity.js` — `loadClientAddresses`
- `js/pages/clients/detail/identity.js` — `loadClientPhoto`
- `js/pages/clients/detail/index.js` — `overview`
- `js/pages/clients/detail/index.js` — `kyc`
- `js/pages/clients/detail/index.js` — `notes`
- `js/pages/clients/detail/index.js` — `switchTab`
- `js/pages/clients/detail/index.js` — `openNewLoanForClient`
- `js/pages/clients/detail/index.js` — `renderDetail`
- `js/pages/clients/detail/notes-docs.js` — `docIcon`
- `js/pages/clients/detail/notes-docs.js` — `loadClientDocuments`
- `js/pages/clients/detail/notes-docs.js` — `loadClientNotes`
- `js/pages/clients/detail/notes-docs.js` — `loadClientHistory`
- `js/pages/clients/list.js` — `loadClients`
- `js/pages/clients/list.js` — `onChange`
- `js/pages/clients/list.js` — `drawPagination`
- `js/pages/clients/list.js` — `draw`
- `js/pages/clients/list.js` — `renderList`
- `js/pages/clients/new.js` — `stepper`
- `js/pages/clients/new.js` — `isPerson`
- `js/pages/clients/new.js` — `chip`
- `js/pages/clients/new.js` — `captureStep`
- `js/pages/clients/new.js` — `validateStep`
- `js/pages/clients/new.js` — `wire`
- `js/pages/clients/new.js` — `renderNew`
- `js/pages/clients/shared.js` — `can`
- `js/pages/clients/shared.js` — `cvHue`
- `js/pages/clients/shared.js` — `cvAvatar`
- `js/pages/clients/shared.js` — `cvClientType`
- `js/pages/clients/shared.js` — `cvPill`
- `js/pages/clients/shared.js` — `cvStatusTone`
- `js/pages/collateral/actions.js` — `openCollateralFormModal`
- `js/pages/collateral/detail.js` — `valuation`
- `js/pages/collateral/detail.js` — `switchTab`
- `js/pages/collateral/detail.js` — `renderDetail`
- `js/pages/collateral/detail.js` — `renderValuationGuide`
- `js/pages/collateral/detail.js` — `loadCollateralUsage`
- `js/pages/collateral/list.js` — `draw`
- `js/pages/collateral/list.js` — `renderList`
- `js/pages/collateral/shared.js` — `can`
- `js/pages/credit-bureau.js` — `loadBureaus`
- `js/pages/credit-bureau.js` — `loadMappings`
- `js/pages/credit-bureau.js` — `showJson`
- `js/pages/credit-bureau.js` — `loadReports`
- `js/pages/credit-bureau.js` — `asList`
- `js/pages/dashboard/charts.js` — `_injectScript`
- `js/pages/dashboard/charts.js` — `loadChartJs`
- `js/pages/dashboard/charts.js` — `destroyChart`
- `js/pages/dashboard/charts.js` — `showFallback`
- `js/pages/dashboard/charts.js` — `showCanvas`
- `js/pages/dashboard/charts.js` — `renderTrendChart`
- `js/pages/dashboard/charts.js` — `renderProductDistChart`
- `js/pages/dashboard/charts.js` — `renderStatusMixChart`
- `js/pages/dashboard/charts.js` — `renderGrowthChart`
- `js/pages/dashboard/charts.js` — `renderIncomeExpenseChart`
- `js/pages/dashboard/charts.js` — `isCurrent`
- `js/pages/dashboard/charts.js` — `renderParChart`
- `js/pages/dashboard/charts.js` — `renderBranchChart`
- `js/pages/dashboard/charts.js` — `renderOfficerChart`
- `js/pages/dashboard/charts.js` — `renderCashFlowChart`
- `js/pages/dashboard/data.js` — `getHeadOfficeId`
- `js/pages/dashboard/data.js` — `ensureSnapshotTable`
- `js/pages/dashboard/data.js` — `loadSnapshotHistory`
- `js/pages/dashboard/data.js` — `saveSnapshot`
- `js/pages/dashboard/data.js` — `pickBaseline`
- `js/pages/dashboard/data.js` — `analyzePAR`
- `js/pages/dashboard/data.js` — `parseOfficeBreakdown`
- `js/pages/dashboard/data.js` — `bucketMonthly`
- `js/pages/dashboard/data.js` — `groupBy`
- `js/pages/dashboard/data.js` — `summarizeStatusMix`
- `js/pages/dashboard/data.js` — `sampleBalance`
- `js/pages/dashboard/data.js` — `sampleList`
- `js/pages/dashboard/data.js` — `sumFromSample`
- `js/pages/dashboard/data.js` — `fmt8`
- `js/pages/dashboard/data.js` — `loadCashActivity`
- `js/pages/dashboard/data.js` — `fmt8`
- `js/pages/dashboard/data.js` — `loadIncomeExpense`
- `js/pages/dashboard/data.js` — `loadLoansByOfficer`
- `js/pages/dashboard/index.js` — `canRead`
- `js/pages/dashboard/index.js` — `kpiEl`
- `js/pages/dashboard/index.js` — `setKpi`
- `js/pages/dashboard/index.js` — `approxBadge`
- `js/pages/dashboard/index.js` — `fmt8`
- `js/pages/dashboard/index.js` — `guarded`
- `js/pages/dashboard/index.js` — `val`
- `js/pages/dashboard/index.js` — `getLoanSample`
- `js/pages/dashboard/index.js` — `loadAll`
- `js/pages/dashboard/index.js` — `loadSavingsBalance`
- `js/pages/dashboard/index.js` — `deltaHtml`
- `js/pages/dashboard/shared.js` — `toJsDate`
- `js/pages/dashboard/shared.js` — `isoDay`
- `js/pages/datatables/actions.js` — `inputFor`
- `js/pages/datatables/actions.js` — `openDatatableEntryModal`
- `js/pages/datatables/actions.js` — `columnRow`
- `js/pages/datatables/actions.js` — `wireRowRemove`
- `js/pages/datatables/actions.js` — `openCreateDataTableModal`
- `js/pages/datatables/actions.js` — `openAddColumnModal`
- `js/pages/datatables/actions.js` — `openRegisterModal`
- `js/pages/datatables/detail.js` — `renderEntryRows`
- `js/pages/datatables/detail.js` — `loadEntries`
- `js/pages/datatables/detail.js` — `renderDetail`
- `js/pages/datatables/list.js` — `applyFilters`
- `js/pages/datatables/list.js` — `draw`
- `js/pages/datatables/list.js` — `renderList`
- `js/pages/datatables/shared.js` — `can`
- `js/pages/deposits/actions/charges.js` — `openApplyDepositChargeModal`
- `js/pages/deposits/actions/charges.js` — `openPayDepositChargeModal`
- `js/pages/deposits/actions/lifecycle.js` — `openDepositSimpleCmd`
- `js/pages/deposits/actions/lifecycle.js` — `openEditDepositModal`
- `js/pages/deposits/actions/lifecycle.js` — `openPrematureCloseModal`
- `js/pages/deposits/actions/transactions.js` — `exportDepositStatement`
- `js/pages/deposits/actions/transactions.js` — `openDepositTxModal`
- `js/pages/deposits/actions/transactions.js` — `openAdjustDepositTxModal`
- `js/pages/deposits/detail/closure.js` — `loadClosureCalculator`
- `js/pages/deposits/detail/index.js` — `calculator`
- `js/pages/deposits/detail/index.js` — `notes`
- `js/pages/deposits/detail/index.js` — `switchTab`
- `js/pages/deposits/detail/index.js` — `renderDetail`
- `js/pages/deposits/detail/notes-docs.js` — `loadDepositNotes`
- `js/pages/deposits/detail/notes-docs.js` — `loadDepositDocuments`
- `js/pages/deposits/detail/transactions.js` — `reload`
- `js/pages/deposits/detail/transactions.js` — `loadDepositTransactions`
- `js/pages/deposits/detail/transactions.js` — `loadDepositCharges`
- `js/pages/deposits/list.js` — `onChange`
- `js/pages/deposits/list.js` — `drawPagination`
- `js/pages/deposits/list.js` — `loadFD`
- `js/pages/deposits/list.js` — `loadRD`
- `js/pages/deposits/list.js` — `renderList`
- `js/pages/deposits/shared.js` — `can`
- `js/pages/groups/actions/lifecycle.js` — `openEditGroupModal`
- `js/pages/groups/actions/lifecycle.js` — `openCloseGroupModal`
- `js/pages/groups/actions/lifecycle.js` — `openAssignStaffModal`
- `js/pages/groups/actions/meetings.js` — `openScheduleMeetingModal`
- `js/pages/groups/actions/meetings.js` — `openAttendanceModal`
- `js/pages/groups/actions/members.js` — `reload`
- `js/pages/groups/actions/members.js` — `openGlimAccountData`
- `js/pages/groups/actions/members.js` — `openGlimDetailModal`
- `js/pages/groups/actions/members.js` — `openAssignRoleModal`
- `js/pages/groups/actions/members.js` — `refreshSelected`
- `js/pages/groups/actions/members.js` — `openAddMembersModal`
- `js/pages/groups/actions/members.js` — `openTransferMembersModal`
- `js/pages/groups/detail/index.js` — `meetings`
- `js/pages/groups/detail/index.js` — `notes`
- `js/pages/groups/detail/index.js` — `switchTab`
- `js/pages/groups/detail/index.js` — `renderDetail`
- `js/pages/groups/detail/meetings-charges.js` — `loadMeetings`
- `js/pages/groups/detail/meetings-charges.js` — `loadCharges`
- `js/pages/groups/detail/meetings-charges.js` — `loadStandingInstructions`
- `js/pages/groups/detail/members.js` — `loadMembers`
- `js/pages/groups/detail/members.js` — `loadRoles`
- `js/pages/groups/detail/members.js` — `sect`
- `js/pages/groups/detail/members.js` — `loadAccounts`
- `js/pages/groups/detail/notes-docs.js` — `loadNotes`
- `js/pages/groups/detail/notes-docs.js` — `loadDocuments`
- `js/pages/groups/list.js` — `onChange`
- `js/pages/groups/list.js` — `drawPagination`
- `js/pages/groups/list.js` — `draw`
- `js/pages/groups/list.js` — `renderList`
- `js/pages/groups/shared.js` — `can`
- `js/pages/interest-rate-charts.js` — `can`
- `js/pages/interest-rate-charts.js` — `renderList`
- `js/pages/interest-rate-charts.js` — `openChartModal`
- `js/pages/interest-rate-charts.js` — `loadSlabs`
- `js/pages/interest-rate-charts.js` — `renderChartDetail`
- `js/pages/interest-rate-charts.js` — `num_`
- `js/pages/interest-rate-charts.js` — `openSlabModal`
- `js/pages/interest-rate-charts.js` — `isoDate`
- `js/pages/interoperation.js` — `err`
- `js/pages/loans/actions/approval.js` — `openApproveModal`
- `js/pages/loans/actions/approval.js` — `openModifyApprovedAmountModal`
- `js/pages/loans/actions/approval.js` — `openApprovedAmountHistoryModal`
- `js/pages/loans/actions/approval.js` — `openAssignOfficerModal`
- `js/pages/loans/actions/charges.js` — `openApplyLoanChargeModal`
- `js/pages/loans/actions/charges.js` — `openPayLoanChargeModal`
- `js/pages/loans/actions/charges.js` — `openEditLoanChargeModal`
- `js/pages/loans/actions/charges.js` — `openAdjustLoanChargeModal`
- `js/pages/loans/actions/closure.js` — `openChargeOffModal`
- `js/pages/loans/actions/closure.js` — `openForecloseModal`
- `js/pages/loans/actions/closure.js` — `openCloseLoanModal`
- `js/pages/loans/actions/closure.js` — `openSimpleLoanCmdModal`
- `js/pages/loans/actions/collateral-guarantors.js` — `openAddLoanCollateralModal`
- `js/pages/loans/actions/collateral-guarantors.js` — `openEditLoanCollateralModal`
- `js/pages/loans/actions/collateral-guarantors.js` — `openAddGuarantorModal`
- `js/pages/loans/actions/collateral-guarantors.js` — `openEditGuarantorModal`
- `js/pages/loans/actions/collateral-guarantors.js` — `openAttachOriginatorModal`
- `js/pages/loans/actions/collateral-guarantors.js` — `openEAOTransferModal`
- `js/pages/loans/actions/disbursement.js` — `openModifyAvailableDisbursementAmountModal`
- `js/pages/loans/actions/disbursement.js` — `openDisburseModal`
- `js/pages/loans/actions/disbursement.js` — `openDisburseToSavingsModal`
- `js/pages/loans/actions/repayment.js` — `openWaiveInterestModal`
- `js/pages/loans/actions/repayment.js` — `openRecoverPaymentModal`
- `js/pages/loans/actions/repayment.js` — `openAdjustTransactionModal`
- `js/pages/loans/actions/repayment.js` — `openChargebackModal`
- `js/pages/loans/actions/repayment.js` — `apiCall`
- `js/pages/loans/actions/repayment.js` — `openGoodwillModal`
- `js/pages/loans/actions/repayment.js` — `apiCall`
- `js/pages/loans/actions/repayment.js` — `openChargeRefundModal`
- `js/pages/loans/actions/repayment.js` — `openSimpleTxModal`
- `js/pages/loans/actions/restructuring.js` — `buildPayload`
- `js/pages/loans/actions/restructuring.js` — `openReageModal`
- `js/pages/loans/actions/restructuring.js` — `buildPayload`
- `js/pages/loans/actions/restructuring.js` — `openReamortizeModal`
- `js/pages/loans/actions/restructuring.js` — `openTrancheEditorModal`
- `js/pages/loans/actions/restructuring.js` — `openBulkTrancheEditorModal`
- `js/pages/loans/actions/restructuring.js` — `openDelinquencyActionModal`
- `js/pages/loans/actions/schedule.js` — `renderScheduleTable`
- `js/pages/loans/detail/collateral-guarantors.js` — `loadLoanCollateral`
- `js/pages/loans/detail/collateral-guarantors.js` — `loadLoanGuarantors`
- `js/pages/loans/detail/collateral-guarantors.js` — `loadLoanOriginators`
- `js/pages/loans/detail/collateral-guarantors.js` — `loadLoanEAO`
- `js/pages/loans/detail/index.js` — `fmtCompact`
- `js/pages/loans/detail/index.js` — `nextRepayment`
- `js/pages/loans/detail/index.js` — `approvals`
- `js/pages/loans/detail/index.js` — `switchTab`
- `js/pages/loans/detail/index.js` — `renderDetail`
- `js/pages/loans/detail/index.js` — `exportScheduleCsv`
- `js/pages/loans/detail/lifecycle.js` — `loadLoanDelinquency`
- `js/pages/loans/detail/lifecycle.js` — `loadLoanReschedule`
- `js/pages/loans/detail/lifecycle.js` — `loadLoanBuyDown`
- `js/pages/loans/detail/notes-docs.js` — `loadLoanNotes`
- `js/pages/loans/detail/notes-docs.js` — `loadLoanDocuments`
- `js/pages/loans/detail/schedule.js` — `loadSchedule`
- `js/pages/loans/detail/schedule.js` — `loadOriginalSchedule`
- `js/pages/loans/detail/transactions.js` — `reload`
- `js/pages/loans/detail/transactions.js` — `loadLoanTransactions`
- `js/pages/loans/detail/transactions.js` — `loadLoanCharges`
- `js/pages/loans/detail/transactions.js` — `loadLoanDisbursements`
- `js/pages/loans/list.js` — `loanBadge`
- `js/pages/loans/list.js` — `compact`
- `js/pages/loans/list.js` — `setTxt`
- `js/pages/loans/list.js` — `loadKpis`
- `js/pages/loans/list.js` — `setTxt`
- `js/pages/loans/list.js` — `onChange`
- `js/pages/loans/list.js` — `drawPagination`
- `js/pages/loans/list.js` — `draw`
- `js/pages/loans/list.js` — `renderList`
- `js/pages/loans/new.js` — `stepper`
- `js/pages/loans/new.js` — `estMonthly`
- `js/pages/loans/new.js` — `capture`
- `js/pages/loans/new.js` — `wire`
- `js/pages/loans/new.js` — `renderNew`
- `js/pages/loans/shared.js` — `can`
- `js/pages/misc/profile.js` — `profile`
- `js/pages/misc/remittances.js` — `remittances`
- `js/pages/notifications/activity.js` — `loadMyActivity`
- `js/pages/notifications/audit.js` — `runAuditSearch`
- `js/pages/notifications/audit.js` — `loadAuditTrails`
- `js/pages/notifications/audit.js` — `openAuditDetailModal`
- `js/pages/notifications/feed.js` — `draw`
- `js/pages/notifications/feed.js` — `applyFilters`
- `js/pages/notifications/feed.js` — `loadNotifications`
- `js/pages/notifications/feed.js` — `buildEntityLink`
- `js/pages/notifications/shared.js` — `can`
- `js/pages/notifications/shared.js` — `timeAgo`
- `js/pages/notifications/shared.js` — `stopPolling`
- `js/pages/notifications/shared.js` — `startPolling`
- `js/pages/notifications/shared.js` — `setAutoRefresh`
- `js/pages/notifications/shared.js` — `setLastSeenNotifId`
- `js/pages/office-transactions.js` — `openModal`
- `js/pages/organization/actions/calendar.js` — `openHolidayModal`
- `js/pages/organization/actions/finance.js` — `openCurrencyEditModal`
- `js/pages/organization/actions/finance.js` — `openPaymentTypeModal`
- `js/pages/organization/actions/finance.js` — `openFundModal`
- `js/pages/organization/actions/integrations.js` — `openLoanOriginatorModal`
- `js/pages/organization/actions/integrations.js` — `openExternalAssetOwnerModal`
- `js/pages/organization/actions/integrations.js` — `openSmsCampaignModal`
- `js/pages/organization/actions/integrations.js` — `openEmailCampaignModal`
- `js/pages/organization/actions/offices-staff.js` — `openEditOfficeModal`
- `js/pages/organization/actions/offices-staff.js` — `openEditStaffModal`
- `js/pages/organization/actions/offices-staff.js` — `openAllocateCashierModal`
- `js/pages/organization/actions/offices-staff.js` — `openCashInModal`
- `js/pages/organization/actions/offices-staff.js` — `openSettleCashierModal`
- `js/pages/organization/actions/offices-staff.js` — `openEditTellerModal`
- `js/pages/organization/actions/offices-staff.js` — `openEditCashierModal`
- `js/pages/organization/actions/offices-staff.js` — `openCashierTransactionsModal`
- `js/pages/organization/actions/reporting.js` — `openAdhocQueryModal`
- `js/pages/organization/actions/reporting.js` — `openEntityDatatableCheckModal`
- `js/pages/organization/actions/si.js` — `openStandingInstructionModal`
- `js/pages/organization/index.js` — `loadOfficesSection`
- `js/pages/organization/index.js` — `loadHolidaysSection`
- `js/pages/organization/loaders/calendar.js` — `loadHolidays`
- `js/pages/organization/loaders/calendar.js` — `loadWorkingDays`
- `js/pages/organization/loaders/finance.js` — `loadCurrencies`
- `js/pages/organization/loaders/finance.js` — `loadPaymentTypes`
- `js/pages/organization/loaders/finance.js` — `loadFunds`
- `js/pages/organization/loaders/group-hierarchy.js` — `loadGroupHierarchy`
- `js/pages/organization/loaders/integrations/imports-sms.js` — `loadBulkImports`
- `js/pages/organization/loaders/integrations/imports-sms.js` — `loadEmailCampaigns`
- `js/pages/organization/loaders/integrations/imports-sms.js` — `loadSmsCampaigns`
- `js/pages/organization/loaders/integrations/loan-eao.js` — `loadLoanOriginators`
- `js/pages/organization/loaders/integrations/loan-eao.js` — `loadExternalAssetOwners`
- `js/pages/organization/loaders/offices-staff.js` — `loadOffices`
- `js/pages/organization/loaders/offices-staff.js` — `loadStaff`
- `js/pages/organization/loaders/offices-staff.js` — `loadTellers`
- `js/pages/organization/loaders/reporting.js` — `loadAdhocQueries`
- `js/pages/organization/loaders/reporting.js` — `loadEntityDatatableChecks`
- `js/pages/organization/loaders/si.js` — `loadStandingInstructions`
- `js/pages/organization/shared.js` — `can`
- `js/pages/products/actions/config.js` — `openTaxModal`
- `js/pages/products/actions/config.js` — `rangeRow`
- `js/pages/products/actions/config.js` — `wireRemove`
- `js/pages/products/actions/config.js` — `openDelinquencyModal`
- `js/pages/products/actions/config.js` — `openProductMixModal`
- `js/pages/products/actions/loan-products.js` — `setSel`
- `js/pages/products/actions/loan-products.js` — `openLoanProductModal`
- `js/pages/products/actions/loan-products.js` — `ratePeriodRow`
- `js/pages/products/actions/loan-products.js` — `wireRemove`
- `js/pages/products/actions/loan-products.js` — `openFloatingRateModal`
- `js/pages/products/actions/rates.js` — `openRateModal`
- `js/pages/products/actions/savings-products.js` — `termPeriods`
- `js/pages/products/actions/savings-products.js` — `chargeBoxes`
- `js/pages/products/actions/savings-products.js` — `setSel`
- `js/pages/products/actions/savings-products.js` — `openSavingsProductModal`
- `js/pages/products/actions/savings-products.js` — `setSel`
- `js/pages/products/actions/savings-products.js` — `openFDProductModal`
- `js/pages/products/actions/savings-products.js` — `setSel`
- `js/pages/products/actions/savings-products.js` — `openRDProductModal`
- `js/pages/products/actions/share-products.js` — `termPeriods`
- `js/pages/products/actions/share-products.js` — `marketRow`
- `js/pages/products/actions/share-products.js` — `wireMpRemove`
- `js/pages/products/actions/share-products.js` — `setSel`
- `js/pages/products/actions/share-products.js` — `openShareProductModal`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `reload`
- `js/pages/products/loaders.js` — `loadProductMixList`
- `js/pages/products/shared.js` — `can`
- `js/pages/products/shared.js` — `glOptions`
- `js/pages/products/shared.js` — `glSelect`
- `js/pages/products/shared.js` — `populateGl`
- `js/pages/products/shared.js` — `wizardModal`
- `js/pages/products/shared.js` — `vi`
- `js/pages/products/shared.js` — `vf`
- `js/pages/products/shared.js` — `vb`
- `js/pages/products/shared.js` — `resetGlCache`
- `js/pages/report-mailing.js` — `openJobModal`
- `js/pages/report-mailing.js` — `openHistory`
- `js/pages/reports/manage-reports.js` — `draw`
- `js/pages/reports/manage-reports.js` — `applyFilters`
- `js/pages/reports/manage-reports.js` — `loadManageReports`
- `js/pages/reports/manage-reports.js` — `openReportFormModal`
- `js/pages/reports/run-reports.js` — `draw`
- `js/pages/reports/run-reports.js` — `loadRunReports`
- `js/pages/reports/run-reports.js` — `openRunModal`
- `js/pages/reports/run-reports.js` — `runReport`
- `js/pages/reports/shared.js` — `can`
- `js/pages/reports/shared.js` — `getOffices`
- `js/pages/reports/shared.js` — `getStaff`
- `js/pages/reports/shared.js` — `getCurrencies`
- `js/pages/reports/shared.js` — `humanize`
- `js/pages/reports/shared.js` — `buildParamField`
- `js/pages/reports/shared.js` — `exportCSV`
- `js/pages/savings/actions/charges.js` — `openEditSavingsChargeModal`
- `js/pages/savings/actions/charges.js` — `openApplySavingsChargeModal`
- `js/pages/savings/actions/charges.js` — `openPaySavingsChargeModal`
- `js/pages/savings/actions/interest.js` — `openPostInterestAsOnModal`
- `js/pages/savings/actions/interest.js` — `openAnnualFeesModal`
- `js/pages/savings/actions/lifecycle.js` — `openSavingsSimpleCmd`
- `js/pages/savings/actions/lifecycle.js` — `openSavingsCloseModal`
- `js/pages/savings/actions/lifecycle.js` — `openEditSavingsModal`
- `js/pages/savings/actions/lifecycle.js` — `openApproveSavingsModal`
- `js/pages/savings/actions/lifecycle.js` — `openSavingsAssignStaffModal`
- `js/pages/savings/actions/statements.js` — `exportStatement`
- `js/pages/savings/actions/transactions.js` — `openSavingsTransactionDetailModal`
- `js/pages/savings/actions/transactions.js` — `openSavingsTransactionModal`
- `js/pages/savings/actions/transactions.js` — `openHoldModal`
- `js/pages/savings/actions/transactions.js` — `openAdjustSavingsTxModal`
- `js/pages/savings/detail/index.js` — `fmtCompact`
- `js/pages/savings/detail/index.js` — `switchTab`
- `js/pages/savings/detail/index.js` — `renderDetail`
- `js/pages/savings/detail/notes-docs.js` — `loadSavingsNotes`
- `js/pages/savings/detail/notes-docs.js` — `loadSavingsDocuments`
- `js/pages/savings/detail/si.js` — `loadSavingsSI`
- `js/pages/savings/detail/transactions.js` — `reload`
- `js/pages/savings/detail/transactions.js` — `loadSavingsTransactions`
- `js/pages/savings/detail/transactions.js` — `loadSavingsCharges`
- `js/pages/savings/detail/transactions.js` — `loadOnHoldFunds`
- `js/pages/savings/list.js` — `savingsBadge`
- `js/pages/savings/list.js` — `compact`
- `js/pages/savings/list.js` — `setTxt`
- `js/pages/savings/list.js` — `loadKpis`
- `js/pages/savings/list.js` — `onChange`
- `js/pages/savings/list.js` — `drawPagination`
- `js/pages/savings/list.js` — `draw`
- `js/pages/savings/list.js` — `renderList`
- `js/pages/savings/new.js` — `stepper`
- `js/pages/savings/new.js` — `capture`
- `js/pages/savings/new.js` — `wire`
- `js/pages/savings/new.js` — `renderNew`
- `js/pages/savings/shared.js` — `can`
- `js/pages/scheduler.js` — `loadStatus`
- `js/pages/scheduler.js` — `loadSteps`
- `js/pages/search.js` — `can`
- `js/pages/search.js` — `runSearch`
- `js/pages/search.js` — `drawResults`
- `js/pages/search.js` — `getResourceIcon`
- `js/pages/search.js` — `getResourceRoute`
- `js/pages/search.js` — `saveRecentSearch`
- `js/pages/search.js` — `renderRecentSearches`
- `js/pages/self-service/beneficiaries.js` — `loadBeneficiaries`
- `js/pages/self-service/beneficiaries.js` — `openBeneficiaryFormModal`
- `js/pages/self-service/portal-users.js` — `draw`
- `js/pages/self-service/portal-users.js` — `applyFilters`
- `js/pages/self-service/portal-users.js` — `loadPortalUsers`
- `js/pages/self-service/portal-users.js` — `openResetPortalPasswordModal`
- `js/pages/self-service/portal-users.js` — `openSelfServiceInfoModal`
- `js/pages/self-service/shared.js` — `can`
- `js/pages/shares/actions.js` — `openEditShareModal`
- `js/pages/shares/actions.js` — `openApplyAdditionalSharesModal`
- `js/pages/shares/actions.js` — `openRedeemSharesModal`
- `js/pages/shares/actions.js` — `openCloseShareModal`
- `js/pages/shares/actions.js` — `openShareSimpleCmd`
- `js/pages/shares/detail.js` — `dividends`
- `js/pages/shares/detail.js` — `notes`
- `js/pages/shares/detail.js` — `switchTab`
- `js/pages/shares/detail.js` — `renderDetail`
- `js/pages/shares/detail.js` — `loadShareRequests`
- `js/pages/shares/detail.js` — `loadShareCharges`
- `js/pages/shares/detail.js` — `reload`
- `js/pages/shares/detail.js` — `loadShareDividends`
- `js/pages/shares/detail.js` — `openDeclareDividendModal`
- `js/pages/shares/detail.js` — `loadShareNotes`
- `js/pages/shares/detail.js` — `loadShareDocuments`
- `js/pages/shares/list.js` — `onChange`
- `js/pages/shares/list.js` — `drawPagination`
- `js/pages/shares/list.js` — `draw`
- `js/pages/shares/list.js` — `renderList`
- `js/pages/shares/shared.js` — `can`
- `js/pages/surveys-spm.js` — `loadSurveys`
- `js/pages/surveys-spm.js` — `openScorecards`
- `js/pages/surveys-spm.js` — `buildPpiForm`
- `js/pages/surveys-spm.js` — `loadPpi`
- `js/pages/system/actions/audit.js` — `openEditJobModal`
- `js/pages/system/actions/audit.js` — `openAuditDetail`
- `js/pages/system/actions/config.js` — `openEditConfigModal`
- `js/pages/system/actions/config.js` — `openNewCodeModal`
- `js/pages/system/actions/config.js` — `reloadValues`
- `js/pages/system/actions/config.js` — `openCodeValuesModal`
- `js/pages/system/actions/config.js` — `openSetBusinessDateModal`
- `js/pages/system/actions/config.js` — `extractMCEntityGroup`
- `js/pages/system/actions/config.js` — `questionRow`
- `js/pages/system/actions/data-mgmt.js` — `openAccountNumberPrefModal`
- `js/pages/system/actions/data-mgmt.js` — `openEntityMappingDetail`
- `js/pages/system/actions/data-mgmt.js` — `wireRowRemove`
- `js/pages/system/actions/data-mgmt.js` — `slug`
- `js/pages/system/actions/data-mgmt.js` — `openSurveyFormModal`
- `js/pages/system/actions/integrations.js` — `viewServiceConfig`
- `js/pages/system/actions/integrations.js` — `cfgVal`
- `js/pages/system/actions/integrations.js` — `openWebhookModal`
- `js/pages/system/loaders/access.js` — `loadRoles`
- `js/pages/system/loaders/audit.js` — `loadAuditTrails`
- `js/pages/system/loaders/audit.js` — `loadJobs`
- `js/pages/system/loaders/config.js` — `loadConfigurations`
- `js/pages/system/loaders/config.js` — `loadCodes`
- `js/pages/system/loaders/config.js` — `loadMakerCheckerConfig`
- `js/pages/system/loaders/data-mgmt.js` — `loadAccountNumberPrefs`
- `js/pages/system/loaders/data-mgmt.js` — `loadEntityMappings`
- `js/pages/system/loaders/data-mgmt.js` — `loadSurveys`
- `js/pages/system/loaders/data-mgmt.js` — `loadMigrationLinks`
- `js/pages/system/loaders/info.js` — `loadSystemInfo`
- `js/pages/system/loaders/integrations.js` — `loadExternalServices`
- `js/pages/system/loaders/integrations.js` — `loadCOB`
- `js/pages/system/loaders/integrations.js` — `loadHooks`
- `js/pages/system/loaders/integrations.js` — `loadExternalEvents`
- `js/pages/system/loaders/oidc.js` — `loadTenantOidc`
- `js/pages/system/shared.js` — `can`
- `js/pages/tasks/checker-inbox.js` — `currentUser`
- `js/pages/tasks/checker-inbox.js` — `unwrap`
- `js/pages/tasks/checker-inbox.js` — `entityInfo`
- `js/pages/tasks/checker-inbox.js` — `parseCommand`
- `js/pages/tasks/checker-inbox.js` — `pickAmount`
- `js/pages/tasks/checker-inbox.js` — `pickTitle`
- `js/pages/tasks/checker-inbox.js` — `derivePriority`
- `js/pages/tasks/checker-inbox.js` — `timeAgo`
- `js/pages/tasks/checker-inbox.js` — `fmtCompact`
- `js/pages/tasks/checker-inbox.js` — `describeCheckerTask`
- `js/pages/tasks/checker-inbox.js` — `describeLoan`
- `js/pages/tasks/checker-inbox.js` — `describeDisbursement`
- `js/pages/tasks/checker-inbox.js` — `describeClient`
- `js/pages/tasks/checker-inbox.js` — `describeDeposit`
- `js/pages/tasks/checker-inbox.js` — `describeTreasuryExpense`
- `js/pages/tasks/checker-inbox.js` — `describeTreasuryBorrowing`
- `js/pages/tasks/checker-inbox.js` — `fetchTreasury`
- `js/pages/tasks/checker-inbox.js` — `draw`
- `js/pages/tasks/checker-inbox.js` — `applyFilters`
- `js/pages/tasks/checker-inbox.js` — `loadApprovalInbox`
- `js/pages/tasks/checker-inbox.js` — `refreshCounts`
- `js/pages/tasks/checker-inbox.js` — `dateBody`
- `js/pages/tasks/checker-inbox.js` — `approveTpl`
- `js/pages/tasks/checker-inbox.js` — `rejectTpl`
- `js/pages/tasks/checker-inbox.js` — `returnTpl`
- `js/pages/tasks/checker-inbox.js` — `routeTpl`
- `js/pages/tasks/checker-inbox.js` — `buildDecisions`
- `js/pages/tasks/checker-inbox.js` — `openTaskDetailModal`
- `js/pages/tasks/index.js` — `reportInboxError`
- `js/pages/tasks/shared.js` — `can`
- `js/pages/templates/actions.js` — `wireMapperRemove`
- `js/pages/templates/actions.js` — `openTemplateFormModal`
- `js/pages/templates/actions.js` — `mapperRow`
- `js/pages/templates/actions.js` — `openPreviewModal`
- `js/pages/templates/actions.js` — `renderMustache`
- `js/pages/templates/detail.js` — `renderDetail`
- `js/pages/templates/list.js` — `applyFilters`
- `js/pages/templates/list.js` — `draw`
- `js/pages/templates/list.js` — `renderList`
- `js/pages/templates/shared.js` — `can`
- `js/pages/transfers.js` — `loadClients`
- `js/pages/transfers.js` — `loadAccounts`
- `js/pages/transfers.js` — `openStandingInstructionModal`
- `js/pages/treasury/borrowings.js` — `reportActionError`
- `js/pages/treasury/borrowings.js` — `fundingSourceSelect`
- `js/pages/treasury/borrowings.js` — `borrowingRowsHtml`
- `js/pages/treasury/borrowings.js` — `detailRow`
- `js/pages/treasury/borrowings.js` — `detailCell`
- `js/pages/treasury/borrowings.js` — `scheduleRowsHtml`
- `js/pages/treasury/borrowings.js` — `toggleSchedule`
- `js/pages/treasury/borrowings.js` — `renderScheduleInto`
- `js/pages/treasury/borrowings.js` — `openDrawdownForm`
- `js/pages/treasury/borrowings.js` — `reloadList`
- `js/pages/treasury/borrowings.js` — `loadFormForOffice`
- `js/pages/treasury/borrowings.js` — `borrowings`
- `js/pages/treasury/cash-allocation.js` — `loadVaultStatus`
- `js/pages/treasury/cash-allocation.js` — `loadFormForOffice`
- `js/pages/treasury/cash-allocation.js` — `cashAllocation`
- `js/pages/treasury/dashboard.js` — `healthBannerHtml`
- `js/pages/treasury/dashboard.js` — `tile`
- `js/pages/treasury/dashboard.js` — `breakdownRowsHtml`
- `js/pages/treasury/dashboard.js` — `loadDashboardForOffice`
- `js/pages/treasury/expenses.js` — `currentUser`
- `js/pages/treasury/expenses.js` — `reportActionError`
- `js/pages/treasury/expenses.js` — `expenseRowsHtml`
- `js/pages/treasury/expenses.js` — `detailCell`
- `js/pages/treasury/expenses.js` — `detailRow`
- `js/pages/treasury/expenses.js` — `closeDetail`
- `js/pages/treasury/expenses.js` — `reloadList`
- `js/pages/treasury/expenses.js` — `wireRowActions`
- `js/pages/treasury/expenses.js` — `syncSource`
- `js/pages/treasury/expenses.js` — `openPayForm`
- `js/pages/treasury/expenses.js` — `loadFormForOffice`
- `js/pages/treasury/expenses.js` — `expenses`
- `js/pages/treasury/loan-disbursement.js` — `loanOptionsHtml`
- `js/pages/treasury/loan-disbursement.js` — `loadApprovedLoans`
- `js/pages/treasury/loan-disbursement.js` — `prefillAmount`
- `js/pages/treasury/loan-disbursement.js` — `loadFormForOffice`
- `js/pages/treasury/loan-disbursement.js` — `loanDisbursement`
- `js/pages/treasury/reconciliation.js` — `currentUser`
- `js/pages/treasury/reconciliation.js` — `reportActionError`
- `js/pages/treasury/reconciliation.js` — `varianceLabel`
- `js/pages/treasury/reconciliation.js` — `reconRowsHtml`
- `js/pages/treasury/reconciliation.js` — `detailRow`
- `js/pages/treasury/reconciliation.js` — `detailCell`
- `js/pages/treasury/reconciliation.js` — `openCountForm`
- `js/pages/treasury/reconciliation.js` — `wireRowActions`
- `js/pages/treasury/reconciliation.js` — `reloadList`
- `js/pages/treasury/reconciliation.js` — `loadFormForOffice`
- `js/pages/treasury/reconciliation.js` — `reconciliation`
- `js/pages/treasury/settings.js` — `canSaveThresholds`
- `js/pages/treasury/settings.js` — `loadFormForOffice`
- `js/pages/treasury/shared.js` — `officeOptionsHtml`
- `js/pages/treasury/shared.js` — `liquidityBadgeClass`
- `js/pages/treasury/shared.js` — `liquidityAccentClass`
- `js/pages/treasury/shared.js` — `matchBadgeClass`
- `js/pages/treasury/shared.js` — `glOptionsHtml`
- `js/pages/treasury/shared.js` — `statusBadgeClass`
- `js/pages/treasury/shared.js` — `fmtMoney`
- `js/pages/treasury/shared.js` — `tellerCashierOptionsHtml`
- `js/pages/treasury/shared.js` — `loadOfficeTellerCashierList`
- `js/pages/treasury/teller-console.js` — `eventRowsHtml`
- `js/pages/treasury/teller-console.js` — `toggleEventsRow`
- `js/pages/treasury/teller-console.js` — `loadConsoleForOffice`
- `js/pages/treasury/teller-console.js` — `tellerConsole`
- `js/pages/users/account/detail.js` — `renderUserDetail`
- `js/pages/users/account/detail.js` — `openUserFormModal`
- `js/pages/users/account/detail.js` — `openResetPasswordModal`
- `js/pages/users/account/list.js` — `draw`
- `js/pages/users/account/list.js` — `applyFilters`
- `js/pages/users/account/list.js` — `loadUsersList`
- `js/pages/users/roles.js` — `loadRoles`
- `js/pages/users/roles.js` — `openRoleFormModal`
- `js/pages/users/roles.js` — `updateCounts`
- `js/pages/users/roles.js` — `renderRoleDetail`
- `js/pages/users/roles.js` — `extractGroup`
- `js/pages/users/security.js` — `loadPasswordPolicy`
- `js/pages/users/security.js` — `loadTwoFactorConfig`
- `js/pages/users/shared.js` — `can`
- `js/treasury/bootstrap.js` — `currentTenantId`
- `js/treasury/bootstrap.js` — `ensureTreasuryDatatables`
- `js/treasury/bootstrap.js` — `seedTreasuryThresholds`
- `js/treasury/bootstrap.js` — `validateTreasuryConfiguration`
- `js/treasury/bootstrap.js` — `initializeTreasuryTenant`
- `js/treasury/bootstrap.js` — `_resetBootstrapCache`
- `js/treasury/borrowing-schedule.js` — `addMonthsIso`
- `js/treasury/borrowing-schedule.js` — `round2`
- `js/treasury/borrowing-schedule.js` — `generateBorrowingSchedule`
- `js/treasury/borrowing-schedule.js` — `generateFlatSchedule`
- `js/treasury/borrowing-schedule.js` — `generateReducingBalanceSchedule`
- `js/treasury/borrowings.js` — `round2`
- `js/treasury/borrowings.js` — `fundingGlAccountId`
- `js/treasury/borrowings.js` — `getBorrowing`
- `js/treasury/borrowings.js` — `getScheduleRow`
- `js/treasury/borrowings.js` — `deriveScheduleStatus`
- `js/treasury/borrowings.js` — `createBorrowing`
- `js/treasury/borrowings.js` — `postBorrowingDrawdown`
- `js/treasury/borrowings.js` — `accrueInterest`
- `js/treasury/borrowings.js` — `payBorrowingInterest`
- `js/treasury/borrowings.js` — `repayBorrowingPrincipal`
- `js/treasury/borrowings.js` — `getBorrowingsDashboard`
- `js/treasury/dashboard.js` — `orgBalanceOrNull`
- `js/treasury/dashboard.js` — `sumPendingExpenses`
- `js/treasury/dashboard.js` — `getTreasuryDashboard`
- `js/treasury/dashboard.js` — `round2`
- `js/treasury/errors.js` — `constructor`
- `js/treasury/expenses.js` — `getExpense`
- `js/treasury/expenses.js` — `assertStatus`
- `js/treasury/expenses.js` — `createExpenseRequest`
- `js/treasury/expenses.js` — `recordApproval`
- `js/treasury/expenses.js` — `approveExpense`
- `js/treasury/expenses.js` — `rejectExpense`
- `js/treasury/expenses.js` — `payExpense`
- `js/treasury/expenses.js` — `payFromTeller`
- `js/treasury/expenses.js` — `payFromBank`
- `js/treasury/health.js` — `requiredTableNames`
- `js/treasury/health.js` — `getTreasuryHealth`
- `js/treasury/liquidity-status.js` — `deriveLiquidityStatus`
- `js/treasury/loan-disbursement.js` — `isCashierActive`
- `js/treasury/loan-disbursement.js` — `fineractDateToIso`
- `js/treasury/loan-disbursement.js` — `alreadyDisbursedThroughTeller`
- `js/treasury/loan-disbursement.js` — `disburseLoanThroughCashier`
- `js/treasury/reconciliation.js` — `round2`
- `js/treasury/reconciliation.js` — `getReconciliation`
- `js/treasury/reconciliation.js` — `startDailyReconciliation`
- `js/treasury/reconciliation.js` — `submitPhysicalCashCount`
- `js/treasury/reconciliation.js` — `approveReconciliation`
- `js/treasury/segregation.js` — `norm`
- `js/treasury/segregation.js` — `assertDifferentActors`
- `js/treasury/segregation.js` — `assertThreeWaySeparation`
- `js/treasury/teller-balance.js` — `computeCashierExpectedBalance`
- `js/treasury/teller-balance.js` — `validateCashierCanPay`
- `js/treasury/teller-balance.js` — `compareCashierBalanceToFineract`
- `js/treasury/teller-balance.js` — `getOfficeTellerBreakdown`
- `js/treasury/teller-events.js` — `directionFor`
- `js/treasury/teller-events.js` — `assertRequired`
- `js/treasury/teller-events.js` — `recordTellerEvent`
- `js/treasury/teller-events.js` — `reverseTellerEvent`
- `js/treasury/teller-events.js` — `inRange`
- `js/treasury/teller-events.js` — `getCashierEvents`
- `js/treasury/teller-events.js` — `getTellerEvents`
- `js/treasury/teller-events.js` — `getOfficeTellerEvents`
- `js/treasury/thresholds.js` — `fromRow`
- `js/treasury/thresholds.js` — `getThresholds`
- `js/treasury/thresholds.js` — `upsertThresholds`
- `js/treasury/thresholds.js` — `requireThresholds`
- `js/treasury/vault-control.js` — `getVaultBalance`
- `js/treasury/vault-control.js` — `getReserveBuffer`
- `js/treasury/vault-control.js` — `validateVaultCanAllocate`
- `js/treasury/vault-control.js` — `allocateCashToCashier`
