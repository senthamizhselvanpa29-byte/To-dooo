// ============================================================
// LOGIN ERROR MESSAGES
// Turns Supabase's technical errors into a friendly message key
// (the actual words are in src/locales/*.js).
// ============================================================

export function errorKeyFor(error) {
  switch (error?.code) {
    case 'invalid_credentials':
      return 'errLoginFailed';
    case 'email_not_confirmed':
      return 'errEmailNotConfirmed';
    case 'user_already_exists':
    case 'email_exists':
      return 'errUserExists';
    case 'weak_password':
      return 'errPasswordShort';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'errTooMany';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return 'errLinkExpired';
    default:
      return 'errGeneric';
  }
}
