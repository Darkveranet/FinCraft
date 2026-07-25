import { renderDetail } from './detail.js';
import { renderList } from './list.js';

export async function render(c, params = {}) {
  if (params.view === 'detail' && params.id) return renderDetail(c, params.id);
  return renderList(c);
}
