"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Gift,
  TrendingUp,
  Star,
  ExternalLink,
  Search,
  Loader2,
  Share2,
  Trophy,
  UserCheck,
} from "lucide-react";

interface AffiliateUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Affiliate {
  id: string;
  pointsAwarded: number;
  joinedAt: string;
  user: AffiliateUser;
}

interface AffiliateData {
  referralCode: string;
  referralLink: string;
  totalPoints: number;
  totalAffiliates: number;
  affiliates: Affiliate[];
}

export default function InstructorAffiliatePage() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors du chargement");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyLink = async () => {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const filteredAffiliates = (data?.affiliates || []).filter(
    (a) =>
      a.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const POINTS_LEVELS = [
    { label: "Bronze", threshold: 0, icon: "🥉", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/20" },
    { label: "Argent", threshold: 50, icon: "🥈", color: "text-zinc-500", bg: "bg-zinc-50 dark:bg-zinc-800/50" },
    { label: "Or", threshold: 150, icon: "🥇", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
    { label: "Platine", threshold: 500, icon: "💎", color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/20" },
  ];

  const currentLevel = POINTS_LEVELS.reduce((best, lvl) => {
    return (data?.totalPoints || 0) >= lvl.threshold ? lvl : best;
  }, POINTS_LEVELS[0]);

  const nextLevel = POINTS_LEVELS.find((lvl) => (data?.totalPoints || 0) < lvl.threshold);
  const progressToNext = nextLevel
    ? Math.min(100, (((data?.totalPoints || 0) - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100)
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm text-zinc-500">Chargement de votre programme d'affiliation…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{error}</p>
          <button onClick={loadData} className="text-xs text-teal-600 underline cursor-pointer">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-teal-500" />
            Programme d&apos;affiliation
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Partagez votre lien unique et gagnez des points pour chaque nouvel inscrit.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-teal-600">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Affiliés</span>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{data?.totalAffiliates || 0}</p>
          <p className="text-[10px] text-zinc-400">utilisateurs inscrits via votre lien</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-yellow-500">
            <Star className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Points</span>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{data?.totalPoints || 0}</p>
          <p className="text-[10px] text-zinc-400">10 pts par affilié inscrit</p>
        </div>

        <div className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-2 ${currentLevel.bg}`}>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Niveau</span>
          </div>
          <p className={`text-2xl font-extrabold ${currentLevel.color}`}>
            {currentLevel.icon} {currentLevel.label}
          </p>
          {nextLevel && (
            <div className="space-y-1">
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${progressToNext}%` }} />
              </div>
              <p className="text-[10px] text-zinc-400">{nextLevel.threshold - (data?.totalPoints || 0)} pts → {nextLevel.icon} {nextLevel.label}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-500">
            <Gift className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Votre code</span>
          </div>
          <p className="text-xl font-extrabold text-zinc-900 dark:text-white font-mono tracking-widest">
            {data?.referralCode || "—"}
          </p>
          <p className="text-[10px] text-zinc-400">code unique partageable</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-700 dark:to-teal-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="w-5 h-5 opacity-80" />
          <h2 className="font-bold text-base">Votre lien d&apos;affiliation</h2>
        </div>
        <p className="text-sm text-teal-100 mb-4">
          Partagez ce lien à vos contacts. Chaque personne qui s&apos;inscrit via ce lien vous rapportera <strong>10 points</strong>.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0 bg-teal-800/40 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-2 border border-teal-400/30">
            <ExternalLink className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="text-sm text-teal-100 truncate font-mono">{data?.referralLink}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-white text-teal-700 hover:bg-teal-50"
            }`}
          >
            {copied ? (
              <><CheckCircle2 className="w-4 h-4" /> Copié !</>
            ) : (
              <><Copy className="w-4 h-4" /> Copier le lien</>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: "Partager sur WhatsApp", color: "bg-green-500 hover:bg-green-600", href: `https://wa.me/?text=${encodeURIComponent("Rejoins-moi sur Ansella ! " + (data?.referralLink || ""))}` },
            { label: "Partager sur Twitter", color: "bg-sky-500 hover:bg-sky-600", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent("Rejoins-moi sur Ansella et apprends en ligne ! " + (data?.referralLink || ""))}` },
            { label: "Partager sur LinkedIn", color: "bg-blue-700 hover:bg-blue-800", href: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data?.referralLink || "")}` },
          ].map((btn) => (
            <a
              key={btn.label}
              href={btn.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white ${btn.color} transition-colors cursor-pointer`}
            >
              {btn.label}
            </a>
          ))}
        </div>
      </div>

      {/* Affiliates Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-500" />
              Mes affiliés ({data?.totalAffiliates || 0})
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">Liste des utilisateurs inscrits via votre lien</p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs w-48 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        {filteredAffiliates.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-teal-400" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">Aucun affilié pour l&apos;instant</p>
              <p className="text-sm text-zinc-400 mt-1 max-w-xs">
                {searchQuery
                  ? "Aucun résultat pour cette recherche."
                  : "Partagez votre lien d'affiliation pour commencer à recevoir des inscrits et accumuler des points."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 px-5 py-2.5 bg-zinc-50/70 dark:bg-zinc-800/50 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                <div className="col-span-5">Utilisateur</div>
                <div className="col-span-3 text-center">Rôle</div>
                <div className="col-span-2 text-center">Points</div>
                <div className="col-span-2 text-right">Date</div>
              </div>
              <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {filteredAffiliates.map((affiliate) => {
                  const initials = affiliate.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2);
                  const date = new Date(affiliate.joinedAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={affiliate.id}
                      className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{affiliate.user.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{affiliate.user.email}</p>
                        </div>
                      </div>
                      <div className="col-span-3 flex justify-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          affiliate.user.role === "INSTRUCTOR"
                            ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        }`}>
                          {affiliate.user.role === "INSTRUCTOR" ? "Formateur" : "Apprenant"}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-400">
                          <Star className="w-3 h-3" />
                          +{affiliate.pointsAwarded}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[10px] text-zinc-400">{date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="font-bold text-zinc-900 dark:text-white text-base mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-500" />
          Comment fonctionne l&apos;affiliation ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              icon: "🔗",
              title: "Partagez votre lien",
              desc: "Copiez votre lien d'affiliation unique et partagez-le à vos contacts, sur vos réseaux, dans votre contenu.",
            },
            {
              step: "2",
              icon: "👤",
              title: "Ils s'inscrivent",
              desc: "Quand une personne s'inscrit sur Ansella en passant par votre lien, elle est automatiquement liée à votre compte.",
            },
            {
              step: "3",
              icon: "⭐",
              title: "Vous gagnez des points",
              desc: "Chaque inscription validée via votre lien vous rapporte 10 points. Plus d'inscrits = plus de points = meilleur niveau.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2"
            >
              <div className="text-2xl">{item.icon}</div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {item.step}
                </span>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{item.title}</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
