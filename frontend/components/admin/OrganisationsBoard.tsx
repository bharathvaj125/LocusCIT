"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Building2, Landmark, Pencil, Plus, Search, Trash2, Users as UsersIcon } from "lucide-react";
import { OrganisationRow, createOrganisation, deleteOrganisation, describeError, fetchOrganisations, setOrganisationStatus, updateOrganisation } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Button, Card, Chip, Drawer, EmptyState, Eyebrow, PageTitle, Skeleton } from "@/components/ui/primitives";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";

const FIELD = "w-full h-10 px-3 rounded-xl bg-paper border border-line text-sm focus:border-lagoon-500 outline-none";
const TYPE_TONE = { club: "plum", department: "indigo", institute: "saffron" } as const;
interface Form { name: string; type: string; department: string; description: string; members: string }
const BLANK: Form = { name: "", type: "club", department: "", description: "", members: "" };

export function OrganisationsBoard({ onOpenUsers }: { onOpenUsers: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<OrganisationRow[] | null>(null);
  const [types, setTypes] = useState<Array<{ id: string; label: string }>>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [edit, setEdit] = useState<{ mode: "create" | "edit"; target?: OrganisationRow } | null>(null);
  const [form, setForm] = useState<Form>(BLANK);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetchOrganisations(); setRows(r.organisations); setTypes(r.types); setDepartments(r.departments); setError(null); } catch (e) { setError(describeError(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (rows || []).filter((o) => (type === "all" || o.type === type) && (status === "all" || o.status === status) &&
    (!q || o.name.toLowerCase().includes(q.toLowerCase()) || (o.department || "").toLowerCase().includes(q.toLowerCase()))), [rows, q, type, status]);
  const count = (f: (o: OrganisationRow) => boolean) => (rows || []).filter(f).length;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(BLANK); setFormError(null); setEdit({ mode: "create" }); };
  const openEdit = (o: OrganisationRow) => { setForm({ name: o.name, type: o.type, department: o.department || "", description: o.description || "", members: String(o.members) }); setFormError(null); setEdit({ mode: "edit", target: o }); };

  const submit = async () => {
    setBusy(true); setFormError(null);
    const body = { name: form.name, type: form.type, department: form.type === "department" ? form.department || null : null, description: form.description, member_count: form.members.trim() === "" ? undefined : Number(form.members) };
    try {
      if (edit?.mode === "create") { await createOrganisation(body); toast.success(`Created ${form.name}`); }
      else if (edit?.target) { await updateOrganisation(edit.target.id, body); toast.success(`Saved ${form.name}`); }
      setEdit(null); await load();
    } catch (e) { setFormError(describeError(e)); } finally { setBusy(false); }
  };
  const archive = async (o: OrganisationRow) => {
    try { await setOrganisationStatus(o.id, o.status === "active" ? "archived" : "active"); toast.success(o.status === "active" ? `${o.name} archived` : `${o.name} restored`); await load(); }
    catch (e) { toast.error(describeError(e)); }
  };
  const remove = async (o: OrganisationRow) => {
    if (!window.confirm(`Delete ${o.name}? This cannot be undone.`)) return;
    try { await deleteOrganisation(o.id); toast.success(`${o.name} deleted`); await load(); } catch (e) { toast.error(describeError(e)); }
  };

  const total = rows?.length || 0;
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Organisations" title={<>The clubs and offices <span className="italic font-medium text-gold">requests are made for</span></>}
        subtitle="Every booking is made in the name of an organisation. A club representative belongs to exactly one club, so they only see and file that club's requests. Archive instead of deleting once an organisation has members or requests."
        actions={<>
          <Button variant="secondary" icon={<UsersIcon className="w-4 h-4" />} onClick={onOpenUsers}>Users</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Add an organisation</Button>
        </>} />

      {error && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3" role="alert">{error} <button onClick={load} className="underline font-semibold cursor-pointer">Try again</button></p>}

      {!rows ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard index={0} label="Organisations" value={total} tone="lagoon" icon={<Building2 className="w-4 h-4" />} hint="click to show all" active={type === "all"} onClick={() => setType("all")} />
          <StatCard index={1} label="Student clubs" value={count((o) => o.type === "club")} tone="plum" icon={<UsersIcon className="w-4 h-4" />} progress={total ? count((o) => o.type === "club") / total : 0} active={type === "club"} onClick={() => setType(type === "club" ? "all" : "club")} />
          <StatCard index={2} label="Departments" value={count((o) => o.type === "department")} tone="indigo" icon={<Landmark className="w-4 h-4" />} progress={total ? count((o) => o.type === "department") / total : 0} active={type === "department"} onClick={() => setType(type === "department" ? "all" : "department")} />
          <StatCard index={3} label="Institute bodies" value={count((o) => o.type === "institute")} tone="saffron" icon={<Building2 className="w-4 h-4" />} progress={total ? count((o) => o.type === "institute") / total : 0} active={type === "institute"} onClick={() => setType(type === "institute" ? "all" : "institute")} />
        </div>
      )}

      <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="relative"><Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an organisation" aria-label="Find an organisation" className="h-10 pl-9 pr-3 rounded-xl bg-paper border border-line text-sm w-60" /></div>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type" className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">Any type</option>{types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="h-10 px-3 rounded-xl bg-paper border border-line text-sm font-semibold cursor-pointer">
          <option value="all">Active and archived</option><option value="active">Active</option><option value="archived">Archived</option>
        </select>
        <span className="ml-auto text-sm text-ink-600">{shown.length} shown</span>
      </Card>

      {rows && shown.length === 0 && <EmptyState title="Nothing matches" body="Change the search or the filters, or add an organisation." />}
      <div className="grid md:grid-cols-2 gap-3">
        {shown.map((o) => (
          <Card key={o.id} className={cn("p-4 space-y-3", o.status === "archived" && "opacity-75")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold leading-tight">{o.name}</p>
                <p className="text-sm text-ink-600 mt-0.5">{o.description || (o.department ? `${o.department} department` : o.type_label)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Chip tone={TYPE_TONE[o.type]}>{o.type_label}</Chip>
                {o.status === "archived" && <Chip tone="stone">Archived</Chip>}
              </div>
            </div>
            <div className="flex items-center gap-5 text-sm">
              <span><Eyebrow className="text-ink-400">Members</Eyebrow><span className="font-display text-xl font-semibold tabular">{o.members}</span></span>
              <span><Eyebrow className="text-ink-400">Logins</Eyebrow><span className="font-display text-xl font-semibold tabular">{o.accounts}</span></span>
              <span><Eyebrow className="text-ink-400">Requests</Eyebrow><span className="font-display text-xl font-semibold tabular">{o.requests}</span></span>
              {o.department && <span><Eyebrow className="text-ink-400">Department</Eyebrow><span className="font-semibold">{o.department}</span></span>}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="sm" variant="secondary" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(o)}>Edit</Button>
              <Button size="sm" variant="secondary" icon={o.status === "active" ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />} onClick={() => archive(o)}>{o.status === "active" ? "Archive" : "Restore"}</Button>
              <Button size="sm" variant="danger" icon={<Trash2 className="w-3.5 h-3.5" />} disabled={o.accounts > 0 || o.requests > 0} title={o.accounts || o.requests ? "It has logins or requests: archive it instead" : undefined} onClick={() => remove(o)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Drawer open={!!edit} onClose={() => setEdit(null)} eyebrow={edit?.mode === "create" ? "New organisation" : "Edit organisation"} title={edit?.mode === "create" ? "Add an organisation" : edit?.target?.name || ""} width={460}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Name</Eyebrow>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={FIELD} placeholder="Chess Club" required minLength={2} /></label>
          <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Type</Eyebrow>
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={cn(FIELD, "cursor-pointer")}>{types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            <span className="text-xs text-ink-400">Club representatives can only join student clubs; coordinators can only join department organisations.</span></label>
          {form.type === "department" && (
            <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Department (optional)</Eyebrow>
              <select value={form.department} onChange={(e) => set("department", e.target.value)} className={cn(FIELD, "cursor-pointer")}><option value="">Not tied to one department</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
          )}
          <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Members (people in it)</Eyebrow>
            <input value={form.members} onChange={(e) => set("members", e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className={FIELD} placeholder="40" />
            <span className="text-xs text-ink-400">How many students or staff belong to it. Logins are the accounts that can sign in for it.</span></label>
          <label className="block space-y-1.5"><Eyebrow className="text-ink-400">Description (optional)</Eyebrow>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={500} className="w-full p-3 rounded-xl bg-paper border border-line text-sm focus:border-lagoon-500 outline-none" placeholder="What the organisation does" /></label>
          {formError && <p className="text-sm text-sunrise-600 bg-sunrise-50 rounded-xl px-4 py-3" role="alert">{formError}</p>}
          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" loading={busy} className="flex-1">{edit?.mode === "create" ? "Create organisation" : "Save changes"}</Button>
            <Button type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
