'use client';

// ============================================================
// MY PLAN — shared by every planner page (set up in ../app/AppShell.js)
//
//   const { isPro, plan, daysLeft } = usePlan();
//
// The first time, the database starts the 45-day free trial.
// If the plans table is not set up yet, everything stays unlocked.
// ============================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { daysLeft, fetchMyPlan, isProPlan } from '@/lib/plans';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState(null); // { plan: 'trial' | 'monthly' | 'yearly' | 'lifetime', pro_until }
  const [loaded, setLoaded] = useState(false);
  const [available, setAvailable] = useState(true);

  const reload = useCallback(async () => {
    try {
      setPlan(await fetchMyPlan());
      setAvailable(true);
    } catch {
      setAvailable(false);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      plan,
      loaded,
      available,
      // Locked features stay open until the plan is known (or if the table is missing)
      isPro: !loaded || !available || isProPlan(plan),
      daysLeft: daysLeft(plan),
      setPlan,
      reload,
    }),
    [plan, loaded, available, reload]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const value = useContext(PlanContext);
  // Outside the planner frame: behave as Pro (nothing locked)
  return value || { plan: null, loaded: true, available: false, isPro: true, daysLeft: null, setPlan() {}, reload() {} };
}
