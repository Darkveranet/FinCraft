export const RemittanceStepperHandlers = {
    'remit-next': async (btn) => {
      import('../../remit.js').then(m => m.Remit.next());
      return;
    },
    'remit-back': async (btn) => {
      import('../../remit.js').then(m => m.Remit.back());
      return;
    },
};
