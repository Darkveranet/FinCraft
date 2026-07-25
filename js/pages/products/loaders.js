import { api } from '../../api.js';

export async function loadProductMixList() {
  const products = await api.loanProducts.list().catch(() => []);
  const list = Array.isArray(products) ? products : [];
  return list.map(p => ({
    id: p.id,
    name: p.name,
    _mixCount: Array.isArray(p.productMixes) ? p.productMixes.length : 0
  }));
}
