"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldCheck, RefreshCw, Check } from "lucide-react";

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  resetKey?: number;
}

export function Captcha({ onVerify, resetKey = 0 }: CaptchaProps) {
  const [targetX, setTargetX] = useState<number>(0);
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Generate random target slot position (between 30% and 80%)
  const resetCaptcha = () => {
    const randomPercent = Math.floor(Math.random() * 50) + 30; // 30 to 80
    setTargetX(randomPercent);
    setSliderVal(0);
    setIsVerified(false);
    setError(false);
    onVerify(null);
  };

  useEffect(() => {
    resetCaptcha();
  }, [resetKey]);

  const handleStart = () => {
    if (isVerified) return;
    setIsDragging(true);
    setError(false);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const trackWidth = rect.width - 40; // Subtract handle width
    const currentX = clientX - rect.left - 20;
    const percent = Math.max(0, Math.min(100, (currentX / trackWidth) * 100));
    setSliderVal(percent);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Tolerance check (+/- 4 percent points)
    const diff = Math.abs(sliderVal - targetX);
    if (diff <= 4) {
      setIsVerified(true);
      setError(false);
      // Generate a mock secure token with the current position and action timestamp
      const token = btoa(JSON.stringify({
        t: Date.now(),
        p: targetX,
        v: "ansella_sec_pass"
      }));
      onVerify(token);
    } else {
      setError(true);
      setTimeout(() => {
        setSliderVal(0);
        setError(false);
      }, 800);
    }
  };

  // Attach global event listeners during drag for smooth tracking
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onMouseUp = () => handleEnd();

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [isDragging, sliderVal, targetX]);

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Vérification de sécurité
          </span>
        </div>
        <button
          type="button"
          onClick={resetCaptcha}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          title="Recharger le CAPTCHA"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visual Puzzle Box */}
      <div className="relative h-20 bg-zinc-200/50 dark:bg-zinc-900/60 rounded-xl overflow-hidden mb-4 border border-zinc-300/30 dark:border-zinc-800/80">
        {/* Decorative grids */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
        
        {/* Text Hint */}
        {!isVerified && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Glissez le puzzle dans l'emplacement
            </span>
          </div>
        )}

        {/* Target Slot (The destination) */}
        <div
          style={{ left: `${targetX}%` }}
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 border-2 border-dashed border-zinc-400 dark:border-zinc-600 bg-zinc-300/40 dark:bg-zinc-800/50 rounded-lg flex items-center justify-center transition-all duration-300"
        >
          <div className="w-5 h-5 bg-zinc-400/20 dark:bg-zinc-500/20 rounded-full" />
        </div>

        {/* Sliding Block */}
        <div
          style={{ left: `${sliderVal}%` }}
          className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transition-transform duration-100 ${
            isVerified ? "from-green-500 to-emerald-600" : ""
          } ${error ? "animate-shake bg-red-500" : ""}`}
        >
          {isVerified ? (
            <Check className="w-5 h-5 text-white" />
          ) : (
            <div className="w-4 h-4 border-2 border-white/80 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Slider Track */}
      <div
        ref={sliderRef}
        className={`relative h-10 bg-zinc-200/70 dark:bg-zinc-900/40 border border-zinc-300/40 dark:border-zinc-800/80 rounded-xl overflow-hidden flex items-center ${
          isVerified ? "border-green-500/30 bg-green-500/5" : ""
        }`}
      >
        {/* Slider Progress Bar */}
        <div
          style={{ width: `${sliderVal}%` }}
          className={`h-full bg-blue-500/10 transition-colors duration-100 ${
            isVerified ? "bg-green-500/10" : ""
          }`}
        />

        {/* Drag Handle */}
        <div
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{ left: `calc(${sliderVal}% - ${sliderVal * 0.4}px)` }}
          className={`absolute top-0.5 bottom-0.5 w-9 bg-white dark:bg-zinc-700 border border-zinc-300/80 dark:border-zinc-600 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-zinc-50 dark:hover:bg-zinc-600 hover:shadow-md transition-all shadow-sm ${
            isVerified ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950 pointer-events-none" : ""
          }`}
        >
          {isVerified ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <div className="flex gap-0.5 items-center">
              <div className="w-0.5 h-3 bg-zinc-400 dark:bg-zinc-400" />
              <div className="w-0.5 h-3 bg-zinc-400 dark:bg-zinc-400" />
              <div className="w-0.5 h-3 bg-zinc-400 dark:bg-zinc-400" />
            </div>
          )}
        </div>

        {/* Hint text inside track */}
        {sliderVal === 0 && !isVerified && (
          <div className="absolute right-4 text-[10px] font-bold text-zinc-400 tracking-wider pointer-events-none uppercase">
            Glisser
          </div>
        )}
      </div>
    </div>
  );
}
