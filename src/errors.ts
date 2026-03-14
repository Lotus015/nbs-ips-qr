/**
 * Error thrown when IPS QR code input validation fails.
 */
export class IpsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IpsValidationError';
  }
}
