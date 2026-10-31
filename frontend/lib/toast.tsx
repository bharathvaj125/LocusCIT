"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type Kind = "success" | "error" | "info";
interface ToastItem { id: number; kind: Kind; text: string }
const Ctx = createContext<{ push: (kind: Kind, text: string) => void } | null>(null);

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside <ToastProvider>");
  return {
    success: (t: string) => v.push("success", t),
    error: (t: string) => v.push("error", t),
    info: (t: string) => v.push("info", t),
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), kind === "error" ? 9000 : 5500);
  }, []);
  const dismiss = (id: number) => setItems((s) => s.filter((x) => x.id !== id));
  const styles: Record<Kind, string> = {
    success: "bg-mangrove-50 text-mangrove-600 border-mangrove-500/30",
    error: "bg-sunrise-50 text-sunrise-600 border-sunrise-500/40",
    info: "bg-lagoon-50 text-lagoon-700 border-lagoon-500/30",
  };
  const icons = { success: <CheckCircle2 className="w-5 h-5" />, error: <AlertTriangle className="w-5 h-5" />, info: <Info className="w-5 h-5" /> };
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(420px,calc(100vw-2rem))]" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-pop text-sm font-medium ${styles[t.kind]}`} role={t.kind === "error" ? "alert" : "status"}>
              <span className="mt-0.5 shrink-0">{icons[t.kind]}</span>
              <span className="flex-1 leading-snug">{t.text}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
