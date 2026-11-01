"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { Kbd } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  run: () => void;
}

/** Ctrl/Cmd K: jump to any screen, student group, faculty member or room. */
export function CommandPalette({ open, onClose, items }: { open: boolean; onClose: () => void; items: PaletteItem[] }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pool = s ? items.filter((i) => (i.label + " " + (i.hint || "") + " " + i.group).toLowerCase().includes(s)) : items.filter((i) => i.group === "Go to");
    return pool.slice(0, 40);
  }, [q, items]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`)?.scrollIntoView({ block: "nearest" }); }, [idx]);

  const choose = (i: number) => { const it = results[i]; if (it) { onClose(); it.run(); } };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(idx); }
    else if (e.key === "Escape") onClose();
  };

  let lastGroup = "";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-[3px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label="Search"
            className="w-full max-w-xl rounded-2xl bg-raised border border-line shadow-pop overflow-hidden"
            initial={{ y: -16, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -8, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 440, damping: 34 }} onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
            <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
              <Search className="w-5 h-5 text-ink-400" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try CSE-2, F06, AUD, exams, approvals..."
                className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-ink-400" aria-label="Search" />
              <Kbd>Esc</Kbd>
            </div>
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-400">Nothing matches &ldquo;{q}&rdquo;.</p>}
              {results.map((it, i) => {
                const head = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <React.Fragment key={it.id}>
                    {head && <p className="px-3 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">{head}</p>}
                    <button data-i={i} onMouseEnter={() => setIdx(i)} onClick={() => choose(i)}
                      className={cn("w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer", i === idx ? "bg-lagoon-50 text-lagoon-900" : "text-ink-900")}>
                      <span className="min-w-0"><span className="block text-sm font-semibold truncate">{it.label}</span>{it.hint && <span className="block text-xs text-ink-400 truncate">{it.hint}</span>}</span>
                      {i === idx && <CornerDownLeft className="w-4 h-4 text-lagoon-700 shrink-0" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
