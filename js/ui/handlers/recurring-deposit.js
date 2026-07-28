import { api } from '../../api.js';
import { closeModal, toast } from '../core.js';
import { extractFineractError, formData, setSubmitting } from '../dom-helpers.js';
import { DATE_FORMAT, LOCALE } from '../../config.js';

export const RecurringDepositHandlers = {
    'submit-rd': async (btn) => {
      const f = formData('newRDForm');
      if (!f.clientId || !f.productId || !f.mandatoryRecommendedDepositAmount) {
        toast('warn', 'Required', 'Client, product and deposit amount required'); return;
      }
      const payload = {
        dateFormat: DATE_FORMAT, locale: LOCALE,
        clientId: parseInt(f.clientId),
        productId: parseInt(f.productId),
        mandatoryRecommendedDepositAmount: parseFloat(f.mandatoryRecommendedDepositAmount),
        recurringDepositFrequency: parseInt(f.recurringDepositFrequency || 1),
        recurringDepositFrequencyTypeId: parseInt(f.recurringDepositFrequencyTypeId || 2),
        depositPeriod: parseInt(f.depositPeriod || 12),
        depositPeriodFrequencyId: parseInt(f.depositPeriodFrequencyId || 2),
        submittedOnDate: f.submittedOnDate
      };
      if (f.fieldOfficerId) payload.fieldOfficerId = parseInt(f.fieldOfficerId);
      if (f.expectedFirstDepositOnDate) payload.expectedFirstDepositOnDate = f.expectedFirstDepositOnDate;
      if (f.externalId) payload.externalId = f.externalId;
      // Deposit-term limits, lock-in, mandatory-deposit flags & tax (native RD create contract)
      if (f.minDepositTerm) { payload.minDepositTerm = parseInt(f.minDepositTerm); if (f.minDepositTermTypeId) payload.minDepositTermTypeId = parseInt(f.minDepositTermTypeId); }
      if (f.maxDepositTerm) { payload.maxDepositTerm = parseInt(f.maxDepositTerm); if (f.maxDepositTermTypeId) payload.maxDepositTermTypeId = parseInt(f.maxDepositTermTypeId); }
      if (f.lockinPeriodFrequency) { payload.lockinPeriodFrequency = parseInt(f.lockinPeriodFrequency); if (f.lockinPeriodFrequencyType) payload.lockinPeriodFrequencyType = parseInt(f.lockinPeriodFrequencyType); }
      payload.isMandatoryDeposit = (f.isMandatoryDeposit === 'on' || f.isMandatoryDeposit === 'true');
      payload.adjustAdvanceTowardsFuturePayments = (f.adjustAdvanceTowardsFuturePayments === 'on' || f.adjustAdvanceTowardsFuturePayments === 'true');
      if (f.withHoldTax === 'on' || f.withHoldTax === 'true') payload.withHoldTax = true;

      const autoApproveActivate = f.autoApproveActivate === 'on' || f.autoApproveActivate === 'true';

      setSubmitting(btn, true);
      try {
        const r = await api.recurringDeposits.create(payload);
        const id = r.savingsId || r.resourceId;
        let statusMsg = 'RD application submitted';
        if (autoApproveActivate && id) {
          try {
            await api.recurringDeposits.approve(id, { approvedOnDate: f.submittedOnDate, dateFormat: DATE_FORMAT, locale: LOCALE });
            try {
              await api.recurringDeposits.activate(id, { activatedOnDate: f.submittedOnDate, dateFormat: DATE_FORMAT, locale: LOCALE });
              statusMsg = 'RD created, approved & activated';
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
        closeModal('newRDModal');
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) {
        toast('error', 'Create failed', extractFineractError(e));
      } finally { setSubmitting(btn, false); }
      return;
    },
};
