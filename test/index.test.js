import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePersonnummer,
  isValidPersonnummer,
  isSamordningsnummer,
  ageFromPersonnummer,
  checkWitness,
  WITNESS_DISQUALIFICATIONS,
  LAGRUM,
} from '../dist/index.js';

/** Build a valid 10-digit number (YYMMDD + 3 digits + Luhn check digit). */
function withCheck(yymmdd, serial = '123') {
  const nine = yymmdd + serial;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = Number(nine[i]) * (i % 2 === 0 ? 2 : 1);
    if (d > 9) d -= 9;
    sum += d;
  }
  return nine + ((10 - (sum % 10)) % 10);
}

const OCT_2026 = new Date(2026, 9, 7);

test('Luhn check digit', () => {
  assert.equal(isValidPersonnummer('121212-1212', OCT_2026), true);
  assert.equal(isValidPersonnummer('121212-1213', OCT_2026), false);
  assert.equal(isValidPersonnummer('19121212-1219'), false);
});

test('10 and 12 digits, with and without separator, spaces ignored', () => {
  assert.equal(normalizePersonnummer('121212-1212', OCT_2026), '20121212-1212');
  assert.equal(normalizePersonnummer('1212121212', OCT_2026), '20121212-1212');
  assert.equal(normalizePersonnummer('191212121212'), '19121212-1212');
  assert.equal(normalizePersonnummer('19121212-1212'), '19121212-1212');
  assert.equal(normalizePersonnummer(' 121212 - 1212 ', OCT_2026), '20121212-1212');
  assert.equal(normalizePersonnummer('12121-1212'), null);
  assert.equal(normalizePersonnummer('abc'), null);
});

test("'+' means 100 years or older", () => {
  assert.equal(normalizePersonnummer('121212+1212', OCT_2026), '19121212-1212');
});

test('invalid dates are rejected', () => {
  const feb30 = withCheck('900230');
  assert.equal(normalizePersonnummer(feb30, OCT_2026), null);
  const month13 = withCheck('901312');
  assert.equal(normalizePersonnummer(month13, OCT_2026), null);
  assert.equal(normalizePersonnummer(withCheck('000229'), OCT_2026), '20000229-' + withCheck('000229').slice(6));
});

test('samordningsnummer (day + 60) is accepted', () => {
  const s = withCheck('901272'); // 12 Dec 1990
  assert.equal(normalizePersonnummer(s, OCT_2026), '19901272-' + s.slice(6));
  assert.equal(isSamordningsnummer(s, OCT_2026), true);
  assert.equal(isSamordningsnummer('121212-1212', OCT_2026), false);
  assert.equal(ageFromPersonnummer(s, '2026-12-11'), 35);
  assert.equal(ageFromPersonnummer(s, '2026-12-12'), 36);
});

test('century uses the full birth date: born Dec 1926, asked Oct 2026', () => {
  const n = withCheck('261215');
  assert.equal(normalizePersonnummer(n, OCT_2026), '19261215-' + n.slice(6));
  assert.equal(ageFromPersonnummer(n, '2026-10-07'), 99);
  // Same number, born Oct 2026 would be in the future; an earlier date this year is 2026.
  const jan = withCheck('260105');
  assert.equal(normalizePersonnummer(jan, OCT_2026), '20260105-' + jan.slice(6));
});

test('ageFromPersonnummer counts whole years', () => {
  const n = '19800615-' + withCheck('800615').slice(6);
  assert.equal(ageFromPersonnummer(n, '2026-06-14'), 45);
  assert.equal(ageFromPersonnummer(n, '2026-06-15'), 46);
  assert.equal(ageFromPersonnummer('19800615-0001', '2026-06-15'), null);
  assert.equal(ageFromPersonnummer(n, '2026-02-30'), null);
});

test('a person with no relation passes', () => {
  assert.deepEqual(checkWitness({ age: 40, relationToTestator: 'none', relationToBeneficiary: 'none' }), { ok: true, reasons: [] });
  assert.deepEqual(checkWitness({}), { ok: true, reasons: [] });
});

test('age 15 is allowed, 14 is not', () => {
  assert.equal(checkWitness({ age: 15 }).ok, true);
  const r = checkWitness({ age: 14 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reasons.map((x) => x.code), ['UNDER_15']);
});

test('lack of insight due to mental disorder', () => {
  assert.deepEqual(checkWitness({ lacksInsight: true }).reasons.map((x) => x.code), ['LACKS_INSIGHT']);
});

const testatorCases = {
  spouse: 'TESTATOR_SPOUSE',
  sambo: 'TESTATOR_SAMBO',
  direct_line: 'TESTATOR_DIRECT_LINE',
  affinity: 'TESTATOR_AFFINITY',
  sibling: 'TESTATOR_SIBLING',
};
for (const [rel, code] of Object.entries(testatorCases)) {
  test(`relation to testator: ${rel}`, () => {
    const r = checkWitness({ age: 50, relationToTestator: rel });
    assert.equal(r.ok, false);
    assert.deepEqual(r.reasons.map((x) => x.code), [code]);
    assert.equal(r.reasons[0].scope, 'will');
  });
}

const beneficiaryCases = {
  self: 'BENEFICIARY_SELF',
  spouse: 'BENEFICIARY_SPOUSE',
  sambo: 'BENEFICIARY_SAMBO',
  direct_line: 'BENEFICIARY_DIRECT_LINE',
  affinity: 'BENEFICIARY_AFFINITY',
  sibling: 'BENEFICIARY_SIBLING',
  representative: 'BENEFICIARY_REPRESENTED',
  board_member: 'BENEFICIARY_BOARD_MEMBER',
};
for (const [rel, code] of Object.entries(beneficiaryCases)) {
  test(`relation to beneficiary: ${rel}`, () => {
    const r = checkWitness({ age: 50, relationToBeneficiary: rel });
    assert.equal(r.ok, false);
    assert.deepEqual(r.reasons.map((x) => x.code), [code]);
    assert.equal(r.reasons[0].scope, 'gift');
  });
}

test('testamentsexekutor is no obstacle', () => {
  assert.deepEqual(checkWitness({ age: 50, isExecutor: true, relationToTestator: 'none' }), { ok: true, reasons: [] });
});

test('several grounds are all reported, without duplicates', () => {
  const r = checkWitness({ age: 12, relationToTestator: ['direct_line', 'direct_line'], relationToBeneficiary: ['sibling', 'none'] });
  assert.deepEqual(r.reasons.map((x) => x.code), ['UNDER_15', 'TESTATOR_DIRECT_LINE', 'BENEFICIARY_SIBLING']);
});

test('unknown relation or bad age throws', () => {
  assert.throws(() => checkWitness({ relationToTestator: 'cousin' }), TypeError);
  assert.throws(() => checkWitness({ relationToBeneficiary: 'toString' }), TypeError);
  assert.throws(() => checkWitness({ age: NaN }), TypeError);
});

test('every disqualification has Swedish and English text and the lagrum', () => {
  const all = Object.values(WITNESS_DISQUALIFICATIONS);
  assert.equal(all.length, 15);
  for (const x of all) {
    assert.equal(x.lagrum, LAGRUM);
    assert.equal(x.lagrum, '10 kap. 4 § ärvdabalken');
    assert.ok(x.sv.length > 10 && x.en.length > 10);
    assert.ok(!/\u2014/.test(x.sv + x.en), 'no em dashes');
  }
});
