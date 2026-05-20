/**
 * Region data for the helper modal's "I need more help" section.
 *
 * Each region has an emergency number and 0–2 peer support resources.
 * Peer support `type` field is one of:
 *   - 'Psychedelic peer support' — trained for psychedelic experiences
 *   - 'Listening line' — trained volunteers, broad emotional support (Samaritans-style)
 *   - 'Mental health support' — clinicians/social workers, de-escalation & professional support
 *
 * Phone number conventions for tel:/sms: links:
 *   - Full subscriber numbers use E.164 (`+<countrycode><number>`), e.g. Fireside `+16234737433`.
 *   - National short codes (116 123, 1737, 131114, 1860, 1577-0199, 142, 143, etc.) are
 *     stored WITHOUT a country code prefix. Adding +CC to a short code creates a number
 *     the dialer cannot route — short codes are inherently national.
 * The `displayPhone` field is what we show in the UI (the locally-recognizable form).
 *
 * `smsBody` (when present) is the prefilled text for the messaging app — keep it
 * a polite, context-setting opener so the responder knows what they're dealing with.
 */

const FIRESIDE_SMS_BODY = "Dear Fireside, I'm currently using the m-session app for an MDMA session and I'm having some issues, can you help me out?";

const FIRESIDE_PROJECT = {
  name: 'Fireside Project',
  type: 'Psychedelic peer support',
  description: 'Free, confidential support for psychedelic experiences. Trained listeners, not therapists. 11am–11pm Pacific Time.',
  phone: '+16234737433',
  displayPhone: '+1 623-473-7433',
  sms: '+16234737433',
  smsBody: FIRESIDE_SMS_BODY,
  url: 'https://firesideproject.org/',
};

export const REGIONS = {
  US: {
    code: 'US',
    label: 'United States',
    emergencyNumber: '911',
    emergencyDisplay: 'Call 911',
    peerSupport: [FIRESIDE_PROJECT],
  },
  CA: {
    code: 'CA',
    label: 'Canada',
    emergencyNumber: '911',
    emergencyDisplay: 'Call 911',
    peerSupport: [
      { ...FIRESIDE_PROJECT, description: 'Free, confidential support for psychedelic experiences. Serves the US and Canada. Trained listeners, 11am–11pm Pacific Time.' },
      {
        name: 'Wellness Together Canada',
        type: 'Mental health support',
        description: 'Federally-funded mental health line. Counselors available 24/7 by phone.',
        phone: '+18665850445',
        displayPhone: '1-866-585-0445',
        url: 'https://wellnesstogether.ca/',
      },
    ],
  },
  UK: {
    code: 'UK',
    label: 'United Kingdom',
    emergencyNumber: '999',
    emergencyDisplay: 'Call 999',
    peerSupport: [
      {
        name: 'Samaritans',
        type: 'Listening line',
        description: 'Free, confidential emotional support — trained listeners, 24/7. Not crisis-only.',
        phone: '116123',
        displayPhone: '116 123',
        url: 'https://www.samaritans.org/',
      },
      {
        name: 'NHS 111 (Option 2)',
        type: 'Mental health support',
        description: 'NHS mental health crisis line — staffed by clinicians. 24/7. Choose option 2 after dialing.',
        phone: '111',
        displayPhone: '111',
        url: 'https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/',
      },
    ],
  },
  IE: {
    code: 'IE',
    label: 'Ireland',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Samaritans Ireland',
        type: 'Listening line',
        description: 'Free, confidential emotional support — trained listeners, 24/7. Not crisis-only.',
        phone: '116123',
        displayPhone: '116 123',
        url: 'https://www.samaritans.org/ireland/',
      },
    ],
  },
  AU: {
    code: 'AU',
    label: 'Australia',
    emergencyNumber: '000',
    emergencyDisplay: 'Call 000',
    peerSupport: [
      {
        name: 'Lifeline',
        type: 'Listening line',
        description: 'Free, confidential crisis support and suicide prevention — also handles general emotional distress. 24/7.',
        phone: '131114',
        displayPhone: '13 11 14',
        sms: '+61477131114',
        smsBody: "Hi, I'm using the m-session app for an MDMA session and going through a hard moment. Could you help me?",
        url: 'https://www.lifeline.org.au/',
      },
      {
        name: 'Beyond Blue',
        type: 'Mental health support',
        description: 'Mental health support line — anxiety, depression, general wellbeing. 24/7.',
        phone: '1300224636',
        displayPhone: '1300 22 4636',
        url: 'https://www.beyondblue.org.au/',
      },
    ],
  },
  NZ: {
    code: 'NZ',
    label: 'New Zealand',
    emergencyNumber: '111',
    emergencyDisplay: 'Call 111',
    peerSupport: [
      {
        name: '1737 — Need to talk?',
        type: 'Mental health support',
        description: 'Free national counseling line — trained counselors. Available 24/7. Call or text 1737.',
        phone: '1737',
        displayPhone: '1737',
        sms: '1737',
        smsBody: "Hi, I'm using the m-session app for an MDMA session and going through a hard moment. Could you help me?",
        url: 'https://1737.org.nz/',
      },
    ],
  },
  DE: {
    code: 'DE',
    label: 'Germany',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Telefonseelsorge',
        type: 'Listening line',
        description: 'Free, confidential telephone counseling — trained volunteers, 24/7.',
        phone: '+498001110111',
        displayPhone: '0800 111 0 111',
        url: 'https://www.telefonseelsorge.de/',
      },
    ],
  },
  FR: {
    code: 'FR',
    label: 'France',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'SOS Amitié',
        type: 'Listening line',
        description: 'Free, confidential listening line — trained volunteers. Available daily.',
        phone: '+33972394050',
        displayPhone: '09 72 39 40 50',
        url: 'https://www.sos-amitie.com/',
      },
    ],
  },
  NL: {
    code: 'NL',
    label: 'Netherlands',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'De Luisterlijn',
        type: 'Listening line',
        description: 'Free, confidential listening line — trained volunteers, 24/7.',
        phone: '+31880767000',
        displayPhone: '088 0767 000',
        url: 'https://www.deluisterlijn.nl/',
      },
    ],
  },
  CH: {
    code: 'CH',
    label: 'Switzerland',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Die Dargebotene Hand',
        type: 'Listening line',
        description: 'Free, confidential listening line ("The Helping Hand") — trained volunteers, 24/7.',
        phone: '143',
        displayPhone: '143',
        url: 'https://www.143.ch/',
      },
    ],
  },
  MX: {
    code: 'MX',
    label: 'Mexico',
    emergencyNumber: '911',
    emergencyDisplay: 'Call 911',
    peerSupport: [
      {
        name: 'SAPTEL',
        type: 'Mental health support',
        description: 'Psychological support line staffed by professionals. Available 24/7.',
        phone: '+525552598121',
        displayPhone: '55 5259 8121',
      },
    ],
  },
  JP: {
    code: 'JP',
    label: 'Japan',
    emergencyNumber: '119',
    emergencyDisplay: 'Call 119',
    peerSupport: [
      {
        name: 'TELL Lifeline',
        type: 'Listening line',
        description: 'English-language listening line in Japan — trained volunteers.',
        phone: '+81357740992',
        displayPhone: '03-5774-0992',
        url: 'https://telljp.com/',
      },
    ],
  },
  IN: {
    code: 'IN',
    label: 'India',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Vandrevala Foundation',
        type: 'Mental health support',
        description: 'Free, confidential mental health helpline staffed by professional counselors. Available 24/7.',
        phone: '18602662345',
        displayPhone: '1860 266 2345',
        url: 'https://www.vandrevalafoundation.com/',
      },
    ],
  },
  BR: {
    code: 'BR',
    label: 'Brazil',
    emergencyNumber: '192',
    emergencyDisplay: 'Call 192 (SAMU)',
    peerSupport: [
      {
        name: 'CVV — Centro de Valorização da Vida',
        type: 'Listening line',
        description: 'Free, confidential emotional support — trained volunteers, 24/7. Not crisis-only.',
        phone: '188',
        displayPhone: '188',
        url: 'https://www.cvv.org.br/',
      },
    ],
  },
  ES: {
    code: 'ES',
    label: 'Spain',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Teléfono de la Esperanza',
        type: 'Listening line',
        description: 'Free, confidential emotional support — trained volunteers, 24/7.',
        phone: '+34717003717',
        displayPhone: '717 003 717',
        url: 'https://telefonodelaesperanza.org/',
      },
    ],
  },
  IT: {
    code: 'IT',
    label: 'Italy',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Telefono Amico',
        type: 'Listening line',
        description: 'Free, confidential listening line — trained volunteers. Available daily.',
        phone: '+390223272327',
        displayPhone: '02 2327 2327',
        url: 'https://www.telefonoamico.it/',
      },
    ],
  },
  PT: {
    code: 'PT',
    label: 'Portugal',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'SOS Voz Amiga',
        type: 'Listening line',
        description: 'Free, confidential emotional support — trained volunteers. Evening hours daily.',
        phone: '+351213544545',
        displayPhone: '213 544 545',
        url: 'https://www.sosvozamiga.org/',
      },
    ],
  },
  BE: {
    code: 'BE',
    label: 'Belgium',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Tele-Onthaal',
        type: 'Listening line',
        description: 'Free, confidential listening line (Dutch-language) — trained volunteers, 24/7. French equivalent: Télé-Accueil 107.',
        phone: '106',
        displayPhone: '106',
        url: 'https://www.tele-onthaal.be/',
      },
    ],
  },
  AT: {
    code: 'AT',
    label: 'Austria',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Telefonseelsorge',
        type: 'Listening line',
        description: 'Free, confidential telephone counseling — trained volunteers, 24/7.',
        phone: '142',
        displayPhone: '142',
        url: 'https://www.telefonseelsorge.at/',
      },
    ],
  },
  SE: {
    code: 'SE',
    label: 'Sweden',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Mind Självmordslinjen',
        type: 'Listening line',
        description: 'Free, confidential listening line — trained volunteers. Open daily.',
        phone: '90101',
        displayPhone: '90101',
        url: 'https://mind.se/',
      },
    ],
  },
  NO: {
    code: 'NO',
    label: 'Norway',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Mental Helse',
        type: 'Listening line',
        description: 'Free, confidential listening line — trained volunteers, 24/7.',
        phone: '116123',
        displayPhone: '116 123',
        url: 'https://www.mentalhelse.no/',
      },
    ],
  },
  DK: {
    code: 'DK',
    label: 'Denmark',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Sct. Nicolai Tjenesten',
        type: 'Listening line',
        description: 'Free, confidential listening line — trained volunteers, 24/7. Broader emotional support, not crisis-only.',
        phone: '+4570120110',
        displayPhone: '70 120 110',
      },
    ],
  },
  FI: {
    code: 'FI',
    label: 'Finland',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'MIELI Crisis Helpline',
        type: 'Listening line',
        description: 'National crisis helpline — trained counselors. Available 24/7. English service also available.',
        phone: '+358925250111',
        displayPhone: '09 2525 0111',
        url: 'https://mieli.fi/en/',
      },
    ],
  },
  ZA: {
    code: 'ZA',
    label: 'South Africa',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'SADAG',
        type: 'Mental health support',
        description: 'South African Depression and Anxiety Group — mental health support, trained counselors. Toll-free, available daily.',
        phone: '+27800567567',
        displayPhone: '0800 567 567',
        url: 'https://www.sadag.org/',
      },
    ],
  },
  AR: {
    code: 'AR',
    label: 'Argentina',
    emergencyNumber: '911',
    emergencyDisplay: 'Call 911',
    peerSupport: [
      {
        name: 'SEDRONAR Línea 141',
        type: 'Mental health support',
        description: 'National drug-related support and counseling line. Free, anonymous, 24/7.',
        phone: '141',
        displayPhone: '141',
        url: 'https://www.argentina.gob.ar/sedronar',
      },
    ],
  },
  IL: {
    code: 'IL',
    label: 'Israel',
    emergencyNumber: '101',
    emergencyDisplay: 'Call 101 (Medical)',
    peerSupport: [
      {
        name: 'ERAN',
        type: 'Listening line',
        description: 'Free, confidential emotional support — trained volunteers, 24/7. Hebrew, Arabic, Russian, English.',
        phone: '1201',
        displayPhone: '1201',
        url: 'https://en.eran.org.il/',
      },
    ],
  },
  SG: {
    code: 'SG',
    label: 'Singapore',
    emergencyNumber: '995',
    emergencyDisplay: 'Call 995 (Medical)',
    peerSupport: [
      {
        name: 'Samaritans of Singapore (SOS)',
        type: 'Listening line',
        description: 'Free, confidential emotional support — trained volunteers, 24/7.',
        phone: '1767',
        displayPhone: '1767',
        url: 'https://www.sos.org.sg/',
      },
    ],
  },
  KR: {
    code: 'KR',
    label: 'South Korea',
    emergencyNumber: '119',
    emergencyDisplay: 'Call 119',
    peerSupport: [
      {
        name: 'Mental Health Crisis Counseling (정신건강위기상담)',
        type: 'Mental health support',
        description: 'National mental health crisis counseling line — staffed by trained counselors, 24/7.',
        phone: '15770199',
        displayPhone: '1577-0199',
      },
    ],
  },
  INTL: {
    code: 'INTL',
    label: 'Other / International',
    emergencyNumber: '112',
    emergencyDisplay: 'Call 112',
    peerSupport: [
      {
        name: 'Fireside Project',
        type: 'Psychedelic peer support (US-based)',
        description: 'US-based but reachable internationally. International call rates may apply. Trained psychedelic peer support, 11am–11pm Pacific Time.',
        phone: '+16234737433',
        displayPhone: '+1 623-473-7433',
        url: 'https://firesideproject.org/',
      },
    ],
  },
};

export const REGION_CODES = Object.keys(REGIONS);
