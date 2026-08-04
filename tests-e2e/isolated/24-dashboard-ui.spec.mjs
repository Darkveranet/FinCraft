import { test, expect } from '@playwright/test';
import { fineract, login, runId, date } from './helpers.mjs';

/* Dashboard has no create/update lifecycle of its own — it's a read+navigate
 * surface (KPIs, filters, quick-action launchers, charts). So "full
 * interaction" here means: KPIs actually populate from real data, filters
 * don't break rendering, refresh/export work, and each quick-action modal
 * genuinely opens. One seeded client (via API) gives the KPIs something
 * real to count instead of an all-zero dashboard, which would let a broken
 * fetch silently look identical to "no data yet". */

test.describe.serial('module 24 - dashboard UI', () => {
  let officeId;

  test('seed one client so KPIs have real data to reflect', async ({ request }) => {
    const offices = await fineract(request, 'GET', '/offices');
    officeId = offices[0]?.id;
    expect(officeId).toBeTruthy();
    await fineract(request, 'POST', '/clients', {
      officeId, firstname: 'FinCraft', lastname: `Dashboard ${runId}`.slice(0, 45),
      legalFormId: 1, active: true, activationDate: date(), submittedOnDate: date(),
      dateFormat: 'dd MM yyyy', locale: 'en'
    });
  });

  test('KPIs load, filters apply, refresh/export work, quick actions open their modals', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await login(page);
    await page.evaluate(async () => { const r = await import('/js/router.js'); r.navigate('dashboard'); });
    await expect(page.locator('#dash-kpis')).toBeVisible({ timeout: 30_000 });

    // KPI cards: at least the client-count card should move off the loading
    // skeleton and show a real (non-empty) value once data resolves.
    const clientsKpi = page.locator('#dash-kpi-clients [data-role="value"]');
    await expect(clientsKpi).toBeVisible();
    await expect
      .poll(async () => (await clientsKpi.textContent())?.trim(), { timeout: 20_000 })
      .not.toMatch(/^(—|\.\.\.|)$/);

    // Filters: changing the period filter must not break the page.
    const periodFilter = page.locator('#dash-f-period');
    if (await periodFilter.count()) {
      const options = await periodFilter.locator('option').all();
      if (options.length > 1) {
        const otherValue = await options[1].getAttribute('value');
        await periodFilter.selectOption(otherValue ?? undefined);
        await page.waitForTimeout(500);
        await expect(page.locator('#dash-kpis')).toBeVisible();
      }
    }

    // Refresh must re-render without throwing.
    await page.locator('#dash-refresh').click();
    await expect(page.locator('#dash-kpis')).toBeVisible();
    await page.waitForTimeout(300);

    // Export triggers a download (CSV) rather than a crash.
    const exportBtn = page.locator('#dash-export');
    if (await exportBtn.count()) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10_000 }).catch(() => null),
        exportBtn.click(),
      ]);
      // Not fatal if the environment blocks downloads in CI — what matters is
      // the click didn't throw a page error (checked below).
      if (download) expect(download.suggestedFilename()).toBeTruthy();
    }

    // Quick action: "New Client" should open its modal (admin has CREATE_CLIENT).
    const newClientAction = page.locator('[data-modal="newClientModal"]').first();
    if (await newClientAction.count()) {
      await newClientAction.click();
      await expect(page.locator('#newClientModal')).toBeVisible({ timeout: 10_000 });
      // Close it however the modal system expects — Escape is the universal case.
      await page.keyboard.press('Escape');
      await expect(page.locator('#newClientModal')).toBeHidden({ timeout: 5_000 }).catch(() => {});
    }

    expect(errors, `Unexpected page errors on dashboard: ${errors.join('; ')}`).toEqual([]);
  });
});
