import { describe, it, expect } from 'vitest';
import {
  normalizeBankAccount,
  validateBankAccount,
  calculateBankAccountControlNumber,
  validateReferenceNumber,
  normalizeReferenceNumber,
  mod97,
  mod22,
} from './utils';

describe('normalizeBankAccount', () => {
  it('normalizes dash-separated format', () => {
    // 265-1234-88 → bank=265, account=1234 (padded to 13), control=88
    const result = normalizeBankAccount('265-1234-88');
    expect(result).toBe('265000000000123488');
    expect(result).toHaveLength(18);
    expect(result.slice(0, 3)).toBe('265');
    expect(result.slice(-2)).toBe('88');
  });

  it('passes through 18-digit input', () => {
    expect(normalizeBankAccount('160000000012345678')).toBe('160000000012345678');
  });

  it('normalizes short format with padding', () => {
    // 200-123456-00 → bank=200, account=123456 (padded to 13), control=00
    const result = normalizeBankAccount('200-123456-00');
    expect(result).toBe('200000000012345600');
    expect(result).toHaveLength(18);
    expect(result.slice(0, 3)).toBe('200');
    expect(result.slice(-2)).toBe('00');
  });

  it('throws on too-short input', () => {
    expect(() => normalizeBankAccount('12')).toThrow();
  });
});

describe('validateBankAccount', () => {
  it('validates a known-good account', () => {
    // EPS account from the NBS example
    expect(validateBankAccount('845000000040484987')).toBe(true);
  });

  it('rejects invalid control number', () => {
    expect(validateBankAccount('845000000040484999')).toBe(false);
  });

  it('rejects non-18-digit input', () => {
    expect(validateBankAccount('12345')).toBe(false);
    expect(validateBankAccount('abcdefghijklmnopqr')).toBe(false);
  });
});

describe('calculateBankAccountControlNumber', () => {
  it('calculates correct control for known account', () => {
    const control = calculateBankAccountControlNumber('845000000040484987');
    expect(control).toBe(87);
  });
});

describe('validateReferenceNumber', () => {
  it('returns true for undefined/empty', () => {
    expect(validateReferenceNumber(undefined)).toBe(true);
    expect(validateReferenceNumber('')).toBe(true);
  });

  it('returns true for model 00 (no control)', () => {
    expect(validateReferenceNumber('001234567890')).toBe(true);
  });

  it('validates model 97 reference', () => {
    // This requires a valid MOD 97 control number
    // Model 97: control = mod97(pozivNaBroj)
    expect(validateReferenceNumber('97163220000111111111000')).toBe(true);
  });

  it('returns true for model 11', () => {
    expect(validateReferenceNumber('111234567890')).toBe(true);
  });
});

describe('normalizeReferenceNumber', () => {
  it('prepends 00 for unknown model', () => {
    expect(normalizeReferenceNumber('1234567890')).toBe('001234567890');
  });

  it('preserves known models', () => {
    expect(normalizeReferenceNumber('971234567890')).toBe('971234567890');
    expect(normalizeReferenceNumber('221234567890')).toBe('221234567890');
    expect(normalizeReferenceNumber('001234567890')).toBe('001234567890');
    expect(normalizeReferenceNumber('111234567890')).toBe('111234567890');
  });
});

describe('mod97', () => {
  it('calculates correct control number', () => {
    // Known test case from the original library
    const result = mod97('3220000111111111000');
    expect(result).toBe(16);
  });
});

describe('mod22', () => {
  it('calculates correct control digit', () => {
    // For input 2345671: 1*1 + 7*2 + 6*3 + 5*4 + 4*5 + 3*6 + 2*7 = 105
    // 105 % 11 = 6, 11 - 6 = 5, 5 % 10 = 5
    expect(mod22('2345671')).toBe(5);
  });
});
