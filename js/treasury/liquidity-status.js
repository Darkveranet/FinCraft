export const LIQUIDITY_STATUS = Object.freeze({ RED: 'RED', AMBER: 'AMBER', GREEN: 'GREEN' });

export function deriveLiquidityStatus(availableVault, reserveBuffer) {
  if (availableVault <= 0) return LIQUIDITY_STATUS.RED;
  if (reserveBuffer > 0 && availableVault < reserveBuffer) return LIQUIDITY_STATUS.AMBER;
  return LIQUIDITY_STATUS.GREEN;
}
