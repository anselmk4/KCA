"use client";

import { useEffect, useState } from "react";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { ShieldAlert, TrendingUp } from "lucide-react";
import Link from "next/link";
import BaseCommunityPage from "@/app/(dashboard)/dashboard/community/page";

export default function InstructorCommunityPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlan() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", user.id)
            .single();
          
          const plan = profile?.plan || getSimulatedSession()?.plan || "FREE";
          setCurrentPlan(plan);
        }
      } catch (err) {
        console.error("Error checking plan in community wrapper:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, []);

  const isFreePlan = currentPlan === "FREE";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in relative">
      
      {/* Overlay Banner for FREE plan */}
      {isFreePlan && (
        <div className="bg-gradient-to-br from-amber-600 to-red-600 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 z-30 animate-in slide-in-from-top-4 duration-500 text-left">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-2xl shrink-0">
              <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg md:text-xl">Communauté Verrouillée</h3>
              <p className="text-xs md:text-sm text-white/90 max-w-xl leading-relaxed font-medium">
                Le forum communautaire et le partage d&apos;activité sont réservés aux formateurs ayant souscrit au <span className="font-semibold underline">Plan Base (19$/mois)</span> ou supérieur. Passez au plan supérieur pour échanger avec vos pairs et animer vos cours !
              </p>
            </div>
          </div>
          <Link
            href="/instructor/billing"
            className="px-6 py-3 bg-white text-red-650 hover:bg-zinc-50 font-black text-xs rounded-xl shadow-lg transition-all text-center whitespace-nowrap cursor-pointer shrink-0"
          >
            Débloquer la Communauté
          </Link>
        </div>
      )}

      {/* Main Content Area (greyed out if Free plan) */}
      <div className={`transition-all duration-300 ${isFreePlan ? "opacity-35 pointer-events-none select-none filter blur-[0.5px]" : ""}`}>
        <BaseCommunityPage />
      </div>
    </div>
  );
}
