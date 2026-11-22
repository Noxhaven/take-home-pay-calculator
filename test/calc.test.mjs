import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  RATES,
  parseTaxCode,
  calcAnnualIncomeTax,
  calcPeriodNI,
  calcAnnualStudentLoan,
  computeTakeHome,
} from '../calc.mjs';

const approx = (a, b, eps = 0.02) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);

describe('1257L personal allowance', () => {
  it('parses standard code with full allowance below taper', () => {
    const info = parseTaxCode('1257L', 30000);
    assert.equal(info.mode, 'standard');
    assert.equal(info.allowance, 12570);
    assert.equal(info.unknown, false);
  });

  it('annual income tax on £30,000 at 20% only', () => {
    const info = parseTaxCode('1257L', 30000);
    const tax = calcAnnualIncomeTax(30000, info);
    approx(tax, 3486);
  });
});

describe('National Insurance (category A, monthly)', () => {
  it('main rate between PT and UEL', () => {
    const ni = calcPeriodNI('monthly', 2500);
    approx(ni, 116.16);
  });

  it('no NI at or below primary threshold', () => {
    assert.equal(calcPeriodNI('monthly', 1048), 0);
    assert.equal(calcPeriodNI('monthly', 500), 0);
  });

  it('includes upper rate above UEL', () => {
    const ni = calcPeriodNI('monthly', 5000);
    const main = (4189 - 1048) * 0.08;
    const upper = (5000 - 4189) * 0.02;
    approx(ni, main + upper);
  });
});

describe('flat tax codes', () => {
  it('BR taxes all pay at basic rate', () => {
    const info = parseTaxCode('BR', 0);
    assert.equal(calcAnnualIncomeTax(24000, info), 4800);
  });

  it('D0 at higher rate', () => {
    const info = parseTaxCode('D0', 0);
    assert.equal(calcAnnualIncomeTax(24000, info), 9600);
  });
});

describe('student loan Plan 2', () => {
  it('zero below threshold', () => {
    assert.equal(calcAnnualStudentLoan(28000, 'p2'), 0);
  });

  it('9% above threshold', () => {
    approx(calcAnnualStudentLoan(35000, 'p2'), (35000 - RATES.studentLoan.p2.threshold) * 0.09);
  });
});

describe('integrated take-home (legal regression)', () => {
  it('monthly £2,500, 1257L, no pension or loan', () => {
    const out = computeTakeHome({
      period: 'monthly',
      rate: 0,
      hours: 0,
      othours: 0,
      bonusAmt: 2500,
      bonusMode: 'fixed',
      pensionPct: 0,
      extraSacrifice: 0,
      taxCode: '1257L',
      studentLoan: 'none',
    });
    assert.ok(out);
    approx(out.annualPay, 30000);
    approx(out.periodTax, 3486 / 12);
    approx(out.periodNi, calcPeriodNI('monthly', 2500));
    approx(out.net, 2500 - out.periodTax - out.periodNi);
  });

  it('weekly basic pay with 5% salary sacrifice pension', () => {
    const out = computeTakeHome({
      period: 'weekly',
      rate: 15,
      hours: 40,
      pensionPct: 5,
      taxCode: '1257L',
      studentLoan: 'none',
    });
    assert.ok(out);
    approx(out.gross, 600);
    approx(out.pension, 30);
    approx(out.payAfterSacrifice, 570);
    assert.ok(out.periodNi < calcPeriodNI('weekly', 600));
  });
});