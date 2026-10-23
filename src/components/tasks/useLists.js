'use client';

// ============================================================
// The user's lists (Home, Work, Study…) for pickers and tags.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLists } from '@/lib/tasks';

export function useLists() {
  const [lists, setLists] = useState([]);

  const reloadLists = useCallback(async () => {
    try {
      setLists(await fetchLists());
    } catch {
      setLists([]); // lists table not created yet → simply no lists
    }
  }, []);

  useEffect(() => {
    reloadLists();
  }, [reloadLists]);

  const listsById = useMemo(() => Object.fromEntries(lists.map((l) => [l.id, l])), [lists]);
  return { lists, listsById, reloadLists };
}
