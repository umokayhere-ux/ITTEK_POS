/** Country and timezone lists for the registration dropdowns. */

export const COUNTRIES: string[] = [
  'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Tanzania', 'Uganda', 'Rwanda',
  'Ethiopia', 'Ivory Coast', 'Senegal', 'Cameroon', 'Zambia', 'Zimbabwe',
  'Botswana', 'Namibia', 'Mozambique', 'Angola', 'Egypt', 'Morocco', 'Algeria',
  'Tunisia', 'United States', 'Canada', 'United Kingdom', 'Ireland', 'France',
  'Germany', 'Spain', 'Portugal', 'Italy', 'Netherlands', 'Belgium', 'Switzerland',
  'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Greece',
  'Turkey', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Israel',
  'India', 'Pakistan', 'Bangladesh', 'China', 'Japan', 'South Korea', 'Singapore',
  'Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Australia',
  'New Zealand', 'Brazil', 'Argentina', 'Chile', 'Colombia', 'Mexico', 'Peru',
];

/** A curated fallback used when Intl.supportedValuesOf is unavailable. */
const FALLBACK_TIMEZONES = [
  'Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg',
  'Africa/Cairo', 'Africa/Casablanca', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam',
  'Europe/Istanbul', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata',
  'Asia/Karachi', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Singapore',
  'Australia/Sydney', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'America/Sao_Paulo', 'UTC',
];

/** All IANA timezones supported by the runtime, or a sensible fallback. */
export function timezoneOptions(): string[] {
  try {
    const values = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf?.('timeZone');
    if (values && values.length > 0) return values;
  } catch {
    // fall through
  }
  return FALLBACK_TIMEZONES;
}

/** The browser's detected timezone, if any. */
export function detectedTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}
