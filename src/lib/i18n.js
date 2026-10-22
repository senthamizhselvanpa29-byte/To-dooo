// ============================================================
// Languages
//
// To ADD a new language (for example Kannada):
//   1. Copy src/locales/en.js to src/locales/kn.js and translate the words
//   2. Add it to the two lists below (LANGUAGES and DICTIONARIES)
//   3. Add the quote translations in src/data/quotes.js
// ============================================================

import en from '@/locales/en';
import ta from '@/locales/ta';
import ml from '@/locales/ml';
import te from '@/locales/te';
import hi from '@/locales/hi';

// Shown in the language menu, in this order.
export const LANGUAGES = [
  { code: 'en', name: 'English', label: 'English' },
  { code: 'ta', name: 'தமிழ்', label: 'தமிழ் (Tamil)' },
  { code: 'ml', name: 'മലയാളം', label: 'മലയാളം (Malayalam)' },
  { code: 'te', name: 'తెలుగు', label: 'తెలుగు (Telugu)' },
  { code: 'hi', name: 'हिन्दी', label: 'हिन्दी (Hindi)' },
];

const DICTIONARIES = { en, ta, ml, te, hi };

export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_COOKIE = 'vdou_lang';

export function isSupportedLanguage(code) {
  return Object.hasOwn(DICTIONARIES, code);
}

// Returns the translated text for a key, e.g. t('signIn') → "Sign In".
// If a word is missing in a language, the English word is used instead.
// Values like {email} in the text are replaced: t('x', { email: 'a@b.com' }).
export function translate(lang, key, values) {
  const dictionary = DICTIONARIES[lang] || DICTIONARIES[DEFAULT_LANGUAGE];
  let text = dictionary[key] ?? DICTIONARIES[DEFAULT_LANGUAGE][key] ?? key;
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      text = text.replaceAll(`{${name}}`, value);
    }
  }
  return text;
}
