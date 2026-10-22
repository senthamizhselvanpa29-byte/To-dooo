// ============================================================
// FRAME FOR THE ACCOUNT PAGES
// (login, sign-up, forgot password, new password, terms, privacy)
//
// Galaxy background + top bar + daily quote on the left,
// and the page's box (card) on the right.
// On phones the quote becomes small and sits above the box.
//
// Note: the folder name "(auth)" has brackets, which means it groups
// pages together without adding "/auth" to the web address.
// ============================================================

import GalaxyBackground from '@/components/GalaxyBackground';
import TopBar from '@/components/TopBar';
import DailyQuote from '@/components/DailyQuote';
import AuthCard from '@/components/auth/AuthCard';
import { getTodaysQuote } from '@/lib/dailyQuote';

export default function AuthPagesLayout({ children }) {
  const quote = getTodaysQuote();

  return (
    <>
      <GalaxyBackground />
      <TopBar />

      <main className="page-container">
        <div className="layout-grid">
          <DailyQuote quote={quote} />
          <section className="login-section">
            <AuthCard>{children}</AuthCard>
          </section>
        </div>
      </main>
    </>
  );
}
