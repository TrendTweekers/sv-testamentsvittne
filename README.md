# sv-testamentsvittne

Small, dependency-free TypeScript library for two Swedish legal checks:

1. **Personnummer**: validate and normalise Swedish personal identity numbers and samordningsnummer (Luhn check digit, real calendar date, correct century) and get a person's age.
2. **Will witnesses**: check if a person may witness a Swedish will (testamente) under [10 kap. 4 § ärvdabalken](https://data.riksdagen.se/dokument/sfs-1958-637.text), with the reason in Swedish and English.

ESM, TypeScript types included, zero runtime dependencies.

## Install

Install from GitHub (the package is not on npm):

```sh
npm i github:TrendTweekers/sv-testamentsvittne
```

## Personnummer

```ts
import {
  normalizePersonnummer,
  isValidPersonnummer,
  isSamordningsnummer,
  ageFromPersonnummer,
} from 'sv-testamentsvittne';

normalizePersonnummer('121212-1212');   // '20121212-1212'
normalizePersonnummer('121212+1212');   // '19121212-1212'  ('+' = 100 years or older)
normalizePersonnummer('191212121212');  // '19121212-1212'
normalizePersonnummer('121212-1213');   // null (wrong check digit)

isValidPersonnummer('19121212-1212');   // true
isSamordningsnummer('901272-1230');     // true (day of month + 60)

ageFromPersonnummer('19800615-1230', '2026-06-15'); // 46
```

Rules:

- Input: 10 or 12 digits, with or without `-` or `+`. Spaces are ignored. Output is always `YYYYMMDD-XXXX`.
- The last digit must pass the Luhn check, and the date must exist (samordningsnummer: day + 60).
- For the 10-digit form, the century comes from the full birth **date**, not only the year. A person born on 15 December 1926 who writes `261215-XXXX` in October 2026 is 99 years old, not a person born in the future. A `+` adds 100 years.
- `normalizePersonnummer(raw, today?)` takes an optional reference date (default: now). `ageFromPersonnummer(pnr, onIso)` uses `onIso` as the reference date.

## Will witnesses

```ts
import { checkWitness, ageFromPersonnummer } from 'sv-testamentsvittne';

checkWitness({
  age: ageFromPersonnummer('19800615-1230', '2026-10-07') ?? undefined,
  relationToTestator: 'none',
  relationToBeneficiary: 'none',
  isExecutor: true, // being testamentsexekutor is no obstacle
});
// { ok: true, reasons: [] }

checkWitness({ age: 14, relationToTestator: 'sibling' });
// {
//   ok: false,
//   reasons: [
//     { code: 'UNDER_15', scope: 'will', lagrum: '10 kap. 4 § ärvdabalken',
//       sv: 'Den som är under 15 år får inte vara testamentsvittne.',
//       en: 'A person under 15 may not witness a will.' },
//     { code: 'TESTATOR_SIBLING', scope: 'will', ... }
//   ]
// }
```

### Input

| Field | Values |
| --- | --- |
| `age` | Age in whole years on the day of witnessing. Omit if unknown. |
| `lacksInsight` | `true` if a mental disorder means the person does not understand what witnessing means. |
| `relationToTestator` | `'none' \| 'spouse' \| 'sambo' \| 'direct_line' \| 'affinity' \| 'sibling'`, or an array. For a joint will, give relations to both testators. |
| `relationToBeneficiary` | `'none' \| 'self' \| 'spouse' \| 'sambo' \| 'direct_line' \| 'affinity' \| 'sibling' \| 'representative' \| 'board_member'`, or an array. |
| `isExecutor` | Accepted, never disqualifies. |

An unknown relation value throws a `TypeError`, so a typo cannot pass silently.

Each reason has a `scope`: `'will'` means the person may not witness the will at all. `'gift'` means the person may not witness a provision (förordnande) in favour of that beneficiary.

`WITNESS_DISQUALIFICATIONS` exports all 15 grounds as data (`code`, `scope`, `lagrum`, `sv`, `en`), for example to build a form or a printed checklist.

### The legal rules (10 kap. 4 § ärvdabalken)

Source: ärvdabalken (1958:637), 10 kap. 1-4 §§, [full text at riksdagen.se](https://data.riksdagen.se/dokument/sfs-1958-637.text). A will must be in writing and signed in front of two witnesses who are present at the same time (10:1). Under 10:4:

**May not witness the will at all:**
- A person under 15.
- A person who, because of a mental disorder (psykisk störning), lacks insight into what witnessing means.
- The testator's spouse (make) or cohabiting partner (sambo).
- A relative of the testator in the direct line, up or down (for example parent, grandparent, child, grandchild).
- A person related to the testator by marriage in the direct line (svågerlag, for example parent-in-law, child-in-law, stepchild, stepparent).
- The testator's sibling (syskon).

**May not witness a gift (förordnande) in the will:**
- To themselves, or to their spouse, sambo, sibling, a relative in the direct line, or a relative by marriage in the direct line.
- To a person they represent as framtidsfullmaktshavare, förmyndare, god man or förvaltare.
- To a company, association (förening), religious community (trossamfund) or foundation (stiftelse) where they are a board member.

**No obstacle:** being named testamentsexekutor (executor).

## Not legal advice

This library encodes the text of the statute. It does not give legal advice and does not replace a lawyer. It cannot see facts it is not given, and courts decide disputes about a will. Read the statute yourself and get advice when the case is not simple.

## På svenska

`sv-testamentsvittne` är ett litet TypeScript-bibliotek utan beroenden som:

- kontrollerar och normaliserar personnummer och samordningsnummer (kontrollsiffra, datum, rätt sekel, även `+` för den som fyllt 100) och räknar ut ålder;
- kontrollerar om en person får vara testamentsvittne enligt 10 kap. 4 § ärvdabalken och anger skälet på svenska och engelska.

**Får inte vara vittne alls:** den som är under 15 år; den som på grund av en psykisk störning saknar insikt om betydelsen av vittnesbekräftelsen; testatorns make eller sambo; den som är släkt med testatorn i rakt upp- eller nedstigande led eller står i sådant svågerlag till testatorn; testatorns syskon.

**Får inte bevittna ett förordnande:** till sig själv, sin make, sambo, sitt syskon eller någon som är släkt med vittnet i rakt led eller står i svågerlag i rakt led till vittnet; till den som vittnet är framtidsfullmaktshavare, förmyndare, god man eller förvaltare för; till ett bolag, en förening, ett trossamfund eller en stiftelse där vittnet sitter i styrelsen.

**Inget hinder:** att vara testamentsexekutor.

Lagtext: [ärvdabalken (1958:637) hos riksdagen](https://data.riksdagen.se/dokument/sfs-1958-637.text). Biblioteket är inte juridisk rådgivning.

Installera: `npm i github:TrendTweekers/sv-testamentsvittne`

## Development

```sh
npm install
npm test   # builds with tsc, then runs node:test
```

## Licence

MIT, copyright Vittnet.

Used in production at [Vittnet](https://vittnet.nu/testamente), a Swedish service for wills, cohabitation agreements and gift deeds.
