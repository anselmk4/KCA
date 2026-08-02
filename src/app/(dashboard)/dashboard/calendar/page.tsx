"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CalendarView, CalendarEvent } from "@/components/calendar/CalendarView";
import { Calendar as CalendarIcon, RefreshCw, Loader2, Sparkles, Video, UserCheck, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { RequestCoachingModal } from "@/components/coaching/RequestCoachingModal";

export default function StudentCalendarPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoachingModalOpen, setIsCoachingModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events");
      const data = await res.json();
      if (res.ok && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Error fetching student calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-teal-950 to-zinc-900 p-6 sm:p-8 rounded-3xl text-white border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Mon Emploi du Temps</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Calendrier des Sessions Live & Coaching
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Consultez toutes les Masterclasses en direct programmées pour vos cours suivis ainsi que vos séances de Coaching individuel 1-sur-1 avec vos formateurs.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsCoachingModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" /> Demander un Coaching
          </button>

          <button
            onClick={fetchEvents}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer border border-white/10"
            title="Rafraîchir les événements"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton or Calendar Component */}
      {loading && events.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-500">Chargement de votre planning en cours...</p>
        </div>
      ) : (
        <CalendarView
          events={events}
          isInstructor={false}
          onRefresh={fetchEvents}
        />
      )}

      <RequestCoachingModal
        isOpen={isCoachingModalOpen}
        onClose={() => setIsCoachingModalOpen(false)}
        onRequestSubmitted={fetchEvents}
      />
    </div>
  );
}
