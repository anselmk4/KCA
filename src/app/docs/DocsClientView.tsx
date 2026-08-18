"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  Users,
  CreditCard,
  Award,
  Video,
  FileCode,
  ShieldCheck,
  Zap,
  Globe,
  Coins,
  ArrowRight,
  HelpCircle,
  Clock,
  Laptop,
  ChevronRight,
  Share2,
  FolderTree,
  DollarSign,
  TrendingUp,
  Lock,
  Layers,
  Send,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

interface DocSection {
  id: string;
  title: string;
  badge: string;
  icon: any;
  summary: string;
  content: {
    steps: {
      num: number;
      title: string;
      desc: string;
      tip?: string;
    }[];
    illustrationMockup: {
      headline: string;
      tags: string[];
      details: string[];
    };
    proTip: string;
  };
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "1. Prise en Main & Espace Formateur",
    badge: "Fondations",
    icon: Laptop,
    summary:
      "Configurez votre académie, personnalisez votre profil enseignant et découvrez les indicateurs clés du tableau de bord.",
    content: {
      steps: [
        {
          num: 1,
          title: "Accéder au Tableau de bord Formateur",
          desc: "Connectez-vous à votre compte et cliquez sur « Tableau de bord » ou « Mode Formateur ». Votre espace centralise vos cours, vos revenus en temps réel et le suivi de vos apprenants.",
          tip: "Vérifiez que votre rôle dans le profil est bien défini sur INSTRUCTOR.",
        },
        {
          num: 2,
          title: "Personnaliser votre Profil & Marque",
          desc: "Renseignez le nom de votre Académie (ex: « Ansella AI Institute »), votre biographie d'expert, vos spécialités clés, liens de réseaux sociaux et votre photo de profil.",
          tip: "Un profil complété à 100% inspire confiance aux acheteurs et augmente le taux de conversion.",
        },
        {
          num: 3,
          title: "Suivre vos Métriques en Direct",
          desc: "Visualisez le volume de ventes brutes ($ USD), le nombre d'inscriptions actives, le taux de complétion moyen et les avis de vos étudiants sur vos formations.",
        },
      ],
      illustrationMockup: {
        headline: "Tableau de Bord & KPIs Formateur",
        tags: ["Revenus en Direct", "Inscriptions", "Taux de Réussite", "Alertes"],
        details: [
          "Graphique d'évolution des ventes mensuelles (Mobile Money, Cartes, Crypto)",
          "Liste des étudiants récemment inscrits avec barre de progression",
          "Bouton rapide « Créer un nouveau cours »",
        ],
      },
      proTip:
        "💡 Vous pouvez basculer à tout moment entre votre vue Formateur et votre vue Apprenant pour tester vos formations en conditions réelles.",
    },
  },
  {
    id: "course-creation",
    title: "2. Création & Structuration des Cours",
    badge: "Pédagogie",
    icon: FolderTree,
    summary:
      "Concevez des parcours d'apprentissage complets avec chapitres, leçons vidéo YouTube/Vimeo, blocs de texte enrichi et pièces jointes.",
    content: {
      steps: [
        {
          num: 1,
          title: "Lancer le Wizard de Création",
          desc: "Cliquez sur « Nouveau Cours ». Renseignez le titre accrocheur, le domaine d'expertise, le niveau cible (Débutant à Expert) et la langue de dispensation (Français par défaut).",
        },
        {
          num: 2,
          title: "Organiser en Modules & Chapitres",
          desc: "Découpez votre formation en sections logiques (ex: « Module 1 : Fondations », « Module 2 : Mise en Pratique »). Vous pouvez réordonner vos modules en un clic.",
        },
        {
          num: 3,
          title: "Ajouter des Leçons Vidéos & Contenus Riches",
          desc: "Dans chaque leçon, intégrez vos vidéos (YouTube avec cover officiel, Vimeo ou MP4 direct). Utilisez le Studio WYSIWYG pour insérer du texte formaté, du code avec coloration syntaxique et des fichiers téléchargeables (PDF, ZIP).",
          tip: "Vos vidéos YouTube conservent leur miniature officielle tout en bénéficiant du lecteur optimisé de la plateforme.",
        },
      ],
      illustrationMockup: {
        headline: "Studio d'Édition de Cours Modulaire",
        tags: ["Sections & Leçons", "Vidéos YouTube/Vimeo", "Blocs TipTap", "Ressources PDF"],
        details: [
          "Arborescence latérale des chapitres avec durée totale estimée",
          "Éditeur de leçon TipTap (Gras, Titres H2/H3, Blocs de Code, Images)",
          "Aperçu instantané du lecteur étudiant via le bouton « Preview »",
        ],
      },
      proTip:
        "🚀 Ajoutez toujours une ressource téléchargeable (fiche résumé ou code source) par module pour maximiser l'engagement des apprenants.",
    },
  },
  {
    id: "ai-assistant",
    title: "3. Assistance par Intelligence Artificielle",
    badge: "Innovation",
    icon: Sparkles,
    summary:
      "Générez automatiquement la structure complète de votre cours, les résumés de leçons et des banques de questions QCM grâce à l'IA intégrée.",
    content: {
      steps: [
        {
          num: 1,
          title: "Générateur de Syllabus & Structure",
          desc: "Indiquez le sujet de votre cours (ex: « Maîtriser Python pour les Smart Contracts ») et le nombre de chapitres souhaité. L'IA génère instantanément tous vos modules et les titres de leçons.",
        },
        {
          num: 2,
          title: "Rédaction Assistée de Contenu de Leçon",
          desc: "Dans l'éditeur de leçon, cliquez sur « Rédiger avec l'IA ». L'assistant crée un plan détaillé, les explications théoriques, des exemples concrets et des exercices pratiques.",
        },
        {
          num: 3,
          title: "Générateur Automatique de Quiz QCM",
          desc: "Précisez le niveau de difficulté (Facile, Moyen, Difficile) et le nombre de questions. L'IA génère des questions à choix multiples avec 4 options, la bonne réponse et les explications.",
        },
      ],
      illustrationMockup: {
        headline: "Moteur IA Pédagogique ANSELLA",
        tags: ["Syllabus IA", "Contenu Automatisé", "QCM & Examens IA"],
        details: [
          "Génération en 3 secondes d'un programme de formation complet",
          "Adaptation au contexte professionnel et africain / international",
          "Export direct dans vos modules de cours sans ressaisie",
        ],
      },
      proTip:
        "⚡ L'IA vous fait gagner jusqu'à 80% du temps de préparation. Vous pouvez éditer et enrichir chaque contenu généré selon votre propre style pédagogique.",
    },
  },
  {
    id: "quizzes-homework",
    title: "4. Évaluations, Quiz QCM & Devoirs",
    badge: "Certification",
    icon: CheckCircle2,
    summary:
      "Validez l'acquisition des compétences de vos étudiants avec des quiz chronométrés, des seuils de réussite et des devoirs notés.",
    content: {
      steps: [
        {
          num: 1,
          title: "Créer un Quiz de Module ou d'Examen Final",
          desc: "Associez un quiz à la fin de chaque chapitre ou définissez un examen final global. Définissez le pourcentage minimum de validation (ex: 70% ou 80%).",
        },
        {
          num: 2,
          title: "Composer vos Questions & Réponses",
          desc: "Ajoutez manuellement vos questions ou utilisez le générateur IA. Définissez la bonne réponse et fournissez un retour explicatif pour chaque choix.",
        },
        {
          num: 3,
          title: "Attribuer et Corriger des Devoirs",
          desc: "Pour les cours encadrés, créez des devoirs pratiques avec date limite (deadline). Les apprenants téléversent leurs fichiers de travail et reçoivent vos annotations.",
        },
      ],
      illustrationMockup: {
        headline: "Centre d'Évaluation & Scoring",
        tags: ["Quiz QCM", "Seuil 70%", "Tentatives Illimitées / Limitées", "Devoirs Pratiques"],
        details: [
          "Calcul automatique du score en temps réel dès la soumission",
          "Déverrouillage conditionnel des modules suivants en cas de réussite",
          "Rapports de performance individuels et statistiques de promotion",
        ],
      },
      proTip:
        "🎯 Un seuil de réussite de 70% est le standard recommandé pour garantir la valeur académique de vos certificats de fin de formation.",
    },
  },
  {
    id: "collaborators",
    title: "5. Co-gestion & Rôles Collaborateurs",
    badge: "Collaboration",
    icon: Users,
    summary:
      "Déléguez la création et la modification de contenus à vos assistants pédagogiques, tout en protégeant l'intégrité de vos cours.",
    content: {
      steps: [
        {
          num: 1,
          title: "Inviter un Co-gestionnaire",
          desc: "Dans l'onglet « Collaborateurs » de votre cours, saisissez l'email de votre collègue ou assistant pédagogique enregistré sur ANSELLA et cliquez sur « Ajouter ».",
        },
        {
          num: 2,
          title: "Droits Accordés aux Collaborateurs",
          desc: "Les collaborateurs peuvent créer et éditer des sections, leçons, quiz, questions et devoirs. Ils peuvent également suivre la progression des apprenants.",
        },
        {
          num: 3,
          title: "Sécurité & Protection contre la Suppression",
          desc: "Les collaborateurs ne peuvent JAMAIS supprimer de sections, leçons, quiz ou devoirs. Seul le formateur propriétaire principal possède le droit de suppression.",
        },
      ],
      illustrationMockup: {
        headline: "Système de Permissions Granulaire (RBAC)",
        tags: ["Propriétaire : Contrôle Total", "Collaborateur : Création & Édition", "Suppression Verrouillée"],
        details: [
          "Liste des co-gestionnaires assignés avec bouton de révocation rapide",
          "Protection API 403 Forbidden sur toutes les routes de suppression destructives",
          "Journal d'audit des modifications de contenu",
        ],
      },
      proTip:
        "🔒 Idéal pour faire intervenir des tuteurs, assistants de travaux pratiques ou co-auteurs sans risquer l'effacement accidentel de votre programme.",
    },
  },
  {
    id: "languages",
    title: "6. Gestion Multilingue des Formations",
    badge: "International",
    icon: Globe,
    summary:
      "Proposez vos cours en Français, Anglais, Espagnol, Portugais, Arabe ou Swahili et permettez aux apprenants de filtrer le catalogue par langue.",
    content: {
      steps: [
        {
          num: 1,
          title: "Définition de la Langue Principale",
          desc: "Lors de la création du cours ou dans l'onglet « Description », sélectionnez la langue de dispensation parmi les options proposées (🇫🇷 Français par défaut, 🇬🇧 Anglais, 🇪🇸 Espagnol, 🇵🇹 Portugais, 🇸🇦 Arabe, 🇰🇪 Swahili).",
        },
        {
          num: 2,
          title: "Affichage du Badge sur le Catalogue Public",
          desc: "Chaque carte de formation affiche le badge de langue officiel (ex: 🇫🇷 FR, 🇬🇧 EN), permettant aux étudiants de repérer immédiatement la langue d'enseignement.",
        },
        {
          num: 3,
          title: "Filtrage Instantané pour les Étudiants",
          desc: "Les apprenants peuvent filtrer le catalogue complet `/courses` en un clic selon leur langue maternelle ou de travail.",
        },
      ],
      illustrationMockup: {
        headline: "Catalogue Multilingue & Filtres Régionaux",
        tags: ["🇫🇷 Français (Défaut)", "🇬🇧 English", "🇪🇸 Español", "🇵🇹 Português", "🇰🇪 Swahili"],
        details: [
          "Boutons de filtre par langue instantanés sur la page publique",
          "Compatibilité avec les marchés panafricains francophones et anglophones",
          "Badge distinctif intégré sur chaque vignette de formation",
        ],
      },
      proTip:
        "🌍 Si vous maîtrisez l'anglais ou le swahili, dupliquez vos formations phares dans une seconde langue pour doubler votre audience sur les marchés d'Afrique de l'Est et anglophone.",
    },
  },
  {
    id: "monetization-payments",
    title: "7. Monétisation & Passerelles de Paiement",
    badge: "Finances",
    icon: Coins,
    summary:
      "Vendez vos cours avec les moyens de paiement préférés en Afrique et dans le monde : Mobile Money, Crypto Solana/USDC, Cartes et Paiements échelonnés.",
    content: {
      steps: [
        {
          num: 1,
          title: "Définir votre Modèle Tarifaire",
          desc: "Choisissez si votre formation est 100% Gratuite ($0) pour développer votre communauté, ou Payante avec fixation libre de votre tarif en Dollars ($ USD).",
        },
        {
          num: 2,
          title: "Autoriser le Paiement par Tranches (Installments)",
          desc: "Pour les programmes premium, activez le paiement en 2x, 3x ou 4x mensualités. Les apprenants débloquent les modules au fur et à mesure de leurs règlements.",
        },
        {
          num: 3,
          title: "Passerelles de Paiement Intégrées",
          desc: "Vos étudiants peuvent régler via Mobile Money panafricain (M-Pesa, Wave, Orange Money, MTN MoMo, Airtel), Cryptomonnaies décentralisées (USDC, Solana, Bitcoin) ou Cartes Visa/Mastercard.",
        },
      ],
      illustrationMockup: {
        headline: "Passerelles Multi-Devises & Mobile Money",
        tags: ["M-Pesa", "Wave", "Orange Money", "MTN MoMo", "Crypto USDC", "Cartes Bancaires"],
        details: [
          "Conversion automatique du tarif en devise locale lors du paiement",
          "Validation instantanée des transactions par webhook sécurisé",
          "Factures et reçus téléchargeables automatiquement émis",
        ],
      },
      proTip:
        "💳 Les paiements par tranches augmentent les inscriptions de 40% sur les formations à plus de 100$, en levant le frein du règlement comptant.",
    },
  },
  {
    id: "certificates-linkedin",
    title: "8. Certifications Infalsifiables & Partage LinkedIn",
    badge: "Accréditation",
    icon: Award,
    summary:
      "Délivrez des certificats d'excellence officiels infalsifiables avec QR Code de vérification publique et bouton d'ajout en 1 clic sur LinkedIn.",
    content: {
      steps: [
        {
          num: 1,
          title: "Émission Automatique du Certificat",
          desc: "Dès qu'un apprenant valide 100% de ses leçons et réussit l'examen final (score ≥ seuil), son certificat numérique officiel est généré instantanément.",
        },
        {
          num: 2,
          title: "QR Code & Vérification Publique en Ligne",
          desc: "Chaque certificat possède un code unique (ex: ANS-2026-X8K9L2) et un QR Code menant à la page de vérification publique `/verify/[code]`. Les recruteurs peuvent ainsi attester de l'authenticité du diplôme.",
        },
        {
          num: 3,
          title: "Intégration Directe « Add to LinkedIn »",
          desc: "Les diplômés cliquent sur le bouton « Ajouter à mon profil LinkedIn » pour inscrire automatiquement leur certification dans la section « Licences & Certifications » de leur compte LinkedIn.",
        },
      ],
      illustrationMockup: {
        headline: "Certificat Professionnel Numérique ANSELLA",
        tags: ["QR Code Officiel", "Page /verify", "Bouton LinkedIn", "Export PDF Haute Résolution"],
        details: [
          "Nom du diplômé, titre de la formation et nom de votre académie",
          "Date d'obtention et signature officielle du formateur",
          "Augmentation de la visibilité virale de votre académie sur LinkedIn",
        ],
      },
      proTip:
        "🎓 Chaque certificat partagé sur LinkedIn par un étudiant affiche le nom de votre académie et attire de nouveaux apprenants qualifiés gratuitement.",
    },
  },
  {
    id: "community-social",
    title: "9. Espace Communauté & Réseau Social",
    badge: "Engagement",
    icon: MessageSquare,
    summary:
      "Interagissez avec vos apprenants grâce à un fil d'actualité moderne, des publications enrichies, des réactions multiples et un système d'abonnés (Following).",
    content: {
      steps: [
        {
          num: 1,
          title: "Publier du Contenu d'Expertise",
          desc: "Partagez des analyses, astuces de code, ressources exclusives ou annonces de sessions live directement sur le fil communautaire `/dashboard/community`.",
        },
        {
          num: 2,
          title: "Système de Following & Abonnés",
          desc: "Les apprenants peuvent s'abonner à votre profil en 1 clic grâce au bouton « Suivre ». Ils retrouvent vos posts dans leur onglet personnalisé « ⭐ Mes Abonnements ».",
        },
        {
          num: 3,
          title: "Réactions & Fils de Discussion",
          desc: "Les membres réagissent à vos publications avec des émoticônes variées (❤️ J'aime, 💡 Instructif, 🚀 Inspirant, 👏 Bravo) et posent leurs questions en commentaire.",
        },
      ],
      illustrationMockup: {
        headline: "Fil Social Pédagogique & Interactions",
        tags: ["Fil d'Actualité", "Système d'Abonnement", "Badge Formateur Vérifié", "Fils de Réponses"],
        details: [
          "Badge distinctif doré « Formateur Vérifié » sur vos messages",
          "Widget latéral « Formateurs recommandés » pour accroître votre base d'abonnés",
          "Classement des meilleurs contributeurs de l'académie",
        ],
      },
      proTip:
        "💬 Répondre rapidement aux questions des étudiants sur la communauté renforce votre réputation et fidélise vos apprenants pour vos futurs cours.",
    },
  },
  {
    id: "payouts-earnings",
    title: "10. Retraits de Revenus & Payouts",
    badge: "Revenus",
    icon: TrendingUp,
    summary:
      "Suivez vos commissions nettes et demandez vos virements de gains directement vers votre compte Mobile Money, Crypto ou bancaire.",
    content: {
      steps: [
        {
          num: 1,
          title: "Consulter vos Gains Disponibles",
          desc: "Rendez-vous dans `/instructor/earnings` pour suivre vos ventes brutes, les commissions de la plateforme et votre solde disponible pour retrait.",
        },
        {
          num: 2,
          title: "Configurer vos Coordonnées de Paiement",
          desc: "Renseignez votre numéro Mobile Money (M-Pesa, Wave, Orange Money, MTN MoMo), votre adresse de portefeuille Crypto (USDC Solana/USDT) ou vos coordonnées bancaires.",
        },
        {
          num: 3,
          title: "Soumettre une Demande de Retrait (Payout)",
          desc: "Cliquez sur « Demander un retrait », indiquez le montant souhaité. Votre demande est traitée par le service financier dans un délai de 24 à 48 heures.",
        },
      ],
      illustrationMockup: {
        headline: "Espace Financier & Demandes de Payout",
        tags: ["Virements Mobile Money", "Retraits Crypto", "Relevés de Compte", "Traitement 24-48h"],
        details: [
          "Historique complet de toutes vos transactions avec reçus",
          "Tableau des demandes de retrait (En attente, Payé, Traité)",
          "Zéro frais cachés : transparence totale sur les commissions",
        ],
      },
      proTip:
        "💰 Les retraits en Crypto (USDC Solana) sont les plus rapides et évitent les frais de change internationaux pour les formateurs nomades.",
    },
  },
];

export function DocsClientView() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const activeSection = useMemo(() => {
    return DOC_SECTIONS.find((s) => s.id === selectedSectionId) || DOC_SECTIONS[0];
  }, [selectedSectionId]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOC_SECTIONS;
    const q = searchQuery.toLowerCase().trim();
    return DOC_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.content.steps.some(
          (st) => st.title.toLowerCase().includes(q) || st.desc.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

  return (
    <main className="flex-1 py-16 md:py-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-teal-500/5 dark:bg-teal-500/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-10 relative z-10">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 text-teal-600 dark:text-teal-400 mx-auto">
            <BookOpen className="w-3.5 h-3.5" />
            Centre de Documentation Formateurs
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
            Le Guide Officiel du{" "}
            <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 bg-clip-text text-transparent">
              Formateur ANSELLA
            </span>
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Retrouvez toutes les explications, astuces techniques et démarches pas à pas pour créer,
            animer et monétiser vos formations en ligne avec succès.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto pt-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une fonctionnalité (ex: IA, Mobile Money, Quiz, Certificat, Collaborateur)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs sm:text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Documentation Layout: Sidebar (4 cols) & Detail View (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm sticky top-24 space-y-1.5 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-2">
                Sommaire des Modules
              </p>
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isSelected = selectedSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-teal-600 text-white shadow-md shadow-teal-500/20 scale-[1.01]"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-teal-500"}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? "text-white translate-x-0.5" : "text-zinc-400 opacity-50"}`} />
                  </button>
                );
              })}

              {/* Fast Action CTA Box */}
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 p-3 bg-gradient-to-br from-teal-500/10 to-indigo-500/10 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Prêt à enseigner ?</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Créez votre premier cours en moins de 5 minutes avec l'aide de l'IA.
                </p>
                <Link
                  href="/instructor/courses"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>Créer mon premier cours</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content Detail Area */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div
              key={activeSection.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8"
            >
              {/* Section Header */}
              <div className="space-y-3 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    {activeSection.badge}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white leading-snug">
                  {activeSection.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {activeSection.summary}
                </p>
              </div>

              {/* Visual Mockup Illustration Card */}
              <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 pl-2">
                      ansella.app/instructor
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
                    Aperçu Interface
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-base sm:text-lg font-extrabold text-white">
                    {activeSection.content.illustrationMockup.headline}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSection.content.illustrationMockup.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/10 text-teal-300 border border-white/10"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-300 pt-2">
                    {activeSection.content.illustrationMockup.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-teal-400 font-bold">▸</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="space-y-6">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                  <span>Étapes de configuration pas à pas</span>
                </h3>

                <div className="space-y-4">
                  {activeSection.content.steps.map((step) => (
                    <div
                      key={step.num}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/50 border border-zinc-100 dark:border-zinc-800 space-y-2 hover:border-teal-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {step.num}
                        </span>
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-10">
                        {step.desc}
                      </p>
                      {step.tip && (
                        <div className="ml-10 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-800 dark:text-teal-300 font-medium">
                          💡 <strong>Conseil :</strong> {step.tip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-indigo-500/10 border border-teal-500/20 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-semibold">
                {activeSection.content.proTip}
              </div>

              {/* Navigation between doc modules */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    const currentIndex = DOC_SECTIONS.findIndex((s) => s.id === selectedSectionId);
                    if (currentIndex > 0) {
                      setSelectedSectionId(DOC_SECTIONS[currentIndex - 1].id);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }
                  }}
                  disabled={DOC_SECTIONS.findIndex((s) => s.id === selectedSectionId) === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all cursor-pointer"
                >
                  ← Module Précédent
                </button>

                <button
                  onClick={() => {
                    const currentIndex = DOC_SECTIONS.findIndex((s) => s.id === selectedSectionId);
                    if (currentIndex < DOC_SECTIONS.length - 1) {
                      setSelectedSectionId(DOC_SECTIONS[currentIndex + 1].id);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }
                  }}
                  disabled={
                    DOC_SECTIONS.findIndex((s) => s.id === selectedSectionId) ===
                    DOC_SECTIONS.length - 1
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs disabled:opacity-30 transition-all cursor-pointer"
                >
                  Module Suivant →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
