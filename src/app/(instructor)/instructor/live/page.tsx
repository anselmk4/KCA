"use client";

import { useState } from "react";
import { Video, Clock, Plus, Calendar, Users, Link2, X, CheckCircle2 } from "lucide-react";

const mockLiveSessions = [
  {
    id: "ls1",
    title: "Introduction aux Smart Contracts – Q&A en direct",
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    duration: 90,
    participants: 12,
    platform: "Google Meet",
    link: "https://meet.google.com/xxx-xxxx",
    status: "upcoming"
  },
  {
    id: "ls2",
    title: "Workshop DeFi : Uniswap & Liquidity Pools",
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    duration: 120,
    participants: 8,
    platform: "Zoom",
    link: "https://zoom.us/j/xxx",
    status: "upcoming"
  },
  {
    id: "ls3",
    title: "Analyse Technique Avancée – Bitcoin & Altcoins",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    duration: 60,
    participants: 22,
    platform: "Google Meet",
    link: "",
    status: "completed"
  },
];

export default function LivePage() {
  const [sessions, setSessions] = useState(mockLiveSessions);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", duration: "60", platform: "Google Meet", link: "" });
  const [created, setCreated] = useState(false);

  const upcoming = sessions.filter(s => s.status === "upcoming");
  const past = sessions.filter(s => s.status === "completed");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSessions(prev => [...prev, {
      id: `ls${Date.now()}`,
      title: form.title,
      date: new Date(form.date).toISOString(),
      duration: parseInt(form.duration),
      participants: 0,
      platform: form.platform,
      link: form.link,
      status: "upcoming"
    }]);
    setCreated(true);
    setTimeout(() => { setCreated(false); setShowCreate(false); setForm({ title: "", date: "", duration: "60", platform: "Google Meet", link: "" }); }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Sessions en Direct</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">{upcoming.length} session{upcoming.length !== 1 ? "s" : ""} à venir.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          Planifier une session
        </button>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">À venir</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
            <Video className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucune session planifiée. Créez votre première session en direct !</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map(s => (
              <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl self-start">
                  <Video className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-white">{s.title}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.duration} min</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{s.participants} inscrits</span>
                    <span className="font-medium text-teal-600">{s.platform}</span>
                  </div>
                </div>
                {s.link && (
                  <a href={s.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
                    <Link2 className="w-3.5 h-3.5" />
                    Rejoindre
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      <div>
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Sessions passées</h2>
        <div className="grid gap-4">
          {past.map(s => (
            <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 opacity-70">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl self-start">
                <Video className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-900 dark:text-white">{s.title}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.duration} min</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{s.participants} participants</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase rounded-full shrink-0">Terminée</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Planifier une session live</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            {created ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-teal-500" />
                <p className="font-semibold text-zinc-900 dark:text-white">Session planifiée !</p>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                {[
                  { label: "Titre de la session", key: "title", type: "text", placeholder: "Workshop Blockchain..." },
                  { label: "Date et heure", key: "date", type: "datetime-local", placeholder: "" },
                  { label: "Lien de la réunion", key: "link", type: "url", placeholder: "https://meet.google.com/..." },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
                    <input required type={type} value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Durée (minutes)</label>
                  <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none">
                    {["30", "45", "60", "90", "120"].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors">Créer la session</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
