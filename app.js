/**
 * ============================================================================
 * VdoU Application Controller
 * Languages: English, Tamil, Malayalam, Telugu, Hindi
 * Features:
 * - Language selector dropdown with full UI translations
 * - Dark Mode On/Off Toggle with localStorage persistence & Galaxy sync
 * - Google Sign-In button integration
 * - Input autofill styling & validation
 * - Password visibility toggle
 * - Welcome Back Modal: ONLY "The journey of a thousand miles begins with a single step."
 * - Front page: Preserves "Never give up. Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine."
 * - 3D card tilt effect following cursor
 * ============================================================================
 */

const TRANSLATIONS = {
  en: {
    name: 'English',
    pill: 'Daily Inspiration',
    quoteLine1: 'NEVER GIVE UP.',
    quoteLine2: 'TODAY IS HARD,',
    quoteLine3: 'TOMORROW WILL BE WORSE,',
    quoteLine4: 'BUT THE DAY AFTER TOMORROW WILL BE SUNSHINE.',
    author: 'Jack Ma',
    authorRole: 'Founder, Alibaba Group',
    welcome: 'Welcome to VdoU',
    subtitle: 'The journey of a thousand miles begins with a single step.',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    forgot: 'Forgot password?',
    remember: 'Remember me for 30 days',
    signin: 'Sign In',
    divider: 'or',
    google: 'Continue with Google',
    noAccount: "Don't have an account?",
    signup: 'Sign up',
    welcomeBack: 'Welcome Back!',
    welcomeBackMsg: 'You have successfully signed in as'
  },
  ta: {
    name: 'தமிழ் (Tamil)',
    pill: 'தினசரி உத்வேகம்',
    quoteLine1: 'ஒருபோதும் கைவிடாதீர்கள்.',
    quoteLine2: 'இன்று கடினமாக இருக்கலாம்,',
    quoteLine3: 'நாளை இன்னும் கடினமாக இருக்கலாம்,',
    quoteLine4: 'ஆனால் நாளை மறுநாள் பிரகாசமான சூரிய ஒளியாக இருக்கும்.',
    author: 'ஜாக் மா',
    authorRole: 'நிறுவனர், அலிபாபா குழுமம்',
    welcome: 'VdoU-விற்கு நல்வரவு',
    subtitle: 'ஆயிரம் மைல் பயணம் ஒரு சிறிய அடியிலிருந்தே தொடங்குகிறது.',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    passwordLabel: 'கடவுச்சொல்',
    forgot: 'கடவுச்சொல் மறந்துவிட்டதா?',
    remember: '30 நாட்களுக்கு நினைவில் கொள்',
    signin: 'உள்நுழைய',
    divider: 'அல்லது',
    google: 'கூகுள் மூலம் தொடரவும்',
    noAccount: 'கணக்கு இல்லையா?',
    signup: 'பதிவு செய்க',
    welcomeBack: 'மீண்டும் நல்வரவு!',
    welcomeBackMsg: 'வெற்றிகரமாக உள்நுழைந்துள்ளீர்கள்'
  },
  ml: {
    name: 'മലയാളം (Malayalam)',
    pill: 'പ്രതിദിന പ്രചോദനം',
    quoteLine1: 'ഒരിക്കലും ഉപേക്ഷിക്കരുത്.',
    quoteLine2: 'ഇന്ന് കഠിനമാണ്,',
    quoteLine3: 'നാളെ കൂടുതൽ കഠിനമായിരിക്കും,',
    quoteLine4: 'എന്നാൽ മറ്റന്നാൾ പ്രകാശമുള്ള സൂര്യോദയമായിരിക്കും.',
    author: 'ജാക്ക് മാ',
    authorRole: 'സ്ഥാപകൻ, അലിബാബ ഗ്രൂപ്പ്',
    welcome: 'VdoU-ലേക്ക് സ്വാഗതം',
    subtitle: 'ആയിരം മൈലുകളുടെ യാത്ര ഒരു ചുവടിൽ നിന്നാണ് ആരംഭിക്കുന്നത്.',
    emailLabel: 'ഇമെയിൽ വിലാസം',
    passwordLabel: 'പാസ്‌വേഡ്',
    forgot: 'പാസ്‌വേഡ് മറന്നോ?',
    remember: '30 ദിവസത്തേക്ക് എന്നെ ഓർക്കുക',
    signin: 'പ്രവേശിക്കുക',
    divider: 'അല്ലെങ്കിൽ',
    google: 'ഗൂഗിൾ വഴി തുടരുക',
    noAccount: 'അക്കൗണ്ട് ഇല്ലേ?',
    signup: 'സൈൻ അപ്പ് ചെയ്യുക',
    welcomeBack: 'സ്വാഗതം!',
    welcomeBackMsg: 'നിങ്ങൾ വിജയകരമായി പ്രവേശിച്ചു'
  },
  te: {
    name: 'తెలుగు (Telugu)',
    pill: 'రోజువారీ స్ఫూర్తి',
    quoteLine1: 'ఎప్పుడూ వదులుకోవద్దు.',
    quoteLine2: 'ఈ రోజు కష్టంగా ఉంటుంది,',
    quoteLine3: 'రేపు మరింత కష్టంగా ఉండవచ్చు,',
    quoteLine4: 'కానీ ఎల్లుండి అద్భుతమైన సూర్యకాంతి వస్తుంది.',
    author: 'జాక్ మా',
    authorRole: 'వ్యవస్థాపకుడు, అలీబాబా గ్రూప్',
    welcome: 'VdoU కి స్వాగతం',
    subtitle: 'వేల మైళ్ల ప్రయాణం ఒక్క అడుగుతోనే ప్రారంభమవుతుంది.',
    emailLabel: 'ఇమెయిల్ చిరునామా',
    passwordLabel: 'పాస్‌వర్డ్',
    forgot: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    remember: '30 రోజుల పాటు గుర్తుంచుకో',
    signin: 'సైన్ ఇన్',
    divider: 'లేదా',
    google: 'గూగుల్ తో కొనసాగించండి',
    noAccount: 'ఖాతా లేదా?',
    signup: 'సైన్ అప్ చేయండి',
    welcomeBack: 'తిరిగి స్వాగతం!',
    welcomeBackMsg: 'మీరు విజయవంతంగా సైన్ ఇన్ అయ్యారు'
  },
  hi: {
    name: 'हिन्दी (Hindi)',
    pill: 'दैनिक प्रेरणा',
    quoteLine1: 'कभी हार मत मानो।',
    quoteLine2: 'आज का दिन कठिन है,',
    quoteLine3: 'कल और भी बुरा हो सकता है,',
    quoteLine4: 'लेकिन परसों का दिन सुनहरा सवेरा होगा।',
    author: 'जैक मा',
    authorRole: 'संस्थापक, अलीबाबा ग्रुप',
    welcome: 'VdoU में आपका स्वागत है',
    subtitle: 'हजारों मील की यात्रा भी एक कदम से शुरू होती है।',
    emailLabel: 'ईमेल पता',
    passwordLabel: 'पासवर्ड',
    forgot: 'पासवर्ड भूल गए?',
    remember: 'मुझे 30 दिनों तक याद रखें',
    signin: 'साइन इन करें',
    divider: 'या',
    google: 'गूगल के साथ जारी रखें',
    noAccount: 'खाता नहीं है?',
    signup: 'साइन अप करें',
    welcomeBack: 'वापसी पर स्वागत है!',
    welcomeBackMsg: 'आपने सफलतापूर्वक साइन इन किया है'
  }
};

class VdouApp {
  constructor() {
    this.currentTheme = localStorage.getItem('vdou_theme') || 'dark';
    this.currentLang = localStorage.getItem('vdou_lang') || 'en';

    this.initElements();
    this.initTheme();
    this.initLanguage();
    this.bindEvents();
    this.setupCardTilt();
  }

  initElements() {
    // Theme
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.themeLabel = document.getElementById('theme-label');

    // Language Dropdown
    this.langWrapper = document.getElementById('lang-wrapper');
    this.langBtn = document.getElementById('lang-btn');
    this.currentLangText = document.getElementById('current-lang-text');
    this.langDropdown = document.getElementById('lang-dropdown');
    this.langOptions = document.querySelectorAll('.lang-option');

    // Form elements
    this.form = document.getElementById('login-form');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.emailField = document.getElementById('email-field');
    this.passwordField = document.getElementById('password-field');
    this.togglePasswordBtn = document.getElementById('toggle-password');
    this.submitBtn = document.getElementById('submit-btn');
    this.loginCard = document.getElementById('login-card');

    // Translated UI Nodes
    this.tPill = document.getElementById('t-pill');
    this.tQuoteLine1 = document.getElementById('t-quote-line1');
    this.tQuoteLine2 = document.getElementById('t-quote-line2');
    this.tQuoteLine3 = document.getElementById('t-quote-line3');
    this.tQuoteLine4 = document.getElementById('t-quote-line4');
    this.tAuthorName = document.getElementById('t-author-name');
    this.tAuthorRole = document.getElementById('t-author-role');

    this.tWelcome = document.getElementById('t-welcome');
    this.tSubtitle = document.getElementById('t-subtitle');
    this.tEmailLabel = document.getElementById('t-email-label');
    this.tPasswordLabel = document.getElementById('t-password-label');
    this.tRemember = document.getElementById('t-remember');
    this.tSigninBtn = document.getElementById('t-signin-btn');
    this.tDivider = document.getElementById('t-divider');
    this.tGoogleBtn = document.getElementById('t-google-btn');
    this.tNoAccount = document.getElementById('t-no-account');

    // Google Sign-In & Links
    this.googleBtn = document.getElementById('google-btn');
    this.forgotLink = document.getElementById('forgot-link');
    this.signupLink = document.getElementById('signup-link');

    // Toast & Modal
    this.toast = document.getElementById('toast');
    this.toastTitle = document.getElementById('toast-title');
    this.toastMsg = document.getElementById('toast-msg');
    this.modal = document.getElementById('info-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalContent = document.getElementById('modal-content');
    this.modalClose = document.getElementById('modal-close');
    this.modalOkBtn = document.getElementById('modal-ok-btn');
  }

  /**
   * Theme Switcher
   */
  initTheme() {
    this.applyTheme(this.currentTheme, false);

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme, true);
      });
    }
  }

  applyTheme(theme, showToastNotification = false) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vdou_theme', theme);

    if (this.themeLabel) {
      this.themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }

    const galaxy = window.andromedaGalaxy || window.vdouGalaxy;
    if (galaxy && galaxy.setTheme) {
      galaxy.setTheme(theme);
    }

    if (showToastNotification) {
      this.showToast(
        `${theme === 'dark' ? 'Dark' : 'Light'} Mode Activated`,
        `Switched visual appearance to ${theme} theme.`
      );
    }
  }

  /**
   * Language Switcher
   */
  initLanguage() {
    this.applyLanguage(this.currentLang);

    if (this.langBtn && this.langWrapper) {
      this.langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = this.langWrapper.classList.toggle('open');
        this.langBtn.setAttribute('aria-expanded', isOpen);
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.langWrapper.contains(e.target)) {
          this.langWrapper.classList.remove('open');
          this.langBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Select Language
      this.langOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const lang = opt.getAttribute('data-lang');
          this.applyLanguage(lang);
          this.langWrapper.classList.remove('open');
          this.langBtn.setAttribute('aria-expanded', 'false');
          this.showToast('Language Updated', `Selected language: ${TRANSLATIONS[lang].name}`);
        });
      });
    }
  }

  applyLanguage(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    this.currentLang = lang;
    localStorage.setItem('vdou_lang', lang);

    if (this.currentLangText) this.currentLangText.textContent = t.name;

    // Update active state in dropdown
    this.langOptions.forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
    });

    // Update Quote on Front Page
    if (this.tPill) this.tPill.textContent = t.pill;
    if (this.tQuoteLine1) this.tQuoteLine1.textContent = t.quoteLine1;
    if (this.tQuoteLine2) this.tQuoteLine2.textContent = t.quoteLine2;
    if (this.tQuoteLine3) this.tQuoteLine3.textContent = t.quoteLine3;
    if (this.tQuoteLine4) this.tQuoteLine4.textContent = t.quoteLine4;
    if (this.tAuthorName) this.tAuthorName.textContent = t.author;
    if (this.tAuthorRole) this.tAuthorRole.textContent = t.authorRole;

    // Update Login Card Content
    if (this.tWelcome) this.tWelcome.textContent = t.welcome;
    if (this.tSubtitle) this.tSubtitle.textContent = t.subtitle;
    if (this.tEmailLabel) this.tEmailLabel.textContent = t.emailLabel;
    if (this.tPasswordLabel) this.tPasswordLabel.textContent = t.passwordLabel;
    if (this.forgotLink) this.forgotLink.textContent = t.forgot;
    if (this.tRemember) this.tRemember.textContent = t.remember;
    if (this.tSigninBtn) this.tSigninBtn.textContent = t.signin;
    if (this.tDivider) this.tDivider.textContent = t.divider;
    if (this.tGoogleBtn) this.tGoogleBtn.textContent = t.google;
    if (this.tNoAccount) this.tNoAccount.textContent = t.noAccount;
    if (this.signupLink) this.signupLink.textContent = t.signup;
  }

  setupCardTilt() {
    if (!this.loginCard) return;

    window.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 1024) return;

      const rect = this.loginCard.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const mouseX = (e.clientX - cardCenterX) / (window.innerWidth / 2);
      const mouseY = (e.clientY - cardCenterY) / (window.innerHeight / 2);

      const rotateY = mouseX * 5.5;
      const rotateX = -mouseY * 5.5;

      this.loginCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    this.loginCard.addEventListener('mouseleave', () => {
      this.loginCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  }

  bindEvents() {
    // Password visibility toggle
    if (this.togglePasswordBtn) {
      this.togglePasswordBtn.addEventListener('click', () => {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.togglePasswordBtn.classList.toggle('is-visible', isPassword);
        this.togglePasswordBtn.setAttribute(
          'aria-label',
          isPassword ? 'Hide password' : 'Show password'
        );
      });
    }

    // Clear error on typing
    this.emailInput.addEventListener('input', () => {
      this.emailField.classList.remove('has-error');
    });

    this.passwordInput.addEventListener('input', () => {
      this.passwordField.classList.remove('has-error');
    });

    // Form submit
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignIn();
    });

    // Google Sign-In Button
    if (this.googleBtn) {
      this.googleBtn.addEventListener('click', () => {
        this.showToast('Google Sign-In', 'Connecting to Google OAuth services...');
        setTimeout(() => {
          this.openModal(
            'Google Sign-In',
            'Google authentication endpoint initiated. Choose your Google account in the popup window to proceed.'
          );
        }, 500);
      });
    }

    // Forgot password link
    if (this.forgotLink) {
      this.forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal(
          'Reset Your Password',
          'Please enter your registered email address on the main screen, and we will send you a secure password reset link.'
        );
      });
    }

    // Sign up link
    if (this.signupLink) {
      this.signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal(
          'Create a VdoU Account',
          'Registration is open! Click below to begin setting up your new VdoU workspace.'
        );
      });
    }

    // Modal close events
    if (this.modalClose) this.modalClose.addEventListener('click', () => this.closeModal());
    if (this.modalOkBtn) this.modalOkBtn.addEventListener('click', () => this.closeModal());
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }
  }

  handleSignIn() {
    let isValid = true;
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.emailField.classList.add('has-error');
      isValid = false;
    }

    if (password.length < 6) {
      this.passwordField.classList.add('has-error');
      isValid = false;
    }

    if (!isValid) return;

    const t = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;

    // Simulate login loading state
    this.submitBtn.classList.add('loading');
    this.showToast('Signing in...', 'Validating your credentials.');

    setTimeout(() => {
      this.submitBtn.classList.remove('loading');
      this.showToast('Login Successful', `Welcome back to VdoU, ${email}!`);
      
      // USER STRICT SPECIFICATION:
      // In the "Welcome Back!" modal dialog, ONLY show:
      // "The journey of a thousand miles begins with a single step."
      // (NEVER show "Never give up. Today is hard..." here, as it belongs on the front page)
      this.openModal(
        t.welcomeBack,
        `${t.welcomeBackMsg} <strong>${email}</strong>.<br><br>` +
        `<em>"${t.subtitle}"</em>`
      );
    }, 1100);
  }

  showToast(title, msg) {
    if (!this.toast) return;
    this.toastTitle.textContent = title;
    this.toastMsg.textContent = msg;
    this.toast.classList.add('show');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 4000);
  }

  openModal(title, html) {
    if (!this.modal) return;
    this.modalTitle.textContent = title;
    this.modalContent.innerHTML = html;
    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
  }
}

// Start app
window.addEventListener('DOMContentLoaded', () => {
  new VdouApp();
});
