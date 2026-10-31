"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { InspectorDeck } from "@/components/layout/InspectorDeck";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { PipelinePanel } from "@/components/views/PipelinePanel";
import { TimetableGrid, TimetableEntities, EveningEvent } from "@/components/timetable/TimetableGrid";
import { ExamsDeck } from "@/components/exams/ExamsDeck";
import { SpectraClashMatrix } from "@/components/spectra/SpectraClashMatrix";
import { ApprovalsDeck } from "@/components/approvals/ApprovalsDeck";
import { DisruptionDeck } from "@/components/disruptions/DisruptionDeck";
import { AiBookingAssistant } from "@/components/assistant/AiBookingAssistant";
import { ExportsDeck } from "@/components/exports/ExportsDeck";
import { AppProvider, useApp } from "@/lib/appContext";
import { ApiError, describeError, fetchBookings, fetchTimetable, login, logout, onUnauthorized, resetDemoData } from "@/lib/api";
import { loadSession, StoredSession } from "@/lib/session";
import { NavRouteId, ReferenceData, ScheduledSession, SessionUser } from "@/lib/types";
import { NAV_ROUTES, ROLE_CONFIGS } from "@/lib/uiConfig";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

type Pivot = "group" | "faculty" | "room";

export function MainDashboardView({ initialNav = "timetable" }: { initialNav?: NavRouteId }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
    return onUnauthorized(() => {
      setSession(null);
      setNotice("Your session ended. Please sign in again.");
    });
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-[#080A0C]" />;
  }
  if (!session) {
    return <LoginScreen notice={notice} onSignedIn={(s) => { setNotice(null); setSession(s); }} />;
  }
  return (
    <AppProvider key={session.user.username} user={session.user}>
      <Workspace
        initialNav={initialNav}
        onSession={setSession}
        onSignOut={() => {
          logout();
          setSession(null);
        }}
      />
    </AppProvider>
  );
}

function allowedEntities(ref: ReferenceData | null, user: SessionUser): TimetableEntities {
  if (!ref) return { group: [], faculty: [], room: [] };
  const rooms = ref.rooms;
  if (user.role === "admin") return { group: ref.student_groups, faculty: ref.faculty, room: rooms };
  if (user.role === "club") return { group: [], faculty: [], room: rooms };
  if (user.role === "faculty") {
    const taught = new Set(ref.sessions.filter((s) => s.faculty_id === user.faculty_id).flatMap((s) => s.groups));
    return {
      group: ref.student_groups.filter((g) => taught.has(g.id)),
      faculty: ref.faculty.filter((f) => f.id === user.faculty_id),
      room: rooms,
    };
  }
  return {
    group: ref.student_groups.filter((g) => g.department === user.department || g.department === "COMMON"),
    faculty: ref.faculty.filter((f) => f.department === user.department),
    room: rooms,
  };
}

function Workspace({
  initialNav,
  onSession,
  onSignOut,
}: {
  initialNav: NavRouteId;
  onSession: (s: StoredSession) => void;
  onSignOut: () => void;
}) {
  const { user, ref, dashboard, revision, refresh } = useApp();
  const roleConfig = ROLE_CONFIGS[user.role];
  const [activeNav, setActiveNav] = useState<NavRouteId>(
    roleConfig.allowedNav.includes(initialNav) ? initialNav : "timetable"
  );
  const [isResetting, setIsResetting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [assistantText, setAssistantText] = useState<string | null>(null);

  const entities = useMemo(() => allowedEntities(ref, user), [ref, user]);
  const defaultPivot: Pivot = user.role === "club" ? "room" : user.role === "faculty" ? "faculty" : "group";
  const [activePivot, setActivePivot] = useState<Pivot>(defaultPivot);
  const [selectedId, setSelectedId] = useState<string>("");
  const [showEvening, setShowEvening] = useState(false);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [ttState, setTtState] = useState<{ loading: boolean; error: string | null; empty: string | null }>({
    loading: false, error: null, empty: null,
  });
  const [events, setEvents] = useState<EveningEvent[]>([]);

  // pick a sensible first entity once reference data arrives, or when the pivot changes
  useEffect(() => {
    const list = entities[activePivot] as Array<{ id: string }>;
    if (!list.length) return;
    if (!list.some((e) => e.id === selectedId)) {
      const preferred = activePivot === "group" ? "Y1-A" : activePivot === "room" ? (user.role === "club" ? "AUD" : "LH-1") : "";
      setSelectedId(list.some((e) => e.id === preferred) ? preferred : list[0].id);
    }
  }, [entities, activePivot, selectedId, user.role]);

  // keep the URL in step with the screen, so a reload or shared link opens the same place
  const changeNav = useCallback((nav: NavRouteId) => {
    setActiveNav(nav);
    const href = NAV_ROUTES.find((r) => r.id === nav)?.href;
    if (href && typeof window !== "undefined") window.history.replaceState(null, "", href);
  }, []);

  useEffect(() => {
    if (!ref || !selectedId) return;
    let alive = true;
    setTtState((s) => ({ ...s, loading: true, error: null }));
    fetchTimetable(activePivot, selectedId, ref)
      .then((rows) => {
        if (!alive) return;
        setSessions(rows);
        setTtState({ loading: false, error: null, empty: null });
      })
      .catch((e) => {
        if (!alive) return;
        setSessions([]);
        if (e instanceof ApiError && e.status === 404) {
          setTtState({ loading: false, error: null, empty: user.role === "admin"
            ? "No timetable yet. Press 1. GENERATE TIMETABLE above."
            : "No timetable has been generated yet. Ask an Admin to generate it." });
        } else {
          setTtState({ loading: false, error: describeError(e), empty: null });
        }
      });
    return () => {
      alive = false;
    };
  }, [ref, activePivot, selectedId, revision, dashboard?.schedule_version, user.role]);

  // evening (P10-P13) and Week 7 events for the selected room, straight from the booking decisions
  useEffect(() => {
    if (!showEvening || activePivot !== "room" || !selectedId) {
      setEvents([]);
      return;
    }
    fetchBookings()
      .then((b) => {
        const fromDataset: EveningEvent[] = b.requests
          .filter((r) => r.assigned_room === selectedId && (r.status === "approved" || r.status === "alternative_offered"))
          .map((r) => ({ id: r.id, title: r.title, day: r.day, start: r.start_period, end: r.end_period, status: r.status }));
        const fromApp: EveningEvent[] = b.submitted
          .filter((s) => s.placement?.room_id === selectedId && (s.status === "APPROVED" || s.status === "ALTERNATIVE_OFFERED"))
          .map((s) => ({ id: s.id, title: s.title, day: s.placement!.day, start: s.placement!.start_period,
                         end: s.placement!.end_period, status: s.status.toLowerCase() }));
        setEvents([...fromDataset, ...fromApp]);
      })
      .catch(() => setEvents([]));
  }, [showEvening, activePivot, selectedId, revision]);

  const handleReset = async () => {
    if (!window.confirm("Reset the shared demo data? Generated timetables, exams, bookings and proposals are cleared. Demo accounts are kept.")) return;
    setIsResetting(true);
    try {
      const r = await resetDemoData();
      setToast({ ok: true, text: `${r.message} (revision ${r.revision})` });
      await refresh();
    } catch (e) {
      setToast({ ok: false, text: describeError(e) });
    } finally {
      setIsResetting(false);
      setTimeout(() => setToast(null), 6000);
    }
  };

  const switchAccount = async (u: string, p: string) => {
    setSwitching(true);
    try {
      onSession(await login(u, p));
    } catch (e) {
      setToast({ ok: false, text: describeError(e) });
      setTimeout(() => setToast(null), 6000);
    } finally {
      setSwitching(false);
    }
  };

  const header = (
    <Header
      user={user}
      dashboard={dashboard}
      workspaceRevision={dashboard?.revision ?? 0}
      onReset={handleReset}
      isResetting={isResetting}
      activeNav={activeNav}
      onNavChange={changeNav}
      onSwitchAccount={switchAccount}
      onSignOut={onSignOut}
      switching={switching}
    />
  );

  const inspector = (
    <InspectorDeck
      onOpenAssistant={(text) => {
        setAssistantText(text);
        changeNav("ai_booking");
      }}
      onOpenApprovals={() => changeNav("approvals")}
    />
  );

  return (
    <AppShell
      header={header}
      inspector={inspector}
      footerRevision={`${dashboard?.dataset_id || "..."} // REV ${dashboard?.revision ?? "-"}`}
      footerSummary={`ROLE: ${user.role.toUpperCase()} // SCREEN: ${activeNav.toUpperCase()}`}
    >
      <div className="space-y-4">
        {toast && (
          <div className={`p-3 rounded-[4px] border flex items-center gap-2 text-xs font-mono ${
            toast.ok ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200" : "bg-rose-950/70 border-rose-500/50 text-rose-200"
          }`} role="status">
            {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        )}

        <PipelinePanel />

        {!ref && (
          <div className="p-6 flex items-center gap-2 font-mono text-xs text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading campus data from the server...
          </div>
        )}

        {ref && activeNav === "timetable" && (
          <div className="space-y-2">
            {ttState.error && (
              <div className="p-2 bg-rose-950/50 border border-rose-500/40 rounded font-mono text-xs text-rose-200">{ttState.error}</div>
            )}
            {ttState.empty && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded font-mono text-xs text-amber-200">{ttState.empty}</div>
            )}
            <TimetableGrid
              sessions={sessions}
              loading={ttState.loading}
              entities={entities}
              activePivot={activePivot}
              onPivotChange={setActivePivot}
              selectedId={selectedId}
              onSelectId={setSelectedId}
              showEvening={showEvening}
              onToggleEvening={() => setShowEvening(!showEvening)}
              eveningEvents={events}
            />
          </div>
        )}
        {ref && activeNav === "exams" && <ExamsDeck />}
        {ref && activeNav === "spectra_clash" && <SpectraClashMatrix />}
        {ref && activeNav === "approvals" && <ApprovalsDeck onOpenDisruptions={() => changeNav("disruptions")} />}
        {ref && activeNav === "disruptions" && <DisruptionDeck />}
        {ref && activeNav === "ai_booking" && (
          <AiBookingAssistant initialText={assistantText} onConsumedInitialText={() => setAssistantText(null)} />
        )}
        {ref && activeNav === "exports" && <ExportsDeck />}
      </div>
    </AppShell>
  );
}
