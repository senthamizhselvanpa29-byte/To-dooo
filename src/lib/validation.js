// ============================================================
// FORM CHECKS — is the email / phone / password OK?
// ============================================================

// Smallest allowed password length.
export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Turns a country code + number into one standard phone number,
// e.g. "+91" + "98765 43210" → "+919876543210".
// Returns null if the number doesn't look right.
export function normalizePhone(countryCode, number) {
  const code = countryCode.trim().replace(/^(?!\+)/, '+');
  const digits = number.replace(/[\s\-()]/g, '');

  if (!/^\+\d{1,4}$/.test(code) || !/^\d+$/.test(digits)) return null;

  if (code === '+91') {
    // Indian mobile numbers: 10 digits starting with 6, 7, 8 or 9
    return /^[6-9]\d{9}$/.test(digits) ? code + digits : null;
  }

  // Other countries: 4 to 14 digits
  return /^\d{4,14}$/.test(digits) ? code + digits : null;
}
