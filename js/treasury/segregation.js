function norm(v) { return String(v ?? '').trim().toLowerCase(); }
export function assertDifferentActors(maker, checker, action = 'approve') {
  if (!norm(maker) || !norm(checker)) throw new Error(`Cannot ${action}: maker and checker identities are required`);
  if (norm(maker) === norm(checker)) throw new Error(`Segregation of duties: ${checker} cannot ${action} their own item`);
}
export function assertThreeWaySeparation(requester, approver, payer) {
  assertDifferentActors(requester, approver, 'approve');
  if (norm(payer) === norm(requester) || norm(payer) === norm(approver)) {
    throw new Error(`Segregation of duties: payer ${payer} must differ from requester and approver`);
  }
}
