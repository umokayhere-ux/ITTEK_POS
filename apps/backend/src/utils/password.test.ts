import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('hashes a password to a non-plaintext value', async () => {
    const hash = await hashPassword('S3curePass');
    expect(hash).not.toBe('S3curePass');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('S3curePass');
    expect(await verifyPassword('S3curePass', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('S3curePass');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
