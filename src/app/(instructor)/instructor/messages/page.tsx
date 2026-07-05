"use client";

import { useEffect, useState } from "react";
import { getDB, initDB, Database } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";
import { MessageSquare, Send, Search, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
  own?: boolean;
}

interface Conversation {
  userId: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
  messages: Message[];
}

export default function MessagesPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  useEffect(() => {
    initDB();
    const d = getDB();
    setDb(d);
    const s = getSimulatedSession();
    if (!s) return;
    setSession(s);

    const myCourseIds = d.courses.filter(c => c.instructorId === s.userId).map(c => c.id);
    const myEnrollments = d.enrollments.filter(e => myCourseIds.includes(e.courseId));
    const studentIds = [...new Set(myEnrollments.map(e => e.studentId))];
    const students = d.users.filter(u => studentIds.includes(u.id)).slice(0, 6);

    const mockConversations: Conversation[] = students.map((student, i) => ({
      userId: student.id,
      name: student.name || "Apprenant",
      avatar: (student.name || "").split(" ").map((n: string) => n[0] || "").join("").slice(0, 2),
      preview: i % 2 === 0 ? "Merci pour le cours, super contenu !" : "J'ai une question sur le module 3...",
      time: `${10 + i}:${30 + i < 60 ? 30 + i : "00"}`,
      unread: i % 3 === 0 ? 2 : 0,
      messages: [
        { id: "m1", from: student.name || "Apprenant", text: i % 2 === 0 ? "Bonjour, j'ai adoré le cours !" : "Bonjour, j'ai une question.", time: "09:00" },
        { id: "m2", from: s.name || "Vous", text: "Merci ! Posez votre question.", time: "09:05", own: true },
        { id: "m3", from: student.name || "Apprenant", text: i % 2 === 0 ? "Merci pour le cours, super contenu !" : "J'ai une question sur le module 3...", time: "09:10" },
      ]
    }));

    setConversations(mockConversations);
    if (mockConversations.length > 0) setSelected(mockConversations[0].userId);
  }, []);

  const activeConv = conversations.find(c => c.userId === selected);
  const filteredConvs = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selected) return;
    setConversations(prev => prev.map(c => {
      if (c.userId !== selected) return c;
      return {
        ...c,
        preview: draft,
        messages: [...c.messages, { id: `m${Date.now()}`, from: session?.name || "Vous", text: draft, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), own: true }]
      };
    }));
    setDraft("");
  };

  if (!db || !session) return (
    <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
  );

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in">
      {/* Plan Free Limitations Card / Upgrade Invite Banner */}
      {session?.plan === "FREE" && (
        <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-blue-500/10 border-2 border-dashed border-red-500/30 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md relative overflow-hidden text-left mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 dark:bg-red-500/5 rounded-full blur-[40px] pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[40px] pointer-events-none -ml-16 -mb-16" />
          
          <div className="space-y-3 z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
              ⚠️ Plan d&apos;essai gratuit actif
            </span>
            <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white leading-snug">
              Boostez votre Académie en passant au Plan Supérieur !
            </h2>
            <p className="text-xs md:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
              Votre plan actuel est limité à <span className="font-bold text-zinc-900 dark:text-white">1 cours actif</span>, <span className="font-bold text-zinc-900 dark:text-white">15 apprenants</span> et comporte des frais de transaction de <span className="font-bold text-zinc-900 dark:text-white">50%</span>. 
              Passez au Plan supérieur pour débloquer les <span className="font-semibold text-blue-600 dark:text-blue-400">sessions live</span>, réduire vos frais de transaction à <span className="font-semibold text-teal-650 dark:text-teal-400">10% ou moins</span> et accueillir des élèves en illimité.
            </p>
          </div>
          <div className="shrink-0 z-10 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Link
              href="/instructor/billing"
              className="px-6 py-3 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              Passer à l&apos;offre supérieure
              <TrendingUp className="w-4 h-4" />
            </Link>
            <Link
              href="/instructor/billing"
              className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 font-bold text-xs rounded-xl transition-all text-center cursor-pointer"
            >
              Voir tous les tarifs & avantages
            </Link>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Messages</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Communiquez avec vos apprenants.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation list */}
        <div className={`w-full lg:w-80 border-r border-zinc-100 dark:border-zinc-800 flex flex-col shrink-0 ${mobileShowChat ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800">
            {filteredConvs.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">Aucune conversation.</p>
              </div>
            ) : filteredConvs.map(c => (
              <button
                key={c.userId}
                onClick={() => { setSelected(c.userId); setMobileShowChat(true); }}
                className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${selected === c.userId ? "bg-teal-50 dark:bg-teal-900/10 border-r-2 border-teal-500" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{c.name}</p>
                      <span className="text-[10px] text-zinc-400 shrink-0 ml-1">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-zinc-400 truncate">{c.preview}</p>
                      {c.unread > 0 && (
                        <span className="ml-1 w-4 h-4 bg-teal-500 rounded-full text-white text-[10px] flex items-center justify-center shrink-0">{c.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!mobileShowChat ? "hidden lg:flex" : "flex"}`}>
          {activeConv ? (
            <>
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">
                  {activeConv.avatar}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm">{activeConv.name}</p>
                  <p className="text-xs text-emerald-500">En ligne</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeConv.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm ${
                      msg.own
                        ? "bg-teal-600 text-white rounded-tr-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm"
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.own ? "text-teal-100" : "text-zinc-400"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
                <button type="submit" disabled={!draft.trim()} className="p-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="font-semibold text-zinc-500 dark:text-zinc-400">Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
