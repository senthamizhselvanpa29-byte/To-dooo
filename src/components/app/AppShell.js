'use client';

// ============================================================
// PLANNER FRAME — used by every planner page (Today, Upcoming, Lists, Reports, Settings)
//
// - Calm background with a few tiny stars
// - Top bar: logo, language, dark/light, account menu
// - Menu: on the left on computers, at the bottom on phones
//
// To add a new menu item, add it to MENU below.
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopBar from '../TopBar';
import { usePreferences } from '../Preferences';
import { CalendarIcon, ChartIcon, GearIcon, ListIcon, SunIcon } from '../Icons';
import UserMenu from './UserMenu';

// href: null means the page is not built yet ("Soon")
const MENU = [
  { key: 'navToday', href: '/today', Icon: SunIcon },
  { key: 'navUpcoming', href: '/upcoming', Icon: CalendarIcon },
  { key: 'navLists', href: '/lists', Icon: ListIcon },
  { key: 'navReports', href: '/reports', Icon: ChartIcon },
  { key: 'navSettings', href: '/settings', Icon: GearIcon },
];

export default function AppShell({ name, email, children }) {
  const { t } = usePreferences();
  const pathname = usePathname();

  return (
    <div className="app-page">
      <div className="app-stars" aria-hidden="true" />

      <TopBar variant="app-topbar">
        <UserMenu name={name} email={email} />
      </TopBar>

      <nav className="app-nav" aria-label="Main">
        {MENU.map(({ key, href, Icon }) =>
          href ? (
            <Link
              key={key}
              href={href}
              className={`app-nav-item${pathname === href ? ' active' : ''}`}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon className="app-nav-icon" />
              <span>{t(key)}</span>
            </Link>
          ) : (
            <span key={key} className="app-nav-item disabled" aria-disabled="true">
              <Icon className="app-nav-icon" />
              <span>{t(key)}</span>
              <span className="soon-badge">{t('comingSoon')}</span>
            </span>
          )
        )}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  );
}
