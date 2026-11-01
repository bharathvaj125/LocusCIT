"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Terminal } from "lucide-react";

interface IntroRevealProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export function IntroReveal({ onComplete, forceShow = false }: IntroRevealProps) {
  // Stages: "college" -> "transition" -> "locus"
  const [stage, setStage] = useState<"college" | "transition" | "locus">("college");
  const [locusProgress, setLocusProgress] = useState(0);

  useEffect(() => {
    // Stage 1: College logo reveal with "PRESENTS" animation (0 to 3800ms)
    const t1 = setTimeout(() => {
      setStage("transition");
    }, 3800);

    // Stage 2: App logo zoom-out reveal & initializing bar appears (4200ms)
    const t2 = setTimeout(() => {
      setStage("locus");
    }, 4200);

    // Stage 3: Auto-complete at 9800ms
    const t3 = setTimeout(() => {
      handleComplete();
    }, 9800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Run progress ticker ONLY when locus stage is active
  useEffect(() => {
    if (stage !== "locus") return;

    const start = Date.now();
    const duration = 5400; // 5.4 seconds from locus appearance to complete
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setLocusProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 35);

    return () => clearInterval(interval);
  }, [stage]);

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("locus_intro_seen", "true");
      } catch {
        // ignore storage errors
      }
    }
    onComplete();
  };

  return (
    <motion.div
      key="intro-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#03090e] text-[#fbf8f2] select-none overflow-hidden font-sans p-4 sm:p-6"
    >
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(rgba(31, 138, 150, 0.3) 1px, transparent 1px), radial-gradient(rgba(233, 169, 58, 0.15) 1px, transparent 1px)`,
            backgroundSize: "40px 40px, 80px 80px",
            backgroundPosition: "0 0, 20px 20px",
          }}
        />

        {/* Ambient radial glows */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-gradient-to-tr from-[#0e6270]/40 via-[#1f8a96]/30 to-[#e9a93a]/20 blur-[130px]"
        />

        {/* Secondary gold flare during locus stage */}
        {stage === "locus" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.7, scale: 1.35 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full bg-[#e9a93a]/25 blur-[100px]"
          />
        )}
      </div>

      {/* Top Bar: Clean Skip button on top-right */}
      <div className="absolute top-0 inset-x-0 p-5 sm:p-8 flex items-center justify-end z-20">
        <button
          onClick={handleComplete}
          className="group flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#d0e5e8] hover:text-white bg-[#0a232e]/80 hover:bg-[#123644] px-4 py-2 rounded-full border border-[#1f8a96]/30 hover:border-[#e9a93a]/60 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all cursor-pointer"
        >
          <span>Skip</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#e9a93a]" />
        </button>
      </div>

      {/* Central Animation Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-4">
        <AnimatePresence mode="wait">
          {/* ================= STAGE 1: COLLEGE LOGO REVEAL WITH 'PRESENTS' ================= */}
          {(stage === "college" || stage === "transition") && (
            <motion.div
              key="college-stage"
              initial={{ opacity: 0, scale: 2.4, filter: "blur(14px)" }}
              animate={
                stage === "transition"
                  ? { opacity: 0, scale: 0.45, filter: "blur(8px)" }
                  : { opacity: 1, scale: 1, filter: "blur(0px)" }
              }
              exit={{ opacity: 0, scale: 0.35, filter: "blur(8px)" }}
              transition={{
                duration: stage === "transition" ? 0.45 : 2.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center text-center"
            >
              {/* Outer pulsing halo rings */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.95, 1.15, 1], opacity: [0.3, 0.75, 0.4] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-[#1f8a96]/40 shadow-[0_0_50px_rgba(31,138,150,0.5)]"
                />
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: [1, 1.25, 1.05], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border border-[#e9a93a]/30"
                />

                {/* College Seal Image */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 drop-shadow-[0_12px_40px_rgba(31,138,150,0.7)]">
                  <Image
                    src="/college_logo_transparent.png"
                    alt="Chilika Institute of Technology Logo"
                    fill
                    priority
                    className="object-contain"
                  />
                </div>
              </div>

              {/* College Typography */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1.1, ease: "easeOut" }}
                className="mt-6 flex flex-col items-center gap-1.5"
              >
                <div className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.35em] text-[#e9a93a]">
                  Established 2004
                </div>
                <h1 className="text-xl sm:text-3xl font-bold tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#d9f2f5] via-[#ffffff] to-[#99d7de] drop-shadow-sm font-display">
                  Chilika Institute of Technology
                </h1>
                <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm font-mono tracking-[0.2em] text-[#71a6af]">
                  <span>LEARN</span>
                  <span className="w-1 h-1 rounded-full bg-[#e9a93a]" />
                  <span>INNOVATE</span>
                  <span className="w-1 h-1 rounded-full bg-[#e9a93a]" />
                  <span>EXCEL</span>
                </div>
              </motion.div>

              {/* Animated PRESENTS under the logo */}
              <motion.div
                initial={{ opacity: 0, letterSpacing: "0.2em", y: 12 }}
                animate={{
                  opacity: [0, 1, 0.95],
                  letterSpacing: ["0.2em", "0.55em"],
                  y: 0,
                }}
                transition={{ delay: 1.6, duration: 1.6, ease: "easeOut" }}
                className="mt-6 text-xs sm:text-sm font-mono uppercase font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-100 to-amber-300 drop-shadow-[0_0_16px_rgba(233,169,58,0.75)]"
              >
                PRESENTS
              </motion.div>
            </motion.div>
          )}

          {/* ================= STAGE 2: LOCUS APP LOGO SLOW ZOOM-OUT REVEAL ================= */}
          {stage === "locus" && (
            <motion.div
              key="locus-stage"
              className="flex flex-col items-center text-center w-full"
            >
              {/* LOCUS APP LOGO: SLOW ZOOM OUT REVEAL */}
              <div className="relative flex items-center justify-center">
                {/* Background Golden Shockwave */}
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: [0.8, 1.6], opacity: [0.8, 0] }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                  className="absolute w-72 h-72 rounded-full border-2 border-[#e9a93a] blur-[2px]"
                />

                {/* Golden Glow Aura */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.85, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-b from-[#e9a93a]/35 via-[#c98020]/25 to-transparent blur-3xl pointer-events-none"
                />

                {/* THE SLOW ZOOM-OUT 3D METALLIC EMBLEM & LOCUS TYPOGRAPHY */}
                <motion.div
                  initial={{
                    scale: 2.6,
                    filter: "blur(16px) brightness(1.7)",
                    opacity: 0,
                  }}
                  animate={{
                    scale: [2.6, 1.05, 1],
                    filter: ["blur(14px) brightness(1.5)", "blur(0px) brightness(1.05)", "blur(0px) brightness(1)"],
                    opacity: [0, 1, 1],
                  }}
                  transition={{
                    duration: 2.6,
                    times: [0, 0.8, 1],
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative w-56 h-56 sm:w-72 sm:h-72 drop-shadow-[0_20px_50px_rgba(233,169,58,0.5)]"
                >
                  <Image
                    src="/locus_intro_transparent.png"
                    alt="Locus Logo with Typography"
                    fill
                    priority
                    className="object-contain"
                  />

                  {/* Shimmer Light Sweep across the golden emblem */}
                  <motion.div
                    initial={{ x: "-120%", opacity: 0 }}
                    animate={{ x: "180%", opacity: [0, 0.9, 0] }}
                    transition={{ duration: 1.8, delay: 1.4, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] pointer-events-none"
                  />
                </motion.div>
              </div>

              {/* ================= IN-FLOW ENGINE & INITIALIZING BAR (NEVER OVERLAPPING) ================= */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.0, ease: "easeOut" }}
                className="mt-3 flex flex-col items-center w-full max-w-md"
              >
                {/* Glowing Laser Horizon Line with Center Sparkle */}
                <div className="relative w-full flex items-center justify-center my-2">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#e9a93a] to-transparent shadow-[0_0_12px_#e9a93a]"
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: [0, 1.4, 1], rotate: 180 }}
                    transition={{ duration: 1, delay: 1.3 }}
                    className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff]"
                  />
                </div>

                {/* Subtitle flanked by Gyro and Waves */}
                <div className="flex items-center justify-center gap-3 my-2 w-full">
                  {/* Rotating Quantum Gyroscope Ring (Left) */}
                  <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border border-dashed border-[#1f8a96]/70"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-1 rounded-full border border-[#e9a93a]/70"
                    />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                  </div>

                  {/* Subtitle Text */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.9, delay: 1.3 }}
                    className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.22em] text-[#86c0c8] text-center"
                  >
                    Campus Operations &amp; Spatial Logistics Engine
                  </motion.p>

                  {/* Audio / Spatial Frequency Waves (Right) */}
                  <div className="flex items-center gap-1 h-6 shrink-0 px-1">
                    {[12, 18, 24, 16, 20, 10].map((h, idx) => (
                      <motion.div
                        key={idx}
                        animate={{
                          height: [5, h, 7, h * 0.8, 5],
                        }}
                        transition={{
                          duration: 1.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: idx * 0.14,
                        }}
                        className="w-1 rounded-full bg-gradient-to-t from-[#0e6270] via-[#1f8a96] to-[#e9a93a]"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>

                {/* ================= INITIALIZING PROGRESS SECTION (IN-FLOW WITH CLEAN GAP) ================= */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.4 }}
                  className="w-full flex flex-col items-center gap-2.5 mt-4 pt-2 border-t border-[#1f8a96]/20"
                >
                  <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#5c8b93]">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-[#1f8a96]" />
                      {locusProgress < 95
                        ? "INITIALIZING SPATIAL ORCHESTRATION ENGINE..."
                        : "ORCHESTRATION ENGINE READY"}
                    </span>
                    <span className="text-[#e9a93a] font-semibold">{Math.round(locusProgress)}%</span>
                  </div>

                  {/* Progress Track */}
                  <div className="w-full h-1.5 bg-[#08222d] rounded-full overflow-hidden border border-[#1f8a96]/30">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#1f8a96] via-[#e9a93a] to-[#ffffff] shadow-[0_0_8px_#e9a93a]"
                      style={{ width: `${locusProgress}%` }}
                    />
                  </div>

                  {/* Enter Console Button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    onClick={handleComplete}
                    className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#061822] bg-gradient-to-r from-[#e9a93a] to-[#f4c26b] hover:from-[#f4c26b] hover:to-[#ffe099] px-6 py-2.5 rounded-xl shadow-[0_8px_24px_rgba(233,169,58,0.35)] transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                  >
                    <span>Enter Console</span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
