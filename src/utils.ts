/**
 * Bank account and reference number utilities for Serbian payment system.
 *
 * Implements ISO 7064 MOD 97-10 and MOD 11 control number algorithms
 * per NBS (Narodna Banka Srbije) regulations.
 *
 * References:
 * - Odluka o obliku, sadržini i načinu korišćenja obrazaca platnih naloga
 *   ("Sl. glasnik RS", br. 55/15, 78/15, 82/17, 65/18, 78/18, 22/19, 125/20)
 * - Pravilnik o uslovima i načinu vođenja računa za uplatu javnih prihoda
 *   ("Sl. glasnik RS", br. 16/16, 49/16, 107/16, 46/17, 114/17, 36/18,
 *    44/18, 104/18, 14/19, 33/19, 68/19)
 * - ISO 7064 97,10 (Data processing — Check character systems)
 */

import { IpsValidationError } from './errors.js';

// ─── Bank Account ───────────────────────────────────────────────

/**
 * Normalize a bank account number to the canonical 18-digit format.
 *
 * Accepts formats like:
 * - `"265-1234567890123-45"` (with dashes)
 * - `"265123456789012345"` (18 digits)
 * - `"265-123456-45"` (short notation, padded with leading zeros)
 *
 * Structure: [bank 3d][account 13d][control 2d]
 */
export function normalizeBankAccount(input: string): string {
  const numerals = input.replace(/[^0-9]/g, '');
  if (numerals.length < 6) {
    throw new IpsValidationError(
      `Bank account too short: "${input}". Must have at least bank (3) + control (2) digits.`,
    );
  }
  const bank = numerals.slice(0, 3);
  const control = numerals.slice(-2);
  const account = numerals.slice(3, -2);
  return `${bank}${account.padStart(13, '0')}${control}`;
}

/**
 * Calculate the 2-digit control number for a bank account.
 *
 * Uses ISO 7064 MOD 97-10:
 *   controlNumber = 98 - mod(first16digits * 100, 97)
 */
export function calculateBankAccountControlNumber(input: string): number {
  return 98 - modulo(input.slice(0, -2) + '00', 97);
}

/**
 * Validate a bank account control number.
 * Input must be exactly 18 digits (normalized).
 */
export function validateBankAccount(input: string): boolean {
  if (!/^[0-9]{18}$/.test(input)) return false;
  const controlNumber = parseInt(input.slice(-2), 10);
  const calculatedControlNumber = calculateBankAccountControlNumber(input);
  return controlNumber === calculatedControlNumber;
}

// ─── Reference Number (Poziv na Broj) ───────────────────────────

/**
 * Validate a reference number (poziv na broj) per NBS spec.
 *
 * Supports models:
 * - `97` — ISO 7064 MOD 97-10 control number
 * - `22` — MOD 11 control digit
 * - `11` — legacy model (passes through)
 * - `00` — no control number
 */
export function validateReferenceNumber(
  input: string | undefined,
): boolean {
  if (input === undefined || input === '') return true;

  const inputString = String(input);
  const model = inputString.slice(0, 2);

  switch (model) {
    case '97': {
      const sanitized = sanitize97(inputString);
      const control = sanitized.slice(2, 4);
      const pozivNaBroj = sanitized.slice(4);
      return parseInt(control, 10) === mod97(pozivNaBroj);
    }
    case '22': {
      const sanitized = sanitize22(inputString);
      const pozivNaBroj = sanitized.substring(5, sanitized.length - 1);
      const control = sanitized.slice(-1);
      return parseInt(control, 10) === mod22(pozivNaBroj);
    }
    case '00':
    case '11':
      return true;
    default:
      return true;
  }
}

/**
 * Prepend model `00` if the reference number doesn't start with a known model.
 */
export function normalizeReferenceNumber(input: string): string {
  const model = input.slice(0, 2);
  if (['97', '22', '11', '00'].includes(model)) {
    return input;
  }
  return `00${input}`;
}

// ─── Modulo Algorithms ──────────────────────────────────────────

/**
 * Large-number modulo for strings (handles numbers exceeding JS safe integer range).
 */
function modulo(dividend: string, divisor: number): number {
  const partLength = 10;
  let remaining = dividend;
  while (remaining.length > partLength) {
    const part = remaining.substring(0, partLength);
    remaining = (parseInt(part, 10) % divisor) + remaining.substring(partLength);
  }
  return parseInt(remaining, 10) % divisor;
}

/**
 * ISO 7064 MOD 97-10 control number calculation.
 *
 * Returns a 2-digit control number (0–96) for the given input string.
 */
export function mod97(input: string, base = 100): number {
  let controlNumber = 0;
  const digits = [...String(input)].reverse().map((c) => parseInt(c, 10));

  for (const digit of digits) {
    controlNumber = (controlNumber + base * digit) % 97;
    base = (base * 10) % 97;
  }

  return 98 - controlNumber;
}

/**
 * MOD 11 control digit calculation (model 22).
 *
 * Each digit is multiplied by its position (right to left, starting at 1),
 * products are summed, then: `(11 - (sum % 11)) % 10`.
 */
export function mod22(input: string): number {
  let controlNumber = 0;
  const digits = [...String(input)].reverse().map((c) => parseInt(c, 10));

  digits.forEach((digit, index) => {
    controlNumber += (index + 1) * digit;
  });

  controlNumber = 11 - (controlNumber % 11);
  return controlNumber % 10;
}

// ─── Sanitizers ─────────────────────────────────────────────────

/**
 * Sanitize input for MOD 97 validation.
 * Allows 0-9 and A-Z (letters converted to 10-35 per ISO 7064).
 * Strips spaces and dashes.
 *
 * Throws IpsValidationError on invalid characters (no `window.alert`).
 */
function sanitize97(input: string): string {
  let sanitized = '';
  const chars = [...String(input).toUpperCase().replace(/[ -]/g, '')];

  for (let index = 0; index < chars.length; index++) {
    const char = chars[index];
    const charCode = char.charCodeAt(0);

    if (charCode >= 65 && charCode <= 90) {
      // A-Z → 10-35
      sanitized += `${charCode - 55}`;
    } else if (charCode >= 48 && charCode <= 57) {
      // 0-9
      sanitized += `${charCode - 48}`;
    } else {
      throw new IpsValidationError(
        `Invalid character "${char}" at position ${index} in reference number (model 97). Only 0-9 and A-Z are allowed.`,
      );
    }
  }

  return sanitized;
}

/**
 * Sanitize input for MOD 22 validation.
 * Allows only 0-9. Strips spaces and dashes.
 *
 * Throws IpsValidationError on invalid characters.
 */
function sanitize22(input: string): string {
  let sanitized = '';
  const chars = [...String(input).replace(/[ -]/g, '')];

  for (let index = 0; index < chars.length; index++) {
    const char = chars[index];
    const charCode = char.charCodeAt(0);

    if (charCode >= 48 && charCode <= 57) {
      sanitized += `${charCode - 48}`;
    } else {
      throw new IpsValidationError(
        `Invalid character "${char}" at position ${index} in reference number (model 22). Only digits are allowed.`,
      );
    }
  }

  return sanitized;
}
