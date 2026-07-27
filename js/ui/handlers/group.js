import { api } from '../../api.js';
import { closeModal, toast } from '../core.js';
import { extractFineractError, formData, setSubmitting } from '../dom-helpers.js';
import { DATE_FORMAT, LOCALE } from '../../config.js';

export const GroupHandlers = {
    'submit-group': async (btn) => {
      const f = formData('newGroupForm');
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
      // Native clientMembers[] — enrol members at creation (single select ⇒ string, multi ⇒ array)
      const clientMembers = Array.isArray(f.clientMembers)
        ? f.clientMembers
        : (f.clientMembers ? [f.clientMembers] : []);
      if (clientMembers.length) payload.clientMembers = clientMembers.map(id => parseInt(id));
      const autoActivate = f.active === 'on' || f.active === 'true';
      const activationDate = f.activationDate || f.submittedOnDate;

      setSubmitting(btn, true);
      try {
        const r = await api.groups.create(payload);
        const id = r.groupId || r.resourceId;
        let statusMsg = 'Group created';

        // Center attachment is optional (Fineract allows standalone groups)
        if (id && f.centerId) {
          try {
            await api.centers.associateGroups(f.centerId, { groupMembers: [String(id)] });
            statusMsg = 'Group created & attached to center';
          } catch (assocErr) {
            toast('warn', 'Created, but attaching to center failed', extractFineractError(assocErr));
            statusMsg = null;
          }
        }

        if (autoActivate && id) {
          try {
            await api.groups.activate(id, { activationDate, dateFormat: DATE_FORMAT, locale: LOCALE });
            statusMsg = statusMsg ? statusMsg + ' & activated' : 'Group activated';
          } catch (actErr) {
            toast('warn', 'Group created, but activation failed', extractFineractError(actErr));
            if (!statusMsg) statusMsg = null;
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
            await api.calendars.create('groups', id, cal);
            statusMsg = statusMsg ? statusMsg + ' + meeting set' : 'Meeting scheduled';
          } catch (calErr) {
            toast('warn', 'Group saved, but meeting schedule failed', extractFineractError(calErr));
          }
        }

        if (statusMsg) toast('success', statusMsg, f.name);
        closeModal('newGroupModal');
        document.dispatchEvent(new CustomEvent('fc:reload'));
      } catch (e) {
        toast('error', 'Create failed', extractFineractError(e));
      } finally { setSubmitting(btn, false); }
      return;
    },
};
