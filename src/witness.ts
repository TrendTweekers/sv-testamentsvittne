/**
 * Who may witness a Swedish will: 10 kap. 4 § ärvdabalken (1958:637).
 * Statute text: https://data.riksdagen.se/dokument/sfs-1958-637.text
 */

export const LAGRUM = '10 kap. 4 § ärvdabalken';

/**
 * - `will`: the person may not witness the will at all (10:4 first paragraph).
 * - `gift`: the person may not witness a provision (förordnande) in favour of
 *   that beneficiary (10:4 second paragraph).
 */
export type DisqualificationScope = 'will' | 'gift';

export type DisqualificationCode =
  | 'UNDER_15'
  | 'LACKS_INSIGHT'
  | 'TESTATOR_SPOUSE'
  | 'TESTATOR_SAMBO'
  | 'TESTATOR_DIRECT_LINE'
  | 'TESTATOR_AFFINITY'
  | 'TESTATOR_SIBLING'
  | 'BENEFICIARY_SELF'
  | 'BENEFICIARY_SPOUSE'
  | 'BENEFICIARY_SAMBO'
  | 'BENEFICIARY_DIRECT_LINE'
  | 'BENEFICIARY_AFFINITY'
  | 'BENEFICIARY_SIBLING'
  | 'BENEFICIARY_REPRESENTED'
  | 'BENEFICIARY_BOARD_MEMBER';

export interface Disqualification {
  code: DisqualificationCode;
  scope: DisqualificationScope;
  lagrum: string;
  sv: string;
  en: string;
}

const d = (code: DisqualificationCode, scope: DisqualificationScope, sv: string, en: string): Disqualification =>
  Object.freeze({ code, scope, lagrum: LAGRUM, sv, en });

/** Every ground in 10 kap. 4 § ärvdabalken that stops someone from being a witness. */
export const WITNESS_DISQUALIFICATIONS: Readonly<Record<DisqualificationCode, Disqualification>> = Object.freeze({
  UNDER_15: d('UNDER_15', 'will',
    'Den som är under 15 år får inte vara testamentsvittne.',
    'A person under 15 may not witness a will.'),
  LACKS_INSIGHT: d('LACKS_INSIGHT', 'will',
    'Den som på grund av en psykisk störning saknar insikt om betydelsen av vittnesbekräftelsen får inte vara testamentsvittne.',
    'A person who, because of a mental disorder, does not understand the meaning of witnessing may not witness a will.'),
  TESTATOR_SPOUSE: d('TESTATOR_SPOUSE', 'will',
    'Testatorns make får inte vara vittne.',
    "The testator's spouse may not be a witness."),
  TESTATOR_SAMBO: d('TESTATOR_SAMBO', 'will',
    'Testatorns sambo får inte vara vittne.',
    "The testator's cohabiting partner (sambo) may not be a witness."),
  TESTATOR_DIRECT_LINE: d('TESTATOR_DIRECT_LINE', 'will',
    'Den som är släkt med testatorn i rakt upp- eller nedstigande led (till exempel barn, barnbarn, förälder, far- eller morförälder) får inte vara vittne.',
    'A relative of the testator in the direct ascending or descending line (for example a child, grandchild, parent or grandparent) may not be a witness.'),
  TESTATOR_AFFINITY: d('TESTATOR_AFFINITY', 'will',
    'Den som står i rätt upp- eller nedstigande svågerlag till testatorn (till exempel svärförälder, svärbarn, styvbarn eller styvförälder) får inte vara vittne.',
    "A relative by marriage of the testator in the direct line (for example a parent-in-law, child-in-law, stepchild or stepparent) may not be a witness."),
  TESTATOR_SIBLING: d('TESTATOR_SIBLING', 'will',
    'Testatorns syskon får inte vara vittne.',
    "The testator's sibling may not be a witness."),
  BENEFICIARY_SELF: d('BENEFICIARY_SELF', 'gift',
    'Ingen får bevittna ett förordnande till sig själv.',
    'Nobody may witness a gift in the will to themselves.'),
  BENEFICIARY_SPOUSE: d('BENEFICIARY_SPOUSE', 'gift',
    'Ingen får bevittna ett förordnande till sin make.',
    'Nobody may witness a gift to their spouse.'),
  BENEFICIARY_SAMBO: d('BENEFICIARY_SAMBO', 'gift',
    'Ingen får bevittna ett förordnande till sin sambo.',
    'Nobody may witness a gift to their cohabiting partner (sambo).'),
  BENEFICIARY_DIRECT_LINE: d('BENEFICIARY_DIRECT_LINE', 'gift',
    'Ingen får bevittna ett förordnande till någon som är släkt med vittnet i rakt upp- eller nedstigande led.',
    'Nobody may witness a gift to a relative of theirs in the direct ascending or descending line.'),
  BENEFICIARY_AFFINITY: d('BENEFICIARY_AFFINITY', 'gift',
    'Ingen får bevittna ett förordnande till någon som står i rätt upp- eller nedstigande svågerlag till vittnet.',
    'Nobody may witness a gift to a relative of theirs by marriage in the direct line.'),
  BENEFICIARY_SIBLING: d('BENEFICIARY_SIBLING', 'gift',
    'Ingen får bevittna ett förordnande till sitt syskon.',
    'Nobody may witness a gift to their sibling.'),
  BENEFICIARY_REPRESENTED: d('BENEFICIARY_REPRESENTED', 'gift',
    'Den som är framtidsfullmaktshavare, förmyndare, god man eller förvaltare för någon får inte bevittna ett förordnande till denne.',
    'An attorney under a continuing power of attorney (framtidsfullmaktshavare), a guardian (förmyndare), a god man or a förvaltare may not witness a gift to the person they represent.'),
  BENEFICIARY_BOARD_MEMBER: d('BENEFICIARY_BOARD_MEMBER', 'gift',
    'En styrelseledamot får inte bevittna ett förordnande till det bolag, den förening, det trossamfund eller den stiftelse som han eller hon företräder.',
    'A board member may not witness a gift to the company, association, religious community or foundation they represent.'),
});

/** The witness's relation to the testator (the person making the will). */
export type TestatorRelation = 'none' | 'spouse' | 'sambo' | 'direct_line' | 'affinity' | 'sibling';

/**
 * The witness's relation to a beneficiary (someone who gets something under the will).
 * `self`: the witness is the beneficiary. `representative`: the witness is the
 * beneficiary's framtidsfullmaktshavare, förmyndare, god man or förvaltare.
 * `board_member`: the beneficiary is a company, förening, trossamfund or
 * stiftelse and the witness sits on its board.
 */
export type BeneficiaryRelation =
  | 'none'
  | 'self'
  | 'spouse'
  | 'sambo'
  | 'direct_line'
  | 'affinity'
  | 'sibling'
  | 'representative'
  | 'board_member';

export interface WitnessInput {
  /** Age in whole years on the day of witnessing. Omit if unknown (then not checked). */
  age?: number;
  /** True if a mental disorder means the person lacks insight into what witnessing means. */
  lacksInsight?: boolean;
  /** One or more relations to the testator. For a joint will, include relations to both testators. */
  relationToTestator?: TestatorRelation | TestatorRelation[];
  /** One or more relations to beneficiaries of the will. */
  relationToBeneficiary?: BeneficiaryRelation | BeneficiaryRelation[];
  /** Being named testamentsexekutor (executor) is no obstacle (10:4). Accepted for completeness; never disqualifies. */
  isExecutor?: boolean;
}

export interface WitnessResult {
  ok: boolean;
  reasons: Disqualification[];
}

const TESTATOR_MAP: Record<TestatorRelation, DisqualificationCode | null> = {
  none: null,
  spouse: 'TESTATOR_SPOUSE',
  sambo: 'TESTATOR_SAMBO',
  direct_line: 'TESTATOR_DIRECT_LINE',
  affinity: 'TESTATOR_AFFINITY',
  sibling: 'TESTATOR_SIBLING',
};

const BENEFICIARY_MAP: Record<BeneficiaryRelation, DisqualificationCode | null> = {
  none: null,
  self: 'BENEFICIARY_SELF',
  spouse: 'BENEFICIARY_SPOUSE',
  sambo: 'BENEFICIARY_SAMBO',
  direct_line: 'BENEFICIARY_DIRECT_LINE',
  affinity: 'BENEFICIARY_AFFINITY',
  sibling: 'BENEFICIARY_SIBLING',
  representative: 'BENEFICIARY_REPRESENTED',
  board_member: 'BENEFICIARY_BOARD_MEMBER',
};

function list<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

/**
 * Check one intended witness against 10 kap. 4 § ärvdabalken.
 * Throws a TypeError for an unknown relation value, so a typo never passes silently.
 */
export function checkWitness(input: WitnessInput): WitnessResult {
  const codes = new Set<DisqualificationCode>();
  if (input.age !== undefined) {
    if (typeof input.age !== 'number' || !Number.isFinite(input.age) || input.age < 0) {
      throw new TypeError(`checkWitness: invalid age ${String(input.age)}`);
    }
    if (input.age < 15) codes.add('UNDER_15');
  }
  if (input.lacksInsight) codes.add('LACKS_INSIGHT');
  for (const r of list(input.relationToTestator)) {
    if (!Object.prototype.hasOwnProperty.call(TESTATOR_MAP, r)) throw new TypeError(`checkWitness: unknown relationToTestator "${String(r)}"`);
    const c = TESTATOR_MAP[r];
    if (c) codes.add(c);
  }
  for (const r of list(input.relationToBeneficiary)) {
    if (!Object.prototype.hasOwnProperty.call(BENEFICIARY_MAP, r)) throw new TypeError(`checkWitness: unknown relationToBeneficiary "${String(r)}"`);
    const c = BENEFICIARY_MAP[r];
    if (c) codes.add(c);
  }
  const reasons = [...codes].map((c) => WITNESS_DISQUALIFICATIONS[c]);
  return { ok: reasons.length === 0, reasons };
}
