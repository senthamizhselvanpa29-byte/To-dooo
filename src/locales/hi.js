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

  // ----- Account -----
  signOut: 'साइन आउट',

  // ----- Terms & Privacy pages -----
  termsTitle: 'सेवा की शर्तें',
  privacyTitle: 'गोपनीयता नीति',
  pageComingSoon: 'यह पेज लिखा जा रहा है और लॉन्च से पहले तैयार होगा।',

  // ----- Planner: menu and account -----
  navToday: 'आज',
  navUpcoming: 'आने वाले',
  navLists: 'सूचियाँ',
  comingSoon: 'जल्द',
  accountMenu: 'खाता मेनू',

  // ----- Planner: greeting -----
  goodMorning: 'सुप्रभात, {name}',
  goodAfternoon: 'शुभ दोपहर, {name}',
  goodEvening: 'शुभ संध्या, {name}',
  progressLabel: '{total} में से {done} पूरे',

  // ----- Planner: plan tomorrow -----
  planTomorrowTitle: 'कल की योजना',
  planTomorrowEvening: 'शाम हो गई — कल की योजना के लिए 5 मिनट निकालें।',
  planTomorrowDay: 'आगे रहें: कल के काम अभी प्लान करें।',
  planTomorrowNone: 'कल के लिए अभी कुछ प्लान नहीं है।',
  planTomorrowCount: 'कल के लिए {count} प्लान किए गए',
  addForTomorrow: 'कल के लिए जोड़ें',

  // ----- Planner: add / edit a task -----
  addPlaceholder: 'एक काम जोड़ें…',
  dateLabel: 'तारीख',
  timeLabel: 'समय',
  today: 'आज',
  tomorrow: 'कल',
  yesterday: 'बीता कल',
  morning: 'सुबह',
  afternoon: 'दोपहर',
  evening: 'शाम',
  night: 'रात',
  priorityLabel: 'प्राथमिकता',
  priorityHigh: 'ज़्यादा',
  priorityMedium: 'मध्यम',
  priorityLow: 'कम',
  ballLabel: 'क्या इसे बदला जा सकता है?',
  ballGlass: 'काँच',
  ballRubber: 'रबर',
  ballGlassHint: 'छोड़ा नहीं जा सकता',
  ballRubberHint: 'बदला जा सकता है',
  noteLabel: 'नोट',
  notePlaceholder: 'नोट जोड़ें (वैकल्पिक)',
  saveTask: 'सेव करें',
  chooseTime: 'कृपया समय चुनें',
  enterTitle: 'कृपया काम का नाम लिखें',
  editTask: 'काम बदलें',
  deleteTask: 'हटाएँ',
  cancel: 'रद्द करें',
  close: 'बंद करें',

  // ----- Planner: task list -----
  sectionOverdue: 'देरी वाले',
  sectionToday: 'आज',
  sectionCompleted: 'पूरे हुए',
  emptyToday: 'अभी कुछ प्लान नहीं है। अपना पहला काम जोड़ें ✨',
  allDoneToday: 'आज के सारे काम पूरे! 🎉',
  markDone: 'पूरा हुआ चिह्नित करें',
  markNotDone: 'अधूरा चिह्नित करें',
  postponedInfo: '{count} बार टाला · {time} देरी',
  late: 'देरी',
  taskDeleted: 'काम हटाया गया',
  undo: 'वापस लाएँ',
  loadingTasks: 'आपके काम लोड हो रहे हैं…',
  errLoadTasks: 'काम लोड नहीं हो सके। कृपया पेज रीफ़्रेश करें।',
  errSaveTask: 'सेव नहीं हो सका। फिर से कोशिश करें।',
  errDbNotReady: 'कामों का डेटाबेस अभी सेट नहीं हुआ है।',
  unitDay: 'दि',
  unitHour: 'घं',
  unitMinute: 'मि',

  // ----- Upcoming page + calendar -----
  listView: 'सूची',
  calendarView: 'कैलेंडर',
  later: 'बाद में',
  nothingUpcoming: 'आने वाले दिनों के लिए कुछ प्लान नहीं है।',
  addForDay: '{day} के लिए काम जोड़ें',
  noTasksThisDay: 'इस दिन कोई काम नहीं।',
  prevMonth: 'पिछला महीना',
  nextMonth: 'अगला महीना',

  // ----- Lists -----
  newList: 'नई सूची',
  listNamePlaceholder: 'सूची का नाम (जैसे घर)',
  createList: 'बनाएँ',
  noLists: 'अभी कोई सूची नहीं। कामों को समूह में रखने के लिए एक बनाएँ।',
  listEmpty: 'इस सूची में अभी कोई काम नहीं।',
  renameList: 'नाम बदलें',
  deleteList: 'सूची हटाएँ',
  deleteListConfirm: 'यह सूची हटाएँ? इसके काम बिना सूची के रहेंगे।',
  listLabel: 'सूची',
  noList: 'कोई सूची नहीं',
  tasksCount: '{count} काम',
  chooseEmoji: 'एक चिह्न चुनें',

  // ----- How long? -----
  durationLabel: 'कितनी देर? (वैकल्पिक)',
  dur15: '15 मिनट',
  dur30: '30 मिनट',
  dur1h: '1 घंटा',
  dur2h: '2 घंटे',
  durAllDay: 'पूरा दिन',
  durDays: 'कई दिन',
  endDateLabel: 'तक',
  allDay: 'पूरा दिन',
  errEndBeforeStart: 'आख़िरी दिन पहले दिन के बाद या उसी दिन होना चाहिए',

  // ----- Steps inside a big plan -----
  stepsLabel: 'चरण',
  addStep: 'चरण जोड़ें',
  stepPlaceholder: 'चरण का नाम',
  stepsProgress: '{total} में से {done} चरण',
  errStepAfterPlan: 'यह चरण आपकी योजना ({date}) के बाद है। कृपया पहले की तारीख चुनें।',
  errStepAfterPlanShort: 'चरण अपनी योजना के बाद नहीं हो सकता। कृपया पहले की तारीख चुनें।',
  partOf: '{title} का हिस्सा',
  stepsHint: 'इस योजना से पहले (या दौरान) पूरे करने वाले छोटे काम।',

  // ----- Clash check -----
  clashTitle: '{date} को टकराव',
  clashExplain: 'ये योजनाएँ एक ही समय पर हैं।',
  clashLess: '“{title}” कम ज़रूरी है।',
  moveTo: '“{title}” को यहाँ ले जाएँ:',
  noFreeDays: 'अगले 30 दिनों में कोई खाली दिन नहीं मिला।',
  keepBoth: 'दोनों रखें',
  changeTime: 'समय बदलें',
  newTaskLabel: 'नया',
};

export default hi;
