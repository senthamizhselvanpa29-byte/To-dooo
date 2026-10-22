// ============================================================
// ENGLISH — every word shown in the app
//
// To change a word: edit the text inside the quotes '...'.
// Do not change the names on the left (like signIn:).
// Text inside { } (like {email}) is filled in by the app — keep it.
// ============================================================

const en = {
  // ----- Top bar -----
  changeLanguage: 'Change language',
  darkMode: 'Dark Mode',
  lightMode: 'Light Mode',
  switchTheme: 'Switch dark / light mode',
  home: 'VdoU home',

  // ----- Daily quote -----
  quotePill: 'Daily Inspiration',

  // ----- Login page -----
  loginTitle: 'Welcome to VdoU',
  loginSubtitle: 'The journey of a thousand miles begins with a single step.',
  emailLabel: 'Email Address',
  emailPlaceholder: 'name@example.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Enter your password',
  forgotLink: 'Forgot password?',
  keepSignedIn: 'Keep me signed in',
  signIn: 'Sign In',
  or: 'or',
  continueGoogle: 'Continue with Google',
  noAccount: "Don't have an account?",
  signUpLink: 'Sign up',
  showPassword: 'Show password',
  hidePassword: 'Hide password',

  // ----- Sign-up page -----
  signupTitle: 'Create your VdoU account',
  signupSubtitle: 'Plan your life in 2 taps.',
  fullNameLabel: 'Full Name',
  fullNamePlaceholder: 'Your full name',
  phoneLabel: 'Phone Number',
  phonePlaceholder: '98765 43210',
  countryCode: 'Country code',
  newPasswordPlaceholder: 'At least 8 characters',
  confirmPasswordLabel: 'Confirm Password',
  confirmPasswordPlaceholder: 'Type the password again',
  agreeText: 'I agree to the {terms} and {privacy}',
  terms: 'Terms',
  privacy: 'Privacy Policy',
  createAccount: 'Create Account',
  haveAccount: 'Already have an account?',
  signInLink: 'Sign in',
  checkEmailTitle: 'Check your email',
  checkEmailMsg: 'We sent a link to {email}. Open it to activate your account.',

  // ----- Forgot password page -----
  forgotTitle: 'Forgot your password?',
  forgotSubtitle: "Enter your email and we'll send you a link to set a new password.",
  sendResetLink: 'Send Reset Link',
  resetSentTitle: 'Email sent',
  resetSentMsg: 'If an account exists for {email}, a reset link is on its way.',
  backToLogin: 'Back to sign in',

  // ----- New password page -----
  resetTitle: 'Set a new password',
  resetSubtitle: "Choose a strong password you'll remember.",
  newPasswordLabel: 'New Password',
  savePassword: 'Save Password',
  passwordSaved: 'Password updated. Taking you to your planner…',

  // ----- Complete profile page (after Google sign-in) -----
  completeTitle: 'One last step',
  completeSubtitle: 'Add your phone number to finish setting up your account.',
  continue: 'Continue',

  // ----- Error messages -----
  errEmail: 'Please enter a valid email address',
  errPasswordRequired: 'Please enter your password',
  errPasswordShort: 'Password must be at least 8 characters',
  errPasswordMatch: 'Passwords do not match',
  errFullName: 'Please enter your name',
  errPhone: 'Please enter a valid phone number',
  errAgree: 'Please accept the Terms and Privacy Policy',
  errLoginFailed: 'Wrong email or password',
  errEmailNotConfirmed: 'Please confirm your email first. Check your inbox.',
  errUserExists: 'An account with this email already exists. Please sign in.',
  errTooMany: 'Too many attempts. Please wait a minute and try again.',
  errLinkExpired: 'This link has expired or was already used. Please try again.',
  errNotConnected: 'Login is not connected yet. Please add the Supabase keys.',
  errGeneric: 'Something went wrong. Please try again.',

  // ----- Today page -----
  todayTitle: 'Today',
  todayHello: 'Hello, {name}!',
  todayComingSoon: 'Your tasks will appear here soon.',
  signOut: 'Sign out',

  // ----- Terms & Privacy pages -----
  termsTitle: 'Terms of Service',
  privacyTitle: 'Privacy Policy',
  pageComingSoon: 'This page is being written and will be ready before launch.',
};

export default en;
