"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Trash2, 
  Check, 
  Loader2, 
  Inbox,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "SUCCESS" | "WARNING" | "ERROR" | "INFO";
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const session = getSimulatedSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotifications(data as NotificationItem[]);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (!error) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const session = getSimulatedSession();
      if (!session) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", session.userId)
        .eq("is_read", false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "UNREAD") return !n.is_read;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400 mb-1">
            <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Retour au tableau de bord
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-600" /> Notifications
          </h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-center px-4 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        {[
          { key: "ALL", label: "Toutes" },
          { key: "UNREAD", label: `Non lues (${notifications.filter(n => !n.is_read).length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer -mb-px ${
              filter === tab.key
                ? "border-teal-600 text-teal-600 dark:text-teal-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <Inbox className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {filter === "UNREAD" ? "Aucune notification non lue" : "Votre boîte de notifications est vide"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {filteredNotifications.map(n => {
            let IconComponent = Info;
            let iconColor = "text-blue-500 bg-blue-50 dark:bg-blue-950/20";
            if (n.type === "SUCCESS") {
              IconComponent = CheckCircle2;
              iconColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
            } else if (n.type === "WARNING") {
              IconComponent = AlertTriangle;
              iconColor = "text-amber-500 bg-amber-50 dark:bg-amber-950/20";
            } else if (n.type === "ERROR") {
              IconComponent = XCircle;
              iconColor = "text-red-500 bg-red-50 dark:bg-red-950/20";
            }

            return (
              <div
                key={n.id}
                className={`p-5 flex gap-4 transition-colors ${
                  !n.is_read ? "bg-teal-50/10 dark:bg-teal-900/5" : ""
                }`}
              >
                {/* Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center ${iconColor}`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-sm ${!n.is_read ? "font-bold text-zinc-900 dark:text-white" : "font-semibold text-zinc-700 dark:text-zinc-300"}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap shrink-0 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-words">
                    {n.message}
                  </p>
                  
                  {n.link && (
                    <div className="pt-2">
                      <Link
                        href={n.link}
                        onClick={() => handleMarkRead(n.id)}
                        className="inline-flex items-center text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors"
                      >
                        En savoir plus →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-between items-end gap-3 shrink-0">
                  {!n.is_read ? (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      title="Marquer comme lu"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-6 h-6" /> // Placeholder
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-zinc-400 hover:text-red-650 transition-colors"
                    title="Supprimer la notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
