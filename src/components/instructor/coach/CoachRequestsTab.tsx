"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  User,
  Video,
  CornerUpLeft,
  CheckCircle2,
} from "lucide-react";

export interface MentorshipRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "PENDING" | "REPLIED";
}

export function CoachRequestsTab() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedRequestId) return;
    setSendingReply(true);
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequestId ? { ...r, status: "REPLIED" } : r))
      );
      setSendingReply(false);
      setReplyText("");
      alert("Votre réponse de mentorat a été transmise à l'apprenant !");
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {requests.length === 0 ? (
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
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        }`}
                      >
                        {req.status === "PENDING" ? "En attente" : "Répondu"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {req.subject}
                    </p>

                    <p className="text-[10px] text-zinc-400 font-medium">{req.createdAt}</p>
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
                  <span className="text-xs text-zinc-400 font-medium">{selectedRequest.createdAt}</span>
                </div>

                <p className="text-xs text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                  De : {selectedRequest.studentName} ({selectedRequest.studentEmail})
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                {selectedRequest.message}
              </div>

              {/* Reply Form */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CornerUpLeft className="w-4 h-4 text-teal-600" /> Réponse du Coach
                </label>

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Rédigez votre réponse explicative ou proposez une vidéo de correction Ansella Live..."
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-medium"
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setReplyText(
                        `Bonjour ${selectedRequest.studentName.split(" ")[0]},\n\nJ'ai analysé votre demande. Je vous propose qu'on fasse un rapide point en visio Ansella Live 1-on-1 pour corriger la méthode étape par étape.`
                      )
                    }
                    className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-teal-600" /> Proposer un rdv Ansella Live
                  </button>

                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> {sendingReply ? "Envoi..." : "Envoyer la réponse"}
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
