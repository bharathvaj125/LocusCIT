"use client";

import React, { useState, useEffect } from "react";
import { Header, ScenarioType } from "./Header";
import { Footer } from "./Footer";
import { InspectorDeck } from "./InspectorDeck";
import { TactileButton } from "@/components/tactile/TactileButton";
import { RoleType, NavRouteId } from "@/lib/types";
import { getLocalWorkspaceRevision } from "@/lib/api";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

interface AppShellProps {
  children?: React.ReactNode;
  initialRole?: RoleType;
  initialScenario?: ScenarioType;
  currentScenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  workspaceRevision: number;
  onReset: () => Promise<void> | void;
  isResetting?: boolean;
  activeNav: NavRouteId;
  onNavChange: (nav: NavRouteId) => void;
}

export function AppShell({
  children,
  currentScenario,
  onScenarioChange,
  currentRole,
  onRoleChange,
  workspaceRevision,
  onReset,
  isResetting = false,
  activeNav,
  onNavChange,
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
    <div className="min-h-screen bg-[#080A0C] text-[#F3F4F6] flex flex-col font-sans antialiased console-grid selection:bg-cyan-500/30 selection:text-cyan-300">
      {/* 1. Global Navigation & Persistent Judge Header Dock */}
      <Header
        currentScenario={currentScenario}
        onScenarioChange={onScenarioChange}
        currentRole={currentRole}
        onRoleChange={onRoleChange}
        workspaceRevision={workspaceRevision}
        onReset={onReset}
        isResetting={isResetting}
        activeNav={activeNav}
        onNavChange={onNavChange}
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

        {/* Action & Telemetry Inspector (Right side dock) */}
        {inspectorOpen && (
          <div className="hidden lg:block shrink-0 shadow-2xl">
            <InspectorDeck
              currentScenario={currentScenario}
              currentRole={currentRole}
            />
          </div>
        )}
      </div>

      {/* 3. System Footer Strip */}
      <Footer
        revision={`CIT-REV-${workspaceRevision}.0`}
        latencyMs={12}
        activeFilterSummary={`SCENARIO: ${currentScenario.toUpperCase()} // ROLE: ${currentRole.toUpperCase()} // ROUTE: ${activeNav.toUpperCase()}`}
      />
    </div>
  );
}
