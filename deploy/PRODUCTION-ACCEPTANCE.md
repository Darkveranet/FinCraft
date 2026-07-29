# Production Acceptance Gates

- [ ] OIDC and MFA enforced; Basic disabled
- [ ] Internal CA installed as `nginx-certs/internal-ca.pem`; upstream TLS check passes
- [ ] All image/plugin references replaced with verified immutable digests
- [ ] Mutable branch auto-update remains disabled
- [ ] Role matrix direct-API tests return 403 for unauthorized roles and offices
- [ ] Maker/checker/payer separation tested with real identities
- [ ] Durable server-side idempotency/outbox deployed for every multi-leg treasury workflow
- [ ] Posted datatable rows protected from update/delete and independently reconciled to GL
- [ ] Authenticated E2E, axe/WCAG, DAST, dependency, container and secret scans pass
- [ ] Backup restore drill meets approved RPO/RTO
- [ ] Audit events forwarded to append-only storage with alert tests
- [ ] Cross-tenant and cross-office negative tests pass
