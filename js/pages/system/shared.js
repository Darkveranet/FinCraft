import { store } from '../../store.js';

export const can = (code) => store.hasPermission(code);

export const TABS = [
  'Configurations',
  'Audit Trails',
  'Codes & Values',
  'Roles & Permissions',
  'Manage Jobs',
  'External Services',
  'COB',
  'Hooks',
  'Account Number Prefs',
  'Entity Mappings',
  'External Events',
  'Maker-Checker Config',
  'Surveys',
  'Migration Links',
  'System Info'
];
