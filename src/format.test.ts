import { describe, it, expect } from 'vitest';
import { formatIpsAmount, formatBankAccount } from './format';

describe('formatIpsAmount', () => {
  it('formats integer amount', () => {
    expect(formatIpsAmount(1500)).toBe('RSD1500,00');
  });

  it('formats amount with one decimal', () => {
    expect(formatIpsAmount(1500.5)).toBe('RSD1500,50');
  });

  it('formats amount with two decimals', () => {
    expect(formatIpsAmount(1500.75)).toBe('RSD1500,75');
  });

  it('formats string amount', () => {
    expect(formatIpsAmount('2000')).toBe('RSD2000,00');
  });

  it('formats zero amount', () => {
    expect(formatIpsAmount(0.01)).toBe('RSD0,01');
  });

  it('formats with custom currency', () => {
    expect(formatIpsAmount(100, 'EUR')).toBe('EUR100,00');
  });

  it('throws on negative amount', () => {
    expect(() => formatIpsAmount(-100)).toThrow();
  });

  it('throws on NaN', () => {
    expect(() => formatIpsAmount('abc')).toThrow();
  });

  it('rounds to 2 decimal places', () => {
    expect(formatIpsAmount(10.999)).toBe('RSD11,00');
    expect(formatIpsAmount(10.994)).toBe('RSD10,99');
  });
});

describe('formatBankAccount', () => {
  it('strips dashes from account number', () => {
    expect(formatBankAccount('160-0000000123456-78')).toBe('160000000012345678');
  });

  it('pads short input', () => {
    const result = formatBankAccount('160-123456-78');
    expect(result).toHaveLength(18);
  });
});
