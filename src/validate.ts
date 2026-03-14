/**
 * Validation for IPS QR code fields per NBS specification.
 *
 * No external validation library (yup/zod) — just clean TypeScript.
 */

import type { IpsNormalized } from './types.js';
import { IpsValidationError } from './errors.js';
import {
  normalizeBankAccount,
  validateBankAccount,
  validateReferenceNumber,
  normalizeReferenceNumber,
} from './utils.js';

/** Allowed characters in payee/payer name per NBS spec. */
const NAME_REGEX =
  /^[a-zA-ZšđžčćŠĐŽČĆ0-9 (){}\[\]<\/\.,:;!@#$%^&?„"""`'''_~=+\-\r\n]+$/;

/** Amount format: 3-letter currency code + digits + comma + 0-2 decimals */
const AMOUNT_REGEX = /^[A-Z]{3}[0-9]+,[0-9]{0,2}$/;

/** Payment code: 3 digits, first must be 1 or 2 */
const PAYMENT_CODE_REGEX = /^[12][0-9]{2}$/;

/**
 * Validate and normalize IPS options. Returns cleaned values ready for string building.
 *
 * Throws `IpsValidationError` on any invalid field.
 */
export function validate(options: IpsNormalized): IpsNormalized {
  const result = { ...options };

  // K — identification code
  if (!['PR', 'PT', 'PK', 'EK'].includes(result.k)) {
    throw new IpsValidationError(
      `Invalid identification code "${result.k}". Must be one of: PR, PT, PK, EK.`,
    );
  }

  // V — version
  if (result.v !== '01') {
    throw new IpsValidationError(
      `Invalid version "${result.v}". Must be "01".`,
    );
  }

  // C — character set
  if (result.c !== '1') {
    throw new IpsValidationError(
      `Invalid character set "${result.c}". Must be "1" (UTF-8).`,
    );
  }

  // R — payee account (required)
  if (!result.r) {
    throw new IpsValidationError('Payee account number (r) is required.');
  }
  result.r = normalizeBankAccount(result.r);
  if (!validateBankAccount(result.r)) {
    throw new IpsValidationError(
      `Invalid payee bank account "${result.r}". Control number check failed.`,
    );
  }

  // O — payer account (optional)
  if (result.o) {
    result.o = normalizeBankAccount(result.o);
    if (!validateBankAccount(result.o)) {
      throw new IpsValidationError(
        `Invalid payer bank account "${result.o}". Control number check failed.`,
      );
    }
  }

  // N — payee name (required)
  if (!result.n || result.n.length === 0) {
    throw new IpsValidationError('Payee name (n) is required.');
  }
  if (result.n.length > 70) {
    throw new IpsValidationError(
      `Payee name too long (${result.n.length} chars). Max 70.`,
    );
  }
  if (!NAME_REGEX.test(result.n)) {
    throw new IpsValidationError(
      'Payee name contains invalid characters. Only letters (including Serbian), digits, and select punctuation are allowed.',
    );
  }
  const nameLines = result.n.split('\n').length;
  if (nameLines > 3) {
    throw new IpsValidationError(
      `Payee name has ${nameLines} lines. Max 3.`,
    );
  }

  // P — payer name (optional)
  if (result.p !== undefined && result.p.length > 70) {
    throw new IpsValidationError(
      `Payer name too long (${result.p.length} chars). Max 70.`,
    );
  }

  // I — amount (required)
  if (!result.i) {
    throw new IpsValidationError('Amount (i) is required.');
  }
  if (result.i.length < 5 || result.i.length > 20) {
    throw new IpsValidationError(
      `Amount "${result.i}" has invalid length. Must be 5-20 chars.`,
    );
  }
  if (!AMOUNT_REGEX.test(result.i)) {
    throw new IpsValidationError(
      `Invalid amount format "${result.i}". Expected format: RSD1000,00 (currency code + digits + comma + 0-2 decimals).`,
    );
  }

  // SF — payment code (required for PR)
  if (result.k === 'PR') {
    if (!result.sf) {
      throw new IpsValidationError(
        'Payment code (sf) is required for PR type invoices.',
      );
    }
  }
  if (result.sf) {
    if (result.sf.length !== 3 || !PAYMENT_CODE_REGEX.test(result.sf)) {
      throw new IpsValidationError(
        `Invalid payment code "${result.sf}". Must be 3 digits, first digit 1 or 2.`,
      );
    }
  }

  // S — payment purpose (optional)
  if (result.s !== undefined && result.s.length > 35) {
    throw new IpsValidationError(
      `Payment purpose too long (${result.s.length} chars). Max 35.`,
    );
  }

  // M — merchant category code (required for PT/PK/EK)
  if (['PT', 'PK', 'EK'].includes(result.k) && !result.m) {
    throw new IpsValidationError(
      `Merchant category code (m) is required for ${result.k} type.`,
    );
  }
  if (result.m) {
    if (!/^[0-9]{4}$/.test(result.m)) {
      throw new IpsValidationError(
        `Invalid merchant category code "${result.m}". Must be exactly 4 digits.`,
      );
    }
  }

  // JS — one-time code (optional)
  if (result.js) {
    if (!/^[0-9]{5}$/.test(result.js)) {
      throw new IpsValidationError(
        `Invalid one-time code "${result.js}". Must be exactly 5 digits.`,
      );
    }
  }

  // RO — reference number (optional)
  if (result.ro) {
    if (result.ro.length > 35) {
      throw new IpsValidationError(
        `Reference number too long (${result.ro.length} chars). Max 35.`,
      );
    }
    result.ro = normalizeReferenceNumber(result.ro);
    if (!validateReferenceNumber(result.ro)) {
      throw new IpsValidationError(
        `Invalid reference number "${result.ro}". Control number check failed for the declared model.`,
      );
    }
  }

  // RL — payee reference (optional)
  if (result.rl !== undefined && result.rl.length > 140) {
    throw new IpsValidationError(
      `Payee reference too long (${result.rl.length} chars). Max 140.`,
    );
  }

  // RP — POS reference (optional)
  if (result.rp) {
    if (!/^[0-9]{19}$/.test(result.rp)) {
      throw new IpsValidationError(
        `Invalid POS reference "${result.rp}". Must be exactly 19 digits.`,
      );
    }
  }

  return result;
}
