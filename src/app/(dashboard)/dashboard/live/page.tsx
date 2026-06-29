"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  Video, Calendar, Clock, User, ExternalLink, ArrowRight, 
  Loader2, Sparkles, Shield, ShieldAlert 
} from "lucide-react";
import Link from "next/link";

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

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [instructorMap, setInstructorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // 1. Fetch live sessions from Supabase.
      // RLS policy automatically filters only public lives or private lives where the student is invited.
      const { data: sbSessions, error } = await supabase
        .from("live_sessions")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (error) {
        console.error("Error fetching live sessions:", error.message);
        setLoading(false);
        return;
      }

      if (!sbSessions || sbSessions.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      setSessions(sbSessions as LiveSession[]);

      // 2. Fetch instructor profiles to display names
      const instructorIds = [...new Set(sbSessions.map(s => s.instructor_id).filter(Boolean))];
      if (instructorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", instructorIds);

        const map: Record<string, string> = {};
        profiles?.forEach(p => {
          map[p.id] = p.full_name;
        });
        setInstructorMap(map);
      }
    } catch (err) {
      console.error("Unexpected error in student live page:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformLabel = (platform: string | null) => {
    if (!platform) return "Inconnu";
    switch (platform) {
      case "ANSELLA_LIVE": return "Ansella Live";
      case "ZOOM": return "Zoom";
      case "TEAMS": return "Microsoft Teams";
      case "MEET": return "Google Meet";
      default: return platform;
    }
  };

  const getPlatformColor = (platform: string | null) => {
    if (!platform) return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
    switch (platform) {
      case "ANSELLA_LIVE": return "text-teal-500 bg-teal-500/10 border-teal-500/20";
      case "ZOOM": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "TEAMS": return "text-violet-500 bg-violet-500/10 border-violet-500/20";
      case "MEET": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      default: return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const isSessionActive = (session: LiveSession) => {
    const start = new Date(session.scheduled_at).getTime();
    const duration = session.duration_minutes || 60;
    const end = start + (duration * 60000);
    const now = Date.now();
    return now >= start && now <= end;
  };

  const isSessionPast = (session: LiveSession) => {
    const start = new Date(session.scheduled_at).getTime();
    const duration = session.duration_minutes || 60;
    const end = start + (duration * 60000);
    return Date.now() > end;
  };

  // Filter sessions
  const activeSession = sessions.find(s => isSessionActive(s));
  const upcomingSessions = sessions.filter(s => !isSessionActive(s) && !isSessionPast(s));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Recherche de lives programmés...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
          <Video className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">En direct</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Sessions Live & Q/R</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Rejoignez les cours en direct et posez vos questions en temps réel à vos instructeurs.</p>
      </div>

      {/* Main Status Block (Online or Offline) */}
      {activeSession ? (
        <div className="bg-gradient-to-r from-teal-900 to-zinc-900 text-white rounded-3xl p-8 border border-teal-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                Live en cours
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{activeSession.title}</h2>
              {activeSession.description && (
                <p className="text-zinc-300 text-sm">{activeSession.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {instructorMap[activeSession.instructor_id] || "Instructeur"}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Durée : {activeSession.duration_minutes} min</span>
                <span className="font-semibold text-teal-400">{getPlatformLabel(activeSession.meeting_provider)}</span>
              </div>
            </div>
            {activeSession.meeting_url && (
              <div className="shrink-0">
                <a 
                  href={activeSession.meeting_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-teal-500 hover:bg-teal-400 text-zinc-900 font-bold rounded-2xl transition-all shadow-xl hover:shadow-teal-500/20 text-sm hover:scale-[1.02] transform active:scale-[0.98]"
                >
                  Rejoindre le Live
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 text-white rounded-3xl p-8 border border-zinc-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-lg">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                Hors ligne
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight">Aucun live en cours pour le moment</h2>
              <p className="text-zinc-400 text-sm">
                Les sessions en direct sont programmées à l'avance. Quand un live commencera, un bouton de connexion apparaîtra ici pour rejoindre la salle virtuelle (Ansella Live, Zoom, Meet, etc.).
              </p>
            </div>
            <div className="shrink-0">
              <button className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-50 border border-zinc-700 rounded-2xl font-bold transition-all text-sm cursor-not-allowed">
                Rejoindre la salle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Sessions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Sessions programmées
        </h3>
        
        {upcomingSessions.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl text-center shadow-sm">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun autre live programmé pour l&apos;instant. Revenez bientôt !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingSessions.map(session => (
              <div key={session.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative">
                
                <div className="absolute right-4 top-4">
                  {session.is_public ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10"><Shield className="w-2.5 h-2.5" /> Public</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10"><ShieldAlert className="w-2.5 h-2.5" /> Privé</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="pr-12">
                    <h4 className="font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 text-sm md:text-base">{session.title}</h4>
                  </div>
                  {session.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{session.description}</p>
                  )}
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>{new Date(session.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {instructorMap[session.instructor_id] || "Instructeur"}</span>
                    <span className={`px-2.5 py-0.5 rounded font-bold border ${getPlatformColor(session.meeting_provider)}`}>
                      {getPlatformLabel(session.meeting_provider)} ({session.duration_minutes}m)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learning Prompt */}
      <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Besoin d&apos;étudier d&apos;ici là ?</h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Poursuivez vos modules d&apos;apprentissage autonomes.</p>
        </div>
        <Link href="/dashboard/courses" className="mt-4 sm:mt-0 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          Mes formations <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
