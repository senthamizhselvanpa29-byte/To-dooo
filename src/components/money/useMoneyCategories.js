'use client';

// ============================================================
// My own money categories (e.g. 🐄 Cow feed) — loaded once per page
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createMoneyCategory, fetchMoneyCategories } from '@/lib/money';

export function useMoneyCategories() {
  const [categories, setCategories] = useState([]);
  const [available, setAvailable] = useState(true); // false = money tables not set up yet

  const reload = useCallback(async () => {
    try {
      setCategories(await fetchMoneyCategories());
      setAvailable(true);
    } catch {
      setCategories([]);
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Add one and return it (so the form can select it straight away)
  const add = useCallback(async (fields) => {
    const created = await createMoneyCategory(fields);
    setCategories((list) => [...list, created]);
    return created;
  }, []);

  const byId = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  return { categories, byId, available, reload, add };
}
