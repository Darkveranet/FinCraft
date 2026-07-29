# FinCraft E2E Function Inventory

Generated: 2026-07-29T19:42:18.361Z

- Source files: 287
- Functions discovered: 1963
- Referenced by E2E specs: 423
- Not referenced by E2E specs: 1540

> REFERENCED is evidence of test ownership, not proof that every branch executed. PASS/FAIL comes from Playwright/JUnit results.

## Module summary

| Module | Functions | Referenced | Untested |
|---|---:|---:|---:|
| js/api/accounting.js | 71 | 36 | 35 |
| js/api/admin.js | 85 | 39 | 46 |
| js/api/auth-account.js | 20 | 6 | 14 |
| js/api/clients.js | 53 | 9 | 44 |
| js/api/core.js | 13 | 1 | 12 |
| js/api/credit-bureau.js | 19 | 0 | 19 |
| js/api/groups-centers.js | 54 | 25 | 29 |
| js/api/index.js | 2 | 0 | 2 |
| js/api/integrations.js | 68 | 38 | 30 |
| js/api/interest-rate-charts.js | 13 | 5 | 8 |
| js/api/interoperation.js | 17 | 0 | 17 |
| js/api/loans.js | 169 | 24 | 145 |
| js/api/misc.js | 78 | 32 | 46 |
| js/api/mix-xbrl.js | 5 | 1 | 4 |
| js/api/office-transactions.js | 5 | 3 | 2 |
| js/api/organization.js | 79 | 36 | 43 |
| js/api/products.js | 52 | 35 | 17 |
| js/api/report-mailing.js | 8 | 5 | 3 |
| js/api/reports.js | 43 | 19 | 24 |
| js/api/savings-deposits.js | 129 | 27 | 102 |
| js/api/shares.js | 24 | 8 | 16 |
| js/api/social-performance.js | 23 | 5 | 18 |
| js/api/treasury.js | 10 | 0 | 10 |
| js/pages/accounting/actions/balances.js | 2 | 0 | 2 |
| js/pages/accounting/actions/coa.js | 7 | 0 | 7 |
| js/pages/accounting/actions/journal.js | 6 | 0 | 6 |
| js/pages/accounting/actions/provisioning.js | 5 | 0 | 5 |
| js/pages/accounting/index.js | 1 | 1 | 0 |
| js/pages/accounting/loaders/coa.js | 8 | 0 | 8 |
| js/pages/accounting/loaders/period.js | 4 | 0 | 4 |
| js/pages/accounting/loaders/rules.js | 2 | 0 | 2 |
| js/pages/accounting/shared.js | 8 | 0 | 8 |
| js/pages/analytics.js | 11 | 1 | 10 |
| js/pages/centers/actions.js | 6 | 0 | 6 |
| js/pages/centers/detail.js | 13 | 1 | 12 |
| js/pages/centers/index.js | 1 | 1 | 0 |
| js/pages/centers/list.js | 5 | 1 | 4 |
| js/pages/centers/shared.js | 1 | 0 | 1 |
| js/pages/charges/actions.js | 1 | 0 | 1 |
| js/pages/charges/detail.js | 6 | 1 | 5 |
| js/pages/charges/index.js | 1 | 1 | 0 |
| js/pages/charges/list.js | 3 | 1 | 2 |
| js/pages/charges/shared.js | 1 | 0 | 1 |
| js/pages/clients/actions/charges.js | 2 | 0 | 2 |
| js/pages/clients/actions/identity.js | 7 | 0 | 7 |
| js/pages/clients/actions/lifecycle.js | 6 | 0 | 6 |
| js/pages/clients/detail/accounts.js | 7 | 0 | 7 |
| js/pages/clients/detail/identity.js | 6 | 0 | 6 |
| js/pages/clients/detail/index.js | 13 | 3 | 10 |
| js/pages/clients/detail/notes-docs.js | 4 | 0 | 4 |
| js/pages/clients/index.js | 1 | 1 | 0 |
| js/pages/clients/list.js | 5 | 0 | 5 |
| js/pages/clients/new.js | 11 | 2 | 9 |
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
| js/pages/deposits/detail/index.js | 7 | 1 | 6 |
| js/pages/deposits/detail/notes-docs.js | 2 | 0 | 2 |
| js/pages/deposits/detail/transactions.js | 3 | 0 | 3 |
| js/pages/deposits/index.js | 1 | 1 | 0 |
| js/pages/deposits/list.js | 5 | 0 | 5 |
| js/pages/deposits/shared.js | 1 | 0 | 1 |
| js/pages/groups/actions/lifecycle.js | 3 | 0 | 3 |
| js/pages/groups/actions/meetings.js | 2 | 0 | 2 |
| js/pages/groups/actions/members.js | 8 | 1 | 7 |
| js/pages/groups/detail/index.js | 9 | 2 | 7 |
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
| js/pages/loans/detail/index.js | 9 | 0 | 9 |
| js/pages/loans/detail/lifecycle.js | 3 | 0 | 3 |
| js/pages/loans/detail/notes-docs.js | 2 | 0 | 2 |
| js/pages/loans/detail/schedule.js | 2 | 0 | 2 |
| js/pages/loans/detail/transactions.js | 4 | 0 | 4 |
| js/pages/loans/index.js | 1 | 1 | 0 |
| js/pages/loans/list.js | 10 | 1 | 9 |
| js/pages/loans/new.js | 10 | 2 | 8 |
| js/pages/loans/shared.js | 1 | 0 | 1 |
| js/pages/misc/index.js | 1 | 1 | 0 |
| js/pages/misc/navigation.js | 1 | 1 | 0 |
| js/pages/misc/profile.js | 1 | 0 | 1 |
| js/pages/misc/remittances.js | 1 | 0 | 1 |
| js/pages/misc/settings.js | 1 | 0 | 1 |
| js/pages/mix-xbrl.js | 3 | 2 | 1 |
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
| js/pages/products/actions/loan-products.js | 6 | 0 | 6 |
| js/pages/products/actions/rates.js | 1 | 0 | 1 |
| js/pages/products/actions/savings-products.js | 9 | 0 | 9 |
| js/pages/products/actions/share-products.js | 5 | 0 | 5 |
| js/pages/products/index.js | 48 | 2 | 46 |
| js/pages/products/loaders.js | 1 | 0 | 1 |
| js/pages/products/shared.js | 12 | 0 | 12 |
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
| js/pages/savings/detail/index.js | 7 | 1 | 6 |
| js/pages/savings/detail/notes-docs.js | 2 | 0 | 2 |
| js/pages/savings/detail/si.js | 1 | 0 | 1 |
| js/pages/savings/detail/transactions.js | 4 | 0 | 4 |
| js/pages/savings/index.js | 1 | 1 | 0 |
| js/pages/savings/list.js | 9 | 1 | 8 |
| js/pages/savings/new.js | 9 | 2 | 7 |
| js/pages/savings/shared.js | 1 | 0 | 1 |
| js/pages/scheduler.js | 3 | 1 | 2 |
| js/pages/search.js | 8 | 1 | 7 |
| js/pages/self-service/beneficiaries.js | 2 | 0 | 2 |
| js/pages/self-service/index.js | 1 | 1 | 0 |
| js/pages/self-service/portal-users.js | 5 | 0 | 5 |
| js/pages/self-service/shared.js | 1 | 0 | 1 |
| js/pages/shares/actions.js | 5 | 0 | 5 |
| js/pages/shares/detail.js | 14 | 1 | 13 |
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
| js/pages/system/loaders/oidc.js | 2 | 0 | 2 |
| js/pages/system/shared.js | 1 | 0 | 1 |
| js/pages/tasks/checker-inbox.js | 31 | 0 | 31 |
| js/pages/tasks/index.js | 2 | 1 | 1 |
| js/pages/tasks/shared.js | 1 | 0 | 1 |
| js/pages/templates/actions.js | 5 | 0 | 5 |
| js/pages/templates/detail.js | 1 | 0 | 1 |
| js/pages/templates/index.js | 1 | 1 | 0 |
| js/pages/templates/list.js | 4 | 1 | 3 |
| js/pages/templates/shared.js | 1 | 0 | 1 |
| js/pages/transfers.js | 5 | 1 | 4 |
| js/pages/treasury/borrowings.js | 13 | 0 | 13 |
| js/pages/treasury/cash-allocation.js | 4 | 0 | 4 |
| js/pages/treasury/dashboard.js | 5 | 0 | 5 |
| js/pages/treasury/expenses.js | 13 | 0 | 13 |
| js/pages/treasury/index.js | 1 | 1 | 0 |
| js/pages/treasury/loan-disbursement.js | 6 | 0 | 6 |
| js/pages/treasury/reconciliation.js | 12 | 0 | 12 |
| js/pages/treasury/settings.js | 3 | 0 | 3 |
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
| js/treasury/borrowings.js | 12 | 0 | 12 |
| js/treasury/dashboard.js | 4 | 0 | 4 |
| js/treasury/errors.js | 1 | 0 | 1 |
| js/treasury/expenses.js | 9 | 0 | 9 |
| js/treasury/health.js | 2 | 0 | 2 |
| js/treasury/liquidity-status.js | 1 | 0 | 1 |
| js/treasury/loan-disbursement.js | 4 | 0 | 4 |
| js/treasury/reconciliation.js | 6 | 0 | 6 |
| js/treasury/segregation.js | 3 | 0 | 3 |
| js/treasury/teller-balance.js | 4 | 0 | 4 |
| js/treasury/teller-events.js | 8 | 0 | 8 |
| js/treasury/thresholds.js | 4 | 0 | 4 |
| js/treasury/vault-control.js | 4 | 0 | 4 |

## Untested functions

- `js/api/accounting.js` — `get`
- `js/api/accounting.js` — `provisioning`
- `js/api/accounting.js` — `openingBalances`
- `js/api/accounting.js` — `makeJournalEntriesAPI`
- `js/api/accounting.js` — `get`
- `js/api/accounting.js` — `getBalance`
- `js/api/accounting.js` — `listWithBalances`
- `js/api/accounting.js` — `computeOfficeBalance`
- `js/api/accounting.js` — `makeGlAccountsAPI`
- `js/api/accounting.js` — `get`
- `js/api/accounting.js` — `makeGlClosuresAPI`
- `js/api/accounting.js` — `get`
- `js/api/accounting.js` — `makeAccountingRulesAPI`
- `js/api/accounting.js` — `entriesFiltered`
- `js/api/accounting.js` — `getEntry`
- `js/api/accounting.js` — `criteria`
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
- `js/api/accounting.js` — `define`
- `js/api/accounting.js` — `makeOpeningBalancesAPI`
- `js/api/accounting.js` — `get`
- `js/api/accounting.js` — `makeFinancialActivityAccountsAPI`
- `js/api/accounting.js` — `get`
- `js/api/accounting.js` — `makeTaxComponentsAPI`
- `js/api/accounting.js` — `get`
- `js/api/accounting.js` — `makeTaxGroupsAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `makeUsersAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `enable`
- `js/api/admin.js` — `disable`
- `js/api/admin.js` — `updatePermissions`
- `js/api/admin.js` — `makeRolesAPI`
- `js/api/admin.js` — `makePermissionsAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `runJob`
- `js/api/admin.js` — `history`
- `js/api/admin.js` — `businessJobNames`
- `js/api/admin.js` — `availableSteps`
- `js/api/admin.js` — `steps`
- `js/api/admin.js` — `updateSteps`
- `js/api/admin.js` — `executeInline`
- `js/api/admin.js` — `getByShortName`
- `js/api/admin.js` — `executeByShortName`
- `js/api/admin.js` — `updateByShortName`
- `js/api/admin.js` — `historyByShortName`
- `js/api/admin.js` — `makeJobsAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `searchTemplate`
- `js/api/admin.js` — `makeAuditsAPI`
- `js/api/admin.js` — `approve`
- `js/api/admin.js` — `makeMakercheckerAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `getById`
- `js/api/admin.js` — `updateByName`
- `js/api/admin.js` — `cacheTypes`
- `js/api/admin.js` — `switchCache`
- `js/api/admin.js` — `makeConfigurationsAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `deactivate`
- `js/api/admin.js` — `makeSurveysAdminAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `getMapping`
- `js/api/admin.js` — `makeEntityToEntityMappingsAPI`
- `js/api/admin.js` — `start`
- `js/api/admin.js` — `stop`
- `js/api/admin.js` — `makeSchedulerAPI`
- `js/api/admin.js` — `makeInstanceModeAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `makeFieldConfigurationAPI`
- `js/api/admin.js` — `get`
- `js/api/admin.js` — `makeAccountNumberPreferencesAPI`
- `js/api/auth-account.js` — `makeUserDetailsAPI`
- `js/api/auth-account.js` — `forgot`
- `js/api/auth-account.js` — `change`
- `js/api/auth-account.js` — `preferences`
- `js/api/auth-account.js` — `preferencesTemplate`
- `js/api/auth-account.js` — `updatePreferences`
- `js/api/auth-account.js` — `makePasswordAPI`
- `js/api/auth-account.js` — `methods`
- `js/api/auth-account.js` — `validate`
- `js/api/auth-account.js` — `invalidate`
- `js/api/auth-account.js` — `get`
- `js/api/auth-account.js` — `makeTwoFactorAPI`
- `js/api/auth-account.js` — `get`
- `js/api/auth-account.js` — `makeTenantOidcAPI`
- `js/api/clients.js` — `get`
- `js/api/clients.js` — `close`
- `js/api/clients.js` — `withdraw`
- `js/api/clients.js` — `undoTransfer`
- `js/api/clients.js` — `assignStaff`
- `js/api/clients.js` — `unassignStaff`
- `js/api/clients.js` — `collateral`
- `js/api/clients.js` — `getCollateral`
- `js/api/clients.js` — `collateralTemplate`
- `js/api/clients.js` — `addCollateral`
- `js/api/clients.js` — `updateCollateral`
- `js/api/clients.js` — `deleteCollateral`
- `js/api/clients.js` — `transactions`
- `js/api/clients.js` — `getTransaction`
- `js/api/clients.js` — `undoTransaction`
- `js/api/clients.js` — `waiveCharge`
- `js/api/clients.js` — `payCharge`
- `js/api/clients.js` — `deleteCharge`
- `js/api/clients.js` — `chargeTemplate`
- `js/api/clients.js` — `getCharge`
- `js/api/clients.js` — `reactivate`
- `js/api/clients.js` — `transfer`
- `js/api/clients.js` — `acceptTransfer`
- `js/api/clients.js` — `rejectTransfer`
- `js/api/clients.js` — `addCharge`
- `js/api/clients.js` — `identifiers`
- `js/api/clients.js` — `identifierTemplate`
- `js/api/clients.js` — `getIdentifier`
- `js/api/clients.js` — `createIdentifier`
- `js/api/clients.js` — `updateIdentifier`
- `js/api/clients.js` — `deleteIdentifier`
- `js/api/clients.js` — `addresses`
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
- `js/api/core.js` — `reset`
- `js/api/core.js` — `onUnauthorized`
- `js/api/core.js` — `_url`
- `js/api/core.js` — `_headers`
- `js/api/core.js` — `_req`
- `js/api/core.js` — `_g`
- `js/api/core.js` — `_p`
- `js/api/core.js` — `_u`
- `js/api/core.js` — `_d`
- `js/api/core.js` — `auth`
- `js/api/core.js` — `any`
- `js/api/credit-bureau.js` — `getCreditBureau`
- `js/api/credit-bureau.js` — `organisationBureaus`
- `js/api/credit-bureau.js` — `updateOrganisationBureau`
- `js/api/credit-bureau.js` — `addOrganisationBureau`
- `js/api/credit-bureau.js` — `getConfiguration`
- `js/api/credit-bureau.js` — `createConfiguration`
- `js/api/credit-bureau.js` — `updateConfiguration`
- `js/api/credit-bureau.js` — `loanProducts`
- `js/api/credit-bureau.js` — `mappingByLoanProduct`
- `js/api/credit-bureau.js` — `mappings`
- `js/api/credit-bureau.js` — `updateMapping`
- `js/api/credit-bureau.js` — `createMapping`
- `js/api/credit-bureau.js` — `makeCreditBureauConfigAPI`
- `js/api/credit-bureau.js` — `fetchReport`
- `js/api/credit-bureau.js` — `addReport`
- `js/api/credit-bureau.js` — `saveReport`
- `js/api/credit-bureau.js` — `getSavedReport`
- `js/api/credit-bureau.js` — `deleteReport`
- `js/api/credit-bureau.js` — `makeCreditBureauIntegrationAPI`
- `js/api/groups-centers.js` — `get`
- `js/api/groups-centers.js` — `close`
- `js/api/groups-centers.js` — `assignStaff`
- `js/api/groups-centers.js` — `unassignStaff`
- `js/api/groups-centers.js` — `unassignStaffCommand`
- `js/api/groups-centers.js` — `assignRole`
- `js/api/groups-centers.js` — `updateRole`
- `js/api/groups-centers.js` — `unassignRole`
- `js/api/groups-centers.js` — `associateClients`
- `js/api/groups-centers.js` — `disassociateClients`
- `js/api/groups-centers.js` — `transferClients`
- `js/api/groups-centers.js` — `generateCollectionSheet`
- `js/api/groups-centers.js` — `saveCollectionSheet`
- `js/api/groups-centers.js` — `glimAccounts`
- `js/api/groups-centers.js` — `gsimAccounts`
- `js/api/groups-centers.js` — `makeGroupsAPI`
- `js/api/groups-centers.js` — `get`
- `js/api/groups-centers.js` — `close`
- `js/api/groups-centers.js` — `associateGroups`
- `js/api/groups-centers.js` — `disassociateGroups`
- `js/api/groups-centers.js` — `generateCollectionSheet`
- `js/api/groups-centers.js` — `saveCollectionSheet`
- `js/api/groups-centers.js` — `makeCentersAPI`
- `js/api/groups-centers.js` — `get`
- `js/api/groups-centers.js` — `makeCalendarsAPI`
- `js/api/groups-centers.js` — `get`
- `js/api/groups-centers.js` — `saveAttendance`
- `js/api/groups-centers.js` — `makeMeetingsAPI`
- `js/api/groups-centers.js` — `makeGroupLevelsAPI`
- `js/api/index.js` — `constructor`
- `js/api/index.js` — `configureAPI`
- `js/api/integrations.js` — `markAllRead`
- `js/api/integrations.js` — `makeNotificationsAPI`
- `js/api/integrations.js` — `get`
- `js/api/integrations.js` — `makeHooksAPI`
- `js/api/integrations.js` — `makeExternalServicesAPI`
- `js/api/integrations.js` — `configurations`
- `js/api/integrations.js` — `updateConfig`
- `js/api/integrations.js` — `makeExternalEventsAPI`
- `js/api/integrations.js` — `get`
- `js/api/integrations.js` — `close`
- `js/api/integrations.js` — `reactivate`
- `js/api/integrations.js` — `preview`
- `js/api/integrations.js` — `makeSmsCampaignsAPI`
- `js/api/integrations.js` — `get`
- `js/api/integrations.js` — `messagesByStatus`
- `js/api/integrations.js` — `makeSmsAPI`
- `js/api/integrations.js` — `get`
- `js/api/integrations.js` — `pending`
- `js/api/integrations.js` — `sent`
- `js/api/integrations.js` — `failed`
- `js/api/integrations.js` — `byStatus`
- `js/api/integrations.js` — `makeEmailAPI`
- `js/api/integrations.js` — `get`
- `js/api/integrations.js` — `templateDetail`
- `js/api/integrations.js` — `operate`
- `js/api/integrations.js` — `close`
- `js/api/integrations.js` — `reactivate`
- `js/api/integrations.js` — `preview`
- `js/api/integrations.js` — `makeEmailCampaignsAPI`
- `js/api/integrations.js` — `makeEmailConfigurationAPI`
- `js/api/interest-rate-charts.js` — `get`
- `js/api/interest-rate-charts.js` — `slabs`
- `js/api/interest-rate-charts.js` — `slabTemplate`
- `js/api/interest-rate-charts.js` — `getSlab`
- `js/api/interest-rate-charts.js` — `createSlab`
- `js/api/interest-rate-charts.js` — `updateSlab`
- `js/api/interest-rate-charts.js` — `deleteSlab`
- `js/api/interest-rate-charts.js` — `makeInterestRateChartsAPI`
- `js/api/interoperation.js` — `health`
- `js/api/interoperation.js` — `getAccount`
- `js/api/interoperation.js` — `accountIdentifiers`
- `js/api/interoperation.js` — `accountKyc`
- `js/api/interoperation.js` — `accountTransactions`
- `js/api/interoperation.js` — `getParty`
- `js/api/interoperation.js` — `registerParty`
- `js/api/interoperation.js` — `deleteParty`
- `js/api/interoperation.js` — `createQuote`
- `js/api/interoperation.js` — `createTransactionRequest`
- `js/api/interoperation.js` — `performTransfer`
- `js/api/interoperation.js` — `getQuote`
- `js/api/interoperation.js` — `getTransactionRequest`
- `js/api/interoperation.js` — `getTransfer`
- `js/api/interoperation.js` — `disburseLoan`
- `js/api/interoperation.js` — `loanRepayment`
- `js/api/interoperation.js` — `makeInteroperationAPI`
- `js/api/loans.js` — `get`
- `js/api/loans.js` — `getWithParams`
- `js/api/loans.js` — `approvalTemplate`
- `js/api/loans.js` — `approve`
- `js/api/loans.js` — `undoApproval`
- `js/api/loans.js` — `withdrawApplication`
- `js/api/loans.js` — `disburse`
- `js/api/loans.js` — `disburseToSavings`
- `js/api/loans.js` — `undoDisbursal`
- `js/api/loans.js` — `writeOff`
- `js/api/loans.js` — `chargeOff`
- `js/api/loans.js` — `undoChargeOff`
- `js/api/loans.js` — `close`
- `js/api/loans.js` — `closeAsRescheduled`
- `js/api/loans.js` — `foreclose`
- `js/api/loans.js` — `reage`
- `js/api/loans.js` — `reagePreview`
- `js/api/loans.js` — `undoReAge`
- `js/api/loans.js` — `reamortize`
- `js/api/loans.js` — `reamortizePreview`
- `js/api/loans.js` — `undoReAmortize`
- `js/api/loans.js` — `transactionTemplate`
- `js/api/loans.js` — `markAsFraud`
- `js/api/loans.js` — `recoverGuarantees`
- `js/api/loans.js` — `assignOfficer`
- `js/api/loans.js` — `removeOfficer`
- `js/api/loans.js` — `transactions`
- `js/api/loans.js` — `transaction`
- `js/api/loans.js` — `repay`
- `js/api/loans.js` — `prepayLoan`
- `js/api/loans.js` — `downPayment`
- `js/api/loans.js` — `recoverPayment`
- `js/api/loans.js` — `goodwillCredit`
- `js/api/loans.js` — `creditBalanceRefund`
- `js/api/loans.js` — `chargeRefund`
- `js/api/loans.js` — `interestPaymentWaiver`
- `js/api/loans.js` — `merchantIssued`
- `js/api/loans.js` — `payoutRefund`
- `js/api/loans.js` — `refundByCash`
- `js/api/loans.js` — `refundByTransfer`
- `js/api/loans.js` — `waiveInterest`
- `js/api/loans.js` — `chargebackTx`
- `js/api/loans.js` — `reverseTransaction`
- `js/api/loans.js` — `undoTransaction`
- `js/api/loans.js` — `adjustTransaction`
- `js/api/loans.js` — `undoWaiveCharge`
- `js/api/loans.js` — `modifyTransaction`
- `js/api/loans.js` — `schedule`
- `js/api/loans.js` — `originalSchedule`
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
- `js/api/loans.js` — `guarantors`
- `js/api/loans.js` — `guarantorTemplate`
- `js/api/loans.js` — `getGuarantor`
- `js/api/loans.js` — `guarantorAccountsTemplate`
- `js/api/loans.js` — `addGuarantor`
- `js/api/loans.js` — `updateGuarantor`
- `js/api/loans.js` — `deleteGuarantor`
- `js/api/loans.js` — `disbursement`
- `js/api/loans.js` — `updateDisbursement`
- `js/api/loans.js` — `editDisbursements`
- `js/api/loans.js` — `delinquency`
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
- `js/api/loans.js` — `reschedule`
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
- `js/api/loans.js` — `originators`
- `js/api/loans.js` — `attachOriginator`
- `js/api/loans.js` — `detachOriginator`
- `js/api/loans.js` — `bulkReassign`
- `js/api/loans.js` — `loanReassignTemplate`
- `js/api/loans.js` — `loanAtDate`
- `js/api/loans.js` — `glimAccounts`
- `js/api/loans.js` — `catchUp`
- `js/api/loans.js` — `isCatchUpRunning`
- `js/api/loans.js` — `oldestCobClosed`
- `js/api/loans.js` — `lockedAccounts`
- `js/api/loans.js` — `pointInTimeSearch`
- `js/api/loans.js` — `capitalizedIncomeAllocation`
- `js/api/loans.js` — `makeLoansAPI`
- `js/api/loans.js` — `get`
- `js/api/loans.js` — `makeLoanCollateralManagementAPI`
- `js/api/loans.js` — `bucketTemplate`
- `js/api/loans.js` — `get`
- `js/api/loans.js` — `ranges`
- `js/api/loans.js` — `range`
- `js/api/loans.js` — `createRange`
- `js/api/loans.js` — `updateRange`
- `js/api/loans.js` — `deleteRange`
- `js/api/loans.js` — `loanTagHistory`
- `js/api/loans.js` — `makeDelinquencyBucketsAPI`
- `js/api/loans.js` — `get`
- `js/api/loans.js` — `makeLoanOriginatorsAPI`
- `js/api/loans.js` — `journalEntries`
- `js/api/loans.js` — `ownerJournalEntriesByExternalId`
- `js/api/loans.js` — `transfers`
- `js/api/loans.js` — `activeTransfer`
- `js/api/loans.js` — `loanProductAttributes`
- `js/api/loans.js` — `createLoanProductAttribute`
- `js/api/loans.js` — `updateLoanProductAttribute`
- `js/api/loans.js` — `transferAsset`
- `js/api/loans.js` — `search`
- `js/api/loans.js` — `makeExternalAssetOwnersAPI`
- `js/api/loans.js` — `get`
- `js/api/loans.js` — `makeCollateralManagementAPI`
- `js/api/misc.js` — `listByAppliesTo`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `makeChargesAPI`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `templateForEdit`
- `js/api/misc.js` — `preview`
- `js/api/misc.js` — `makeTemplatesAPI`
- `js/api/misc.js` — `register`
- `js/api/misc.js` — `resetPassword`
- `js/api/misc.js` — `beneficiaries`
- `js/api/misc.js` — `addBeneficiary`
- `js/api/misc.js` — `updateBeneficiary`
- `js/api/misc.js` — `deleteBeneficiary`
- `js/api/misc.js` — `makeSelfServiceAPI`
- `js/api/misc.js` — `search`
- `js/api/misc.js` — `advanced`
- `js/api/misc.js` — `makeSearchAPI`
- `js/api/misc.js` — `submit`
- `js/api/misc.js` — `makeBatchAPI`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `download`
- `js/api/misc.js` — `upload`
- `js/api/misc.js` — `makeDocumentsAPI`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `upload`
- `js/api/misc.js` — `makeImagesAPI`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `makeNotesAPI`
- `js/api/misc.js` — `refund`
- `js/api/misc.js` — `refundTemplate`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `operate`
- `js/api/misc.js` — `makeTransfersAPI`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `history`
- `js/api/misc.js` — `makeStandingInstructionsAPI`
- `js/api/misc.js` — `configurations`
- `js/api/misc.js` — `updateConfig`
- `js/api/misc.js` — `get`
- `js/api/misc.js` — `getByType`
- `js/api/misc.js` — `catchUp`
- `js/api/misc.js` — `makeCobAPI`
- `js/api/misc.js` — `upload`
- `js/api/misc.js` — `outputTemplateLocation`
- `js/api/misc.js` — `outputTemplate`
- `js/api/misc.js` — `makeBulkImportsAPI`
- `js/api/mix-xbrl.js` — `taxonomies`
- `js/api/mix-xbrl.js` — `mapping`
- `js/api/mix-xbrl.js` — `updateMapping`
- `js/api/mix-xbrl.js` — `makeMixXbrlAPI`
- `js/api/office-transactions.js` — `transfer`
- `js/api/office-transactions.js` — `makeOfficeTransactionsAPI`
- `js/api/organization.js` — `get`
- `js/api/organization.js` — `makeOfficesAPI`
- `js/api/organization.js` — `get`
- `js/api/organization.js` — `makeStaffAPI`
- `js/api/organization.js` — `allCashiers`
- `js/api/organization.js` — `get`
- `js/api/organization.js` — `cashiers`
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
- `js/api/organization.js` — `transactions`
- `js/api/organization.js` — `getTransaction`
- `js/api/organization.js` — `journals`
- `js/api/organization.js` — `makeTellersAPI`
- `js/api/organization.js` — `makeTellerJournalAPI`
- `js/api/organization.js` — `get`
- `js/api/organization.js` — `makeHolidaysAPI`
- `js/api/organization.js` — `get`
- `js/api/organization.js` — `makeWorkingDaysAPI`
- `js/api/organization.js` — `get`
- `js/api/organization.js` — `makeFundsAPI`
- `js/api/organization.js` — `get`
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
- `js/api/organization.js` — `get`
- `js/api/organization.js` — `makePaymentTypesAPI`
- `js/api/products.js` — `basicDetails`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeLoanProductsAPI`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeSavingsProductsAPI`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeShareProductsAPI`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeFdProductsAPI`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeRdProductsAPI`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeProductMixAPI`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeFloatingRatesAPI`
- `js/api/products.js` — `get`
- `js/api/products.js` — `makeRatesAPI`
- `js/api/report-mailing.js` — `get`
- `js/api/report-mailing.js` — `runHistory`
- `js/api/report-mailing.js` — `makeReportMailingJobsAPI`
- `js/api/reports.js` — `get`
- `js/api/reports.js` — `makeReportsAPI`
- `js/api/reports.js` — `availableExports`
- `js/api/reports.js` — `makeRunReportsAPI`
- `js/api/reports.js` — `get`
- `js/api/reports.js` — `save`
- `js/api/reports.js` — `makeCollectionSheetAPI`
- `js/api/reports.js` — `get`
- `js/api/reports.js` — `runAll`
- `js/api/reports.js` — `makeAdhocQueriesAPI`
- `js/api/reports.js` — `makeEntityDatatableChecksAPI`
- `js/api/reports.js` — `get`
- `js/api/reports.js` — `register`
- `js/api/reports.js` — `deregister`
- `js/api/reports.js` — `query`
- `js/api/reports.js` — `updateSchema`
- `js/api/reports.js` — `deleteTable`
- `js/api/reports.js` — `createEntry`
- `js/api/reports.js` — `getEntry`
- `js/api/reports.js` — `updateEntryOneToMany`
- `js/api/reports.js` — `deleteEntry`
- `js/api/reports.js` — `advancedQuery`
- `js/api/reports.js` — `advancedQueryPost`
- `js/api/reports.js` — `makeDataTablesAPI`
- `js/api/savings-deposits.js` — `get`
- `js/api/savings-deposits.js` — `createGsim`
- `js/api/savings-deposits.js` — `updateGsim`
- `js/api/savings-deposits.js` — `gsimCommand`
- `js/api/savings-deposits.js` — `approve`
- `js/api/savings-deposits.js` — `undoApproval`
- `js/api/savings-deposits.js` — `withdrawApplication`
- `js/api/savings-deposits.js` — `withdrawal`
- `js/api/savings-deposits.js` — `deposit`
- `js/api/savings-deposits.js` — `holdAmount`
- `js/api/savings-deposits.js` — `releaseAmount`
- `js/api/savings-deposits.js` — `reverseTransaction`
- `js/api/savings-deposits.js` — `close`
- `js/api/savings-deposits.js` — `postInterest`
- `js/api/savings-deposits.js` — `calculateInterest`
- `js/api/savings-deposits.js` — `block`
- `js/api/savings-deposits.js` — `unblock`
- `js/api/savings-deposits.js` — `blockDebit`
- `js/api/savings-deposits.js` — `unblockDebit`
- `js/api/savings-deposits.js` — `blockCredit`
- `js/api/savings-deposits.js` — `unblockCredit`
- `js/api/savings-deposits.js` — `applyAnnualFees`
- `js/api/savings-deposits.js` — `postInterestAsOn`
- `js/api/savings-deposits.js` — `onHoldTransactions`
- `js/api/savings-deposits.js` — `assignStaff`
- `js/api/savings-deposits.js` — `unassignStaff`
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
- `js/api/savings-deposits.js` — `transactions`
- `js/api/savings-deposits.js` — `transactionTemplate`
- `js/api/savings-deposits.js` — `getTransaction`
- `js/api/savings-deposits.js` — `searchTransactions`
- `js/api/savings-deposits.js` — `queryTransactions`
- `js/api/savings-deposits.js` — `makeSavingsAPI`
- `js/api/savings-deposits.js` — `get`
- `js/api/savings-deposits.js` — `calculateInterestPreview`
- `js/api/savings-deposits.js` — `approve`
- `js/api/savings-deposits.js` — `undoApproval`
- `js/api/savings-deposits.js` — `withdrawApplication`
- `js/api/savings-deposits.js` — `premature`
- `js/api/savings-deposits.js` — `close`
- `js/api/savings-deposits.js` — `prematureTemplate`
- `js/api/savings-deposits.js` — `closeTemplate`
- `js/api/savings-deposits.js` — `withdrawalTemplate`
- `js/api/savings-deposits.js` — `calculateInterest`
- `js/api/savings-deposits.js` — `postInterest`
- `js/api/savings-deposits.js` — `transactions`
- `js/api/savings-deposits.js` — `transaction`
- `js/api/savings-deposits.js` — `transactionTemplate`
- `js/api/savings-deposits.js` — `deposit`
- `js/api/savings-deposits.js` — `withdrawal`
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
- `js/api/savings-deposits.js` — `get`
- `js/api/savings-deposits.js` — `approve`
- `js/api/savings-deposits.js` — `undoApproval`
- `js/api/savings-deposits.js` — `withdrawApplication`
- `js/api/savings-deposits.js` — `premature`
- `js/api/savings-deposits.js` — `updateDepositAmount`
- `js/api/savings-deposits.js` — `close`
- `js/api/savings-deposits.js` — `prematureTemplate`
- `js/api/savings-deposits.js` — `closeTemplate`
- `js/api/savings-deposits.js` — `withdrawalTemplate`
- `js/api/savings-deposits.js` — `calculateInterest`
- `js/api/savings-deposits.js` — `postInterest`
- `js/api/savings-deposits.js` — `transactions`
- `js/api/savings-deposits.js` — `transaction`
- `js/api/savings-deposits.js` — `transactionTemplate`
- `js/api/savings-deposits.js` — `deposit`
- `js/api/savings-deposits.js` — `withdrawal`
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
- `js/api/shares.js` — `get`
- `js/api/shares.js` — `approve`
- `js/api/shares.js` — `undoApproval`
- `js/api/shares.js` — `withdrawApplication`
- `js/api/shares.js` — `close`
- `js/api/shares.js` — `applyAdditional`
- `js/api/shares.js` — `redeem`
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
- `js/api/social-performance.js` — `get`
- `js/api/social-performance.js` — `register`
- `js/api/social-performance.js` — `createEntry`
- `js/api/social-performance.js` — `clientOverview`
- `js/api/social-performance.js` — `getEntry`
- `js/api/social-performance.js` — `deleteEntry`
- `js/api/social-performance.js` — `makeSurveyDataAPI`
- `js/api/social-performance.js` — `get`
- `js/api/social-performance.js` — `makeLikelihoodAPI`
- `js/api/social-performance.js` — `get`
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
- `js/pages/accounting/shared.js` — `v`
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
- `js/pages/centers/detail.js` — `collection`
- `js/pages/centers/detail.js` — `notes`
- `js/pages/centers/detail.js` — `documents`
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
- `js/pages/charges/detail.js` — `tax`
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
- `js/pages/clients/detail/index.js` — `transactions`
- `js/pages/clients/detail/index.js` — `si`
- `js/pages/clients/detail/index.js` — `collateral`
- `js/pages/clients/detail/index.js` — `documents`
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
- `js/pages/clients/new.js` — `dash`
- `js/pages/clients/new.js` — `captureStep`
- `js/pages/clients/new.js` — `validateStep`
- `js/pages/clients/new.js` — `wire`
- `js/pages/clients/new.js` — `submit`
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
- `js/pages/deposits/detail/index.js` — `transactions`
- `js/pages/deposits/detail/index.js` — `calculator`
- `js/pages/deposits/detail/index.js` — `notes`
- `js/pages/deposits/detail/index.js` — `documents`
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
- `js/pages/groups/detail/index.js` — `members`
- `js/pages/groups/detail/index.js` — `meetings`
- `js/pages/groups/detail/index.js` — `si`
- `js/pages/groups/detail/index.js` — `notes`
- `js/pages/groups/detail/index.js` — `documents`
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
- `js/pages/loans/detail/index.js` — `schedule`
- `js/pages/loans/detail/index.js` — `credit`
- `js/pages/loans/detail/index.js` — `approvals`
- `js/pages/loans/detail/index.js` — `documents`
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
- `js/pages/loans/new.js` — `dash`
- `js/pages/loans/new.js` — `capture`
- `js/pages/loans/new.js` — `validate`
- `js/pages/loans/new.js` — `wire`
- `js/pages/loans/new.js` — `submit`
- `js/pages/loans/new.js` — `renderNew`
- `js/pages/loans/shared.js` — `can`
- `js/pages/misc/profile.js` — `profile`
- `js/pages/misc/remittances.js` — `remittances`
- `js/pages/misc/settings.js` — `settings`
- `js/pages/mix-xbrl.js` — `tax`
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
- `js/pages/products/actions/loan-products.js` — `opt`
- `js/pages/products/actions/loan-products.js` — `setSel`
- `js/pages/products/actions/loan-products.js` — `openLoanProductModal`
- `js/pages/products/actions/loan-products.js` — `ratePeriodRow`
- `js/pages/products/actions/loan-products.js` — `wireRemove`
- `js/pages/products/actions/loan-products.js` — `openFloatingRateModal`
- `js/pages/products/actions/rates.js` — `openRateModal`
- `js/pages/products/actions/savings-products.js` — `opt`
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
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `fn`
- `js/pages/products/index.js` — `row`
- `js/pages/products/index.js` — `newFn`
- `js/pages/products/index.js` — `editFn`
- `js/pages/products/index.js` — `deleteFn`
- `js/pages/products/index.js` — `reload`
- `js/pages/products/loaders.js` — `loadProductMixList`
- `js/pages/products/shared.js` — `can`
- `js/pages/products/shared.js` — `glOptions`
- `js/pages/products/shared.js` — `glSelect`
- `js/pages/products/shared.js` — `populateGl`
- `js/pages/products/shared.js` — `modal`
- `js/pages/products/shared.js` — `show`
- `js/pages/products/shared.js` — `wizardModal`
- `js/pages/products/shared.js` — `v`
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
- `js/pages/savings/detail/index.js` — `transactions`
- `js/pages/savings/detail/index.js` — `si`
- `js/pages/savings/detail/index.js` — `documents`
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
- `js/pages/savings/new.js` — `dash`
- `js/pages/savings/new.js` — `capture`
- `js/pages/savings/new.js` — `validate`
- `js/pages/savings/new.js` — `wire`
- `js/pages/savings/new.js` — `submit`
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
- `js/pages/shares/detail.js` — `requests`
- `js/pages/shares/detail.js` — `dividends`
- `js/pages/shares/detail.js` — `notes`
- `js/pages/shares/detail.js` — `documents`
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
- `js/pages/system/loaders/oidc.js` — `v`
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
- `js/pages/tasks/checker-inbox.js` — `add`
- `js/pages/tasks/checker-inbox.js` — `open`
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
- `js/pages/tasks/checker-inbox.js` — `close`
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
- `js/pages/transfers.js` — `opt`
- `js/pages/transfers.js` — `loadClients`
- `js/pages/transfers.js` — `loadAccounts`
- `js/pages/transfers.js` — `openStandingInstructionModal`
- `js/pages/treasury/borrowings.js` — `today`
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
- `js/pages/treasury/cash-allocation.js` — `today`
- `js/pages/treasury/cash-allocation.js` — `loadVaultStatus`
- `js/pages/treasury/cash-allocation.js` — `loadFormForOffice`
- `js/pages/treasury/cash-allocation.js` — `cashAllocation`
- `js/pages/treasury/dashboard.js` — `healthBannerHtml`
- `js/pages/treasury/dashboard.js` — `tile`
- `js/pages/treasury/dashboard.js` — `breakdownRowsHtml`
- `js/pages/treasury/dashboard.js` — `loadDashboardForOffice`
- `js/pages/treasury/dashboard.js` — `dashboard`
- `js/pages/treasury/expenses.js` — `today`
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
- `js/pages/treasury/loan-disbursement.js` — `today`
- `js/pages/treasury/loan-disbursement.js` — `loanOptionsHtml`
- `js/pages/treasury/loan-disbursement.js` — `loadApprovedLoans`
- `js/pages/treasury/loan-disbursement.js` — `prefillAmount`
- `js/pages/treasury/loan-disbursement.js` — `loadFormForOffice`
- `js/pages/treasury/loan-disbursement.js` — `loanDisbursement`
- `js/pages/treasury/reconciliation.js` — `today`
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
- `js/pages/treasury/settings.js` — `settings`
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
- `js/treasury/borrowings.js` — `today`
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
- `js/treasury/reconciliation.js` — `today`
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
