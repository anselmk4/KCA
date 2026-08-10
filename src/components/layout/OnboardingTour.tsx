"use client";

import { useEffect, useState } from "react";
import { 
  X, Check, ChevronRight, ChevronLeft, 
  HelpCircle, BookOpen, Compass, Video, 
  CreditCard, Award, Users, LifeBuoy, 
  LayoutDashboard, Ticket, BarChart3, Wallet,
  MessageSquare, Settings, Users2, Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface TourStep {
  title: string;
  description: string;
  menuLabel: string;
  icon: React.ReactNode;
}

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch user's role from user_roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id);

      let detectedRole: "STUDENT" | "INSTRUCTOR" = "STUDENT";
      if (userRoles && userRoles.length > 0) {
        const roleNames = userRoles.map((ur: any) => ur.roles?.name);
        if (roleNames.includes("INSTRUCTOR")) {
          detectedRole = "INSTRUCTOR";
        }
      }
      setRole(detectedRole);

      // Check if onboarding is completed
      const isCompleted = localStorage.getItem(`ansella_onboarding_completed_${user.id}_${detectedRole}`);
      if (!isCompleted) {
        setIsOpen(true);
      }
    }
    checkOnboarding();
  }, []);

  const studentSteps: TourStep[] = [
    {
      title: "Bienvenue sur Ansella !",
      description: "Nous sommes ravis de vous compter parmi nous. Voici un petit guide pour prendre en main votre espace d'apprentissage en quelques instants.",
      menuLabel: "Introduction",
      icon: <Sparkles className="w-6 h-6 text-blue-500" />,
    },
    {
      title: "Vue d'ensemble",
      description: "Accédez à un résumé global de votre progression, vos cours récemment consultés et vos statistiques d'apprentissage.",
      menuLabel: "Vue d'ensemble",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: "Découvrir",
      description: "Parcourez notre catalogue de formations disponibles pour vous inscrire à de nouveaux cours.",
      menuLabel: "Découvrir",
      icon: <Compass className="w-5 h-5" />,
    },
    {
      title: "Mes Formations",
      description: "Retrouvez ici tous les cours auxquels vous êtes inscrit pour continuer vos leçons.",
      menuLabel: "Mes Formations",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      title: "Sessions Live",
      description: "Planifiez et rejoignez les sessions de cours en direct animées par vos formateurs.",
      menuLabel: "Session Live",
      icon: <Video className="w-5 h-5" />,
    },
    {
      title: "Paiements",
      description: "Consultez l'historique de vos achats, téléchargez vos factures et suivez vos versements.",
      menuLabel: "Paiements",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: "Certificats",
      description: "Une fois un cours complété à 100% et vos quiz validés, générez et téléchargez vos certificats officiels et vérifiables ici.",
      menuLabel: "Certificats",
      icon: <Award className="w-5 h-5" />,
    },
    {
      title: "Communauté",
      description: "Échangez avec les autres apprenants et les formateurs de la plateforme sur le forum interactif.",
      menuLabel: "Communauté",
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: "Support Technique",
      description: "Une question ou un blocage ? Ouvrez un ticket de support directement auprès de notre équipe d'assistance.",
      menuLabel: "Support Technique",
      icon: <LifeBuoy className="w-5 h-5" />,
    },
  ];

  const instructorSteps: TourStep[] = [
    {
      title: "Bienvenue sur Ansella !",
      description: "Nous sommes ravis de vous compter parmi nos formateurs. Ce guide rapide va vous présenter les outils mis à votre disposition pour gérer et vendre vos formations.",
      menuLabel: "Introduction",
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
    },
    {
      title: "Tableau de Bord",
      description: "Visualisez en un clin d'œil les indicateurs clés de votre activité : revenus totaux, nombre d'inscriptions et statistiques de vente.",
      menuLabel: "Tableau de bord",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: "Mes Cours",
      description: "L'outil principal pour créer de nouvelles formations, structurer des chapitres, rédiger vos leçons et concevoir vos quiz d'évaluation.",
      menuLabel: "Mes cours",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      title: "Codes Promo / Coupons",
      description: "Générez des codes de réduction personnalisés pour vos campagnes marketing afin d'attirer plus d'étudiants.",
      menuLabel: "Codes promo / Coupons",
      icon: <Ticket className="w-5 h-5" />,
    },
    {
      title: "Étudiants",
      description: "Suivez la liste complète de vos inscrits, analysez leur avancement leçon par leçon et gardez le contact.",
      menuLabel: "Étudiants",
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: "Sessions Live",
      description: "Organisez des webinaires et cours interactifs en direct via Zoom, Teams, Meet ou notre outil intégré.",
      menuLabel: "Sessions live",
      icon: <Video className="w-5 h-5" />,
    },
    {
      title: "Analytique",
      description: "Analysez en détail le taux de complétion de vos cours et optimisez votre contenu pédagogique.",
      menuLabel: "Analytique",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: "Revenus",
      description: "Suivez le solde de vos gains accumulés, vos commissions Ansella et effectuez des demandes de reversement par Mobile Money ou Virement.",
      menuLabel: "Revenus",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      title: "Abonnement & Facturation",
      description: "Gérez votre abonnement formateur Ansella, consultez vos factures mensuelles et passez à un forfait supérieur.",
      menuLabel: "Abonnement",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: "Messages",
      description: "Communiquez directement en messagerie privée avec vos apprenants pour répondre à leurs questions.",
      menuLabel: "Messages",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      title: "Communauté",
      description: "Créez des publications sur le mur communautaire général pour animer et motiver votre audience.",
      menuLabel: "Communauté",
      icon: <Users2 className="w-5 h-5" />,
    },
  ];

  const steps = role === "INSTRUCTOR" ? instructorSteps : studentSteps;

  const handleClose = () => {
    if (userId && role) {
      localStorage.setItem(`ansella_onboarding_completed_${userId}_${role}`, "true");
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen || steps.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-350 font-sans">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden transition-all relative flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-450" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
              Guide de démarrage Ansella
            </h3>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="Fermer le guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!showAllSteps ? (
            /* Step-by-Step View */
            <div className="space-y-6 text-center py-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-900/30 shadow-sm">
                {steps[currentStep].icon}
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                  {steps[currentStep].title}
                </h4>
                <p className="text-zinc-650 dark:text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                  {steps[currentStep].description}
                </p>
              </div>

              {currentStep > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/50 rounded-full text-zinc-500 dark:text-zinc-400 text-[10px] font-bold">
                  Bouton de menu associé : <span className="text-zinc-850 dark:text-zinc-200 font-black font-sans">{steps[currentStep].menuLabel}</span>
                </div>
              )}
            </div>
          ) : (
            /* Show All Steps List View */
            <div className="space-y-4 pr-1 animate-in fade-in duration-300">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed border-b border-zinc-105 dark:border-zinc-850 pb-3">
                Voici le résumé complet de l&apos;utilité de chaque élément de votre barre latérale de navigation.
              </p>
              <div className="space-y-3">
                {steps.slice(1).map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border border-zinc-100 dark:border-zinc-800/55 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/20 dark:border-zinc-700 flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400">
                      {step.icon}
                    </div>
                    <div className="text-left">
                      <h5 className="font-bold text-xs text-zinc-900 dark:text-white mb-0.5">{step.title}</h5>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          {!showAllSteps ? (
            <>
              <button 
                onClick={handleClose} 
                className="text-zinc-450 hover:text-zinc-750 dark:hover:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Ignorer le guide
              </button>

              <div className="flex items-center gap-4">
                {/* Dots indicator */}
                <div className="flex gap-1.5 hidden sm:flex">
                  {steps.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentStep === idx ? "w-4.5 bg-blue-600" : "w-1.5 bg-zinc-350 dark:bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="p-2 border border-zinc-250 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-xl disabled:opacity-40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                    title="Précédent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={handleNext}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentStep === steps.length - 1 ? "Terminer" : "Suivant"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => setShowAllSteps(false)} 
                className="text-zinc-450 hover:text-zinc-750 dark:hover:text-zinc-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour au pas-à-pas
              </button>

              <button 
                onClick={handleClose}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10"
              >
                <Check className="w-4 h-4" />
                <span>J&apos;ai compris</span>
              </button>
            </>
          )}
        </div>

        {/* Toggle View mode header-button */}
        {!showAllSteps && (
          <button 
            onClick={() => setShowAllSteps(true)}
            className="absolute top-[21px] right-14 text-xs font-bold text-blue-600 hover:text-blue-500 dark:text-blue-450 hover:underline transition-all pr-2 border-r border-zinc-200 dark:border-zinc-800"
          >
            Tout afficher
          </button>
        )}
      </div>
    </div>
  );
}
