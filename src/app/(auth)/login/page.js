// ============================================================
// LOGIN PAGE  →  /login
// The form itself is in src/components/auth/LoginForm.js
// ============================================================

import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Log In' };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
