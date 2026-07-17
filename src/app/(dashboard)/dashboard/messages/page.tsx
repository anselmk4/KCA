"use client";

import React, { useEffect, useState, useRef } from "react";
import { getSimulatedSession } from "@/lib/rbac";
import { 
  getConversationsForUser, 
  sendChatMessage, 
  ChatConversation 
} from "@/lib/chat";
import { 
  MessageSquare, Send, Search, ArrowLeft, 
  User, CheckCheck, Landmark, Sparkles 
} from "lucide-react";
import Link from "next/link";

export default function StudentMessagesPage() {
  const [session, setSession] = useState<any>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [mobileChatVisible, setMobileChatVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // Sync real enrolled instructors from Supabase
  useEffect(() => {
    const syncRealInstructors = async () => {
      const s = getSimulatedSession();
      if (!s || s.role !== "STUDENT") return;
      setLoadingInstructors(true);
      try {
        const { supabase } = await import("@/lib/supabase/client");
        // 1. Get student's enrollments
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", s.userId);

        if (!enrollments || enrollments.length === 0) return;

        const courseIds = enrollments.map((e: any) => e.course_id);

        // 2. Get unique instructor IDs for these courses
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title, instructor_id")
          .in("id", courseIds);

        if (!courses || courses.length === 0) return;

        const instructorIds = [...new Set(courses.map((c: any) => c.instructor_id).filter(Boolean))];

        if (instructorIds.length === 0) return;

        // 3. Fetch profiles of these instructors to cache them
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", instructorIds);

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

          // Save student's active instructors list
          localStorage.setItem(`kuettu_student_instructors_${s.userId}`, JSON.stringify(instructorIds));
          
          // Re-load list
          const list = getConversationsForUser(s.userId, s.role);
          setConversations(list);
          if (list.length > 0 && !selectedContactId) {
            setSelectedContactId(list[0].userId);
          }
        }
      } catch (err) {
        console.error("Error syncing instructors from Supabase:", err);
      } finally {
        setLoadingInstructors(false);
      }
    };

    syncRealInstructors();
  }, [selectedContactId]);

  // Sync session and initial conversations load
  useEffect(() => {
    const s = getSimulatedSession();
    if (!s) return;
    setSession(s);

    const loadConversations = () => {
      const list = getConversationsForUser(s.userId, s.role);
      setConversations(list);
      
      // Auto-select the first conversation if none is selected yet and not on mobile
      if (list.length > 0 && !selectedContactId) {
        setSelectedContactId(list[0].userId);
      }
    };

    loadConversations();

    // Listen to storage events for real-time local sync (same-browser testing)
    const handleStorageChange = () => {
      const list = getConversationsForUser(s.userId, s.role);
      setConversations(list);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedContactId]);

  // Scroll to bottom of chat when message list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedContactId, conversations]);

  const activeConversation = conversations.find(c => c.userId === selectedContactId);
  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageDraft.trim() || !selectedContactId || !session) return;

    // Send the message via our helper (saves to localStorage and triggers storage event)
    sendChatMessage(
      session.userId,
      session.name,
      selectedContactId,
      messageDraft
    );

    // Local state immediate refresh for snappy UI feel
    setConversations(getConversationsForUser(session.userId, session.role));
    setMessageDraft("");
  };

  if (!session) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Messagerie Directe</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Conversations avec vos Formateurs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Posez vos questions et échangez en direct avec vos instructeurs académiques.
          </p>
        </div>
      </div>

      {/* Main Messaging Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden flex h-[65vh] min-h-[500px] relative">
        
        {/* Left Side: Contact List */}
        <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 ${mobileChatVisible ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un formateur..."
                className="pl-10 pr-4 py-2.5 w-full bg-zinc-55/60 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {filteredConversations.length === 0 ? (
              <div className="py-16 text-center px-4 space-y-3">
                <MessageSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-650 mx-auto" />
                <p className="text-zinc-550 dark:text-zinc-450 text-xs font-semibold leading-relaxed">
                  Aucun formateur trouvé ou disponible pour cette recherche.
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.userId === selectedContactId;
                return (
                  <button
                    key={conv.userId}
                    onClick={() => {
                      setSelectedContactId(conv.userId);
                      setMobileChatVisible(true);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-all hover:bg-zinc-50 dark:hover:bg-zinc-850/30 ${
                      isSelected 
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-blue-600" 
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm shadow-blue-500/10">
                      {conv.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-150 truncate">
                          {conv.name}
                        </h4>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 shrink-0 font-medium">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-xxs text-zinc-500 dark:text-zinc-400 truncate font-medium">
                        {conv.preview}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-2 h-2 bg-blue-650 rounded-full shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className={`flex-1 flex flex-col bg-zinc-50/30 dark:bg-zinc-950/10 ${!mobileChatVisible ? "hidden md:flex" : "flex"}`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3.5 bg-white dark:bg-zinc-900 shrink-0">
                <button
                  onClick={() => setMobileChatVisible(false)}
                  className="md:hidden p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                  {activeConversation.avatar}
                </div>
                <div>
                  <h3 className="text-xs font-black text-zinc-800 dark:text-white">
                    {activeConversation.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Instructeur
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeConversation.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 font-bold">
                      Début de la conversation
                    </p>
                    <p className="text-[10px] text-zinc-400 max-w-[240px] leading-relaxed">
                      Écrivez votre premier message ci-dessous pour démarrer l'échange avec votre formateur.
                    </p>
                  </div>
                ) : (
                  activeConversation.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.own ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm space-y-1 ${
                        msg.own
                          ? "bg-blue-650 text-white rounded-br-none"
                          : "bg-white dark:bg-zinc-850 border border-zinc-200/50 dark:border-zinc-800 text-zinc-800 dark:text-zinc-150 rounded-bl-none"
                      }`}>
                        <p className="text-xs leading-relaxed font-semibold">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1.5 text-[8px] opacity-75">
                          <span>{msg.time}</span>
                          {msg.own && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-3 shrink-0"
              >
                <input
                  required
                  type="text"
                  value={messageDraft}
                  onChange={e => setMessageDraft(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2.5 bg-zinc-55/65 dark:bg-zinc-850 border border-zinc-200/60 dark:border-zinc-750 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all text-zinc-850 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!messageDraft.trim()}
                  className="p-3 bg-blue-650 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center text-blue-650">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-800 dark:text-white">
                  Aucun formateur sélectionné
                </h3>
                <p className="text-xs text-zinc-500 max-w-[280px] leading-relaxed">
                  Sélectionnez un formateur dans la liste de gauche pour démarrer la messagerie et poser vos questions.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
