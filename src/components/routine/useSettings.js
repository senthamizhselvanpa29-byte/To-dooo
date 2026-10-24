'use client';

// ============================================================
// The user's settings: day / night shift, wake-up times,
// night planning time, and whether the routine is set up.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, fetchSettings, saveSettings } from '@/lib/routines';

// Only these fields are saved by the app
const EDITABLE = ['shift', 'day_wake', 'night_wake', 'planning_offset', 'routine_set_up', 'night_planned_on'];
// Added later (Step 5) — saved only when the database already has it or it is being changed
const NEWER = ['week_start'];

export function useSettings() {
  const [settings, setSettings] = useState(null); // null = still loading
  const [hasRow, setHasRow] = useState(false);
  const [available, setAvailable] = useState(true); // false = table not created yet

  const reload = useCallback(async () => {
    try {
      const row = await fetchSettings();
      setSettings(row || DEFAULT_SETTINGS);
      setHasRow(Boolean(row));
      setAvailable(true);
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (changes) => {
      const next = { ...(settings || DEFAULT_SETTINGS), ...changes };
      const keys = [...EDITABLE, ...NEWER.filter((k) => k in changes || (settings && k in settings && hasRow))];
      const saved = await saveSettings(Object.fromEntries(keys.map((k) => [k, next[k]])));
      setSettings(saved);
      setHasRow(true);
      return saved;
    },
    [settings, hasRow]
  );

  return {
    settings,
    available,
    needsSetup: available && settings !== null && (!hasRow || !settings.routine_set_up),
    update,
    reload,
  };
}
