"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-xl z-50 animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-6 space-y-4">
            <Link href="#features" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Avantages
            </Link>
            <Link href="/courses" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Nos Cours
            </Link>
            <Link href="#pricing" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Tarifs
            </Link>
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/login" onClick={() => setOpen(false)} className="text-center py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Se connecter
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="text-center py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                S'inscrire
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
