import { renderDetail } from './detail.js';
import { renderList } from './list.js';

export async function render(c, params = {}) {
  const apiGroup = params.type === 'rd' ? 'recurringDeposits' : 'fixedDeposits';
  if (params.view === 'detail' || params.id) return renderDetail(c, apiGroup, params.id, params.tab);
  return renderList(c);
}
