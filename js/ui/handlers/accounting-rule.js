import { api } from '../../api.js';
import { closeModal, toast } from '../core.js';
import { extractFineractError, formData, setSubmitting } from '../dom-helpers.js';

export const AccountingRuleHandlers = {
    'submit-acc-rule': async (btn) => {
      const f = formData('newAccRuleForm');
      if (!f.name || !f.debitAccountId || !f.creditAccountId) {
        toast('warn', 'Required', 'Name and accounts required'); return;
      }
      const payload = {
        name: f.name,
        debitAccountId: parseInt(f.debitAccountId),
        creditAccountId: parseInt(f.creditAccountId)
      };
      if (f.officeId) payload.officeId = parseInt(f.officeId);
      if (f.description) payload.description = f.description;
      if (f.tags) payload.tags = f.tags;
      if (f.allowMultipleDebitEntries === 'on' || f.allowMultipleDebitEntries === 'true') payload.allowMultipleDebitEntries = true;
      if (f.allowMultipleCreditEntries === 'on' || f.allowMultipleCreditEntries === 'true') payload.allowMultipleCreditEntries = true;

      setSubmitting(btn, true);
      try {
        await api.accountingRules.create(payload);
        toast('success', 'Accounting rule created', f.name);
        closeModal('newAccRuleModal');
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) {
        toast('error', 'Create failed', extractFineractError(e));
      } finally { setSubmitting(btn, false); }
      return;
    },
};
