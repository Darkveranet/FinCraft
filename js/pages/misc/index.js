import { navigation } from './navigation.js';
import { profile } from './profile.js';
import { remittances } from './remittances.js';
import { settings } from './settings.js';

export async function render(c, params = {}) {
  const view = params.view || 'profile';
  const VIEWS = { profile, settings, navigation, remittances };
  const fn = VIEWS[view] || profile;
  await fn(c);
}
