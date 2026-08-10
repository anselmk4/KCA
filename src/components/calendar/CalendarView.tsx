"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  UserCheck,
  Sparkles,
  ExternalLink,
  Plus,
  Radio,
  CheckCircle2,
  BookOpen,
  Filter,
  Users,
} from "lucide-react";
import { LiveCountdownBadge } from "./LiveCountdownBadge";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingProvider?: string;
  meetingUrl?: string;
  isPublic?: boolean;
  instructorId?: string;
  instructorName?: string;
  sessionType: "LIVE_SESSION" | "COACHING_1ON1";
  courseId?: string | null;
  courseTitle?: string | null;
  targetStudentId?: string | null;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  isInstructor?: boolean;
  onScheduleClick?: () => void;
  onRefresh?: () => void;
}

export function CalendarView({
  events,
  isInstructor = false,
  onScheduleClick,
  onRefresh,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<"ALL" | "LIVE_SESSION" | "COACHING_1ON1">("ALL");

  // Get days in current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week index (Monday = 0, Sunday = 6)
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterType === "ALL") return true;
      return e.sessionType === filterType;
    });
  }, [events, filterType]);

  // Find next upcoming session for countdown badge
  const upcomingSession = useMemo(() => {
    const now = new Date().getTime();
    const sorted = [...events]
      .filter((e) => new Date(e.scheduledAt).getTime() + (e.durationMinutes * 60 * 1000) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    return sorted[0] || null;
  }, [events]);

  // Helper to format local date string (YYYY-MM-DD) without UTC timezone shift
  const toLocalDateString = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Events on selected date
  const eventsOnSelectedDate = useMemo(() => {
    const selDateStr = toLocalDateString(selectedDate);
    return filteredEvents.filter((e) => {
      const eventDateStr = toLocalDateString(new Date(e.scheduledAt));
      return eventDateStr === selDateStr;
    });
  }, [filteredEvents, selectedDate]);

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const cells = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDayIndex; i++) {
      cells.push({ isPadding: true, day: null, dateStr: null });
    }

    const todayStr = toLocalDateString(new Date());
    const selDateStr = toLocalDateString(selectedDate);

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = toLocalDateString(dateObj);
      
      const dayEvents = filteredEvents.filter((e) => {
        const eDateStr = toLocalDateString(new Date(e.scheduledAt));
        return eDateStr === dateStr;
      });

      cells.push({
        isPadding: false,
        day,
        dateObj,
        dateStr,
        dayEvents,
        isToday: todayStr === dateStr,
        isSelected: selDateStr === dateStr,
      });
    }

    return cells;
  }, [year, month, startingDayIndex, daysInMonth, filteredEvents, selectedDate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* 1. Real-Time Countdown Banner (If upcoming event exists) */}
      {upcomingSession && (
        <LiveCountdownBadge
          targetDate={upcomingSession.scheduledAt}
          title={upcomingSession.title}
          sessionType={upcomingSession.sessionType}
          meetingUrl={upcomingSession.meetingUrl}
          instructorName={upcomingSession.instructorName}
          courseTitle={upcomingSession.courseTitle}
        />
      )}

      {/* 2. Calendar Header Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold shadow-sm">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold capitalize text-zinc-900 dark:text-white">
                {monthName}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Planning des Masterclasses Live et Séances de Coaching 1-sur-1
              </p>
            </div>
          </div>

          {/* Filter & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === "ALL"
                    ? "bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Tous ({events.length})
              </button>
              <button
                onClick={() => setFilterType("LIVE_SESSION")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === "LIVE_SESSION"
                    ? "bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                📡 Lives
              </button>
              <button
                onClick={() => setFilterType("COACHING_1ON1")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === "COACHING_1ON1"
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                🤝 Coaching
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Aujourd'hui
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Formateur Schedule Button */}
            {isInstructor && onScheduleClick && (
              <button
                onClick={onScheduleClick}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
              >
                <Plus className="w-4 h-4" />
                <span>Planifier une Séance</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Main Calendar Layout: Grid (Left 7 cols) & Day Agenda (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Calendar Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-black uppercase tracking-wider text-zinc-400">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mer</span>
              <span>Jeu</span>
              <span>Ven</span>
              <span>Sam</span>
              <span>Dim</span>
            </div>

            {/* Grid Days Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="aspect-square rounded-2xl bg-zinc-50/40 dark:bg-zinc-900/20 border border-transparent"
                    />
                  );
                }

                const hasEvents = cell.dayEvents && cell.dayEvents.length > 0;
                const hasCoaching = cell.dayEvents?.some((e) => e.sessionType === "COACHING_1ON1");
                const hasLive = cell.dayEvents?.some((e) => e.sessionType === "LIVE_SESSION");

                return (
                  <button
                    key={`day-${cell.day}`}
                    onClick={() => cell.dateObj && setSelectedDate(cell.dateObj)}
                    className={`aspect-square rounded-2xl p-1.5 flex flex-col justify-between transition-all cursor-pointer relative ${
                      cell.isSelected
                        ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30 font-bold scale-[1.03]"
                        : cell.isToday
                        ? "bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-500 text-teal-700 dark:text-teal-300 font-extrabold"
                        : "bg-zinc-50/80 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-zinc-900 dark:text-white"
                    }`}
                  >
                    <span className={`text-xs font-extrabold ${cell.isSelected ? "text-white" : ""}`}>
                      {cell.day}
                    </span>

                    {/* Event indicators */}
                    {hasEvents && (
                      <div className="flex items-center justify-center gap-1 w-full pb-1">
                        {hasLive && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              cell.isSelected ? "bg-white" : "bg-purple-500 animate-pulse"
                            }`}
                            title="Session Live"
                          />
                        )}
                        {hasCoaching && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              cell.isSelected ? "bg-amber-300" : "bg-indigo-500 animate-pulse"
                            }`}
                            title="Coaching 1-sur-1"
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Session Live
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Coaching 1-sur-1
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-teal-500 bg-teal-50" />
                Aujourd'hui
              </span>
            </div>
          </div>

          {/* Selected Day Agenda Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-4 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>
                  Programme du {selectedDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </span>
              </h3>
              <span className="text-xs font-bold text-zinc-400 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded-full">
                {eventsOnSelectedDate.length} événement(s)
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {eventsOnSelectedDate.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CalendarIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    Aucune séance programmée pour cette journée.
                  </p>
                  {isInstructor && onScheduleClick && (
                    <button
                      onClick={onScheduleClick}
                      className="mt-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                    >
                      + Planifier une séance ce jour
                    </button>
                  )}
                </div>
              ) : (
                eventsOnSelectedDate.map((evt) => {
                  const isCoaching = evt.sessionType === "COACHING_1ON1";
                  const eventTime = new Date(evt.scheduledAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={evt.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        isCoaching
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30"
                          : "bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                          isCoaching
                            ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                            : "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                        }`}>
                          {isCoaching ? "🤝 Coaching 1-sur-1" : "📡 Masterclass Live"}
                        </span>
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {eventTime} ({evt.durationMinutes} min)
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                          {evt.title}
                        </h4>
                        {evt.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      {evt.courseTitle && (
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                          <BookOpen className="w-3 h-3 text-teal-500" />
                          {evt.courseTitle}
                        </p>
                      )}

                      {/* Join Action Link */}
                      {evt.meetingUrl && (
                        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">
                            Hôte : {evt.instructorName}
                          </span>
                          <a
                            href={evt.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          >
                            <span>Rejoindre</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
