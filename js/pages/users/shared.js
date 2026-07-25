import { store } from '../../store.js';

export const can = (code) => store.hasPermission(code);

export const TABS = [
  'Users',
  'Roles & Permissions',
  'Password Policy',
  'Two-Factor Auth'
];
