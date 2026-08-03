"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Calendar,
  Clock,
  Video,
  Plus,
  MessageSquare,
  ExternalLink,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CornerUpLeft,
  Send,
  ShieldCheck,
} from "lucide-react";
import { RequestCoachingModal } from "@/components/coaching/RequestCoachingModal";

interface CoachingRequest {
  id: string;
  courseTitle: string;
  subject: string;
  message: string;
  preferredTime: string;
  scheduledAt?: string;
  status: "PENDING" | "REPLIED" | "SCHEDULED" | "COMPLETED";
  createdAt: string;
  reply?: string;
}

interface VisioSession {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string;
  meetingProvider: string;
}

export default function StudentCoachingPage() {
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [scheduledVisios, setScheduledVisios] = useState<VisioSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Student Reply State for existing request
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user coaching requests from DB
      const reqRes = await fetch("/api/coaching/requests");
      const reqData = await reqRes.json();
      if (reqData?.requests && Array.isArray(reqData.requests)) {
        setRequests(reqData.requests);
      }

      // 2. Fetch 1-on-1 visio sessions for student from /api/calendar/events
      const calRes = await fetch("/api/calendar/events");
      const calData = await calRes.json();

      if (calData?.events && Array.isArray(calData.events)) {
        const coachEvents = calData.events.filter(
          (e: any) => e.sessionType === "COACHING_1ON1"
        );
        setScheduledVisios(coachEvents);
      }
    } catch (err) {
      console.error("Error fetching student coaching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSendReply = async (requestId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/coaching/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          message: replyText
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'envoi");

      alert("Votre message a été transmis à votre formateur avec notification !");
      setReplyText("");
      setReplyingToId(null);
      fetchData();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-teal-950 rounded-3xl p-8 text-white border border-teal-500/30 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Accompagnement Sur-Mesure
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-teal-400" />
            Coaching Individuel 1-sur-1
          </h1>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-medium">
            Bénéficiez d&apos;un mentorat personnalisé avec vos formateurs experts. Débloquez vos exercices, révisez vos stratégies de trading ou vos architectures smart contracts en visio privée.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-105 self-start lg:self-auto relative z-10 shrink-0"
        >
          <Plus className="w-4 h-4" /> Demander un Coaching 1-sur-1
        </button>

        {/* Ambient glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {requests.length}
            </div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Demande(s) envoyée(s)
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {scheduledVisios.length}
            </div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Séance(s) visio confirmée(s)
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              Ansella Live
            </div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Visioconférence chiffrée
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Scheduled Sessions & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Scheduled Visios */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4 text-teal-600" />
            Mes Séances Visio 1-sur-1 Confirmées ({scheduledVisios.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Chargement de vos séances visio...</p>
            </div>
          ) : scheduledVisios.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Aucune séance 1-on-1 programmée pour le moment
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Soumettez une demande de coaching ou attendez la validation de votre formateur.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Soumettre une demande
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledVisios.map((sess) => (
                <div
                  key={sess.id}
                  className="p-5 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-50/50 to-white dark:from-teal-950/20 dark:to-zinc-900 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> Coaching 1-sur-1 Privé
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 uppercase">
                      Confirmé
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    {sess.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {new Date(sess.scheduledAt).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {sess.durationMinutes || 45} min
                    </span>
                  </div>

                  {sess.meetingUrl && (
                    <div className="pt-2">
                      <a
                        href={sess.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Video className="w-4 h-4" /> Rejoindre la salle Ansella Live
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Submitted Requests & Responses */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            Historique de vos Demandes ({requests.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Chargement de vos demandes...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Vous n&apos;avez envoyé aucune demande de mentorat
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Posez vos questions ou décrivez un blocage sur un cours pour programmer une session.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                      {req.courseTitle}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        req.status === "PENDING"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          : req.status === "SCHEDULED"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      }`}
                    >
                      {req.status === "PENDING"
                        ? "En attente du Formateur"
                        : req.status === "SCHEDULED"
                        ? "Séance Programmée"
                        : "Formateur a répondu"}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    {req.subject}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    {req.message}
                  </p>

                  {/* Instructor Reply Box */}
                  {req.reply && (
                    <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-500/30 text-xs text-zinc-800 dark:text-zinc-200 space-y-1">
                      <span className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Réponse de votre Formateur :
                      </span>
                      <p className="leading-relaxed font-medium whitespace-pre-wrap">{req.reply}</p>
                    </div>
                  )}

                  {/* Scheduled Time preview */}
                  {req.scheduledAt && (
                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Séance visio programmée le : {new Date(req.scheduledAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}

                  {/* Student Reply Action */}
                  {replyingToId === req.id ? (
                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Rédigez votre réponse ou précision pour le formateur..."
                        rows={2}
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1.5 text-xs text-zinc-500 font-bold"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleStudentSendReply(req.id)}
                          disabled={submittingReply || !replyText.trim()}
                          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Envoyer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 font-medium border-t border-zinc-100 dark:border-zinc-800">
                      <span>Créneau souhaité : {req.preferredTime}</span>
                      <button
                        onClick={() => setReplyingToId(req.id)}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CornerUpLeft className="w-3 h-3" /> Répondre
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal component */}
      <RequestCoachingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRequestSubmitted={fetchData}
      />

    </div>
  );
}
