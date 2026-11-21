// apps/web/src/utils/timezoneHelper.ts
// Intelligent IANA Timezone resolution for Google Places and Geolocation

export function getUserDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

interface AddressComponent {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types: string[];
}

const SINGLE_TIMEZONE_COUNTRIES: Record<string, string> = {
  IN: 'Asia/Kolkata',
  GB: 'Europe/London',
  AE: 'Asia/Dubai',
  SG: 'Asia/Singapore',
  JP: 'Asia/Tokyo',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  NL: 'Europe/Amsterdam',
  CH: 'Europe/Zurich',
  NP: 'Asia/Kathmandu',
  LK: 'Asia/Colombo',
  BD: 'Asia/Dhaka',
  PK: 'Asia/Karachi',
  TH: 'Asia/Bangkok',
  MY: 'Asia/Kuala_Lumpur',
  HK: 'Asia/Hong_Kong',
  NZ: 'Pacific/Auckland',
  ZA: 'Africa/Johannesburg',
  QA: 'Asia/Qatar',
  KW: 'Asia/Kuwait',
  SA: 'Asia/Riyadh',
  OM: 'Asia/Muscat',
  BH: 'Asia/Bahrain',
  TR: 'Europe/Istanbul',
  EG: 'Africa/Cairo',
  KE: 'Africa/Nairobi',
  NG: 'Africa/Lagos',
  IE: 'Europe/Dublin',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  DK: 'Europe/Copenhagen',
  FI: 'Europe/Helsinki',
  PL: 'Europe/Warsaw',
  AT: 'Europe/Vienna',
  BE: 'Europe/Brussels',
  PT: 'Europe/Lisbon',
  GR: 'Europe/Athens',
  KR: 'Asia/Seoul',
  TW: 'Asia/Taipei',
  PH: 'Asia/Manila',
  VN: 'Asia/Ho_Chi_Minh',
};

const US_STATE_TIMEZONES: Record<string, string> = {
  // Pacific
  CA: 'America/Los_Angeles',
  WA: 'America/Los_Angeles',
  OR: 'America/Los_Angeles',
  NV: 'America/Los_Angeles',
  // Mountain
  CO: 'America/Denver',
  UT: 'America/Denver',
  NM: 'America/Denver',
  ID: 'America/Denver',
  MT: 'America/Denver',
  WY: 'America/Denver',
  AZ: 'America/Phoenix',
  // Central
  IL: 'America/Chicago',
  TX: 'America/Chicago',
  MN: 'America/Chicago',
  MO: 'America/Chicago',
  WI: 'America/Chicago',
  LA: 'America/Chicago',
  OK: 'America/Chicago',
  IA: 'America/Chicago',
  AR: 'America/Chicago',
  MS: 'America/Chicago',
  KS: 'America/Chicago',
  NE: 'America/Chicago',
  SD: 'America/Chicago',
  ND: 'America/Chicago',
  AL: 'America/Chicago',
  // Eastern
  NY: 'America/New_York',
  FL: 'America/New_York',
  PA: 'America/New_York',
  OH: 'America/New_York',
  GA: 'America/New_York',
  NC: 'America/New_York',
  MI: 'America/New_York',
  NJ: 'America/New_York',
  VA: 'America/New_York',
  MA: 'America/New_York',
  IN: 'America/Indiana/Indianapolis',
  MD: 'America/New_York',
  TN: 'America/New_York',
  SC: 'America/New_York',
  KY: 'America/New_York',
  CT: 'America/New_York',
  WV: 'America/New_York',
  ME: 'America/New_York',
  NH: 'America/New_York',
  RI: 'America/New_York',
  VT: 'America/New_York',
  DE: 'America/New_York',
  DC: 'America/New_York',
  // Other
  AK: 'America/Anchorage',
  HI: 'Pacific/Honolulu',
};

const CA_PROVINCE_TIMEZONES: Record<string, string> = {
  BC: 'America/Vancouver',
  AB: 'America/Edmonton',
  SK: 'America/Regina',
  MB: 'America/Winnipeg',
  ON: 'America/Toronto',
  QC: 'America/Toronto',
  NB: 'America/Halifax',
  NS: 'America/Halifax',
  PE: 'America/Halifax',
  NL: 'America/St_Johns',
};

const AU_STATE_TIMEZONES: Record<string, string> = {
  NSW: 'Australia/Sydney',
  VIC: 'Australia/Sydney',
  QLD: 'Australia/Brisbane',
  TAS: 'Australia/Hobart',
  ACT: 'Australia/Sydney',
  SA: 'Australia/Adelaide',
  NT: 'Australia/Darwin',
  WA: 'Australia/Perth',
};

export function resolveTimezoneFromPlace(
  components?: AddressComponent[],
  lat?: number,
  lon?: number,
): string {
  if (!components || components.length === 0) {
    if (lon !== undefined) {
      return fallbackTimezoneFromLon(lon);
    }
    return getUserDeviceTimezone();
  }

  const countryComp = components.find((c) => c.types.includes('country'));
  const countryCode = (countryComp?.short_name || countryComp?.shortText || '').toUpperCase();

  if (countryCode && SINGLE_TIMEZONE_COUNTRIES[countryCode]) {
    return SINGLE_TIMEZONE_COUNTRIES[countryCode]!;
  }

  const stateComp = components.find((c) =>
    c.types.includes('administrative_area_level_1'),
  );
  const stateCode = (stateComp?.short_name || stateComp?.shortText || '').toUpperCase();

  if (countryCode === 'US') {
    if (stateCode && US_STATE_TIMEZONES[stateCode]) {
      return US_STATE_TIMEZONES[stateCode]!;
    }
    if (lon !== undefined) {
      if (lon < -114) return 'America/Los_Angeles';
      if (lon < -102) return 'America/Denver';
      if (lon < -85) return 'America/Chicago';
      return 'America/New_York';
    }
    return 'America/New_York';
  }

  if (countryCode === 'CA') {
    if (stateCode && CA_PROVINCE_TIMEZONES[stateCode]) {
      return CA_PROVINCE_TIMEZONES[stateCode]!;
    }
    if (lon !== undefined) {
      if (lon < -114) return 'America/Vancouver';
      if (lon < -102) return 'America/Edmonton';
      if (lon < -85) return 'America/Winnipeg';
      return 'America/Toronto';
    }
    return 'America/Toronto';
  }

  if (countryCode === 'AU') {
    if (stateCode && AU_STATE_TIMEZONES[stateCode]) {
      return AU_STATE_TIMEZONES[stateCode]!;
    }
    if (lon !== undefined) {
      if (lon < 128) return 'Australia/Perth';
      if (lon < 140) return 'Australia/Adelaide';
      return 'Australia/Sydney';
    }
    return 'Australia/Sydney';
  }

  if (countryCode === 'RU' && lon !== undefined) {
    if (lon < 40) return 'Europe/Moscow';
    if (lon < 60) return 'Asia/Yekaterinburg';
    if (lon < 90) return 'Asia/Novosibirsk';
    if (lon < 120) return 'Asia/Irkutsk';
    return 'Asia/Vladivostok';
  }

  if (countryCode === 'BR' && lon !== undefined) {
    return lon < -45 ? 'America/Sao_Paulo' : 'America/Manaus';
  }

  if (countryCode === 'ID' && lon !== undefined) {
    return lon < 110 ? 'Asia/Jakarta' : lon < 125 ? 'Asia/Makassar' : 'Asia/Jayapura';
  }

  if (lon !== undefined) {
    return fallbackTimezoneFromLon(lon);
  }

  return getUserDeviceTimezone();
}

function fallbackTimezoneFromLon(lon: number): string {
  // Approximate standard timezone by longitude
  const offsetHours = Math.round(lon / 15);
  if (offsetHours === 0) return 'UTC';
  if (offsetHours === 5 || offsetHours === 6) return 'Asia/Kolkata';
  if (offsetHours === 1) return 'Europe/Paris';
  if (offsetHours === 2) return 'Europe/Athens';
  if (offsetHours === 3) return 'Asia/Riyadh';
  if (offsetHours === 4) return 'Asia/Dubai';
  if (offsetHours === 7) return 'Asia/Bangkok';
  if (offsetHours === 8) return 'Asia/Singapore';
  if (offsetHours === 9) return 'Asia/Tokyo';
  if (offsetHours === 10) return 'Australia/Sydney';
  if (offsetHours === -5) return 'America/New_York';
  if (offsetHours === -6) return 'America/Chicago';
  if (offsetHours === -7) return 'America/Denver';
  if (offsetHours === -8) return 'America/Los_Angeles';
  return 'UTC';
}
