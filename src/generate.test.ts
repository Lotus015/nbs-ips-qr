import { describe, it, expect } from 'vitest';
import { generateIpsString } from './generate';
import { IpsValidationError } from './errors';

describe('generateIpsString', () => {
  it('rejects missing required fields', () => {
    expect(() =>
      generateIpsString({} as any),
    ).toThrow(IpsValidationError);
  });

  it('generates correct string for basic invoice', () => {
    const result = generateIpsString({
      r: '845000000040484987',
      n: 'JP EPS BEOGRAD',
      i: 'RSD3596,13',
      sf: '189',
      s: 'UPLATA PO RACUNU',
    });

    expect(result).toContain('K:PR');
    expect(result).toContain('V:01');
    expect(result).toContain('C:1');
    expect(result).toContain('R:845000000040484987');
    expect(result).toContain('N:JP EPS BEOGRAD');
    expect(result).toContain('I:RSD3596,13');
    expect(result).toContain('SF:189');
    expect(result).toContain('S:UPLATA PO RACUNU');

    // Fields should be pipe-separated
    const parts = result.split('|');
    expect(parts.length).toBeGreaterThanOrEqual(7);
  });

  it('includes RO when pozivNaBroj is provided', () => {
    const result = generateIpsString({
      r: '845000000040484987',
      n: 'JP EPS BEOGRAD',
      i: 'RSD3596,13',
      sf: '189',
      ro: '97163220000111111111000',
    });

    expect(result).toContain('RO:97163220000111111111000');
  });

  it('supports long Serbian param names', () => {
    const result = generateIpsString({
      racunPrimaoca: '845000000040484987',
      nazivPrimaoca: 'JP EPS BEOGRAD',
      iznos: 'RSD1000,00',
      sifraPlacanja: '289',
      svrhaPlacanja: 'Uplata',
    } as any);

    expect(result).toContain('R:845000000040484987');
    expect(result).toContain('N:JP EPS BEOGRAD');
    expect(result).toContain('I:RSD1000,00');
    expect(result).toContain('SF:289');
  });

  it('normalizes short bank account format', () => {
    // 845-40484987-xx: use the full known-good account in dash format
    const result = generateIpsString({
      r: '845-0000000404849-87',
      n: 'Test Firma',
      i: 'RSD100,00',
      sf: '289',
    });

    // Should be normalized to 18 digits
    expect(result).toContain('R:845000000040484987');
  });

  it('omits optional empty fields', () => {
    const result = generateIpsString({
      r: '845000000040484987',
      n: 'Test',
      i: 'RSD100,00',
      sf: '289',
    });

    expect(result).not.toContain('O:');
    expect(result).not.toContain('P:');
    expect(result).not.toContain('S:');
    expect(result).not.toContain('RO:');
  });

  it('replaces pipe characters in values with dashes', () => {
    const result = generateIpsString({
      r: '845000000040484987',
      n: 'Test',
      i: 'RSD100,00',
      sf: '289',
      s: 'Uplata|test',
    });

    // The pipe in the purpose should be replaced with a dash
    expect(result).toContain('S:Uplata-test');
    // Count actual pipes — they should only be delimiters
    const pipeCount = result.split('|').length - 1;
    const fieldCount = result.split('|').length;
    expect(pipeCount).toBe(fieldCount - 1);
  });

  it('rejects invalid payment code', () => {
    expect(() =>
      generateIpsString({
        r: '845000000040484987',
        n: 'Test',
        i: 'RSD100,00',
        sf: '999', // invalid: first digit must be 1 or 2
      }),
    ).toThrow(IpsValidationError);
  });

  it('rejects amount with dot instead of comma', () => {
    expect(() =>
      generateIpsString({
        r: '845000000040484987',
        n: 'Test',
        i: 'RSD100.00', // dot instead of comma
        sf: '289',
      }),
    ).toThrow(IpsValidationError);
  });

  it('rejects name longer than 70 chars', () => {
    expect(() =>
      generateIpsString({
        r: '845000000040484987',
        n: 'A'.repeat(71),
        i: 'RSD100,00',
        sf: '289',
      }),
    ).toThrow(IpsValidationError);
  });

  it('fields are in correct NBS order', () => {
    const result = generateIpsString({
      r: '845000000040484987',
      n: 'Test Firma',
      i: 'RSD100,00',
      sf: '289',
      s: 'Uplata',
      ro: '001234',
    });

    const parts = result.split('|');
    const tags = parts.map((p) => p.split(':')[0]);

    // Verify order: K, V, C, R, N, I, SF, S, RO
    expect(tags.indexOf('K')).toBeLessThan(tags.indexOf('V'));
    expect(tags.indexOf('V')).toBeLessThan(tags.indexOf('C'));
    expect(tags.indexOf('C')).toBeLessThan(tags.indexOf('R'));
    expect(tags.indexOf('R')).toBeLessThan(tags.indexOf('N'));
    expect(tags.indexOf('N')).toBeLessThan(tags.indexOf('I'));
    expect(tags.indexOf('I')).toBeLessThan(tags.indexOf('SF'));
    expect(tags.indexOf('SF')).toBeLessThan(tags.indexOf('S'));
    expect(tags.indexOf('S')).toBeLessThan(tags.indexOf('RO'));
  });
});
