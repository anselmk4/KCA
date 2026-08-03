"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  User,
  Video,
  CornerUpLeft,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";

export interface MentorshipRequest {
  id: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  courseTitle?: string;
  subject: string;
  message: string;
  preferredTime?: string;
  scheduledAt?: string;
  createdAt: string;
  status: "PENDING" | "REPLIED" | "SCHEDULED" | "COMPLETED";
  reply?: string;
}

export function CoachRequestsTab() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/coaching/requests");
      const data = await res.json();
      if (data?.requests && Array.isArray(data.requests)) {
        setRequests(data.requests);
        if (data.requests.length > 0 && !selectedRequestId) {
          setSelectedRequestId(data.requests[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading coach requests:", err);
    } finally {
      setLoading(false);
    }
  }

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedRequestId) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/coaching/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequestId,
          reply: replyText,
          status: scheduleDateTime ? "SCHEDULED" : "REPLIED",
          scheduledAt: scheduleDateTime || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de transmission de la réponse.");
      }

      alert("Votre réponse et la notification in-app ont été envoyées à l'apprenant !");
      setReplyText("");
      setScheduleDateTime("");
      await loadRequests();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent mx-auto" />
          <p className="text-xs text-zinc-500 font-bold">Chargement des demandes de coaching...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto stroke-1" />
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
            Aucune demande de mentorat en attente
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Lorsque vos étudiants soumettront des demandes de soutien individuel ou de revue d&apos;exercices, leurs messages apparaîtront directement dans cette boîte de réception.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Requests List */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              Demandes d&apos;Aide & Mentorat ({requests.length})
            </h3>

            <div className="space-y-2.5">
              {requests.map((req) => {
                const active = req.id === selectedRequestId;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                      active
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-sm ring-1 ring-teal-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-teal-600" /> {req.studentName}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          req.status === "PENDING"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : req.status === "SCHEDULED"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        }`}
                      >
                        {req.status === "PENDING" ? "En attente" : req.status === "SCHEDULED" ? "Programmé" : "Répondu"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {req.subject}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium pt-1">
                      <span>{req.courseTitle || "Mentorat"}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Request Detail & Reply Workbench */}
          {selectedRequest && (
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
              
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                    {selectedRequest.subject}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {new Date(selectedRequest.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <p className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                    De : {selectedRequest.studentName} ({selectedRequest.studentEmail})
                  </p>
                  {selectedRequest.preferredTime && (
                    <span className="text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg">
                      Créneau souhaité : {selectedRequest.preferredTime}
                    </span>
                  )}
                </div>
              </div>

              {/* Original Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Message de l&apos;apprenant
                </label>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedRequest.message}
                </div>
              </div>

              {/* Previous Reply if any */}
              {selectedRequest.reply && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Votre précédente réponse
                  </label>
                  <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-500/30 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedRequest.reply}
                  </div>
                </div>
              )}

              {/* Schedule Optional Visio */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" /> Programmer la visio Ansella Live 1-on-1 (Optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-900 dark:text-white"
                />
                <p className="text-[10px] text-zinc-400">
                  Si une date est définie, la séance s&apos;ajoutera automatiquement à vos deux calendriers et créera la salle Ansella Live.
                </p>
              </div>

              {/* Reply Form */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CornerUpLeft className="w-4 h-4 text-teal-600" /> Répondre à l&apos;apprenant
                </label>

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Rédigez votre réponse explicative ou proposez vos conseils pour l'accompagnement..."
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-medium"
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setReplyText(
                        `Bonjour ${selectedRequest.studentName.split(" ")[0]},\n\nJ'ai bien analysé votre demande sur "${selectedRequest.subject}". Je vous propose qu'on fasse un point rapide en visioconférence Ansella Live 1-on-1 pour corriger l'exercice étape par étape.`
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-teal-600" /> Insérer modèle visio
                  </button>

                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> {sendingReply ? "Envoi en cours..." : "Envoyer & Notifier"}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
