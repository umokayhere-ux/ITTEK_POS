import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth.validator.js';

const validRegister = {
  businessName: 'Corner Shop',
  businessType: 'grocery',
  ownerName: 'Ada Owner',
  email: 'ADA@example.com',
  phone: '+233201234567',
  password: 'S3curePass',
  country: 'Ghana',
  currency: 'ghs',
  timezone: 'Africa/Accra',
};

describe('registerSchema', () => {
  it('accepts a valid payload and normalizes casing', () => {
    const parsed = registerSchema.parse(validRegister);
    expect(parsed.email).toBe('ada@example.com');
    expect(parsed.currency).toBe('GHS');
  });

  it('rejects a weak password', () => {
    expect(() => registerSchema.parse({ ...validRegister, password: 'weak' })).toThrow();
  });

  it('rejects an unknown business type', () => {
    expect(() =>
      registerSchema.parse({ ...validRegister, businessType: 'spaceship' }),
    ).toThrow();
  });

  it('rejects an invalid currency length', () => {
    expect(() => registerSchema.parse({ ...validRegister, currency: 'GHANA' })).toThrow();
  });
});

describe('loginSchema', () => {
  it('defaults rememberMe to false', () => {
    const parsed = loginSchema.parse({ email: 'a@b.com', password: 'x' });
    expect(parsed.rememberMe).toBe(false);
  });
});
