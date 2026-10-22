// ============================================================
// ROOT LAYOUT — wraps EVERY page of the app
// Sets the page language, the theme (dark / light), the fonts
// and the global styles.
// ============================================================

import { cookies } from 'next/headers';
import { PreferencesProvider, THEME_COOKIE } from '@/components/Preferences';
import { DEFAULT_LANGUAGE, isSupportedLanguage, LANGUAGE_COOKIE } from '@/lib/i18n';
import './globals.css';

// Text shown in the browser tab and in Google search results
export const metadata = {
  title: {
    default: 'VdoU — Plan your life in 2 taps',
    template: '%s · VdoU',
  },
  description: 'VdoU is a simple, low-cost planner for everyone. Plan your day in English, Tamil, Malayalam, Telugu or Hindi.',
  icons: { icon: '/logo.png' },
};

export const viewport = {
  themeColor: '#02040b',
};

export default async function RootLayout({ children }) {
  // Read the saved language and theme (from cookies)
  const cookieStore = await cookies();
  const savedLang = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const lang = isSupportedLanguage(savedLang) ? savedLang : DEFAULT_LANGUAGE;
  const theme = cookieStore.get(THEME_COOKIE)?.value === 'light' ? 'light' : 'dark';

  return (
    <html lang={lang} data-theme={theme}>
      <head>
        {/* Fonts: Outfit + Plus Jakarta Sans for English, Noto Sans for Indian scripts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <PreferencesProvider initialLang={lang} initialTheme={theme}>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
