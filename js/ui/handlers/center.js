import { api } from '../../api.js';
import { closeModal, toast } from '../core.js';
import { extractFineractError, formData, setSubmitting } from '../dom-helpers.js';
import { DATE_FORMAT, LOCALE } from '../../config.js';

export const CenterHandlers = {
    'submit-center': async (btn) => {
      const f = formData('newCenterForm');
      if (!f.name || !f.officeId || !f.submittedOnDate) {
        toast('warn', 'Required', 'Name, office and submitted date are required'); return;
      }
      const payload = {
        dateFormat: DATE_FORMAT, locale: LOCALE,
        name: f.name,
        officeId: parseInt(f.officeId),
        submittedOnDate: f.submittedOnDate
      };
      if (f.staffId) payload.staffId = parseInt(f.staffId);
      if (f.externalId) payload.externalId = f.externalId;
      if (f.accountNo) payload.accountNo = f.accountNo;
      const autoActivate = f.active === 'on' || f.active === 'true';
      const activationDate = f.activationDate || f.submittedOnDate;

      setSubmitting(btn, true);
      try {
        const r = await api.centers.create(payload);
        const id = r.centerId || r.resourceId;
        let statusMsg = 'Center created';
        if (autoActivate && id) {
          try {
            await api.centers.activate(id, { activationDate, dateFormat: DATE_FORMAT, locale: LOCALE });
            statusMsg = 'Center created & activated';
          } catch (actErr) {
            toast('warn', 'Center created, but activation failed', extractFineractError(actErr));
            statusMsg = null;
          }
        }

        // Optional collection-meeting calendar (Fineract meeting fields)
        if (id && f.frequency && f.meetingStartDate) {
          try {
            const cal = {
              dateFormat: DATE_FORMAT, locale: LOCALE,
              title: `${f.name} collection meeting`,
              startDate: f.meetingStartDate,
              typeId: 1, repeating: true,
              frequency: parseInt(f.frequency),
              interval: parseInt(f.interval) || 1
            };
            if (f.repeatsOnDay) cal.repeatsOnDay = parseInt(f.repeatsOnDay);
            await api.calendars.create('centers', id, cal);
            statusMsg = statusMsg ? statusMsg + ' + meeting set' : 'Meeting scheduled';
          } catch (calErr) {
            toast('warn', 'Center saved, but meeting schedule failed', extractFineractError(calErr));
          }
        }
        if (statusMsg) toast('success', statusMsg, f.name);
        closeModal('newCenterModal');
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) {
        toast('error', 'Create failed', extractFineractError(e));
      } finally { setSubmitting(btn, false); }
      return;
    },
};
