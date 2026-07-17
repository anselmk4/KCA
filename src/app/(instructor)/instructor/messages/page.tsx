"use client";

import { useState, useEffect } from "react";
import { getSimulatedSession } from "@/lib/rbac";
import { getConversationsForUser, sendChatMessage, ChatConversation } from "@/lib/chat";
import { MessageSquare, Send, Search, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function MessagesPage() {
  const [session, setSession] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [search, setSearch] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const [loadingStudents, setLoadingStudents] = useState(false);

  // Sync real enrolled students from Supabase
  useEffect(() => {
    const syncRealStudents = async () => {
      const s = getSimulatedSession();
      if (!s || s.role !== "INSTRUCTOR") return;
      setLoadingStudents(true);
      try {
        const { supabase } = await import("@/lib/supabase/client");
        
        // 1. Get all student IDs from user_roles
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("user_id, roles!inner(name)")
          .eq("roles.name", "STUDENT");

        const allStudentIds = (userRoles || []).map((r: any) => r.user_id);

        // 2. Find students enrolled in my courses to prioritize them
        const { data: courses } = await supabase
          .from("courses")
          .select("id")
          .eq("instructor_id", s.userId);
        
        let myStudentIds: string[] = [];
        if (courses && courses.length > 0) {
          const courseIds = courses.map((c: any) => c.id);
          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("student_id")
            .in("course_id", courseIds);
          if (enrollments) {
            myStudentIds = enrollments.map((e: any) => e.student_id).filter(Boolean);
          }
        }

        // Combine and put instructor's own course students first
        const sortedStudentIds = [...new Set([
          ...myStudentIds,
          ...allStudentIds
        ])];

        if (sortedStudentIds.length === 0) return;

        // 3. Fetch profiles of all these students to cache them
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", sortedStudentIds);

        if (profiles) {
          // Update profile cache in localStorage
          const cacheRaw = localStorage.getItem("kuettu_profile_cache") || "{}";
          let cache: Record<string, any> = {};
          try {
            cache = JSON.parse(cacheRaw);
          } catch {}

          profiles.forEach((p: any) => {
            cache[p.id] = {
              name: p.full_name,
              avatar: p.full_name ? p.full_name.split(" ").map((n: string) => n[0] || "").join("").slice(0, 2).toUpperCase() : "UT"
            };
          });
          localStorage.setItem("kuettu_profile_cache", JSON.stringify(cache));

          // Save instructor's active students list
          localStorage.setItem(`kuettu_instructor_students_${s.userId}`, JSON.stringify(sortedStudentIds));
          
          // Re-load list
          const list = getConversationsForUser(s.userId, s.role);
          setConversations(list);
          if (list.length > 0 && !selected) {
            setSelected(list[0].userId);
          }
        }
      } catch (err) {
        console.error("Error syncing students from Supabase:", err);
      } finally {
        setLoadingStudents(false);
      }
    };

    syncRealStudents();
  }, [selected]);

  useEffect(() => {
    const s = getSimulatedSession();
    if (!s) return;
    setSession(s);

    const loadConversations = () => {
      const list = getConversationsForUser(s.userId, s.role);
      setConversations(list);
      if (list.length > 0 && !selected) {
        setSelected(list[0].userId);
      }
    };

    loadConversations();

    const handleStorageChange = () => {
      const list = getConversationsForUser(s.userId, s.role);
      setConversations(list);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("kuettu_chat_update", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("kuettu_chat_update", handleStorageChange);
    };
  }, [selected]);

  // Real-time Supabase Database synchronization and subscription
  useEffect(() => {
    if (!session?.userId) return;
    
    // Initial sync
    import("@/lib/chat").then(({ syncDatabaseMessages }) => {
      syncDatabaseMessages(session.userId);
    });

    // Real-time channel subscription
    let subscription: any;
    import("@/lib/supabase/client").then(({ supabase }) => {
      subscription = supabase
        .channel(`instructor-chat-${session.userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages"
          },
          (payload) => {
            const newMsg = payload.new;
            if (newMsg.sender_id === session.userId || newMsg.receiver_id === session.userId) {
              import("@/lib/chat").then(({ syncDatabaseMessages }) => {
                syncDatabaseMessages(session.userId);
              });
            }
          }
        )
        .subscribe();
    });

    return () => {
      if (subscription) {
        import("@/lib/supabase/client").then(({ supabase }) => {
          supabase.removeChannel(subscription);
        });
      }
    };
  }, [session?.userId]);

  const activeConv = conversations.find(c => c.userId === selected);
  const filteredConvs = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selected || !session) return;
    
    sendChatMessage(session.userId, session.name, selected, draft);
    setConversations(getConversationsForUser(session.userId, session.role));
    setDraft("");
  };

  if (!session) return (
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
              Votre plan actuel est limité à <span className="font-bold text-zinc-900 dark:text-white">1 cours actif</span>, <span className="font-bold text-zinc-900 dark:text-white">15 apprenants</span> et comporte des frais de transaction de <span className="font-bold text-zinc-900 dark:text-white">20%</span>. 
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
                      {c.unreadCount > 0 && (
                        <span className="ml-1 w-4 h-4 bg-teal-500 rounded-full text-white text-[10px] flex items-center justify-center shrink-0">{c.unreadCount}</span>
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
