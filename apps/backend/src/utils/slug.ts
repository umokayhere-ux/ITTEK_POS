/** Converts a business name into a URL-safe slug base. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Appends a short random suffix to guarantee slug uniqueness. */
export function withRandomSuffix(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'shop'}-${suffix}`;
}
