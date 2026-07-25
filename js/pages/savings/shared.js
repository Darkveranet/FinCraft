import { store } from '../../store.js';

export const can = (code) => store.hasPermission(code);
