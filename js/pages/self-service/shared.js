import { store } from '../../store.js';

export const can = (code) => store.hasPermission(code);

export const TABS = ['Portal Users', 'Beneficiaries (TPT)'];
