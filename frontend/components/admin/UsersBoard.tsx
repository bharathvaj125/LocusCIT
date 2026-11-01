"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, KeyRound, Pencil, Plus, Search, ShieldCheck, UserCheck, UserX, Users as UsersIcon } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { AccountMeta, AccountUser, UserInput, createUser, describeError, fetchAccountMeta, fetchUsers, resetUserPassword, updateUser } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { RoleType } from "@/lib/types";
import { Button, Card, Chip, Drawer, EmptyState, Eyebrow, PageTitle, Skeleton } from "@/components/ui/primitives";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";

const FIELD = "w-full h-10 px-3 rounded-xl bg-paper border border-line text-sm focus:border-lagoon-500 outline-none disabled:opacity-60";
const ROLE_TONE: Record<RoleType, "lagoon" | "indigo" | "saffron" | "plum"> = { admin: "lagoon", department_coordinator: "indigo", faculty: "saffron", club: "plum" };

interface Form { username: string; full_name: string; role: RoleType; email: string; department: string; faculty_id: string; organisation_id: string; password: string }
const BLANK: Form = { username: "", full_name: "", role: "faculty", email: "", department: "", faculty_id: "", organisation_id: "", password: "" };

function Secret({ title, username, password, onDone }: { title: string; username: string; password: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* the password is on screen to copy by hand */ } };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-saffron-50 p-4 space-y-3">
        <Eyebrow>{title}</Eyebrow>
        <p className="text-sm text-ink-900">Give this to <strong>{username}</strong> now. It is shown only once and is stored only as a hash. They must choose their own password when they sign in.</p>
        <div className="flex items-center gap-2 rounded-xl bg-deep text-onbrand px-4 py-3">
          <code className="font-mono text-lg tracking-wide flex-1 select-all">{password}</code>
          <button type="button" onClick={copy} aria-label="Copy password" className="p-2 rounded-lg hover:bg-white/10 cursor-pointer">{copied ? <Check className="w-4 h-4 text-lagoon-500" /> : <Copy className="w-4 h-4" />}</button>
        </div>
      </div>
      <Button onClick={onDone} className="w-full">Done</Button>
    </div>
  );
}

export function UsersBoard({ onOpenOrganisations }: { onOpenOrganisations: () => void }) {
  const { user: me } = useApp();
  const toast = useToast();
  const [users, setUsers] = useState<AccountUser[] | null>(null);
  const [meta, setMeta] = useState<AccountMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [edit, setEdit] = useState<{ mode: "create" | "edit"; target?: AccountUser } | null>(null);
  const [form, setForm] = useState<Form>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState<{ title: string; username: string; password: string } | null>(null);

  const load = useCallback(async () => {
    try { const [u, m] = await Promise.all([fetchUsers(), fetchAccountMeta()]); setUsers(u); setMeta(m); setError(null); } catch (e) { setError(describeError(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (users || []).filter((u) =>
    (role === "all" || u.role === role) && (status === "all" || (status === "active" ? u.is_active : !u.is_active)) &&
    (!q || [u.username, u.full_name, u.organisation, u.email, u.faculty_name].some((x) => (x || "").toLowerCase().includes(q.toLowerCase())))), [users, q, role, status]);
  const count = (f: (u: AccountUser) => boolean) => (users || []).filter(f).length;

  const openCreate = () => { setForm(BLANK); setFormError(null); setSecret(null); setEdit({ mode: "create" }); };
  const openEdit = (u: AccountUser) => {
    setForm({ username: u.username, full_name: u.full_name, role: u.role, email: u.email || "", department: u.department || "", faculty_id: u.faculty_id || "", organisation_id: u.organisation_id || "", password: "" });
    setFormError(null); setSecret(null); setEdit({ mode: "edit", target: u });
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const changeRole = (r: RoleType) => setForm((f) => ({ ...f, role: r, faculty_id: "", department: "", organisation_id: "" }));

  const orgChoices = useMemo(() => {
    const want = form.role === "club" ? "club" : form.role === "department_coordinator" ? "department" : form.role === "admin" ? "institute" : null;
    return (meta?.organisations || []).filter((o) => o.type === want);
  }, [meta, form.role]);

  const submit = async () => {
    setBusy(true); setFormError(null);
    const body: UserInput = { full_name: form.full_name, role: form.role, email: form.email || null,
      department: form.role === "department_coordinator" ? form.department || null : null, faculty_id: form.role === "faculty" ? form.faculty_id || null : null,
      organisation_id: form.role === "faculty" ? null : form.organisation_id || null };
    try {
      if (edit?.mode === "create") {
        const r = await createUser({ ...body, username: form.username, password: form.password || null });
        setSecret({ title: "Temporary password", username: r.user.username, password: r.temporary_password });
        toast.success(`Created ${r.user.username}`);
      } else if (edit?.target) {
        await updateUser(edit.target.username, body);
        toast.success(`Saved ${edit.target.username}`);
        setEdit(null);
      }
      await load();
    } catch (e) { setFormError(describeError(e)); } finally { setBusy(false); }
  };

  const toggle = async (u: AccountUser) => {
    try { await updateUser(u.username, { is_active: !u.is_active }); toast.success(u.is_active ? `${u.username} can no longer sign in` : `${u.username} can sign in again`); await load(); }
    catch (e) { toast.error(describeError(e)); }
  };
  const reset = async (u: AccountUser) => {
    if (!window.confirm(`Reset the password for ${u.username}? Their current password stops working.`)) return;
    try { const r = await resetUserPassword(u.username); setEdit(null); setSecret({ title: "New temporary password", username: r.username, password: r.temporary_password }); await load(); }
    catch (e) { toast.error(describeError(e)); }
  };

  const total = users?.length || 0;
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Users" title={<>Everyone who can sign in, <span className="italic font-medium text-gold">in one place</span></>}
        subtitle="Nobody can sign up on their own: an Admin creates each account, gives it one role and, where the role needs it, links it to a faculty member, a department or a club."
        actions={<>
          <Button variant="secondary" icon={<UsersIcon className="w-4 h-4" />} onClick={onOpenOrganisations}>Organisations</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Add a user</Button>
        </>} />

      {error && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3" role="alert">{error} <button onClick={load} className="underline font-semibold cursor-pointer">Try again</button></p>}

      {!users ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard index={0} label="Accounts" value={total} tone="lagoon" icon={<UsersIcon className="w-4 h-4" />} hint="click to show all" active={role === "all" && status === "all"} onClick={() => { setRole("all"); setStatus("all"); }} />
          <StatCard index={1} label="Active" value={count((u) => u.is_active)} tone="mangrove" icon={<UserCheck className="w-4 h-4" />} progress={total ? count((u) => u.is_active) / total : 0} hint="can sign in" active={status === "active"} onClick={() => setStatus(status === "active" ? "all" : "active")} />
          <StatCard index={2} label="Admins" value={count((u) => u.role === "admin" && u.is_active)} tone="indigo" icon={<ShieldCheck className="w-4 h-4" />} hint={count((u) => u.role === "admin" && u.is_active) < 2 ? "the account that approves changes and bookings" : "any of them can approve changes and bookings"} active={role === "admin"} onClick={() => setRole(role === "admin" ? "all" : "admin")} />
          <StatCard index={3} label="Deactivated" value={count((u) => !u.is_active)} tone="sunrise" icon={<UserX className="w-4 h-4" />} hint="locked out" active={status === "inactive"} onClick={() => setStatus(status === "inactive" ? "all" : "inactive")} />
        </div>
      )}

      <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="relative"><Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a person" aria-label="Find a person" className="h-10 pl-9 pr-3 rounded-xl bg-paper border border-line text-sm w-56" /></div>
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role" className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">Any role</option>{(meta?.roles || []).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">Any status</option><option value="active">Active</option><option value="inactive">Deactivated</option>
        </select>
        <span className="ml-auto text-sm text-ink-600">{shown.length} shown</span>
      </Card>

      {users && shown.length === 0 && <EmptyState title="Nobody matches" body="Change the search or the filters." />}
      <div className="space-y-2.5">
        {shown.map((u, i) => (
          <Card key={u.username} className={cn("p-4 flex flex-wrap items-center gap-4 transition-colors", !u.is_active && "opacity-75")}>
            <span className="w-11 h-11 rounded-full bg-primary text-onprimary font-display font-semibold text-lg flex items-center justify-center shrink-0" aria-hidden>{u.full_name.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-[200px] flex-1">
              <p className="font-semibold flex items-center gap-2 flex-wrap">{u.full_name}{u.username === me.username && <Chip tone="mangrove">you</Chip>}{u.must_change_password && <Chip tone="saffron">new password pending</Chip>}</p>
              <p className="text-sm text-ink-600"><span className="font-mono text-xs">{u.username}</span>{u.email ? ` · ${u.email}` : ""}</p>
            </div>
            <div className="min-w-[180px] text-sm text-ink-600">
              <Chip tone={ROLE_TONE[u.role]}>{u.role_label}</Chip>
              <p className="mt-1">{u.role === "faculty" ? `${u.faculty_name} (${u.faculty_id})` : u.role === "department_coordinator" ? `${u.department} department${u.organisation ? ` · ${u.organisation}` : ""}` : u.organisation || "No organisation"}</p>
            </div>
            <Chip tone={u.is_active ? "mangrove" : "sunrise"} dot>{u.is_active ? "Active" : "Deactivated"}</Chip>
            <div className="flex items-center gap-1.5 ml-auto" data-index={i}>
              <Button size="sm" variant="secondary" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(u)}>Edit</Button>
              <Button size="sm" variant="secondary" icon={<KeyRound className="w-3.5 h-3.5" />} onClick={() => reset(u)}>Reset password</Button>
              <Button size="sm" variant={u.is_active ? "danger" : "success"} disabled={u.username === me.username && u.is_active} title={u.username === me.username ? "You cannot deactivate your own account" : undefined} onClick={() => toggle(u)}>{u.is_active ? "Deactivate" : "Activate"}</Button>
            </div>
          </Card>
        ))}
      </div>

      <Drawer open={!!edit} onClose={() => { setEdit(null); setSecret(null); }} eyebrow={edit?.mode === "create" ? "New account" : "Edit account"} title={edit?.mode === "create" ? "Add a user" : edit?.target?.full_name || ""} width={480}>
        {secret ? <Secret {...secret} onDone={() => { setEdit(null); setSecret(null); }} /> : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Full name</Eyebrow>
              <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={FIELD} placeholder="Dr. Meera Nair" required minLength={2} /></label>
            <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Username (used to sign in)</Eyebrow>
              <input value={form.username} onChange={(e) => set("username", e.target.value.toLowerCase())} className={FIELD} placeholder="meera.nair" disabled={edit?.mode === "edit"} required />
              {edit?.mode === "create" && <span className="text-xs text-ink-400">3 to 32 characters: letters, digits, dot, dash, underscore. It cannot be changed later.</span>}</label>
            <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Role</Eyebrow>
              <select value={form.role} onChange={(e) => changeRole(e.target.value as RoleType)} className={cn(FIELD, "cursor-pointer")} disabled={edit?.target?.username === me.username}>
                {(meta?.roles || []).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              {edit?.target?.username === me.username && <span className="text-xs text-ink-400">You cannot change your own role.</span>}</label>

            {form.role === "faculty" && (
              <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Faculty member of the timetable</Eyebrow>
                <select value={form.faculty_id} onChange={(e) => set("faculty_id", e.target.value)} className={cn(FIELD, "cursor-pointer")} required>
                  <option value="">Choose a faculty member</option>
                  {(meta?.faculty || []).map((f) => <option key={f.id} value={f.id} disabled={!!f.linked_to && f.linked_to !== edit?.target?.username}>{f.id} · {f.name} ({f.department}){f.linked_to && f.linked_to !== edit?.target?.username ? ` — linked to ${f.linked_to}` : ""}</option>)}
                </select>
                <span className="text-xs text-ink-400">Their own timetable and change requests come from this link. The department follows it.</span></label>
            )}
            {form.role === "department_coordinator" && (
              <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Department</Eyebrow>
                <select value={form.department} onChange={(e) => set("department", e.target.value)} className={cn(FIELD, "cursor-pointer")} required>
                  <option value="">Choose a department</option>{(meta?.departments || []).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <span className="text-xs text-ink-400">A coordinator decides bookings of their department&apos;s labs and asks for changes to its sessions.</span></label>
            )}
            {form.role !== "faculty" && (
              <label className="block space-y-1.5"><Eyebrow className="text-ink-400">{form.role === "club" ? "Club" : "Organisation"}{form.role === "club" ? "" : " (optional)"}</Eyebrow>
                <select value={form.organisation_id} onChange={(e) => set("organisation_id", e.target.value)} className={cn(FIELD, "cursor-pointer")} required={form.role === "club"}>
                  <option value="">{form.role === "club" ? "Choose a club" : "None"}</option>{orgChoices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <span className="text-xs text-ink-400">{form.role === "club" ? "Requests are made in the club's name and only that club's requests are visible. " : ""}Missing one? <button type="button" onClick={onOpenOrganisations} className="underline font-semibold text-lagoon-700 cursor-pointer">Create an organisation</button>.</span></label>
            )}
            <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Email (optional)</Eyebrow>
              <input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" className={FIELD} placeholder="name@cit.edu" /></label>
            {edit?.mode === "create" && (
              <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Temporary password (optional)</Eyebrow>
                <input value={form.password} onChange={(e) => set("password", e.target.value)} className={FIELD} placeholder="Leave empty to generate one" autoComplete="new-password" />
                <span className="text-xs text-ink-400">Either way they must choose their own at first sign-in.</span></label>
            )}
            {formError && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3" role="alert">{formError}</p>}
            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" loading={busy} className="flex-1">{edit?.mode === "create" ? "Create account" : "Save changes"}</Button>
              <Button type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
