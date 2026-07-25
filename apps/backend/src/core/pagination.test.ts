import { describe, expect, it } from 'vitest';
import { buildMeta, parseListQuery } from './pagination.js';

describe('parseListQuery', () => {
  it('applies defaults for empty input', () => {
    const q = parseListQuery({});
    expect(q).toMatchObject({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: -1 });
    expect(q.search).toBeUndefined();
  });

  it('clamps limit to a maximum of 100', () => {
    expect(parseListQuery({ limit: '5000' }).limit).toBe(100);
  });

  it('floors page at 1', () => {
    expect(parseListQuery({ page: '-3' }).page).toBe(1);
  });

  it('honors ascending sort order', () => {
    expect(parseListQuery({ sortOrder: 'asc' }).sortOrder).toBe(1);
  });

  it('trims and passes through search', () => {
    expect(parseListQuery({ search: '  milk ' }).search).toBe('milk');
  });
});

describe('buildMeta', () => {
  it('computes total pages', () => {
    expect(buildMeta(1, 20, 45)).toEqual({ page: 1, limit: 20, total: 45, totalPages: 3 });
  });

  it('never reports fewer than 1 page', () => {
    expect(buildMeta(1, 20, 0).totalPages).toBe(1);
  });
});
