import { api } from '../../api.js';
import { closeModal, toast } from '../core.js';
import { extractFineractError, formData, setSubmitting } from '../dom-helpers.js';
import { DATE_FORMAT, LOCALE } from '../../config.js';

export const LoansHandlers = {
    'submit-loan': async (btn) => {
      const f = formData('newLoanForm');
      const form = document.getElementById('newLoanForm');
      if (!f.clientId || !f.productId || !f.principal) {
        toast('warn', 'Required fields', 'Client, product and principal are required'); return;
      }
      const tpl = form?.dataset?.tpl ? JSON.parse(form.dataset.tpl) : {};
      const payload = {
        dateFormat: DATE_FORMAT,
        locale: LOCALE,
        clientId: parseInt(f.clientId),
        productId: parseInt(f.productId),
        loanType: f.loanType || 'individual',
        principal: parseFloat(f.principal),
        numberOfRepayments: parseInt(f.numberOfRepayments) || tpl.numberOfRepayments || 12,
        repaymentEvery: parseInt(f.repaymentEvery) || 1,
        repaymentFrequencyType: parseInt(f.repaymentFrequencyType ?? tpl.repaymentFrequencyType ?? 2),
        interestRatePerPeriod: parseFloat(f.interestRate) || tpl.interestRatePerPeriod || 0,
        interestRateFrequencyType: tpl.interestRateFrequencyType ?? 2,
        amortizationType: f.amortizationType != null && f.amortizationType !== '' ? parseInt(f.amortizationType) : (tpl.amortizationType ?? 1),
        interestType: f.interestType != null && f.interestType !== '' ? parseInt(f.interestType) : (tpl.interestType ?? 0),
        interestCalculationPeriodType: f.interestCalculationPeriodType != null && f.interestCalculationPeriodType !== '' ? parseInt(f.interestCalculationPeriodType) : (tpl.interestCalculationPeriodType ?? 1),
        transactionProcessingStrategyCode: tpl.transactionProcessingStrategyCode || 'mifos-standard-strategy',
        submittedOnDate: f.submittedOnDate,
        expectedDisbursementDate: f.expectedDisbursementDate
      };
      if (f.loanOfficerId) payload.loanOfficerId = parseInt(f.loanOfficerId);
      if (f.fundId) payload.fundId = parseInt(f.fundId);
      if (f.loanPurposeId) payload.loanPurposeId = parseInt(f.loanPurposeId);
      if (f.linkAccountId) payload.linkAccountId = parseInt(f.linkAccountId);
      if (f.repaymentsStartingFromDate) payload.repaymentsStartingFromDate = f.repaymentsStartingFromDate;
      if (f.graceOnPrincipalPayment) payload.graceOnPrincipalPayment = parseInt(f.graceOnPrincipalPayment);
      if (f.graceOnInterestPayment) payload.graceOnInterestPayment = parseInt(f.graceOnInterestPayment);
      if (f.graceOnArrearsAgeing) payload.graceOnArrearsAgeing = parseInt(f.graceOnArrearsAgeing);
      if (f.externalId) payload.externalId = f.externalId;

      setSubmitting(btn, true);
      try {
        const r = await api.loans.create(payload);
        toast('success', 'Loan application submitted', `Loan #${r.loanId || r.resourceId}`);
        closeModal('newLoanModal');
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) {
        toast('error', 'Loan create failed', extractFineractError(e));
      } finally { setSubmitting(btn, false); }
      return;
    },
};
