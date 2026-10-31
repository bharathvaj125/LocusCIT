"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Cpu, Download, GraduationCap, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { usePipeline } from "@/lib/pipeline";
import { describeError, fetchAudit, resetDemoData } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { NavRouteId } from "@/lib/types";
import { CampusGlance } from "@/components/campus/CampusGlance";
import { Button, Card, Chip, CountUp, Eyebrow, PageTitle, Ring, Skeleton, StepDot } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

function ago(ts: number) {
  const s = Math.max(0, Date.now() / 1000 - ts);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
}

export function Overview({ onNav }: { onNav: (n: NavRouteId) => void }) {
  const { user, dashboard: d, revision, error: loadError, refresh } = useApp();
  const p = usePipeline();
  const [audit, setAudit] = useState<Array<{ at: number; actor: string; action: string; detail: string }>>([]);
  const isAdmin = user.role === "admin";
  const toast = useToast();
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (isAdmin) fetchAudit().then((a) => setAudit(a.slice(0, 7))).catch(() => setAudit([]));
  }, [isAdmin, revision]);

  const scheduled = !!d && d.sessions_scheduled > 0;
  const examsDone = !!d && d.exams_total > 0 && d.exams_scheduled === d.exams_total;
  const decided = !!d && d.booking_requests > 0 && d.booking_decisions === d.booking_requests;
  const ready = scheduled && examsDone && decided;
  const stepState = (done: boolean, active: boolean): "done" | "active" | "todo" => (done ? "done" : active ? "active" : "todo");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = user.display_name.replace(/ \(.*/, "").replace(/'s Office$/, "");

  const steps = [
    { n: 1, title: "Generate the timetable", done: scheduled, active: !scheduled, run: p.generate, key: "generate" as const,
      note: scheduled ? `${d!.sessions_scheduled} of ${d!.sessions_total} sessions placed` : "189 sessions, no clashes", icon: <Cpu className="w-4 h-4" /> },
    { n: 2, title: "Schedule midsem exams", done: examsDone, active: scheduled && !examsDone, run: p.exams, key: "exams" as const,
      note: examsDone ? `${d!.exams_scheduled} of ${d!.exams_total} exams placed` : "Rooms seat half their capacity", icon: <GraduationCap className="w-4 h-4" /> },
    { n: 3, title: "Decide Spectra requests", done: decided, active: scheduled && !decided, run: p.bookings, key: "bookings" as const,
      note: decided ? `${d!.booking_decisions} decided, score ${d!.booking_score}/${d!.booking_score_max ?? "?"}` : "By priority, with a reason each", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const solverPhase = p.job?.phase === "optimising"
    ? { text: `Valid timetable found and already usable (soft penalty ${p.job.soft_total}). Now improving it`, tone: "saffron" as const }
    : { text: "Searching for a clash-free timetable", tone: "lagoon" as const };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">
      <motion.div variants={item}>
        <PageTitle
          eyebrow="Overview"
          title={<>{greeting}, <span className="italic font-medium text-lagoon-700">{first}</span></>}
          subtitle={
            isAdmin
              ? "Three steps take the public dataset to a validated timetable, exam week and Spectra decisions. Everything below is read live from the server."
              : "Here is the state of the semester timetable, exams and Spectra bookings."
          }
        />
      </motion.div>

      {/* pipeline */}
      <motion.div variants={item}>
        <Card className="overflow-hidden">
          <div className="relative bg-lagoon-900 text-raised px-6 md:px-8 py-6">
            <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden" aria-hidden>
              <div className="wave-drift absolute -bottom-2 left-0 w-[200%]"><svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24"><path d="M0 60 Q 150 10 300 60 T 600 60 T 900 60 T 1200 60 V120 H0Z" fill="#1F8A96" /></svg></div>
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div>
                <Eyebrow className="text-lagoon-200">The pipeline</Eyebrow>
                <h2 className="font-display text-2xl md:text-3xl font-semibold mt-1">
                  {ready ? "Everything is placed and validated" : isAdmin ? "Run the three steps in order" : "Waiting for an Admin to finish setup"}
                </h2>
              </div>
              {ready && isAdmin && (
                <Button variant="sunrise" icon={<Download className="w-4 h-4" />} onClick={() => onNav("exports")}>Open exports</Button>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-line">
            {steps.map((s) => (
              <div key={s.n} className="p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <StepDot n={s.n} state={stepState(s.done, s.active)} />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] leading-snug">{s.title}</h3>
                    <p className="text-sm text-ink-600 mt-0.5">{s.note}</p>
                  </div>
                </div>
                {isAdmin ? (
                  <Button variant={s.done ? "secondary" : "primary"} size="md" icon={s.icon} loading={p.busy === s.key}
                    disabled={(p.busy !== null && p.busy !== s.key) || (s.n > 1 && !scheduled)} onClick={s.run}>
                    {p.busy === s.key ? "Working..." : s.done ? "Run again" : "Run this step"}
                  </Button>
                ) : (
                  <Chip tone={s.done ? "mangrove" : "stone"} dot>{s.done ? "Done" : "Not done yet"}</Chip>
                )}
              </div>
            ))}
          </div>
          {p.busy === "generate" && (
            <div className="border-t border-line bg-lagoon-50/60 px-6 py-4 flex flex-wrap items-center gap-4">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lagoon-500 opacity-60" /><span className="relative inline-flex rounded-full h-3 w-3 bg-lagoon-500" /></span>
              <p className="text-sm font-medium text-lagoon-900 flex-1 min-w-[240px]">{solverPhase.text}.</p>
              <span className="font-mono text-sm text-lagoon-700 tabular">{Math.floor(p.elapsed / 60)}:{String(p.elapsed % 60).padStart(2, "0")}</span>
              <div className="w-full h-1.5 rounded-full bg-lagoon-200 overflow-hidden">
                <motion.div className="h-full bg-lagoon-500" initial={{ width: "4%" }} animate={{ width: p.job?.phase === "optimising" ? "70%" : "28%" }} transition={{ duration: 6, ease: "easeOut" }} />
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {!d && loadError && (
        <motion.div variants={item} role="alert" className="rounded-xl bg-sunrise-50 text-sunrise-600 px-4 py-3 text-sm flex flex-wrap items-center gap-3">
          <span>{loadError} Retrying automatically.</span>
          <button onClick={() => refresh()} className="font-semibold underline cursor-pointer">Try again now</button>
        </motion.div>
      )}

      {/* the same read-only campus picture for every role */}
      <motion.div variants={item}><CampusGlance onNav={onNav} /></motion.div>

      {/* metrics */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!d ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />) : (
          <>
            <Card className="p-5 flex items-center gap-4">
              <Ring value={d.sessions_total ? (100 * d.sessions_scheduled) / d.sessions_total : 0} tone="lagoon"
                label={<span className="font-display text-xl font-semibold"><CountUp value={d.sessions_scheduled} /></span>} />
              <div><Eyebrow>Sessions</Eyebrow><p className="text-sm text-ink-600 mt-1">of {d.sessions_total} placed</p></div>
            </Card>
            <Card className="p-5">
              <Eyebrow>Hard violations</Eyebrow>
              <p className={cn("font-display text-5xl font-semibold mt-2", scheduled && d.hard_violation_count === 0 ? "text-mangrove-500" : scheduled ? "text-sunrise-500" : "text-ink-400")}>
                {scheduled ? <CountUp value={d.hard_violation_count ?? 0} /> : "-"}
              </p>
              <p className="text-xs text-ink-600 mt-1">official validator</p>
            </Card>
            <Card className="p-5">
              <Eyebrow>Soft penalty</Eyebrow>
              <p className="font-display text-5xl font-semibold mt-2">{scheduled ? <CountUp value={d.soft_total ?? 0} /> : "-"}</p>
              <p className="text-xs text-ink-600 mt-1">lower is better</p>
            </Card>
            <Card className="p-5 flex items-center gap-4">
              <Ring value={d.utilisation.average_pct} tone="saffron" label={<span className="font-display text-lg font-semibold"><CountUp value={d.utilisation.average_pct} decimals={0} suffix="%" /></span>} />
              <div><Eyebrow>Rooms in use</Eyebrow><p className="text-sm text-ink-600 mt-1">avg teaching hours</p></div>
            </Card>
          </>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <motion.div variants={item} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-display text-xl font-semibold">Needs your attention</h3>
              <Chip tone={d && d.pending_approvals > 0 ? "sunrise" : "mangrove"} dot>{d ? (d.pending_approvals > 0 ? `${d.pending_approvals} waiting` : "All clear") : "..."}</Chip>
            </div>
            {d && d.pending_approvals === 0 && d.conflicts.length === 0 && (
              <p className="text-sm text-ink-600">Nothing is waiting, and the validator sees no clashes.</p>
            )}
            <ul className="space-y-2">
              {d?.pending_proposals.map((pr) => (
                <li key={pr.proposal_id}>
                  <button onClick={() => onNav(isAdmin ? "disruptions" : "approvals")} className="w-full flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left hover:border-lagoon-500 hover:bg-lagoon-50/60 transition-colors cursor-pointer">
                    <span><span className="block text-sm font-semibold capitalize">{pr.type.replace(/_/g, " ")} {pr.proposal_id}</span><span className="block text-xs text-ink-600">{pr.moved_count ?? "?"} session(s) would move</span></span>
                    <ArrowRight className="w-4 h-4 text-lagoon-700" />
                  </button>
                </li>
              ))}
              {d?.pending_bookings.map((b) => (
                <li key={b.id}>
                  <button onClick={() => onNav("approvals")} className="w-full flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left hover:border-lagoon-500 hover:bg-lagoon-50/60 transition-colors cursor-pointer">
                    <span><span className="block text-sm font-semibold">{b.title}</span><span className="block text-xs text-ink-600">{b.requester} · {b.id}</span></span>
                    <ArrowRight className="w-4 h-4 text-lagoon-700" />
                  </button>
                </li>
              ))}
              {d?.conflicts.slice(0, 5).map((c, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl bg-sunrise-50 text-sunrise-600 px-4 py-3 text-sm">
                  <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" /><span><strong>{c.rule}</strong> {c.detail}</span>
                </li>
              ))}
            </ul>
          </Card>

          {d && d.utilisation.busiest.length > 0 && (
            <Card className="p-6">
              <h3 className="font-display text-xl font-semibold mb-4">Busiest rooms</h3>
              <ul className="space-y-3">
                {d.utilisation.busiest.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-sm font-semibold truncate" title={r.name}>{r.id}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-sunk overflow-hidden">
                      <motion.div className="h-full rounded-full bg-lagoon-500" initial={{ width: 0 }} animate={{ width: `${Math.min(100, r.utilisation_pct)}%` }} transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                    <span className="w-12 text-right font-mono text-xs text-ink-600 tabular">{r.utilisation_pct}%</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          {!isAdmin && (
            <Card className="p-6 space-y-3">
              <h3 className="font-display text-xl font-semibold">What you can do</h3>
              {(user.role === "faculty" ? [
                ["See my timetable", "timetable"], ["Ask to move a class", "ai_booking"], ["Request a venue", "ai_booking"],
              ] : user.role === "department_coordinator" ? [
                ["Review department bookings", "approvals"], ["Browse the timetable", "timetable"], ["Request a venue", "ai_booking"],
              ] : [
                ["Request a venue in plain language", "ai_booking"], ["See the venue board", "spectra_clash"], ["Track my requests", "approvals"],
              ]).map(([label, to]) => (
                <button key={label} onClick={() => onNav(to as NavRouteId)} className="w-full flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 text-left text-sm font-semibold hover:border-lagoon-500 hover:bg-lagoon-50/60 cursor-pointer">
                  {label}<ArrowRight className="w-4 h-4 text-lagoon-700" />
                </button>
              ))}
            </Card>
          )}
          {isAdmin && (
            <Card className="p-6 space-y-3">
              <h3 className="font-display text-xl font-semibold">Start over</h3>
              <p className="text-sm text-ink-600">Clears the timetable, exams, decisions, requests and applied changes, and loads the official dataset again. Demo accounts are kept. Then run the three steps above.</p>
              <Button variant="danger" size="sm" icon={<RotateCcw className="w-4 h-4" />} loading={resetting} onClick={async () => {
                if (!window.confirm("Reset all demo data? The timetable, exams, requests and applied changes will be cleared.")) return;
                setResetting(true);
                try { await resetDemoData(); toast.success("Demo data was reset. Run the three steps to build it again."); refresh(); }
                catch (e) { toast.error(describeError(e)); } finally { setResetting(false); }
              }}>Reset demo data</Button>
            </Card>
          )}
          {isAdmin && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4"><Bell className="w-4 h-4 text-lagoon-700" /><h3 className="font-display text-xl font-semibold">Recent activity</h3></div>
              {audit.length === 0 ? <p className="text-sm text-ink-600">Nothing yet.</p> : (
                <ol className="relative border-l border-line ml-1.5 space-y-4">
                  {audit.map((a, i) => (
                    <motion.li key={`${a.at}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="pl-5 relative">
                      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-lagoon-500 ring-4 ring-raised" />
                      <p className="text-sm"><strong className="font-semibold">{a.actor}</strong> {a.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-ink-400">{ago(a.at)}{a.detail && a.detail !== "-" ? ` · ${a.detail.slice(0, 36)}` : ""}</p>
                    </motion.li>
                  ))}
                </ol>
              )}
            </Card>
          )}
          <Card className="p-6 bg-lagoon-50/70">
            <Eyebrow>Good to know</Eyebrow>
            <ul className="mt-2 space-y-2 text-sm text-ink-600">
              <li>Nothing is saved unless the <strong className="text-ink-900">official validator</strong> reports zero hard violations.</li>
              <li>Changes to the timetable are proposals until an Admin approves, and <strong className="text-ink-900">nobody approves their own</strong>.</li>
              <li>Press <strong className="text-ink-900">Ctrl K</strong> to jump to any group, teacher or room.</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
