export const TAX_YEAR = '2026/27';

export const RATES = {
  personalAllowance: 12570,
  taperFrom: 100000,
  basicRateCeiling: 50270,
  additionalRateFrom: 125140,
  basicRate: 0.2,
  higherRate: 0.4,
  additionalRate: 0.45,
  periodsPerYear: { weekly: 52, monthly: 12, annual: 1 },
  periodLabel: { weekly: 'week', monthly: 'month', annual: 'year' },
  ni: {
    weekly: { pt: 242, uel: 967, main: 0.08, upper: 0.02 },
    monthly: { pt: 1048, uel: 4189, main: 0.08, upper: 0.02 },
    annual: { pt: 12570, uel: 50270, main: 0.08, upper: 0.02 },
  },
  studentLoan: {
    none: null,
    p1: { threshold: 26900, rate: 0.09 },
    p2: { threshold: 29385, rate: 0.09 },
    p4: { threshold: 33795, rate: 0.09 },
    p5: { threshold: 25000, rate: 0.09 },
    pg: { threshold: 21000, rate: 0.06 },
  },
};

export function optionalExtra(amount, mode, pctBase, hourlyHours) {
  const v = amount;
  if (v <= 0) return 0;
  if (mode === 'pct') return pctBase * (v / 100);
  if (mode === 'hourly') return v * hourlyHours;
  return v;
}

export function parseTaxCode(raw, annualIncome) {
  const code = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s/g, '');
  if (!code) return { mode: 'unknown', allowance: 0, unknown: true };
  if (code === 'BR') return { mode: 'flat', rate: RATES.basicRate, unknown: false };
  if (code === 'D0') return { mode: 'flat', rate: RATES.higherRate, unknown: false };
  if (code === 'D1') return { mode: 'flat', rate: RATES.additionalRate, unknown: false };
  const k = code.match(/^K(\d+)$/);
  if (k) return { mode: 'standard', allowance: -parseInt(k[1], 10) * 10, unknown: false };
  const l = code.match(/^(\d+)L$/);
  if (l) {
    let allowance = parseInt(l[1], 10) * 10;
    if (annualIncome > RATES.taperFrom)
      allowance = Math.max(0, allowance - (annualIncome - RATES.taperFrom) / 2);
    return { mode: 'standard', allowance, unknown: false };
  }
  return { mode: 'unknown', allowance: 0, unknown: true };
}

export function calcAnnualIncomeTax(annualPay, codeInfo) {
  if (codeInfo.mode === 'flat') return Math.max(0, annualPay) * codeInfo.rate;
  const pa = codeInfo.mode === 'standard' ? codeInfo.allowance : 0;
  const taxable = annualPay - pa;
  if (taxable <= 0) return 0;
  const basicWidth = RATES.basicRateCeiling - RATES.personalAllowance;
  const higherCap = RATES.additionalRateFrom - pa;
  return (
    Math.min(taxable, basicWidth) * RATES.basicRate +
    Math.max(0, Math.min(taxable, higherCap) - basicWidth) * RATES.higherRate +
    Math.max(0, taxable - higherCap) * RATES.additionalRate
  );
}

export function calcPeriodNI(period, periodPay) {
  const b = RATES.ni[period];
  if (!b || periodPay <= 0) return 0;
  if (periodPay <= b.pt) return 0;
  const mainBand = Math.max(0, Math.min(periodPay, b.uel) - b.pt);
  const upperBand = Math.max(0, periodPay - b.uel);
  return mainBand * b.main + upperBand * b.upper;
}

export function calcAnnualStudentLoan(annualPay, planKey) {
  const plan = RATES.studentLoan[planKey];
  if (!plan || annualPay <= plan.threshold) return 0;
  return (annualPay - plan.threshold) * plan.rate;
}

/**
 * @param {object} input
 * @returns {object|null} breakdown, or null if period unset
 */
export function computeTakeHome(input) {
  const {
    period,
    rate = 0,
    otrate = 0,
    hours = 0,
    othours = 0,
    shiftAllowAmt = 0,
    shiftAllowMode = 'fixed',
    supplementAmt = 0,
    supplementMode = 'hourly',
    bonusAmt = 0,
    bonusMode = 'fixed',
    pensionPct = 0,
    extraSacrifice = 0,
    taxCode = '',
    studentLoan = '',
  } = input;

  if (!period || !RATES.periodsPerYear[period]) return null;

  const freq = RATES.periodsPerYear[period];
  const basicPay = hours * rate;
  const otPay = othours * otrate;
  const totalHours = hours + othours;
  const shiftAllow = optionalExtra(shiftAllowAmt, shiftAllowMode, basicPay, 0);
  const supplement = optionalExtra(supplementAmt, supplementMode, 0, totalHours);
  const payBeforeBonus = basicPay + otPay + shiftAllow + supplement;
  const bonus =
    bonusAmt > 0 ? (bonusMode === 'pct' ? payBeforeBonus * (bonusAmt / 100) : bonusAmt) : 0;
  const gross = payBeforeBonus + bonus;
  const pen = gross * (pensionPct / 100);
  const sac = pen + extraSacrifice;
  const pay = Math.max(0, gross - sac);
  const annualPay = pay * freq;

  const codeResolved = parseTaxCode(taxCode, annualPay);
  const taxAnnual = calcAnnualIncomeTax(annualPay, codeResolved);
  const periodTax = taxAnnual / freq;
  const periodNi = calcPeriodNI(period, pay);

  const planKey = studentLoan === '' ? 'none' : studentLoan;
  const slAnnual = planKey === 'none' ? 0 : calcAnnualStudentLoan(annualPay, planKey);
  const periodSl = slAnnual / freq;

  const net = Math.max(0, pay - periodTax - periodNi - periodSl);

  return {
    basicPay,
    otPay,
    shiftAllow,
    supplement,
    payBeforeBonus,
    bonus,
    gross,
    pension: pen,
    extraSacrifice,
    payAfterSacrifice: pay,
    periodTax,
    periodNi,
    periodSl,
    net,
    annualPay,
    annualTax: taxAnnual,
    annualSl: slAnnual,
    annualNet: net * freq,
    codeInfo: codeResolved,
    freq,
  };
}