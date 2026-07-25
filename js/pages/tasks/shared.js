import { store } from '../../store.js';

export const can = (code) => store.hasPermission(code);

export const TABS = ['Checker Inbox', 'Loan Approvals', 'Client Approvals', 'Reschedule Requests'];
