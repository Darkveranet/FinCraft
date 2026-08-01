# FinCraft — Hand-written API ↔ Contract Drift

_Generated 2026-08-01T22:19:36.872Z_

Contract source: **sample-spec.json** · contract operations: **10** · hand-written routes: **904** (across 20 modules)

| Bucket | Count | Meaning |
|---|---:|---|
| ✅ Matched | 10 | hand-written route backed by a contract op |
| 🔴 Mismatch | 1 | same path, **wrong method/command** — likely a bug |
| 🟡 Unverified | 843 | hand-written route with no contract op (wrong route, or op absent from this spec) |
| ⚪ Uncovered | 0 | contract op no UI route calls yet |

> ⚠️ **This run used the bundled sample spec (6 paths), not the full Fineract surface.** Unverified/Uncovered counts are meaningless until the pipeline runs against the real `apache/fineract` image in CI. Treat only 🔴 **Mismatch** as actionable here.

## 🔴 Mismatches (method/command differs from contract)

| Hand-written | Location | Contract candidate(s) |
|---|---|---|
| `GET /loans` | loans.js:3 | `POST …` (calculateLoanScheduleOrSubmitLoanApplication) |

## 🟡 Unverified hand-written routes (843)

| Route | Location |
|---|---|
| `GET /journalentries` | accounting.js:3 |
| `GET /journalentries/{}` | accounting.js:4 |
| `GET /journalentries/provisioning` | accounting.js:5 |
| `GET /journalentries/openingbalance` | accounting.js:6 |
| `POST /journalentries` | accounting.js:7 |
| `POST /journalentries/{}?command=reverse` | accounting.js:8 |
| `GET /glaccounts` | accounting.js:14 |
| `GET /glaccounts/{}` | accounting.js:15 |
| `GET /glaccounts/template` | accounting.js:16 |
| `POST /glaccounts` | accounting.js:17 |
| `PUT /glaccounts/{}` | accounting.js:18 |
| `DELETE /glaccounts/{}` | accounting.js:19 |
| `GET /glclosures` | accounting.js:48 |
| `GET /glclosures/{}` | accounting.js:49 |
| `POST /glclosures` | accounting.js:50 |
| `PUT /glclosures/{}` | accounting.js:51 |
| `DELETE /glclosures/{}` | accounting.js:52 |
| `GET /accountingrules` | accounting.js:58 |
| `GET /accountingrules/{}` | accounting.js:59 |
| `GET /accountingrules/template` | accounting.js:60 |
| `POST /accountingrules` | accounting.js:61 |
| `PUT /accountingrules/{}` | accounting.js:62 |
| `DELETE /accountingrules/{}` | accounting.js:63 |
| `GET /provisioningentries` | accounting.js:69 |
| `GET /provisioningentries/entries` | accounting.js:70 |
| `GET /provisioningentries/{}` | accounting.js:71 |
| `GET /provisioningcriteria` | accounting.js:72 |
| `GET /provisioningcriteria/template` | accounting.js:73 |
| `GET /provisioningcriteria/{}` | accounting.js:74 |
| `POST /provisioningcriteria` | accounting.js:75 |
| `PUT /provisioningcriteria/{}` | accounting.js:76 |
| `DELETE /provisioningcriteria/{}` | accounting.js:77 |
| `POST /provisioningentries` | accounting.js:78 |
| `POST /provisioningentries/{}?command=createjournalentry` | accounting.js:79 |
| `POST /provisioningentries/{}?command=recreateprovisioningentry` | accounting.js:80 |
| `GET /provisioningcategory` | accounting.js:86 |
| `POST /provisioningcategory` | accounting.js:87 |
| `PUT /provisioningcategory/{}` | accounting.js:88 |
| `DELETE /provisioningcategory/{}` | accounting.js:89 |
| `POST /runaccruals` | accounting.js:95 |
| `POST /journalentries?command=defineOpeningBalance` | accounting.js:101 |
| `GET /financialactivityaccounts` | accounting.js:107 |
| `GET /financialactivityaccounts/{}` | accounting.js:108 |
| `GET /financialactivityaccounts/template` | accounting.js:109 |
| `POST /financialactivityaccounts` | accounting.js:110 |
| `PUT /financialactivityaccounts/{}` | accounting.js:111 |
| `DELETE /financialactivityaccounts/{}` | accounting.js:112 |
| `GET /taxes/component` | accounting.js:118 |
| `GET /taxes/component/{}` | accounting.js:119 |
| `GET /taxes/component/template` | accounting.js:120 |
| `POST /taxes/component` | accounting.js:121 |
| `PUT /taxes/component/{}` | accounting.js:122 |
| `GET /taxes/group` | accounting.js:128 |
| `GET /taxes/group/{}` | accounting.js:129 |
| `GET /taxes/group/template` | accounting.js:130 |
| `POST /taxes/group` | accounting.js:131 |
| `PUT /taxes/group/{}` | accounting.js:132 |
| `GET /users` | admin.js:3 |
| `GET /users/{}` | admin.js:4 |
| `GET /users/template` | admin.js:5 |
| `POST /users` | admin.js:6 |
| `PUT /users/{}` | admin.js:7 |
| `DELETE /users/{}` | admin.js:8 |
| `GET /roles` | admin.js:14 |
| `GET /roles/{}` | admin.js:15 |
| `POST /roles` | admin.js:16 |
| `PUT /roles/{}` | admin.js:17 |
| `DELETE /roles/{}` | admin.js:18 |
| `POST /roles/{}?command=enable` | admin.js:19 |
| `POST /roles/{}?command=disable` | admin.js:20 |
| `GET /roles/{}/permissions` | admin.js:21 |
| `PUT /roles/{}/permissions` | admin.js:22 |
| `GET /permissions` | admin.js:28 |
| `PUT /permissions` | admin.js:29 |
| `GET /jobs` | admin.js:35 |
| `GET /jobs/{}` | admin.js:36 |
| `PUT /jobs/{}` | admin.js:37 |
| `POST /jobs/{}?command=executeJob` | admin.js:38 |
| `GET /jobs/{}/runhistory` | admin.js:39 |
| `GET /jobs/names` | admin.js:40 |
| `GET /jobs/{}/available-steps` | admin.js:41 |
| `GET /jobs/{}/steps` | admin.js:42 |
| `PUT /jobs/{}/steps` | admin.js:43 |
| `POST /jobs/{}/inline` | admin.js:44 |
| `GET /jobs/short-name/{}` | admin.js:45 |
| `POST /jobs/short-name/{}` | admin.js:46 |
| `PUT /jobs/short-name/{}` | admin.js:47 |
| `GET /jobs/short-name/{}/runhistory` | admin.js:48 |
| `GET /audits` | admin.js:54 |
| `GET /audits/{}` | admin.js:55 |
| `GET /audits/searchtemplate` | admin.js:56 |
| `GET /makercheckers` | admin.js:62 |
| `GET /makercheckers/searchtemplate` | admin.js:63 |
| `POST /makercheckers/{}?command=approve` | admin.js:64 |
| `POST /makercheckers/{}?command=reject` | admin.js:65 |
| `DELETE /makercheckers/{}` | admin.js:66 |
| `GET /configurations` | admin.js:72 |
| `GET /configurations/name/{}` | admin.js:73 |
| `GET /configurations/{}` | admin.js:74 |
| `PUT /configurations/{}` | admin.js:75 |
| `PUT /configurations/name/{}` | admin.js:76 |
| `GET /caches` | admin.js:77 |
| `PUT /caches` | admin.js:78 |
| `GET /surveys` | admin.js:88 |
| `GET /surveys/{}` | admin.js:89 |
| `POST /surveys` | admin.js:90 |
| `PUT /surveys/{}` | admin.js:91 |
| `POST /surveys/{}?command=activate` | admin.js:92 |
| `POST /surveys/{}?command=deactivate` | admin.js:93 |
| `GET /entitytoentitymapping` | admin.js:99 |
| `GET /entitytoentitymapping/{}` | admin.js:100 |
| `GET /entitytoentitymapping/{}/{}/{}` | admin.js:101 |
| `POST /entitytoentitymapping/{}` | admin.js:102 |
| `PUT /entitytoentitymapping/{}` | admin.js:103 |
| `DELETE /entitytoentitymapping/{}` | admin.js:104 |
| `GET /scheduler` | admin.js:110 |
| `POST /scheduler?command=start` | admin.js:111 |
| `POST /scheduler?command=stop` | admin.js:112 |
| `POST /scheduler` | admin.js:113 |
| `PUT /instance-mode` | admin.js:119 |
| `GET /fieldconfiguration/{}` | admin.js:125 |
| `GET /accountnumberformats` | admin.js:131 |
| `GET /accountnumberformats/{}` | admin.js:132 |
| `GET /accountnumberformats/template` | admin.js:133 |
| `POST /accountnumberformats` | admin.js:134 |
| `PUT /accountnumberformats/{}` | admin.js:135 |
| `DELETE /accountnumberformats/{}` | admin.js:136 |
| `GET /userdetails` | auth-account.js:3 |
| `POST /password/forgot` | auth-account.js:9 |
| `POST /users/{}/pwd` | auth-account.js:10 |
| `GET /passwordpreferences` | auth-account.js:11 |
| `GET /passwordpreferences/template` | auth-account.js:12 |
| `PUT /passwordpreferences` | auth-account.js:13 |
| `GET /twofactor` | auth-account.js:19 |
| `POST /twofactor/invalidate` | auth-account.js:22 |
| `GET /twofactor/configure` | auth-account.js:24 |
| `PUT /twofactor/configure` | auth-account.js:25 |
| `GET /tenants/{}/oidc-config` | auth-account.js:32 |
| `POST /tenants/{}/oidc-config` | auth-account.js:33 |
| `PUT /tenants/{}/oidc-config` | auth-account.js:34 |
| `DELETE /tenants/{}/oidc-config` | auth-account.js:35 |
| `POST /clients/{}?command=activate` | clients.js:10 |
| `POST /clients/{}?command=close` | clients.js:11 |
| `POST /clients/{}?command=reject` | clients.js:12 |
| `POST /clients/{}?command=withdraw` | clients.js:13 |
| `POST /clients/{}?command=withdrawTransfer` | clients.js:14 |
| `POST /clients/{}?command=assignStaff` | clients.js:15 |
| `POST /clients/{}?command=unassignStaff` | clients.js:16 |
| `GET /clients/{}/collaterals` | clients.js:17 |
| `GET /clients/{}/collaterals/{}` | clients.js:18 |
| `GET /clients/{}/collaterals/template` | clients.js:19 |
| `POST /clients/{}/collaterals` | clients.js:20 |
| `PUT /clients/{}/collaterals/{}` | clients.js:21 |
| `DELETE /clients/{}/collaterals/{}` | clients.js:22 |
| `GET /clients/{}/transactions` | clients.js:23 |
| `GET /clients/{}/transactions/{}` | clients.js:24 |
| `POST /clients/{}/transactions/{}?command=undo` | clients.js:25 |
| `POST /clients/{}/charges/{}?command=waive` | clients.js:26 |
| `POST /clients/{}/charges/{}?command=paycharge` | clients.js:27 |
| `DELETE /clients/{}/charges/{}` | clients.js:28 |
| `GET /clients/{}/charges/template` | clients.js:29 |
| `GET /clients/{}/charges/{}` | clients.js:30 |
| `POST /clients/{}?command=reactivate` | clients.js:31 |
| `POST /clients/{}?command=proposeTransfer` | clients.js:32 |
| `POST /clients/{}?command=acceptTransfer` | clients.js:33 |
| `POST /clients/{}?command=rejectTransfer` | clients.js:34 |
| `GET /clients/{}/accounts` | clients.js:36 |
| `GET /clients/{}/charges` | clients.js:37 |
| `POST /clients/{}/charges` | clients.js:38 |
| `GET /clients/{}/identifiers` | clients.js:39 |
| `GET /clients/{}/identifiers/template` | clients.js:40 |
| `GET /clients/{}/identifiers/{}` | clients.js:41 |
| `POST /clients/{}/identifiers` | clients.js:42 |
| `PUT /clients/{}/identifiers/{}` | clients.js:43 |
| `DELETE /clients/{}/identifiers/{}` | clients.js:44 |
| `GET /client/{}/addresses` | clients.js:45 |
| `POST /client/{}/addresses` | clients.js:46 |
| `PUT /client/{}/addresses` | clients.js:47 |
| `GET /client/addresses/template` | clients.js:48 |
| `GET /clients/{}/familymembers` | clients.js:49 |
| `GET /clients/{}/familymembers/template` | clients.js:50 |
| `GET /clients/{}/familymembers/{}` | clients.js:51 |
| `POST /clients/{}/familymembers` | clients.js:52 |
| `PUT /clients/{}/familymembers/{}` | clients.js:53 |
| `DELETE /clients/{}/familymembers/{}` | clients.js:54 |
| `GET /clients/{}/obligeedetails` | clients.js:55 |
| `GET /clients/{}/transferproposaldate` | clients.js:56 |
| `GET /CreditBureauConfiguration` | credit-bureau.js:3 |
| `GET /CreditBureauConfiguration/organisationCreditBureau` | credit-bureau.js:4 |
| `PUT /CreditBureauConfiguration/organisationCreditBureau` | credit-bureau.js:5 |
| `POST /CreditBureauConfiguration/organisationCreditBureau/{}` | credit-bureau.js:7 |
| `GET /CreditBureauConfiguration/config/{}` | credit-bureau.js:9 |
| `POST /CreditBureauConfiguration/configuration/{}` | credit-bureau.js:10 |
| `PUT /CreditBureauConfiguration/configuration/{}` | credit-bureau.js:11 |
| `GET /CreditBureauConfiguration/loanProduct` | credit-bureau.js:13 |
| `GET /CreditBureauConfiguration/loanProduct/{}` | credit-bureau.js:14 |
| `GET /CreditBureauConfiguration/mappings` | credit-bureau.js:15 |
| `PUT /CreditBureauConfiguration/mappings` | credit-bureau.js:16 |
| `POST /CreditBureauConfiguration/mappings/{}` | credit-bureau.js:18 |
| `POST /creditBureauIntegration/creditReport` | credit-bureau.js:24 |
| …and 643 more | |
