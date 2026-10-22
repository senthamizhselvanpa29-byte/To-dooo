// ============================================================
// HINDI (हिन्दी) — every word shown in the app
//
// To change a word: edit the text inside the quotes '...'.
// Do not change the names on the left (like signIn:).
// Text inside { } (like {email}) is filled in by the app — keep it.
// Please ask a native speaker to check these before launch.
// ============================================================

const hi = {
  // ----- Top bar -----
  changeLanguage: 'भाषा बदलें',
  darkMode: 'डार्क मोड',
  lightMode: 'लाइट मोड',
  switchTheme: 'डार्क / लाइट मोड बदलें',
  home: 'VdoU होम',

  // ----- Daily quote -----
  quotePill: 'दैनिक प्रेरणा',

  // ----- Login page -----
  loginTitle: 'VdoU में आपका स्वागत है',
  loginSubtitle: 'हजारों मील की यात्रा भी एक कदम से शुरू होती है।',
  emailLabel: 'ईमेल पता',
  emailPlaceholder: 'name@example.com',
  passwordLabel: 'पासवर्ड',
  passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
  forgotLink: 'पासवर्ड भूल गए?',
  keepSignedIn: 'मुझे साइन इन रखें',
  signIn: 'साइन इन करें',
  or: 'या',
  continueGoogle: 'गूगल के साथ जारी रखें',
  noAccount: 'खाता नहीं है?',
  signUpLink: 'साइन अप करें',
  showPassword: 'पासवर्ड दिखाएँ',
  hidePassword: 'पासवर्ड छिपाएँ',

  // ----- Sign-up page -----
  signupTitle: 'अपना VdoU खाता बनाएँ',
  signupSubtitle: '2 टैप में अपनी ज़िंदगी की योजना बनाएँ।',
  fullNameLabel: 'पूरा नाम',
  fullNamePlaceholder: 'आपका पूरा नाम',
  phoneLabel: 'फ़ोन नंबर',
  phonePlaceholder: '98765 43210',
  countryCode: 'देश कोड',
  newPasswordPlaceholder: 'कम से कम 8 अक्षर',
  confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
  confirmPasswordPlaceholder: 'पासवर्ड फिर से लिखें',
  agreeText: 'मैं {terms} और {privacy} से सहमत हूँ',
  terms: 'नियमों',
  privacy: 'गोपनीयता नीति',
  createAccount: 'खाता बनाएँ',
  haveAccount: 'पहले से खाता है?',
  signInLink: 'साइन इन करें',
  checkEmailTitle: 'अपना ईमेल देखें',
  checkEmailMsg: 'हमने {email} पर एक लिंक भेजा है। अपना खाता चालू करने के लिए उसे खोलें।',

  // ----- Forgot password page -----
  forgotTitle: 'पासवर्ड भूल गए?',
  forgotSubtitle: 'अपना ईमेल दर्ज करें। नया पासवर्ड सेट करने के लिए हम आपको एक लिंक भेजेंगे।',
  sendResetLink: 'लिंक भेजें',
  resetSentTitle: 'ईमेल भेज दिया गया',
  resetSentMsg: 'अगर {email} का खाता है, तो रीसेट लिंक जल्द ही पहुँच जाएगा।',
  backToLogin: 'साइन इन पर वापस जाएँ',

  // ----- New password page -----
  resetTitle: 'नया पासवर्ड सेट करें',
  resetSubtitle: 'ऐसा मज़बूत पासवर्ड चुनें जो आपको याद रहे।',
  newPasswordLabel: 'नया पासवर्ड',
  savePassword: 'पासवर्ड सेव करें',
  passwordSaved: 'पासवर्ड अपडेट हो गया। आपको आपके प्लानर पर ले जा रहे हैं…',

  // ----- Complete profile page (after Google sign-in) -----
  completeTitle: 'बस एक कदम और',
  completeSubtitle: 'अपना खाता पूरा करने के लिए फ़ोन नंबर जोड़ें।',
  continue: 'जारी रखें',

  // ----- Error messages -----
  errEmail: 'कृपया सही ईमेल पता दर्ज करें',
  errPasswordRequired: 'कृपया अपना पासवर्ड दर्ज करें',
  errPasswordShort: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए',
  errPasswordMatch: 'पासवर्ड मेल नहीं खाते',
  errFullName: 'कृपया अपना नाम दर्ज करें',
  errPhone: 'कृपया सही फ़ोन नंबर दर्ज करें',
  errAgree: 'कृपया नियम और गोपनीयता नीति स्वीकार करें',
  errLoginFailed: 'ईमेल या पासवर्ड गलत है',
  errEmailNotConfirmed: 'पहले अपने ईमेल की पुष्टि करें। अपना इनबॉक्स देखें।',
  errUserExists: 'इस ईमेल से पहले से एक खाता है। कृपया साइन इन करें।',
  errTooMany: 'बहुत ज़्यादा कोशिशें। एक मिनट रुककर फिर से कोशिश करें।',
  errLinkExpired: 'यह लिंक पुराना हो गया है या पहले ही इस्तेमाल हो चुका है। फिर से कोशिश करें।',
  errNotConnected: 'लॉगिन अभी जुड़ा नहीं है। कृपया Supabase कुंजियाँ जोड़ें।',
  errGeneric: 'कुछ गलत हो गया। कृपया फिर से कोशिश करें।',

  // ----- Today page -----
  todayTitle: 'आज',
  todayHello: 'नमस्ते, {name}!',
  todayComingSoon: 'आपके काम जल्द ही यहाँ दिखेंगे।',
  signOut: 'साइन आउट',

  // ----- Terms & Privacy pages -----
  termsTitle: 'सेवा की शर्तें',
  privacyTitle: 'गोपनीयता नीति',
  pageComingSoon: 'यह पेज लिखा जा रहा है और लॉन्च से पहले तैयार होगा।',
};

export default hi;
