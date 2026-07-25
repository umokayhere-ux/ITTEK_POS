import { describe, expect, it } from 'vitest';
import { slugify, withRandomSuffix } from './slug.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('My Corner Shop')).toBe('my-corner-shop');
  });

  it('strips special characters', () => {
    expect(slugify("Joe's Pharmacy & Co.!")).toBe('joes-pharmacy-co');
  });

  it('trims surrounding whitespace and dashes', () => {
    expect(slugify('  --Hello--  ')).toBe('hello');
  });

  it('caps length at 60 characters', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(60);
  });
});

describe('withRandomSuffix', () => {
  it('appends a random suffix to the base', () => {
    const result = withRandomSuffix('shop');
    expect(result).toMatch(/^shop-[a-z0-9]{1,6}$/);
  });

  it('falls back to "shop" when base is empty', () => {
    expect(withRandomSuffix('')).toMatch(/^shop-/);
  });
});
