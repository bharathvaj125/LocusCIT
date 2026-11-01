"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { CommandPalette, PaletteItem } from "@/components/layout/CommandPalette";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Overview } from "@/components/views/Overview";
import { TimetableView, TimetableEntities, TimetableMode, Week7Data } from "@/components/timetable/TimetableView";
import { ExamsBoard } from "@/components/exams/ExamsBoard";
import { SpectraBoard } from "@/components/spectra/SpectraBoard";
import { ApprovalsDeck } from "@/components/approvals/ApprovalsDeck";
import { DisruptionDeck } from "@/components/disruptions/DisruptionDeck";
import { AiBookingAssistant } from "@/components/assistant/AiBookingAssistant";
import { ExportsDeck } from "@/components/exports/ExportsDeck";
import { AppProvider, useApp } from "@/lib/appContext";
import { ToastProvider, useToast } from "@/lib/toast";
import { ApiError, describeError, fetchTimetable, fetchWeek7, login, logout, onUnauthorized } from "@/lib/api";
import { loadSession, StoredSession } from "@/lib/session";
import { NavRouteId, ReferenceData, ScheduledSession, SessionUser } from "@/lib/types";
import { NAV_ROUTES, ROLE_CONFIGS } from "@/lib/uiConfig";
import { Skeleton } from "@/components/ui/primitives";

import { AnimatePresence } from "framer-motion";
import { IntroReveal } from "@/components/intro/IntroReveal";

type Pivot = "group" | "faculty" | "room";

export function MainDashboardView({ initialNav = "overview" }: { initialNav?: NavRouteId }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introKey, setIntroKey] = useState(1);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);

    try {
      const seen = sessionStorage.getItem("locus_intro_seen");
      if (seen === "true") {
        setShowIntro(false);
      }
    } catch {
      // ignore
    }

    const handleReplay = () => {
      try {
        sessionStorage.removeItem("locus_intro_seen");
      } catch {
        // ignore
      }
      setIntroKey((k) => k + 1);
      setShowIntro(true);
    };

    window.addEventListener("replay_intro", handleReplay);
    const unauth = onUnauthorized(() => { setSession(null); setNotice("Your session ended. Please sign in again."); });

    return () => {
      window.removeEventListener("replay_intro", handleReplay);
      unauth();
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroReveal
            key={introKey}
            onComplete={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {!ready ? (
        <div className="min-h-screen" />
      ) : !session ? (
        <LoginScreen notice={notice} onSignedIn={(s) => { setNotice(null); setSession(s); }} />
      ) : (
        <ToastProvider>
          <AppProvider key={session.user.username} user={session.user}>
            <Workspace initialNav={initialNav} onSession={setSession} onSignOut={() => { logout(); setSession(null); }} />
          </AppProvider>
        </ToastProvider>
      )}
    </>
  );
}

function allowedEntities(ref: ReferenceData | null, user: SessionUser): TimetableEntities {
  if (!ref) return { group: [], faculty: [], room: [] };
  // campus timetables are shared, read-only information: every role can open any group, teacher or room
  return { group: ref.student_groups, faculty: ref.faculty, room: ref.rooms };
}

function Workspace({ initialNav, onSession, onSignOut }: { initialNav: NavRouteId; onSession: (s: StoredSession) => void; onSignOut: () => void }) {
  const { user, ref, dashboard, revision, error: loadError, refresh } = useApp();
  const toast = useToast();
  const allowed = ROLE_CONFIGS[user.role].allowedNav;
  const [nav, setNav] = useState<NavRouteId>(allowed.includes(initialNav) ? initialNav : "overview");
  const [switching, setSwitching] = useState(false);
  const [palette, setPalette] = useState(false);
  const [assistantText, setAssistantText] = useState<string | null>(null);

  const entities = useMemo(() => allowedEntities(ref, user), [ref, user]);
  const [pivot, setPivot] = useState<Pivot>(user.role === "club" ? "room" : user.role === "faculty" ? "faculty" : "group");
  const [selectedId, setSelectedId] = useState("");
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [tt, setTt] = useState<{ loading: boolean; error: string | null; empty: string | null }>({ loading: false, error: null, empty: null });
  const [mode, setMode] = useState<TimetableMode>("regular");
  const [week7, setWeek7] = useState<Week7Data>({ events: [], closures: [] });

  const go = useCallback((n: NavRouteId) => {
    setNav(n);
    const href = NAV_ROUTES.find((r) => r.id === n)?.href;
    if (href && typeof window !== "undefined") window.history.replaceState(null, "", href);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // choose a sensible first entity when reference data arrives or the pivot changes
  useEffect(() => {
    const list = entities[pivot] as Array<{ id: string }>;
    if (!list.length) return;
    if (!list.some((e) => e.id === selectedId)) {
      const own = pivot === "faculty" ? user.faculty_id || "" : pivot === "group" && user.role === "department_coordinator"
        ? (ref?.student_groups.find((g) => g.department === user.department)?.id || "") : "";
      const pref = own || (pivot === "group" ? "Y1-A" : pivot === "room" ? (user.role === "club" ? "AUD" : "LH-1") : "");
      setSelectedId(list.some((e) => e.id === pref) ? pref : list[0].id);
    }
  }, [entities, pivot, selectedId, user.role]);

  // the two modes hold different rows: clear them so one mode's classes never flash inside the other's grid
  useEffect(() => { setSessions([]); setWeek7({ events: [], closures: [] }); }, [mode]);

  useEffect(() => {
    if (nav !== "timetable" || !ref || !selectedId) return;
    let alive = true;
    setTt((s) => ({ ...s, loading: true, error: null }));
    const load = mode === "week7"
      ? fetchWeek7(pivot, selectedId, ref).then((d) => { if (alive) setWeek7({ events: d.events, closures: d.closures }); return d.classes; })
      : fetchTimetable(pivot, selectedId, ref);
    load
      .then((rows) => { if (alive) { setSessions(rows); setTt({ loading: false, error: null, empty: null }); } })
      .catch((e) => {
        if (!alive) return;
        setSessions([]);
        if (e instanceof ApiError && e.status === 404) setTt({ loading: false, error: null, empty: user.role === "admin" ? "No timetable yet. Run step 1 on the Overview page." : "No timetable has been generated yet. An Admin has to do that first." });
        else setTt({ loading: false, error: describeError(e), empty: null });
      });
    return () => { alive = false; };
  }, [nav, ref, pivot, selectedId, mode, revision, dashboard?.schedule_version, user.role]);

  const switchAccount = async (u: string, p: string) => {
    setSwitching(true);
    try { onSession(await login(u, p)); } catch (e) { toast.error(describeError(e)); } finally { setSwitching(false); }
  };

  const items: PaletteItem[] = useMemo(() => {
    const out: PaletteItem[] = NAV_ROUTES.filter((r) => allowed.includes(r.id)).map((r) => ({ id: "nav-" + r.id, label: r.label, hint: r.description, group: "Go to", run: () => go(r.id) }));
    const open = (p: Pivot, id: string) => () => { setPivot(p); setSelectedId(id); go("timetable"); };
    entities.group.forEach((g) => out.push({ id: "g-" + g.id, label: `${g.id}  ${g.name}`, hint: `${g.size} students`, group: "Student groups", run: open("group", g.id) }));
    entities.faculty.forEach((f) => out.push({ id: "f-" + f.id, label: `${f.name}`, hint: `${f.id} · ${f.department}`, group: "Faculty", run: open("faculty", f.id) }));
    entities.room.forEach((r) => out.push({ id: "r-" + r.id, label: `${r.id}  ${r.name}`, hint: `${r.type.replace(/_/g, " ")} · ${r.capacity} seats`, group: "Rooms", run: open("room", r.id) }));
    out.push({ id: "signout", label: "Sign out", group: "Account", run: onSignOut });
    return out;
  }, [allowed, entities, go, onSignOut]);

  return (
    <>
      <Shell user={user} dashboard={dashboard} nav={nav} onNav={go} onSwitch={switchAccount} onSignOut={onSignOut} onSearch={() => setPalette(true)} switching={switching}>
        {!ref && nav !== "overview" ? (
          <div className="space-y-4" role="status">
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600"><Loader2 className="w-4 h-4 animate-spin" />Loading campus data...
              {loadError && <button onClick={() => refresh()} className="font-semibold text-lagoon-700 underline cursor-pointer">Try again now</button>}
            </div>
            {loadError && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3">{loadError} Retrying automatically.</p>}
            <Skeleton className="h-64" />
          </div>
        ) : (
          <>
            {nav === "overview" && <Overview onNav={go} />}
            {nav === "timetable" && (
              <div className="space-y-3">
                {tt.error && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3" role="alert">{tt.error}</p>}
                {tt.empty && <p className="text-sm text-saffron-600 bg-saffron-50 rounded-xl px-4 py-3">{tt.empty}</p>}
                <TimetableView sessions={sessions} loading={tt.loading} entities={entities} pivot={pivot} onPivot={setPivot} selectedId={selectedId} onSelect={setSelectedId} mode={mode} onMode={setMode} week7={week7} ref_={ref} />
              </div>
            )}
            {nav === "exams" && <ExamsBoard />}
            {nav === "spectra_clash" && <SpectraBoard />}
            {nav === "approvals" && <ApprovalsDeck onOpenChanges={() => go("disruptions")} />}
            {nav === "disruptions" && <DisruptionDeck onOpenExports={() => go("exports")} />}
            {nav === "ai_booking" && <AiBookingAssistant initialText={assistantText} onConsumedInitialText={() => setAssistantText(null)} />}
            {nav === "exports" && <ExportsDeck />}
          </>
        )}
      </Shell>
      <CommandPalette open={palette} onClose={() => setPalette(false)} items={items} />
    </>
  );
}
