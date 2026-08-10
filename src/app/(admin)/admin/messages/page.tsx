"use client";

import { useEffect, useState } from "react";
import { getDB, saveDB, ContactMessage } from "@/lib/db";
import { Mail, Search, Trash2, MessageSquare, User, Calendar } from "lucide-react";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    setLoading(true);
    try {
      const db = getDB();
      const list = db.contactMessages || [];
      const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(sorted);
    } catch (err) {
      console.error("Error loading contact messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = (msg: ContactMessage) => {
    setSelectedMsg(msg);
    try {
      const db = getDB();
      const updated = db.contactMessages.map((m) => m.id === msg.id ? { ...m, read: true } : m);
      db.contactMessages = updated;
      saveDB(db);
      setMessages([...updated].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const handleDeleteMessage = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      const db = getDB();
      const filtered = db.contactMessages.filter((m) => m.id !== id);
      db.contactMessages = filtered;
      saveDB(db);
      setMessages([...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const filtered = messages.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Mail className="w-7 h-7 text-red-600 dark:text-red-500" />
          Messages du site
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Consultez et gérez les messages envoyés depuis le formulaire de contact de la page À propos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Messages List */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 flex flex-col h-[600px]">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="text-center py-8 text-xs text-zinc-500">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">Aucun message trouvé.</div>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedMsg?.id === msg.id
                      ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
                      : "bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate flex-1">
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-red-650 dark:text-red-400 mt-1 truncate">
                    {msg.subject}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                    {msg.message}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      msg.read 
                        ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    }`}>
                      {msg.read ? "Lu" : "Nouveau"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(msg.id);
                      }}
                      className="text-zinc-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Message Details */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col h-[600px] overflow-hidden">
          {selectedMsg ? (
            <div className="flex flex-col h-full">
              {/* Header Info */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                      {selectedMsg.subject}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {selectedMsg.name}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-zinc-400">{selectedMsg.email}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 text-xxs font-bold uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedMsg.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 p-6 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950/10 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                {selectedMsg.message}
              </div>

              {/* Quick Actions Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                <a
                  href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-red-600/10"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Répondre par Email
                </a>
                <button
                  onClick={() => handleDeleteMessage(selectedMsg.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-850 text-zinc-500 hover:text-red-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer le message
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
              <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mb-3" />
              <p className="text-sm font-semibold">Aucun message sélectionné</p>
              <p className="text-xs text-zinc-400 mt-1">Sélectionnez un message dans la liste pour afficher ses détails.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
