"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, HelpCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre guide virtuel Kuettu. Posez-moi vos questions sur le fonctionnement de la plateforme (création de cours, abonnements, paiements, retraits, etc.)."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, je rencontre une difficulté technique. Veuillez réessayer." }
      ]);
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = (prompt: string) => {
    handleSend(prompt);
  };

  const suggestions = [
    "Comment créer mon premier cours ?",
    "Quels sont les moyens de paiement ?",
    "Comment retirer mes revenus formateur ?",
    "Qu'apporte le Plan supérieur ?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-teal-600 via-teal-700 to-indigo-700 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-teal-300 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm">Guide IA Kuettu</h3>
                <span className="text-[10px] text-teal-200 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  En ligne • Prêt à vous guider
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/10">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap text-left ${
                    m.role === "user"
                      ? "bg-teal-650 dark:bg-teal-750 text-white rounded-br-none"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2 text-zinc-500">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  Rédaction du guide...
                </div>
              </div>
            )}

            {/* Suggesions Empty State */}
            {messages.length === 1 && !loading && (
              <div className="pt-4 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Questions fréquemment posées
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggest(s)}
                      className="w-full text-left px-4 py-2.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="p-3 border-t border-zinc-200 dark:border-zinc-850 flex items-center gap-2 bg-white dark:bg-zinc-950"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Écrivez votre question ici..."
              disabled={loading}
              className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="p-2.5 bg-teal-650 hover:bg-teal-500 text-white rounded-xl disabled:bg-zinc-150 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-colors cursor-pointer disabled:cursor-default"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-gradient-to-r from-teal-600 to-indigo-700 hover:from-teal-500 hover:to-indigo-600 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer relative group"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950 animate-bounce" />
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
}
