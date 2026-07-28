---
name: API coverage gap / audit follow-up
about: Track a deferred module, or a module that was only spot-checked / unconfirmable
title: "[api-gap] <module or capability>"
labels: ["api-coverage", "audit"]
---

## Module / capability
<!-- e.g. js/api/organization.js, or "Working Capital Loans" -->

## Current status
<!-- Deferred | Spot-checked | Unconfirmable | Mixed — copy the row from
     fixlogs/FIXLOG-full-api-audit-consolidated.md -->

## What "done" means
- [ ] Diffed method-by-method against `fineract_api_raw.json` /
      `Apache_Fineract_API_Documentation.html`
- [ ] Any wrong path/method corrected (see §2 "Used Incorrectly" table for the pattern)
- [ ] Frontend surface wired (or explicitly marked won't-do with a reason)
- [ ] Removed from `OPEN-ITEMS.md`

## Fixlog / source
<!-- Link the relevant fixlogs/*.md -->

## Notes
<!-- Op count, backend resource classes, roadmap decision, etc. -->
