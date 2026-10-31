"use client";

import React, { useEffect, useState } from "react";
import { Footer } from "./Footer";
import { TactileButton } from "@/components/tactile/TactileButton";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

interface AppShellProps {
  header: React.ReactNode;
  inspector: React.ReactNode;
  footerRevision: string;
  footerSummary: string;
  children?: React.ReactNode;
}

export function AppShell({ header, inspector, footerRevision, footerSummary, children }: AppShellProps) {
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [isLarge, setIsLarge] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsLarge(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="min-h-screen bg-[#080A0C] text-[#F3F4F6] flex flex-col font-sans antialiased console-grid">
      {header}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col overflow-y-auto relative min-w-0">
          <div className="lg:hidden flex items-center justify-between p-2 bg-[#0E1216] border-b border-white/10">
            <span className="font-mono text-xs text-[#9CA3AF]">STATUS PANEL</span>
            <TactileButton
              size="sm"
              variant="default"
              onClick={() => setInspectorOpen(!inspectorOpen)}
              icon={inspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            >
              {inspectorOpen ? "HIDE" : "SHOW"}
            </TactileButton>
          </div>
          {!isLarge && inspectorOpen && <div className="border-b border-white/10">{inspector}</div>}
          <div className="flex-1 p-3 md:p-4">{children}</div>
        </main>
        {isLarge && inspectorOpen && <div className="shrink-0 shadow-2xl">{inspector}</div>}
        {isLarge && (
          <button
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className="absolute right-2 bottom-2 z-30 p-1.5 bg-[#161B22] border border-white/10 rounded-[3px] text-neutral-300 hover:text-white cursor-pointer"
            title={inspectorOpen ? "Hide status panel" : "Show status panel"}
          >
            {inspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <Footer revision={footerRevision} activeFilterSummary={footerSummary} />
    </div>
  );
}
