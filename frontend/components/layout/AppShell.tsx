"use client";

import React, { useState, useEffect } from "react";
import { Header, RoleType, ScenarioType } from "./Header";
import { Footer } from "./Footer";
import { InspectorDeck } from "./InspectorDeck";
import { TactileButton } from "@/components/tactile/TactileButton";
import { PanelRightClose, PanelRightOpen, RefreshCw } from "lucide-react";

interface AppShellProps {
  children?: React.ReactNode;
  initialRole?: RoleType;
  initialScenario?: ScenarioType;
  currentScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  onReset: () => void;
}

export function AppShell({
  children,
  currentScenario,
  onScenarioChange,
  currentRole,
  onRoleChange,
  onReset,
}: AppShellProps) {
  const [inspectorOpen, setInspectorOpen] = useState(true);

  // Keyboard shortcut listener for Judge Zero-Hunting UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "1") {
        onScenarioChange("default");
      } else if (e.key === "2") {
        onScenarioChange("spectra_surge");
      } else if (e.key === "3") {
        onScenarioChange("disruption");
      } else if (e.key === "4") {
        onScenarioChange("exams");
      } else if (e.key === "Escape") {
        onReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScenarioChange, onReset]);

  return (
    <div className="min-h-screen bg-[#080A0C] text-[#F3F4F6] flex flex-col font-sans antialiased console-grid selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* 1. Top Mission Telemetry Bar & Judge Presets */}
      <Header
        currentScenario={currentScenario}
        onScenarioChange={onScenarioChange}
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        onReset={onReset}
      />

      {/* 2. Main Dual-Workspace Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Primary Focus Deck (Left / Center) */}
        <main className="flex-1 flex flex-col overflow-y-auto relative min-w-0">
          {/* Mobile / Compact Screen Inspector Toggle */}
          <div className="lg:hidden flex items-center justify-between p-2 bg-[#0E1216] border-b border-white/10">
            <span className="font-mono text-xs text-[#9CA3AF]">
              VIEWPORT: PRIMARY FOCUS DECK
            </span>
            <TactileButton
              size="sm"
              variant="default"
              onClick={() => setInspectorOpen(!inspectorOpen)}
              icon={inspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            >
              {inspectorOpen ? "HIDE INSPECTOR" : "SHOW INSPECTOR"}
            </TactileButton>
          </div>

          <div className="flex-1 p-3 md:p-4">{children}</div>
        </main>

        {/* Action & Telemetry Inspector (Right 30%) */}
        {inspectorOpen && (
          <div className="fixed inset-y-0 right-0 z-40 lg:static lg:z-auto shadow-2xl lg:shadow-none">
            <InspectorDeck
              currentScenario={currentScenario}
              currentRole={currentRole}
            />
          </div>
        )}
      </div>

      {/* 3. System Footer Strip */}
      <Footer
        revision={`CIT-REV-${currentScenario === "default" ? "4029.0" : currentScenario === "spectra_surge" ? "4029.S7" : currentScenario === "disruption" ? "4029.DIS" : "4029.EXM"}`}
        latencyMs={11}
        activeFilterSummary={`SCENARIO: ${currentScenario.toUpperCase()} // ROLE: ${currentRole.toUpperCase()}`}
      />
    </div>
  );
}
