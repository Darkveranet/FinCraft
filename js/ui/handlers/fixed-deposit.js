import { api } from '../../api.js';
import { closeModal, toast } from '../core.js';
import { extractFineractError, formData, setSubmitting } from '../dom-helpers.js';
import { DATE_FORMAT, LOCALE } from '../../config.js';

export const FixedDepositHandlers = {
    'submit-fd': async (btn) => {
      const f = formData('newFDForm');
      if (!f.clientId || !f.productId || !f.depositAmount || !f.depositPeriod) {
        toast('warn', 'Required', 'Client, product, amount and period are required'); return;
      }
      const payload = {
        dateFormat: DATE_FORMAT, locale: LOCALE,
        clientId: parseInt(f.clientId),
        productId: parseInt(f.productId),
        depositAmount: parseFloat(f.depositAmount),
        depositPeriod: parseInt(f.depositPeriod),
        depositPeriodFrequencyId: parseInt(f.depositPeriodFrequencyId || 2),
        submittedOnDate: f.submittedOnDate
      };
      if (f.fieldOfficerId) payload.fieldOfficerId = parseInt(f.fieldOfficerId);
      if (f.expectedFirstDepositOnDate) payload.expectedFirstDepositOnDate = f.expectedFirstDepositOnDate;
      if (f.maturityInstructionId) payload.maturityInstructionId = parseInt(f.maturityInstructionId);
      if (f.nominalAnnualInterestRate) payload.nominalAnnualInterestRate = parseFloat(f.nominalAnnualInterestRate);
      if (f.interestCompoundingPeriodType) payload.interestCompoundingPeriodType = parseInt(f.interestCompoundingPeriodType);
      if (f.interestPostingPeriodType) payload.interestPostingPeriodType = parseInt(f.interestPostingPeriodType);
      if (f.interestCalculationType) payload.interestCalculationType = parseInt(f.interestCalculationType);
      if (f.interestCalculationDaysInYearType) payload.interestCalculationDaysInYearType = parseInt(f.interestCalculationDaysInYearType);
      if (f.lockinPeriodFrequency) {
        payload.lockinPeriodFrequency = parseInt(f.lockinPeriodFrequency);
        payload.lockinPeriodFrequencyType = parseInt(f.lockinPeriodFrequencyType || 2);
      }
      if (f.transferToSavingsId) payload.transferToSavingsId = parseInt(f.transferToSavingsId);
      if (f.transferInterestToSavings === 'on' || f.transferInterestToSavings === 'true') payload.transferInterestToSavings = true;
      if (f.externalId) payload.externalId = f.externalId;

      const autoApproveActivate = f.autoApproveActivate === 'on' || f.autoApproveActivate === 'true';

      setSubmitting(btn, true);
      try {
        const r = await api.fixedDeposits.create(payload);
        const id = r.savingsId || r.resourceId;
        let statusMsg = 'FD application submitted';
        if (autoApproveActivate && id) {
          try {
            await api.fixedDeposits.approve(id, { approvedOnDate: f.submittedOnDate, dateFormat: DATE_FORMAT, locale: LOCALE });
            try {
              await api.fixedDeposits.activate(id, { activatedOnDate: f.submittedOnDate, dateFormat: DATE_FORMAT, locale: LOCALE });
              statusMsg = 'FD created, approved & activated';
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
        closeModal('newFDModal');
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) {
        toast('error', 'Create failed', extractFineractError(e));
      } finally { setSubmitting(btn, false); }
      return;
    },
};
