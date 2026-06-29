"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  Video, Clock, Plus, Calendar, Users, Link2, X, CheckCircle2, 
  Trash2, Shield, ShieldAlert, Search, Loader2, Sparkles, User
} from "lucide-react";

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  meeting_provider: string | null;
  meeting_url: string | null;
  is_public: boolean;
  instructor_id: string;
  allowed_user_ids: string[];
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export default function LivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hostMap, setHostMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    duration: "60",
    isPublic: true,
    meeting_provider: "ANSELLA_LIVE",
    meeting_url: ""
  });

  // Selected User IDs for Private Live
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // 1. Fetch live sessions (RLS automatically filters public or created/invited by current user)
      const { data: sessionsData, error: sessionsErr } = await supabase
        .from("live_sessions")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (sessionsErr) {
        console.error("Error fetching sessions:", sessionsErr.message);
      } else {
        const loadedSessions = (sessionsData as LiveSession[]) || [];
        setSessions(loadedSessions);

        // Fetch instructor names for all sessions
        const hostIds = [...new Set(loadedSessions.map(s => s.instructor_id).filter(Boolean))];
        if (hostIds.length > 0) {
          const { data: hostProfiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", hostIds);

          const map: Record<string, string> = {};
          hostProfiles?.forEach(p => {
            map[p.id] = p.full_name;
          });
          setHostMap(map);
        }
      }

      // 2. Fetch all profiles (to invite to private sessions)
      const { data: profilesData, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesErr) {
        console.error("Error fetching profiles:", profilesErr.message);
      } else {
        // Exclude the current instructor from the invite list
        setProfiles((profilesData || []).filter(p => p.id !== user.id));
      }
    } catch (err) {
      console.error("Unexpected error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);

    try {
      const sessionId = crypto.randomUUID();
      let liveLink = form.meeting_url;

      // If Ansella Live, generate the custom Jitsi room URL
      if (form.meeting_provider === "ANSELLA_LIVE") {
        liveLink = `https://meet.jit.si/ansella-live-${sessionId}`;
      }

      const newSession = {
        id: sessionId,
        title: form.title,
        description: form.description || null,
        scheduled_at: new Date(form.date).toISOString(),
        duration_minutes: parseInt(form.duration),
        meeting_provider: form.meeting_provider,
        meeting_url: liveLink || null,
        is_public: form.isPublic,
        instructor_id: currentUser.id,
        allowed_user_ids: form.isPublic ? [] : selectedUserIds,
        course_id: null
      };

      const { error } = await supabase
        .from("live_sessions")
        .insert(newSession);

      if (error) {
        throw new Error(error.message);
      }

      setCreated(true);
      setTimeout(() => {
        setCreated(false);
        setShowCreate(false);
        // Reset form
        setForm({
          title: "",
          description: "",
          date: "",
          duration: "60",
          isPublic: true,
          meeting_provider: "ANSELLA_LIVE",
          meeting_url: ""
        });
        setSelectedUserIds([]);
        setSearchTerm("");
        loadData();
      }, 2000);

    } catch (err: any) {
      alert("Erreur lors de la planification : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette session live ?")) return;

    try {
      const { error } = await supabase
        .from("live_sessions")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert("Erreur de suppression : " + err.message);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredProfiles = profiles.filter(p => 
    (p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlatformBadge = (provider: string | null) => {
    switch (provider) {
      case "ANSELLA_LIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" /> Ansella Live</span>;
      case "ZOOM":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Zoom</span>;
      case "TEAMS":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">Teams</span>;
      case "MEET":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">Google Meet</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-500/10 text-zinc-600 border border-zinc-500/20">{provider || "Inconnu"}</span>;
    }
  };

  const isSessionPast = (session: LiveSession) => {
    const start = new Date(session.scheduled_at).getTime();
    const duration = session.duration_minutes || 60;
    const end = start + (duration * 60000);
    return Date.now() > end;
  };

  const upcoming = sessions.filter(s => !isSessionPast(s));
  const past = sessions.filter(s => isSessionPast(s));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement des sessions live...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-teal-600" />
            Sessions en Direct
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {upcoming.length} session{upcoming.length !== 1 ? "s" : ""} programmée{upcoming.length !== 1 ? "s" : ""} à venir (les vôtres ou celles où vous êtes invité).
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-teal-600/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          Planifier une session
        </button>
      </div>

      {/* Upcoming Sessions */}
      <div className="space-y-4">
        <h2 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          Sessions à venir
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center shadow-sm">
            <Video className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
              Aucune session en direct programmée. Créez-en une pour interagir avec vos apprenants !
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map(s => {
              const isOwner = s.instructor_id === currentUser?.id;
              return (
                <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-teal-600 self-start shrink-0">
                      <Video className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-zinc-900 dark:text-white text-base leading-snug">{s.title}</p>
                        {s.is_public ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-500/10"><Shield className="w-2.5 h-2.5" /> Publique</span>
                        ) : isOwner ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 border border-amber-500/10"><ShieldAlert className="w-2.5 h-2.5" /> Privée ({s.allowed_user_ids?.length || 0})</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1 border border-blue-500/10"><ShieldAlert className="w-2.5 h-2.5" /> Invité (Privé)</span>
                        )}
                      </div>
                      
                      {/* Host Name display if invited */}
                      {!isOwner && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          Animé par : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{hostMap[s.instructor_id] || "Formateur"}</span>
                        </p>
                      )}

                      {s.description && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 max-w-xl">{s.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-zinc-400" />{new Date(s.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-zinc-400" />{s.duration_minutes} min</span>
                        {getPlatformBadge(s.meeting_provider)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:self-center">
                    {s.meeting_url && (
                      <a 
                        href={s.meeting_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-sm"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Rejoindre
                      </a>
                    )}
                    {isOwner && (
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                        title="Supprimer la session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {past.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="font-bold text-lg text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-zinc-400" />
            Sessions passées
          </h2>
          <div className="grid gap-4">
            {past.map(s => {
              const isOwner = s.instructor_id === currentUser?.id;
              return (
                <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-60">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-zinc-400 self-start shrink-0">
                      <Video className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-base leading-snug">{s.title}</p>
                      
                      {!isOwner && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          Animé par : <span className="font-semibold">{hostMap[s.instructor_id] || "Formateur"}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(s.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.duration_minutes} min</span>
                        <span className="text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{getPlatformBadge(s.meeting_provider)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase rounded-lg">Terminée</span>
                    {isOwner && (
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                        title="Supprimer la session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div 
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Planifier une session live</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Renseignez les détails pour planifier le direct.</p>
              </div>
              <button 
                onClick={() => setShowCreate(false)} 
                className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {created ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 bg-teal-500/10 text-teal-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white text-lg">Session planifiée avec succès !</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Elle apparaîtra instantanément dans le calendrier des lives.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-5">
                {/* Titre */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Titre de la session *</label>
                  <input 
                    required 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                    placeholder="ex: Workshop Solidity - Déploiement Pratique" 
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" 
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                    placeholder="Saisissez les objectifs ou le programme de cette session..." 
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all resize-none" 
                  />
                </div>

                {/* Date & Durée */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Date et heure *</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={form.date} 
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Durée</label>
                    <select 
                      value={form.duration} 
                      onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    >
                      {["30", "45", "60", "90", "120", "180"].map(d => (
                        <option key={d} value={d}>{d} minutes</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Plateforme */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Plateforme *</label>
                    <select 
                      value={form.meeting_provider} 
                      onChange={e => setForm(f => ({ ...f, meeting_provider: e.target.value, meeting_url: e.target.value === "ANSELLA_LIVE" ? "" : f.meeting_url }))} 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    >
                      <option value="ANSELLA_LIVE">Ansella Live (Jitsi - Gratuit)</option>
                      <option value="ZOOM">Zoom</option>
                      <option value="TEAMS">Microsoft Teams</option>
                      <option value="MEET">Google Meet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      {form.meeting_provider === "ANSELLA_LIVE" ? "Lien de la réunion" : "Lien de la réunion *"}
                    </label>
                    {form.meeting_provider === "ANSELLA_LIVE" ? (
                      <div className="w-full px-4 py-3 rounded-xl bg-teal-500/5 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-semibold flex items-center gap-2 h-[46px]">
                        <Sparkles className="w-4 h-4 shrink-0 text-teal-500" />
                        Généré automatiquement par Jitsi Meet.
                      </div>
                    ) : (
                      <input 
                        required 
                        type="url" 
                        value={form.meeting_url} 
                        onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))} 
                        placeholder="https://zoom.us/j/... ou Meet" 
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" 
                      />
                    )}
                  </div>
                </div>

                {/* Confidentialité (Public / Privé) */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-zinc-800 dark:text-white">Confidentialité</span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Qui peut rejoindre ce cours en direct ?</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isPublic: true }))}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${form.isPublic ? "bg-teal-600 border-teal-600 text-white" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"}`}
                      >
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isPublic: false }))}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${!form.isPublic ? "bg-teal-600 border-teal-600 text-white" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"}`}
                      >
                        Privé
                      </button>
                    </div>
                  </div>

                  {/* Participant Selection for Private Lives */}
                  {!form.isPublic && (
                    <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/80 animate-in fade-in slide-in-from-top-2 duration-250">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Sélectionner les invités ({selectedUserIds.length})
                        </span>
                        {selectedUserIds.length > 0 && (
                          <button 
                            type="button" 
                            onClick={() => setSelectedUserIds([])}
                            className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-white underline font-semibold"
                          >
                            Tout décocher
                          </button>
                        )}
                      </div>

                      {/* Search profile input */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                        <input 
                          type="text"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          placeholder="Rechercher par nom ou email..."
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      {/* Profiles List */}
                      <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-700/80 rounded-xl bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {filteredProfiles.length === 0 ? (
                          <p className="text-center py-4 text-xs text-zinc-400">Aucun utilisateur trouvé.</p>
                        ) : (
                          filteredProfiles.map(p => {
                            const isSelected = selectedUserIds.includes(p.id);
                            return (
                              <label 
                                key={p.id} 
                                className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer select-none"
                              >
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleUserSelection(p.id)}
                                  className="rounded border-zinc-300 dark:border-zinc-700 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-zinc-800 dark:text-white truncate">{p.full_name || "Nom inconnu"}</p>
                                  <p className="text-[10px] text-zinc-400 truncate">{p.email}</p>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-md hover:shadow-teal-600/20 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Planification en cours...
                    </>
                  ) : (
                    "Planifier la session"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
