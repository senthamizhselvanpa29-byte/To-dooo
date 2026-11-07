'use client';

// ============================================================
// 👁️ Hide amounts (shows ₹••• when someone is near your screen)
// Starts from the "Hide amounts when the app opens" setting; the eye
// button changes it until the browser tab is closed.
// ============================================================

import { useCallback, useEffect, useState } from 'react';

const KEY = 'vdou_money_hidden';

export function useMoneyHidden(settings) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!settings) return;
    let saved = null;
    try {
      saved = sessionStorage.getItem(KEY);
    } catch {
      // private window — just use the setting
    }
    setHidden(saved === null ? Boolean(settings.money_hide) : saved === '1');
  }, [settings]);

  const toggle = useCallback(() => {
    setHidden((current) => {
      try {
        sessionStorage.setItem(KEY, current ? '0' : '1');
      } catch {
        // ignore
      }
      return !current;
    });
  }, []);

  return [hidden, toggle];
}
