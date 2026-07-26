import { renderDetail } from './detail.js';
import { renderList } from './list.js';
import { renderNew } from './new.js';

export async function render(c, params = {}) {
  if (params.view === 'new') return renderNew(c);
  if (params.view === 'detail' || params.id) return renderDetail(c, params.id, params.tab);
  return renderList(c);
}
