export {
  normalizePersonnummer,
  isValidPersonnummer,
  isSamordningsnummer,
  ageFromPersonnummer,
} from './personnummer.js';

export {
  checkWitness,
  WITNESS_DISQUALIFICATIONS,
  LAGRUM,
} from './witness.js';

export type {
  Disqualification,
  DisqualificationCode,
  DisqualificationScope,
  TestatorRelation,
  BeneficiaryRelation,
  WitnessInput,
  WitnessResult,
} from './witness.js';
