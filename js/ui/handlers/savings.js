import { api } from '../../api.js';
import { closeModal, toast } from '../core.js';
import { extractFineractError, formData, setSubmitting } from '../dom-helpers.js';
import { DATE_FORMAT, LOCALE } from '../../config.js';

export const SavingsHandlers = {
    'submit-savings': async (btn) => {
      const f = formData('newSavingsForm');
      if (!f.clientId || !f.productId) { toast('warn', 'Required', 'Client and product required'); return; }
      const payload = {
        dateFormat: DATE_FORMAT, locale: LOCALE,
        clientId: parseInt(f.clientId),
        productId: parseInt(f.productId),
        submittedOnDate: f.submittedOnDate
      };
      if (f.staffId) payload.fieldOfficerId = parseInt(f.staffId);
      if (f.nominalAnnualInterestRate) payload.nominalAnnualInterestRate = parseFloat(f.nominalAnnualInterestRate);
      if (f.minRequiredOpeningBalance) payload.minRequiredOpeningBalance = parseFloat(f.minRequiredOpeningBalance);
      if (f.lockinPeriodFrequency) {
        payload.lockinPeriodFrequency = parseInt(f.lockinPeriodFrequency);
        payload.lockinPeriodFrequencyType = parseInt(f.lockinPeriodFrequencyType || 2);
      }
      if (f.interestCompoundingPeriodType) payload.interestCompoundingPeriodType = parseInt(f.interestCompoundingPeriodType);
      if (f.interestPostingPeriodType) payload.interestPostingPeriodType = parseInt(f.interestPostingPeriodType);
      if (f.interestCalculationType) payload.interestCalculationType = parseInt(f.interestCalculationType);
      if (f.interestCalculationDaysInYearType) payload.interestCalculationDaysInYearType = parseInt(f.interestCalculationDaysInYearType);
      if (f.allowOverdraft === 'on' || f.allowOverdraft === 'true') {
        payload.allowOverdraft = true;
        if (f.overdraftLimit) payload.overdraftLimit = parseFloat(f.overdraftLimit);
        if (f.nominalAnnualInterestRateOverdraft) payload.nominalAnnualInterestRateOverdraft = parseFloat(f.nominalAnnualInterestRateOverdraft);
      }
      if (f.enforceMinRequiredBalance === 'on' || f.enforceMinRequiredBalance === 'true') payload.enforceMinRequiredBalance = true;
      if (f.minRequiredBalance) payload.minRequiredBalance = parseFloat(f.minRequiredBalance);
      if (f.withHoldTax === 'on' || f.withHoldTax === 'true') payload.withHoldTax = true;
      if (f.externalId) payload.externalId = f.externalId;

      const autoApproveActivate = f.autoApproveActivate === 'on' || f.autoApproveActivate === 'true';

      setSubmitting(btn, true);
      try {
        const r = await api.savings.create(payload);
        const id = r.savingsId || r.resourceId;
        let statusMsg = 'Savings application submitted';
        if (autoApproveActivate && id) {
          try {
            await api.savings.approve(id, { approvedOnDate: f.submittedOnDate, dateFormat: DATE_FORMAT, locale: LOCALE });
            try {
              await api.savings.activate(id, { activatedOnDate: f.submittedOnDate, dateFormat: DATE_FORMAT, locale: LOCALE });
              statusMsg = 'Savings account created, approved & activated';
            } catch (actErr) {
              statusMsg = 'Created & approved, but activation failed';
              toast('warn', statusMsg, extractFineractError(actErr));
              statusMsg = null;
            }
          } catch (appErr) {
            toast('warn', 'Created, but approval failed', extractFineractError(appErr));
            statusMsg = null;
          }
        }
        if (statusMsg) toast('success', statusMsg, `#${id}`);
        closeModal('newSavingsModal');
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) {
        toast('error', 'Create failed', extractFineractError(e));
      } finally { setSubmitting(btn, false); }
      return;
    },
};
