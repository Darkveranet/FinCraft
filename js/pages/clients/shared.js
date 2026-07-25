import { store } from '../../store.js';
import { escapeHtml, ini } from '../../utils.js';

export const can = (code) => store.hasPermission(code);

export function cvHue(seed) {
  const s = String(seed ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 5;
}

export function cvAvatar(cl, size = 'md') {
  return `<div class="cv-avatar cv-avatar-${size}" data-hue="${cvHue(cl.id)}">${ini(cl.displayName)}</div>`;
}

export function cvClientType(cl) {
  const v = cl.legalForm?.value || (cl.legalForm?.id === 2 ? 'Entity' : cl.legalForm?.id === 1 ? 'Person' : '');
  return /entity/i.test(v) ? 'Business' : 'Individual';
}

export function cvPill(label, tone = 'slate') {
  return `<span class="cv-pill cv-${tone}"><span class="dot"></span>${escapeHtml(label)}</span>`;
}

export function cvStatusTone(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'active') return 'green';
  if (s === 'pending') return 'amber';
  if (s === 'rejected' || s === 'closed') return 'red';
  return 'slate';
}
