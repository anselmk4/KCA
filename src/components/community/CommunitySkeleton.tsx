"use client";

import React from "react";

export function CommunitySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-850 rounded-full" />
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-2 pt-1">
            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>

          {/* Image Placeholder */}
          {i % 2 === 0 && (
            <div className="w-full h-48 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          )}

          {/* Footer Bar */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
