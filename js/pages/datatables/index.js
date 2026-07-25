import { renderDetail } from './detail.js';
import { renderList } from './list.js';

export async function render(c, params = {}) {
  if (params.view === 'detail' && params.name) return renderDetail(c, params.name);
  return renderList(c);
}
