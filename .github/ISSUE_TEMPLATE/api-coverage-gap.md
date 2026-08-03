---
name: API coverage gap / audit follow-up
about: Track a deferred module, or a module that was only spot-checked / unconfirmable
title: "[api-gap] <module or capability>"
labels: ["api-coverage", "audit"]
---

## Module / capability
<!-- e.g. js/api/organization.js, or "Working Capital Loans" -->

## Current status
<!-- Deferred | Spot-checked | Unconfirmable | Mixed — copy the matching line
     from OPEN-ITEMS.md -->

## What "done" means
- [ ] Diffed method-by-method against `fineract_api_raw.json` /
      `Apache_Fineract_API_Documentation.html`
- [ ] Any wrong path/method corrected
- [ ] Frontend surface wired (or explicitly marked won't-do with a reason)
- [ ] Ticked / removed in `OPEN-ITEMS.md`

## Source
<!-- OPEN-ITEMS.md section + relevant git commit(s) -->

## Notes
<!-- Op count, backend resource classes, roadmap decision, etc. -->
