/**
 * IPS QR Code identification codes.
 *
 * - `PR` — Printed invoice/bill (štampani račun)
 * - `PT` — POS terminal, merchant shows QR
 * - `PK` — POS terminal, customer shows QR
 * - `EK` — E-commerce
 */
export type IpsCode = 'PR' | 'PT' | 'PK' | 'EK';

/**
 * Input options for generating an IPS QR code string.
 *
 * Supports both Serbian long names and short NBS tag names.
 */
export interface IpsOptions {
  /** Identification code (K). Default: `"PR"` */
  k?: IpsCode;
  kod?: IpsCode;

  /** Version (V). Fixed: `"01"` */
  v?: string;
  verzija?: string;

  /** Character set (C). Fixed: `"1"` (UTF-8) */
  c?: string;
  znakovniSkup?: string;

  /** Payee account number — 18 digits or short format (R). Required. */
  r: string;
  racunPrimaoca?: string;

  /** Payee name and address, max 70 chars, max 3 lines (N). Required. */
  n: string;
  nazivPrimaoca?: string;

  /** Amount in format `RSD{amount},{decimals}` (I). Required. */
  i: string;
  iznos?: string;

  /** Payer account number — 18 digits (O). Optional. */
  o?: string;
  racunPlatioca?: string;

  /** Payer name and address (P). Optional. */
  p?: string;
  nazivPlatioca?: string;

  /** Payment code — 3-digit, starts with 1 or 2 (SF). Required for PR. */
  sf?: string;
  sifraPlacanja?: string;

  /** Payment purpose, max 35 chars (S). Optional. */
  s?: string;
  svrhaPlacanja?: string;

  /** Merchant Category Code — 4-digit (M). Required for PT/PK/EK. */
  m?: string;

  /** One-time payer code — 5-digit TOTP (JS). Optional. */
  js?: string;
  jednokratnaSifra?: string;

  /** Payee reference / poziv na broj (RO). Optional, max 35 chars. */
  ro?: string;
  pozivNaBroj?: string;

  /** Payee supplementary reference (RL). Optional, max 140 chars. */
  rl?: string;
  referencaPrimaoca?: string;

  /** POS transaction reference — 19 digits (RP). Optional. */
  rp?: string;
  referencaPlacanja?: string;
}

/**
 * Normalized internal representation with only short tag keys.
 */
export interface IpsNormalized {
  k: IpsCode;
  v: string;
  c: string;
  r: string;
  n: string;
  i: string;
  o?: string;
  p?: string;
  sf?: string;
  s?: string;
  m?: string;
  js?: string;
  ro?: string;
  rl?: string;
  rp?: string;
}

/**
 * Options for QR code image generation.
 */
export interface QrImageOptions {
  /** Width in pixels. Default: 300 */
  width?: number;
  /** Error correction level. Default: `"M"` */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** Margin in modules. Default: 4 */
  margin?: number;
  /** Foreground color. Default: `"#000000"` */
  color?: string;
  /** Background color. Default: `"#ffffff"` */
  backgroundColor?: string;
}
