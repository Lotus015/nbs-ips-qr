/**
 * IPS QR code string and image generation.
 */

import type { IpsOptions, IpsNormalized, IpsCode, QrImageOptions } from './types.js';
import { validate } from './validate.js';

/** Ordered list of NBS IPS tags for the pipe-delimited string. */
const TAG_ORDER = ['k', 'v', 'c', 'r', 'n', 'i', 'o', 'p', 'sf', 's', 'm', 'js', 'ro', 'rl', 'rp'] as const;

/** Maps long Serbian/English option names to short NBS tag keys. */
const KEY_MAP: Record<string, string> = {
  kod: 'k',
  verzija: 'v',
  version: 'v',
  znakovniSkup: 'c',
  characterEncodingType: 'c',
  racunPrimaoca: 'r',
  nazivPrimaoca: 'n',
  iznos: 'i',
  racunPlatioca: 'o',
  nazivPlatioca: 'p',
  sifraPlacanja: 'sf',
  svrhaPlacanja: 's',
  merchantCodeCategory: 'm',
  jednokratnaSifra: 'js',
  pozivNaBroj: 'ro',
  referencaPrimaoca: 'rl',
  referencaPlacanja: 'rp',
};

/**
 * Normalize options: remap long keys to short tags + apply defaults.
 */
function normalizeOptions(options: IpsOptions): IpsNormalized {
  const result: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(options)) {
    const mappedKey = KEY_MAP[key] || key;
    // Don't overwrite if already set (short key takes precedence)
    if (value !== undefined && result[mappedKey] === undefined) {
      result[mappedKey] = String(value);
    }
  }

  return {
    k: (result.k as IpsCode) || 'PR',
    v: result.v || '01',
    c: result.c || '1',
    r: result.r || '',
    n: result.n || '',
    i: result.i || '',
    o: result.o,
    p: result.p,
    sf: result.sf,
    s: result.s,
    m: result.m,
    js: result.js,
    ro: result.ro,
    rl: result.rl,
    rp: result.rp,
  };
}

/**
 * Generate an NBS IPS QR code data string.
 *
 * Validates all fields per the NBS specification and returns
 * a pipe-delimited string like:
 * ```
 * K:PR|V:01|C:1|R:160000012345678900|N:Firma DOO|I:RSD1000,00|SF:289
 * ```
 *
 * @throws {IpsValidationError} if any field is invalid
 *
 * @example
 * ```ts
 * const ipsString = generateIpsString({
 *   r: '160-123456-90',
 *   n: 'Firma DOO, Beograd',
 *   i: 'RSD1500,00',
 *   sf: '289',
 *   s: 'Uplata po fakturi 001',
 * });
 * ```
 */
export function generateIpsString(options: IpsOptions): string {
  const normalized = normalizeOptions(options);
  const validated = validate(normalized);

  return TAG_ORDER
    .map((tag) => {
      const value = validated[tag];
      if (value === undefined || value === '') return undefined;
      // Pipe chars inside values replaced with dash per NBS spec
      return `${tag.toUpperCase()}:${String(value).replace(/\|/g, '-')}`;
    })
    .filter(Boolean)
    .join('|');
}

/**
 * Generate an NBS IPS QR code as a base64 data URI (PNG).
 *
 * Suitable for embedding in PDFs, HTML img tags, etc.
 *
 * @example
 * ```ts
 * const dataUri = await generateIpsQrDataUri({
 *   r: '160-123456-90',
 *   n: 'Firma DOO, Beograd',
 *   i: 'RSD1500,00',
 *   sf: '289',
 * });
 * // => "data:image/png;base64,iVBOR..."
 * ```
 */
export async function generateIpsQrDataUri(
  options: IpsOptions,
  qrOptions?: QrImageOptions,
): Promise<string> {
  const ipsString = generateIpsString(options);
  const QRCode = await import('qrcode');
  return QRCode.toDataURL(ipsString, {
    width: qrOptions?.width ?? 300,
    errorCorrectionLevel: qrOptions?.errorCorrectionLevel ?? 'M',
    margin: qrOptions?.margin ?? 4,
    color: {
      dark: qrOptions?.color ?? '#000000',
      light: qrOptions?.backgroundColor ?? '#ffffff',
    },
  });
}

/**
 * Generate an NBS IPS QR code as a PNG buffer.
 *
 * Useful for server-side PDF generation, file writing, etc.
 *
 * @example
 * ```ts
 * const buffer = await generateIpsQrBuffer({
 *   r: '160-123456-90',
 *   n: 'Firma DOO, Beograd',
 *   i: 'RSD1500,00',
 *   sf: '289',
 * });
 * fs.writeFileSync('qr.png', buffer);
 * ```
 */
export async function generateIpsQrBuffer(
  options: IpsOptions,
  qrOptions?: QrImageOptions,
): Promise<Buffer> {
  const ipsString = generateIpsString(options);
  const QRCode = await import('qrcode');
  return QRCode.toBuffer(ipsString, {
    width: qrOptions?.width ?? 300,
    errorCorrectionLevel: qrOptions?.errorCorrectionLevel ?? 'M',
    margin: qrOptions?.margin ?? 4,
    color: {
      dark: qrOptions?.color ?? '#000000',
      light: qrOptions?.backgroundColor ?? '#ffffff',
    },
  });
}

/**
 * Generate an NBS IPS QR code as an SVG string.
 *
 * @example
 * ```ts
 * const svg = await generateIpsQrSvg({
 *   r: '160-123456-90',
 *   n: 'Firma DOO, Beograd',
 *   i: 'RSD1500,00',
 *   sf: '289',
 * });
 * ```
 */
export async function generateIpsQrSvg(
  options: IpsOptions,
  qrOptions?: QrImageOptions,
): Promise<string> {
  const ipsString = generateIpsString(options);
  const QRCode = await import('qrcode');
  return QRCode.toString(ipsString, {
    type: 'svg',
    width: qrOptions?.width ?? 300,
    errorCorrectionLevel: qrOptions?.errorCorrectionLevel ?? 'M',
    margin: qrOptions?.margin ?? 4,
    color: {
      dark: qrOptions?.color ?? '#000000',
      light: qrOptions?.backgroundColor ?? '#ffffff',
    },
  });
}
