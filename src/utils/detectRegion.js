/**
 * Region auto-detection for the helper modal.
 *
 * Pure client-side: reads `Intl.DateTimeFormat().resolvedOptions().timeZone`
 * and `navigator.language`. No network calls, no permission prompts, no PII
 * leaves the device.
 *
 * Falls back to 'INTL' when the timezone doesn't match a supported region —
 * 112 is a GSM-standard emergency number that works in most countries.
 */

const TIMEZONE_TO_REGION = {
  // Canada (precede US America/* fallback)
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',
  'America/Regina': 'CA',
  'America/Whitehorse': 'CA',
  'America/Yellowknife': 'CA',
  'America/Iqaluit': 'CA',
  // Mexico
  'America/Mexico_City': 'MX',
  'America/Cancun': 'MX',
  'America/Monterrey': 'MX',
  'America/Tijuana': 'MX',
  'America/Hermosillo': 'MX',
  'America/Mazatlan': 'MX',
  'America/Merida': 'MX',
  'America/Chihuahua': 'MX',
  // Brazil
  'America/Sao_Paulo': 'BR',
  'America/Rio_Branco': 'BR',
  'America/Manaus': 'BR',
  'America/Recife': 'BR',
  'America/Fortaleza': 'BR',
  'America/Belem': 'BR',
  'America/Cuiaba': 'BR',
  'America/Bahia': 'BR',
  'America/Maceio': 'BR',
  'America/Campo_Grande': 'BR',
  'America/Araguaina': 'BR',
  'America/Noronha': 'BR',
  // Argentina (multiple sub-zones)
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Salta': 'AR',
  'America/Argentina/Jujuy': 'AR',
  'America/Argentina/Tucuman': 'AR',
  'America/Argentina/Catamarca': 'AR',
  'America/Argentina/La_Rioja': 'AR',
  'America/Argentina/San_Juan': 'AR',
  'America/Argentina/Mendoza': 'AR',
  'America/Argentina/San_Luis': 'AR',
  'America/Argentina/Rio_Gallegos': 'AR',
  'America/Argentina/Ushuaia': 'AR',
  // UK & Ireland
  'Europe/London': 'UK',
  'Europe/Dublin': 'IE',
  // Germany
  'Europe/Berlin': 'DE',
  'Europe/Munich': 'DE',
  // France
  'Europe/Paris': 'FR',
  // Netherlands
  'Europe/Amsterdam': 'NL',
  // Switzerland
  'Europe/Zurich': 'CH',
  // Spain
  'Europe/Madrid': 'ES',
  'Europe/Ceuta': 'ES',
  'Atlantic/Canary': 'ES',
  // Italy
  'Europe/Rome': 'IT',
  // Portugal
  'Europe/Lisbon': 'PT',
  'Atlantic/Azores': 'PT',
  'Atlantic/Madeira': 'PT',
  // Belgium
  'Europe/Brussels': 'BE',
  // Austria
  'Europe/Vienna': 'AT',
  // Sweden
  'Europe/Stockholm': 'SE',
  // Norway
  'Europe/Oslo': 'NO',
  // Denmark
  'Europe/Copenhagen': 'DK',
  // Finland
  'Europe/Helsinki': 'FI',
  // Japan
  'Asia/Tokyo': 'JP',
  // India
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  // Israel
  'Asia/Jerusalem': 'IL',
  'Asia/Tel_Aviv': 'IL',
  // Singapore
  'Asia/Singapore': 'SG',
  // South Korea
  'Asia/Seoul': 'KR',
  // South Africa
  'Africa/Johannesburg': 'ZA',
  // New Zealand
  'Pacific/Auckland': 'NZ',
  'Pacific/Chatham': 'NZ',
};

export function detectRegion() {
  let timezone;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'INTL';
  }

  if (!timezone) return 'INTL';

  const direct = TIMEZONE_TO_REGION[timezone];
  if (direct) return direct;

  if (timezone.startsWith('Australia/')) return 'AU';
  if (timezone.startsWith('America/')) return 'US';
  if (timezone.startsWith('Europe/')) return 'INTL';

  return 'INTL';
}
