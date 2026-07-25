function addMonthsIso(dateIso, n) {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, d));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

export function generateBorrowingSchedule({ principalAmount, interestRate, interestMethod, startDate, tenorMonths }) {
  if (!(principalAmount > 0)) throw new Error('generateBorrowingSchedule: principalAmount must be positive');
  if (!(tenorMonths >= 1) || !Number.isInteger(tenorMonths)) throw new Error('generateBorrowingSchedule: tenorMonths must be a positive integer');
  if (interestRate < 0) throw new Error('generateBorrowingSchedule: interestRate cannot be negative');
  if (interestMethod !== 'FLAT' && interestMethod !== 'REDUCING_BALANCE') {
    throw new Error(`generateBorrowingSchedule: interestMethod must be FLAT or REDUCING_BALANCE, got "${interestMethod}"`);
  }

  return interestMethod === 'FLAT'
    ? generateFlatSchedule({ principalAmount, interestRate, startDate, tenorMonths })
    : generateReducingBalanceSchedule({ principalAmount, interestRate, startDate, tenorMonths });
}

function generateFlatSchedule({ principalAmount, interestRate, startDate, tenorMonths }) {
  const totalInterest = round2(principalAmount * (interestRate / 100) * (tenorMonths / 12));
  const basePrincipal = round2(principalAmount / tenorMonths);
  const baseInterest = round2(totalInterest / tenorMonths);

  const rows = [];
  let principalRunning = 0, interestRunning = 0;
  for (let i = 1; i <= tenorMonths; i++) {
    const isLast = i === tenorMonths;
    const principalDue = isLast ? round2(principalAmount - principalRunning) : basePrincipal;
    const interestDue = isLast ? round2(totalInterest - interestRunning) : baseInterest;
    principalRunning = round2(principalRunning + principalDue);
    interestRunning = round2(interestRunning + interestDue);
    rows.push({ installmentNo: i, dueDate: addMonthsIso(startDate, i), principalDue, interestDue });
  }
  return rows;
}

function generateReducingBalanceSchedule({ principalAmount, interestRate, startDate, tenorMonths }) {
  const monthlyRate = interestRate / 100 / 12;
  const rows = [];
  let outstanding = principalAmount;

  if (monthlyRate === 0) {
    const basePrincipal = round2(principalAmount / tenorMonths);
    let principalRunning = 0;
    for (let i = 1; i <= tenorMonths; i++) {
      const isLast = i === tenorMonths;
      const principalDue = isLast ? round2(principalAmount - principalRunning) : basePrincipal;
      principalRunning = round2(principalRunning + principalDue);
      rows.push({ installmentNo: i, dueDate: addMonthsIso(startDate, i), principalDue, interestDue: 0 });
    }
    return rows;
  }

  const levelPayment = (principalAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenorMonths));
  for (let i = 1; i <= tenorMonths; i++) {
    const isLast = i === tenorMonths;
    const interestDue = round2(outstanding * monthlyRate);
    const principalDue = isLast ? round2(outstanding) : round2(levelPayment - interestDue);
    outstanding = round2(outstanding - principalDue);
    rows.push({ installmentNo: i, dueDate: addMonthsIso(startDate, i), principalDue, interestDue });
  }
  return rows;
}
