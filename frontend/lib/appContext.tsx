"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Dashboard, ReferenceData, SessionUser } from "./types";
import { describeError, fetchDashboard, fetchReference } from "./api";

interface AppState {
  user: SessionUser;
  ref: ReferenceData | null;
  dashboard: Dashboard | null;
  /** Bumps whenever the server's workspace revision changes; screens reload their data when it does. */
  revision: number;
  error: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

/** Loads reference data once per dataset and polls the dashboard so all screens notice server changes. */
export function AppProvider({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [ref, setRef] = useState<ReferenceData | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const datasetRef = useRef<string | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const refresh = useCallback(async () => {
    try {
      const d = await fetchDashboard();
      setDashboard(d);
      setError(null);
      setRevision((prev) => (prev !== d.revision ? d.revision : prev));
      if (datasetRef.current !== d.dataset_id) {
        // first load, or an Admin imported a different dataset
        const r = await fetchReference();
        datasetRef.current = r.dataset_id;
        setRef(r);
      }
    } catch (e) {
      setError(describeError(e));
      // nothing loaded yet (for example the free server is still waking up): try again soon, not in 15 s
      if (!datasetRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = setTimeout(refresh, 4000);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => { clearInterval(t); clearTimeout(retryRef.current); };
  }, [refresh]);

  // a reset or import can keep the same dataset id but change sessions; reload reference on every revision bump
  useEffect(() => {
    if (!revision) return;
    fetchReference()
      .then((r) => {
        datasetRef.current = r.dataset_id;
        setRef(r);
      })
      .catch(() => undefined);
  }, [revision]);

  return (
    <Ctx.Provider value={{ user, ref, dashboard, revision, error, refresh }}>{children}</Ctx.Provider>
  );
}
