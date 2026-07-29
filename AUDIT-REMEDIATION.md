# FinCraft Audit Remediation Register

This release hardens all frontend/deployment items that can be implemented in this repository. Runtime-only controls remain acceptance gates, not claims.

## Implemented
- **F-03/F-05:** checker permissions separated from maker/poster permissions; native maker-checker feed is available to entity checkers; self-approval and three-way expense payment separation are enforced in workflow code.
- **F-06:** OAuth access, refresh and ID tokens are memory-only; Bearer sessions are not restored from Web Storage. Basic must be disabled in production.
- **F-08:** enforceable CSP, frame/object/base restrictions, Permissions-Policy and secure response headers are defined for Netlify/nginx.
- **F-10/F-11:** mutable-branch polling is opt-in and disabled by default; image digest placeholders deliberately fail governance review until replaced with verified values.
- **F-12:** nginx verifies the upstream certificate against an internal CA.
- **F-15:** accessibility acceptance checklist and automated static checks are included.

## Backend/runtime acceptance gates
F-01/F-02 require a backend transaction/outbox or server-side idempotency implementation; a browser cannot make a Fineract post and a later datatable write atomic. F-04/F-09 require direct API role/office/tenant tests against the deployed Fineract tenant. F-07 requires deployed payload-based DAST in addition to repository escaping gates. F-13/F-16/F-17 require append-only centralized logging, restore drills, network egress controls and backend governance. These are documented in `deploy/PRODUCTION-ACCEPTANCE.md`; production approval must block until evidence is attached.
