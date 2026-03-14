/**
 * Helpers for formatting invoice data into NBS IPS-compatible values.
 */

/**
 * Format a numeric amount into NBS IPS amount string.
 *
 * Converts a number or string amount to the NBS format: `{CURRENCY}{integer},{decimals}`
 *
 * @example
 * ```ts
 * formatIpsAmount(1500.5)        // => "RSD1500,50"
 * formatIpsAmount(1500.5, 'EUR') // => "EUR1500,50"
 * formatIpsAmount('2000')        // => "RSD2000,00"
 * formatIpsAmount(0.01)          // => "RSD0,01"
 * ```
 */
export function formatIpsAmount(
  amount: number | string,
  currency = 'RSD',
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;
  const [intPart, decPart = ''] = rounded.toString().split('.');

  return `${currency}${intPart},${decPart.padEnd(2, '0')}`;
}

/**
 * Format a bank account number from common Serbian formats.
 *
 * Just an alias for display — the actual normalization happens in `normalizeBankAccount`.
 * This simply strips any non-digit characters.
 *
 * @example
 * ```ts
 * formatBankAccount('160-0000000123456-78') // => "160000000012345678"
 * ```
 */
export function formatBankAccount(input: string): string {
  return input.replace(/[^0-9]/g, '').padEnd(18, '0').slice(0, 18);
}
