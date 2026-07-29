# Isolated transactional E2E

This suite targets a disposable Apache Fineract instance started inside GitHub Actions. It never permits transactional execution against public Mifos hosts.

Implemented real-write gate:
- create active client;
- retrieve and verify the client through Fineract;
- open the created client through FinCraft;
- update and re-read the client;
- verify all core platform endpoints;
- render every authorized FinCraft route;
- ensure every `js/api` module has E2E ownership in the coverage manifest.

The manifest distinguishes infrastructure/API-surface coverage from completed lifecycle coverage. A module is not release-certified merely because its route renders. Further loan, savings, accounting, maker-checker and Treasury lifecycle scenarios must be added as independent specs and changed to completed status only after CI proves them.

## Function inventory and honest status

The workflow now scans all functions under `js/api`, `js/pages`, and `js/treasury` and emits both JSON and Markdown inventories. The report labels functions as `REFERENCED` or `UNTESTED`; Playwright results separately show `PASSED` or `FAILED`. This deliberately prevents an untested command from being mistaken for a working command.
