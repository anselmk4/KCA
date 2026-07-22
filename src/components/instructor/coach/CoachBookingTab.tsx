"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  CheckCircle2,
  DollarSign,
  User,
  ExternalLink,
  Trash2,
  Check,
} from "lucide-react";

interface BookingSession {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  date: string;
  time: string;
  durationMin: number;
  videoPlatform: "ANSELLA_LIVE" | "GOOGLE_MEET" | "ZOOM" | "CUSTOM";
  meetingUrl: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED";
}

const MOCK_SESSIONS: BookingSession[] = [
  {
    id: "b1",
    studentName: "Thomas Dubois",
    studentEmail: "thomas.dubois@email.com",
    courseTitle: "Masterclass IA & Web3 Automation",
    date: "Aujourd'hui, 22 Juillet",
    time: "15:00 - 15:45",
    durationMin: 45,
    videoPlatform: "ANSELLA_LIVE",
    meetingUrl: "https://meet.jit.si/ansella-live-coaching-b1",
    status: "CONFIRMED",
  },
  {
    id: "b2",
    studentName: "Amélie Morel",
    studentEmail: "amelie.m@email.com",
    courseTitle: "Bourse & Trading Crypto Algorithmique",
    date: "Demain, 23 Juillet",
    time: "10:30 - 11:15",
    durationMin: 45,
    videoPlatform: "GOOGLE_MEET",
    meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
    status: "CONFIRMED",
  },
];

export function CoachBookingTab() {
  const [sessions, setSessions] = useState<BookingSession[]>(MOCK_SESSIONS);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);

  // Slot Form
  const [slotDay, setSlotDay] = useState("Lundi");
  const [slotStartTime, setSlotStartTime] = useState("14:00");
  const [slotDuration, setSlotDuration] = useState("45");
  const [videoPlatform, setVideoPlatform] = useState<"ANSELLA_LIVE" | "GOOGLE_MEET" | "ZOOM" | "CUSTOM">("ANSELLA_LIVE");
  const [customUrl, setCustomUrl] = useState("");

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl =
      videoPlatform === "ANSELLA_LIVE"
        ? `https://meet.jit.si/ansella-live-coaching-${Date.now()}`
        : customUrl.trim() || "https://meet.google.com/ansella-live";

    const newSess: BookingSession = {
      id: `b_${Date.now()}`,
      studentName: "Élève Inscrit",
      studentEmail: "eleve@ansella.app",
      courseTitle: "Formation Continue",
      date: `${slotDay}, Prochaine session`,
      time: `${slotStartTime} - 45m`,
      durationMin: parseInt(slotDuration),
      videoPlatform,
      meetingUrl: finalUrl,
      status: "CONFIRMED",
    };

    setSessions([newSess, ...sessions]);
    setShowAddSlotModal(false);
    alert(`Plage horaire Ansella Live créée avec le lien : ${finalUrl}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Sessions de Coaching 1-on-1 & Visioconférences
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez vos créneaux de mentorat individuel avec vos élèves et rejoignez vos réunions en direct.
          </p>
        </div>

        <button
          onClick={() => setShowAddSlotModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Ajouter un Créneau
        </button>
      </div>

      {/* Grid: Upcoming Sessions & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Upcoming Sessions List */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4 text-teal-600" />
            Prochaines Séances Confirmées ({sessions.length})
          </h3>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-300 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-4 h-4 text-teal-600" /> {session.studentName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase">
                      Confirmé
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {session.courseTitle}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300 font-semibold pt-1">
                    <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                      <Calendar className="w-3.5 h-3.5" /> {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" /> {session.time} ({session.durationMin} min)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                  <a
                    href={session.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-4 h-4" /> Rejoindre la Visio <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Availability Configuration */}
        <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Paramètres des Séances 1-on-1
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Durée par défaut</span>
              <span className="font-bold text-zinc-900 dark:text-white text-sm">45 minutes</span>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Inclus dans la formation</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                Oui (Gratuit pour les étudiants inscrits)
              </span>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Lien visio par défaut</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
                Google Meet / Zoom automatique
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Add Slot */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" /> Ajouter une Plage d&apos;Accompagnement
            </h3>

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Jour de la semaine
                </label>
                <select
                  value={slotDay}
                  onChange={(e) => setSlotDay(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium"
                >
                  <option value="Lundi">Lundi</option>
                  <option value="Mardi">Mardi</option>
                  <option value="Mercredi">Mercredi</option>
                  <option value="Jeudi">Jeudi</option>
                  <option value="Vendredi">Vendredi</option>
                  <option value="Samedi">Samedi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Heure de début
                </label>
                <input
                  type="time"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Interface de Visioconférence
                </label>
                <select
                  value={videoPlatform}
                  onChange={(e) => setVideoPlatform(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium"
                >
                  <option value="ANSELLA_LIVE">🟢 Ansella Live (Jitsi Meet - Gratuit & Inclus Par Défaut)</option>
                  <option value="GOOGLE_MEET">🔵 Google Meet</option>
                  <option value="ZOOM">🔷 Zoom</option>
                  <option value="CUSTOM">🌐 Lien Personnalisé / Autre</option>
                </select>
              </div>

              {videoPlatform === "CUSTOM" && (
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                    Lien Visio Personnalisé
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://votre-lien-visio.com"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-medium"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-500/20"
                >
                  Ajouter le créneau
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
