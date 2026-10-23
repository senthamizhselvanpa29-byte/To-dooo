'use client';

// ============================================================
// TOP BAR — logo on the left, language menu + theme switch on the right
// Pages can add extra buttons on the right (the planner adds the
// account menu) by putting them inside <TopBar>…</TopBar>.
// ============================================================

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '@/lib/i18n';
import { usePreferences } from './Preferences';
import { ChevronIcon, GlobeIcon, MoonIcon, SunIcon } from './Icons';

export default function TopBar({ variant, children }) {
  const { t } = usePreferences();

  return (
    <header className={`top-controls${variant ? ` ${variant}` : ''}`}>
      {/* ----- Logo (left corner) ----- */}
      <Link href="/" className="top-brand" aria-label={t('home')}>
        <span className="brand-logo-badge">
          <Image src="/logo.png" alt="VdoU" width={1024} height={921} className="brand-logo-img" priority />
        </span>
      </Link>

      {/* ----- Language + theme (right corner) ----- */}
      <div className="top-actions">
        <LanguageMenu />
        <ThemeToggle />
        {children}
      </div>
    </header>
  );
}

// ------------------------------------------------------------
// Language menu: English, Tamil, Malayalam, Telugu, Hindi
// ------------------------------------------------------------
function LanguageMenu() {
  const { t, lang, setLang } = usePreferences();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Close the menu when clicking anywhere else or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className={`lang-selector-wrapper${open ? ' open' : ''}`}>
      <button
        type="button"
        className="action-btn lang-btn"
        aria-haspopup="true"
        aria-expanded={open}
        title={t('changeLanguage')}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon className="globe-icon" />
        <span>{current.name}</span>
        <ChevronIcon className="chevron-icon" />
      </button>

      <div className="lang-dropdown" role="menu">
        {LANGUAGES.map((language) => (
          <button
            key={language.code}
            type="button"
            role="menuitem"
            className={`lang-option${language.code === lang ? ' active' : ''}`}
            onClick={() => {
              setLang(language.code);
              setOpen(false);
            }}
          >
            <span className="lang-name">{language.label}</span>
            <span className="lang-code">{language.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Dark / light mode switch
// ------------------------------------------------------------
function ThemeToggle() {
  const { t, theme, setTheme } = usePreferences();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="action-btn theme-toggle-btn"
      aria-label={t('switchTheme')}
      title={t('switchTheme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <span className="toggle-track">
        <span className="toggle-thumb">
          <SunIcon className="icon-sun" />
          <MoonIcon className="icon-moon" />
        </span>
      </span>
      <span className="theme-label">{isDark ? t('darkMode') : t('lightMode')}</span>
    </button>
  );
}
