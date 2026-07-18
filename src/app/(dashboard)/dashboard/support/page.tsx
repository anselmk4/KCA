"use client";

import { useEffect, useState } from "react";
import { getDB, addSupportTicket, addReplyToTicket, Database, SupportTicket } from "@/lib/db";
import { getSimulatedSession, CurrentSession } from "@/lib/rbac";
import { useLanguage } from "@/context/LanguageContext";
import { 
  MessageSquare, 
  Send, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  AlertCircle, 
  Plus, 
  MessageCircle,
  FileText
} from "lucide-react";

export default function StudentSupportPage() {
  const { t } = useLanguage();
  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<CurrentSession | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setDb(getDB());
    setSession(getSimulatedSession());
  }, []);

  if (!db || !session) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
            <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          </div>
          <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
        </div>
      </div>
    );
  }

  // Filter tickets for current student
  const studentTickets = db.supportTickets.filter(
    (t) => t.userId === session.userId
  );

  const filteredTickets = studentTickets.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.message.toLowerCase().includes(search.toLowerCase())
  );

  const activeTicket = studentTickets.find((t) => t.id === selectedId);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    setCreating(true);
    setTimeout(() => {
      addSupportTicket({
        userId: session.userId,
        userName: session.name,
        subject: newSubject.trim(),
        message: newMessage.trim(),
      });

      const updatedDB = getDB();
      setDb(updatedDB);
      
      // Auto select the newly created ticket
      const myUpdatedTickets = updatedDB.supportTickets.filter(t => t.userId === session.userId);
      if (myUpdatedTickets.length > 0) {
        setSelectedId(myUpdatedTickets[myUpdatedTickets.length - 1].id);
      }

      setNewSubject("");
      setNewMessage("");
      setShowCreateModal(false);
      setCreating(false);
    }, 600);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;

    addReplyToTicket(selectedId, {
      senderId: session.userId,
      senderName: session.name,
      message: draft.trim(),
    });

    setDb(getDB());
    setDraft("");
  };

  // Status visual attributes
  const statusConfig = {
    OPEN: {
      label: t("student.support.open", "Ouvert"),
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30",
      icon: <AlertCircle className="w-3.5 h-3.5" />
    },
    IN_PROGRESS: {
      label: t("student.support.pending", "En cours"),
      color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30",
      icon: <Clock className="w-3.5 h-3.5" />
    },
    RESOLVED: {
      label: t("student.support.closed", "Résolu"),
      color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    CLOSED: {
      label: t("student.support.closed", "Fermé"),
      color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800",
      icon: <X className="w-3.5 h-3.5" />
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            {t("student.support.title", "Support Technique")}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {t("student.support.subtitle", "Une question ou un problème ? Contactez notre équipe d'assistance.")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" /> {t("student.support.createTicket", "Nouveau Ticket")}
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-230px)] min-h-[500px]">
        
        {/* Left Side: Ticket List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-900">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("student.discover.searchPlaceholder", "Rechercher un ticket...")}
                className="pl-9 pr-4 py-2.5 w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all placeholder-zinc-400 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900/50">
            {filteredTickets.length === 0 ? (
              <div className="py-16 text-center px-4">
                <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs">{t("student.support.noTickets", "Aucun ticket disponible")}</p>
                <p className="text-zinc-400 text-[10px] mt-1">{t("student.payment.applyCoupon", "Créez").toLowerCase().includes("appliqu") ? "Create your first support ticket to get started." : "Créez votre première requête de support pour débuter."}</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const config = statusConfig[t.status];
                const active = selectedId === t.id;
                const lastMsg = t.replies.length > 0 ? t.replies[t.replies.length - 1].message : t.message;
                const hasReplies = t.replies.length > 0;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-5 py-4 transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 flex flex-col gap-2 ${
                      active ? "bg-blue-500/5 dark:bg-blue-500/5 border-r-2 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-zinc-400 font-mono">#{t.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 uppercase ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-white text-xs truncate w-full">{t.subject}</p>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 w-full">{lastMsg}</p>
                    <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-0.5">
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      {hasReplies && (
                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded font-bold">
                          {t.replies.length} rép.
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
        {/* Right Side: Chat Area */}
        <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/10">
          {activeTicket ? (
            <>
              {/* Ticket Top bar */}
              <div className="px-6 py-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 dark:text-white text-xs truncate max-w-md">{activeTicket.subject}</h2>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {t("student.payment.applyCoupon", "Créé").toLowerCase().includes("appliqu") ? "Created on" : "Créé le"} {new Date(activeTicket.createdAt).toLocaleString(t("student.payment.applyCoupon", "Créé").toLowerCase().includes("appliqu") ? "en-US" : "fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 uppercase ${statusConfig[activeTicket.status].color}`}>
                    {statusConfig[activeTicket.status].icon}
                    {statusConfig[activeTicket.status].label}
                  </span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Initial Student Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {session.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white">{session.name}</span>
                      <span className="text-[9px] text-zinc-400">{t("student.payment.applyCoupon", "Auteur").toLowerCase().includes("appliqu") ? "Author" : "Auteur"}</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-2xl text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {activeTicket.message}
                    </div>
                  </div>
                </div>

                {/* Ticket Replies */}
                {activeTicket.replies.map((reply) => {
                  const isAdmin = reply.senderId !== session.userId;
                  return (
                    <div key={reply.id} className="flex items-start gap-3">
                      {isAdmin ? (
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                          AD
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {session.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-white">
                            {isAdmin ? "Support Admin" : reply.senderName}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            isAdmin ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "text-zinc-400"
                          }`}>
                            {isAdmin ? (t("student.payment.applyCoupon", "Équipe").toLowerCase().includes("appliqu") ? "Staff" : "Équipe") : (t("student.payment.applyCoupon", "Vous").toLowerCase().includes("appliqu") ? "You" : "Vous")}
                          </span>
                        </div>
                        <div className={`p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isAdmin 
                            ? "bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 text-zinc-800 dark:text-zinc-200" 
                            : "bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200"
                        }`}>
                          {reply.message}
                        </div>
                        <p className="text-[9px] text-zinc-400 pl-1">{new Date(reply.createdAt).toLocaleString(t("student.payment.applyCoupon", "Créé").toLowerCase().includes("appliqu") ? "en-US" : "fr-FR")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Box */}
              {activeTicket.status !== "CLOSED" ? (
                <form 
                  onSubmit={handleSendReply}
                  className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t("student.payment.applyCoupon", "Écrire").toLowerCase().includes("appliqu") ? "Write a reply message..." : "Écrire un message de réponse..."}
                    className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-zinc-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-md shadow-blue-500/10 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 text-center text-xs text-zinc-400">
                  {t("student.payment.applyCoupon", "Ce ticket").toLowerCase().includes("appliqu") ? "This ticket has been closed. Replies are no longer allowed." : "Ce ticket a été fermé. Il n'est plus possible d'y répondre."}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="max-w-md space-y-3">
                <MessageCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">{t("student.payment.applyCoupon", "Aucune discussion").toLowerCase().includes("appliqu") ? "No Open Discussion" : "Aucune discussion ouverte"}</h3>
                <p className="text-xs text-zinc-400">{t("student.payment.applyCoupon", "Sélectionnez").toLowerCase().includes("appliqu") ? "Select a ticket from the list on the left or open a new one to ask your question." : "Sélectionnez un ticket dans la liste de gauche ou ouvrez-en un nouveau pour poser votre question à l'assistance."}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">{t("student.payment.applyCoupon", "Créer").toLowerCase().includes("appliqu") ? "Create New Ticket" : "Créer un nouveau ticket"}</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">{t("student.payment.applyCoupon", "Décrivez").toLowerCase().includes("appliqu") ? "Describe your technical or academic issue in detail." : "Décrivez précisément votre problème technique ou académique."}</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    {t("student.payment.applyCoupon", "Sujet").toLowerCase().includes("appliqu") ? "Subject of your request *" : "Sujet de votre requête *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder={t("student.payment.applyCoupon", "Ex").toLowerCase().includes("appliqu") ? "e.g. Issue accessing my quiz" : "Ex: Problème d'accès à mon quiz"}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wide">
                    {t("student.payment.applyCoupon", "Message").toLowerCase().includes("appliqu") ? "Detailed Message / Description *" : "Message / Description détaillée *"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("student.payment.applyCoupon", "Veuillez").toLowerCase().includes("appliqu") ? "Please describe the problem you encountered with as much detail as possible (actions performed, error messages, etc.)." : "Veuillez décrire le problème rencontré avec le plus de précisions possibles (actions effectuées, messages d'erreurs, etc.)."}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {t("student.payment.applyCoupon", "Annuler").toLowerCase().includes("appliqu") ? "Cancel" : "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={!newSubject.trim() || !newMessage.trim() || creating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                >
                  {creating ? (t("student.payment.applyCoupon", "Création").toLowerCase().includes("appliqu") ? "Creating..." : "Création...") : (t("student.payment.applyCoupon", "Soumettre").toLowerCase().includes("appliqu") ? "Submit Ticket" : "Soumettre le ticket")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
