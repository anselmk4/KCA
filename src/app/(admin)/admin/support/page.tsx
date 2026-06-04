"use client";

import { useEffect, useState } from "react";
import { getDB, saveDB, addReplyToTicket, Database, SupportTicket } from "@/lib/db";
import { 
  MessageSquare, 
  Send, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  AlertCircle, 
  MessageCircle,
  FileText,
  CornerDownLeft,
  User,
  Filter
} from "lucide-react";

export default function AdminSupportPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED">("ALL");

  useEffect(() => {
    setDb(getDB());
  }, []);

  if (!db) {
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

  // Filter tickets globally
  const filteredTickets = db.supportTickets.filter((t) => {
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchSearch = 
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeTicket = db.supportTickets.find((t) => t.id === selectedId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;

    addReplyToTicket(selectedId, {
      senderId: "admin",
      senderName: "Support Admin",
      message: draft.trim(),
    });

    setDb(getDB());
    setDraft("");
  };

  const handleStatusChange = (id: string, newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
    const updated = getDB();
    const ticket = updated.supportTickets.find((t) => t.id === id);
    if (ticket) {
      ticket.status = newStatus;
      saveDB(updated);
      setDb(updated);
    }
  };

  // Status config
  const statusConfig = {
    OPEN: {
      label: "Ouvert",
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30",
      icon: <AlertCircle className="w-3.5 h-3.5" />
    },
    IN_PROGRESS: {
      label: "En cours",
      color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30",
      icon: <Clock className="w-3.5 h-3.5" />
    },
    RESOLVED: {
      label: "Résolu",
      color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    CLOSED: {
      label: "Fermé",
      color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800",
      icon: <X className="w-3.5 h-3.5" />
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <HelpCircle className="w-7 h-7 text-red-600 dark:text-red-500" />
          Modération du Support Technique
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Gérez les requêtes d'assistance technique et pédagogique ouvertes par les étudiants de la plateforme.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "ALL", label: "Tous" },
          { key: "OPEN", label: "Ouverts" },
          { key: "IN_PROGRESS", label: "En cours" },
          { key: "RESOLVED", label: "Résolus" },
          { key: "CLOSED", label: "Fermés" }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              statusFilter === tab.key
                ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/30 shadow-sm"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-270px)] min-h-[500px]">
        
        {/* Left Side: Ticket List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-900">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par élève ou sujet..."
                className="pl-9 pr-4 py-2.5 w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500 transition-all placeholder-zinc-400 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900/50">
            {filteredTickets.length === 0 ? (
              <div className="py-16 text-center px-4">
                <MessageSquare className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-900 dark:text-zinc-100 font-semibold text-xs">Aucun ticket correspondant</p>
                <p className="text-zinc-400 text-[10px] mt-1">Aucune demande ne correspond aux filtres appliqués.</p>
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
                      active ? "bg-red-500/5 dark:bg-red-500/5 border-r-2 border-red-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-zinc-400 font-mono">#{t.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 uppercase ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-zinc-900 dark:text-white text-xs truncate w-full">{t.subject}</p>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-semibold">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>{t.userName}</span>
                      </div>
                    </div>
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

        {/* Right Side: Chat / Reply Area */}
        <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/10">
          {activeTicket ? (
            <>
              {/* Ticket Top Actions bar */}
              <div className="px-6 py-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-500 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 dark:text-white text-xs truncate max-w-md">{activeTicket.subject}</h2>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Élève : <span className="font-bold">{activeTicket.userName}</span> · ID : {activeTicket.userId}</p>
                  </div>
                </div>
                
                {/* Actions dropdown/buttons */}
                <div className="flex items-center gap-2">
                  {activeTicket.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleStatusChange(activeTicket.id, "RESOLVED")}
                      className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-amber-100 dark:hover:bg-amber-950/50"
                    >
                      Résoudre
                    </button>
                  )}
                  {activeTicket.status !== "CLOSED" ? (
                    <button
                      onClick={() => handleStatusChange(activeTicket.id, "CLOSED")}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Fermer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(activeTicket.id, "OPEN")}
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-[10px] font-bold uppercase transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                    >
                      Réouvrir
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Initial Student Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {activeTicket.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white">{activeTicket.userName}</span>
                      <span className="text-[9px] text-zinc-400">Élève (Auteur)</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-2xl text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {activeTicket.message}
                    </div>
                    <p className="text-[9px] text-zinc-400 pl-1">{new Date(activeTicket.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                </div>

                {/* Replies Thread */}
                {activeTicket.replies.map((reply) => {
                  const isAdmin = reply.senderId === "admin";
                  return (
                    <div key={reply.id} className="flex items-start gap-3">
                      {isAdmin ? (
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                          AD
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {reply.senderName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-white">
                            {isAdmin ? "Vous (Admin Support)" : reply.senderName}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            isAdmin ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold" : "text-zinc-400"
                          }`}>
                            {isAdmin ? "Équipe" : "Élève"}
                          </span>
                        </div>
                        <div className={`p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isAdmin 
                            ? "bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 text-zinc-800 dark:text-zinc-200" 
                            : "bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200"
                        }`}>
                          {reply.message}
                        </div>
                        <p className="text-[9px] text-zinc-400 pl-1">{new Date(reply.createdAt).toLocaleString("fr-FR")}</p>
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
                    placeholder="Saisir la réponse d'assistance..."
                    className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-zinc-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="p-3 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-md shadow-red-500/10 shrink-0"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 text-center text-xs text-zinc-400">
                  Ce ticket a été clos. Veuillez réouvrir le ticket si vous devez envoyer un nouveau message.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="max-w-md space-y-3">
                <MessageCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Aucun ticket sélectionné</h3>
                <p className="text-xs text-zinc-400">Sélectionnez une demande dans la liste de gauche pour afficher l'historique et envoyer une réponse d'assistance.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
