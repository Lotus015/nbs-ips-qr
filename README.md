# nbs-ips-qr

NBS IPS QR code generator for the Serbian payment system. TypeScript-first, server-safe, zero `window` dependencies.

Generate QR codes that Serbian banking apps can scan to auto-fill payment orders — the standard QR you see on every Serbian invoice.

## Features

- **Full NBS IPS spec** — all 15 tags, correct field ordering, pipe-delimited format
- **Bank account validation** — ISO 7064 MOD 97-10 control number verification
- **Reference number validation** — models 97, 22, 11, 00
- **Server-safe** — no `window.alert`, no browser APIs, works in Node.js/NestJS/Next.js
- **TypeScript** — full type definitions, IntelliSense support
- **Multiple output formats** — string, data URI (base64 PNG), PNG buffer, SVG
- **Amount formatting helper** — converts numbers to NBS format (`RSD1500,50`)
- **Dual ESM/CJS** — works with both `import` and `require`

## Install

```bash
npm install nbs-ips-qr
```

## Quick Start

```typescript
import { generateIpsString, generateIpsQrDataUri, formatIpsAmount } from 'nbs-ips-qr';

// Generate just the IPS string
const ipsString = generateIpsString({
  r: '845000000040484987',       // payee account (18 digits or dash format)
  n: 'JP EPS BEOGRAD',           // payee name
  i: 'RSD3596,13',               // amount (NBS format)
  sf: '189',                     // payment code
  s: 'Uplata po racunu',         // payment purpose
  ro: '97163220000111111111000',  // poziv na broj (optional)
});
// => "K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3596,13|SF:189|S:Uplata po racunu|RO:97163220000111111111000"

// Generate a QR code as base64 data URI (for PDFs, HTML img tags)
const dataUri = await generateIpsQrDataUri({
  r: '160-123456-90',
  n: 'Firma DOO, Beograd',
  i: formatIpsAmount(1500.50),  // => "RSD1500,50"
  sf: '289',
});
// => "data:image/png;base64,iVBOR..."

// Use Serbian long param names
const ipsString2 = generateIpsString({
  racunPrimaoca: '845000000040484987',
  nazivPrimaoca: 'JP EPS BEOGRAD',
  iznos: 'RSD3596,13',
  sifraPlacanja: '189',
  svrhaPlacanja: 'Uplata po racunu',
  pozivNaBroj: '97163220000111111111000',
});
```

## API

### `generateIpsString(options): string`

Generates the NBS IPS pipe-delimited string. Validates all fields. Throws `IpsValidationError` on invalid input.

### `generateIpsQrDataUri(options, qrOptions?): Promise<string>`

Generates a QR code as a base64 PNG data URI. Perfect for embedding in PDFs or HTML.

### `generateIpsQrBuffer(options, qrOptions?): Promise<Buffer>`

Generates a QR code as a PNG buffer. For server-side file writing.

### `generateIpsQrSvg(options, qrOptions?): Promise<string>`

Generates a QR code as an SVG string.

### `formatIpsAmount(amount, currency?): string`

Converts a number to NBS amount format: `formatIpsAmount(1500.5)` → `"RSD1500,50"`.

### Validation utilities

```typescript
import {
  validateBankAccount,     // check 18-digit account control number
  normalizeBankAccount,    // "265-1234-88" → "265000000000123488"
  validateReferenceNumber, // check poziv na broj by model (97/22/11/00)
} from 'nbs-ips-qr';
```

## IPS Options

| Option | Tag | Required | Description |
|--------|-----|----------|-------------|
| `r` / `racunPrimaoca` | R | Yes | Payee account — 18 digits or dash format |
| `n` / `nazivPrimaoca` | N | Yes | Payee name & address (max 70 chars, max 3 lines) |
| `i` / `iznos` | I | Yes | Amount: `{CCY}{digits},{decimals}` e.g. `RSD1000,00` |
| `sf` / `sifraPlacanja` | SF | PR | Payment code — 3 digits, first digit 1 or 2 |
| `s` / `svrhaPlacanja` | S | No | Payment purpose (max 35 chars) |
| `ro` / `pozivNaBroj` | RO | No | Reference number with model prefix (max 35) |
| `k` / `kod` | K | No | Code type: `PR` (default), `PT`, `PK`, `EK` |
| `o` / `racunPlatioca` | O | No | Payer account |
| `p` / `nazivPlatioca` | P | No | Payer name (max 70 chars) |
| `m` | M | PT/PK/EK | Merchant Category Code (4 digits) |
| `js` / `jednokratnaSifra` | JS | No | One-time TOTP code (5 digits) |
| `rl` / `referencaPrimaoca` | RL | No | Supplementary payee reference (max 140) |
| `rp` / `referencaPlacanja` | RP | No | POS transaction reference (19 digits) |

## QR Image Options

```typescript
{
  width: 300,                // pixels (default: 300)
  errorCorrectionLevel: 'M', // 'L' | 'M' | 'Q' | 'H' (default: 'M')
  margin: 4,                 // quiet zone in modules (default: 4)
  color: '#000000',          // foreground color
  backgroundColor: '#ffffff', // background color
}
```

## Common Payment Codes (SF)

| Code | Description |
|------|-------------|
| `189` | Električna energija |
| `221` | Komunalne usluge |
| `289` | Ostale usluge (most common for B2B invoices) |
| `290` | Ostali prihodi |

## Differences from `ips-qr-code`

This is a clean-room TypeScript reimplementation inspired by [ArtBIT/ips-qr-code](https://github.com/ArtBIT/ips-qr-code). Key improvements:

- **No `window.alert`** — the original crashes in Node.js when sanitizing reference numbers with invalid characters. We throw proper `IpsValidationError` instead.
- **TypeScript-first** — full type definitions, not a JS-with-types-bolted-on approach
- **No yup dependency** — validation is built-in, no external schema library
- **Integrated QR generation** — data URI, buffer, and SVG output built in
- **Amount formatting helper** — `formatIpsAmount()` handles the decimal comma conversion
- **Dual ESM/CJS** — works with both module systems out of the box

## License

MIT
