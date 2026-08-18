export interface CompetitorComparison {
  slug: string;
  name: string;
  metaTitle: string;
  metaDesc: string;
  tagline: string;
  heroSummary: string;
  pricingComparison: {
    ansella: string;
    competitor: string;
  };
  featuresTable: {
    feature: string;
    ansella: string | boolean;
    competitor: string | boolean;
    highlight?: boolean;
  }[];
  keyAdvantages: {
    title: string;
    desc: string;
  }[];
  verdict: string;
}

export const COMPETITORS_SEO: CompetitorComparison[] = [
  {
    slug: "teachable",
    name: "Teachable",
    metaTitle: "ANSELLA vs Teachable (2026) : Quelle Plateforme LMS Choisir en Afrique et Monde ?",
    metaDesc: "Comparatif complet ANSELLA vs Teachable. Découvrez pourquoi ANSELLA est la meilleure alternative avec Mobile Money natif, zéro frais cachés et certificats vérifiables.",
    tagline: "L'alternative moderne à Teachable conçue pour les marchés mondiaux et panafricains",
    heroSummary: "Alors que Teachable impose des frais de transaction élevés sur ses forfaits de base et ne supporte pas nativement les paiements par Mobile Money africains, ANSELLA offre une suite tout-en-un avec paiements locaux, cryptos, IA générative et certification sécurisée.",
    pricingComparison: {
      ansella: "Plan Base à 19$/m | Pro à 49$/m | Max à 200$/m (0% com)",
      competitor: "De 39$/m (+10% frais) à 119$/m (+5% frais) et 499$/m",
    },
    featuresTable: [
      { feature: "Paiements Mobile Money (M-Pesa, Wave, MTN, Orange, Airtel)", ansella: true, competitor: false, highlight: true },
      { feature: "Paiements Crypto (Solana USDC, Bitcoin)", ansella: true, competitor: false, highlight: true },
      { feature: "Paiements Cartes Visa, Mastercard & PayPal", ansella: true, competitor: true },
      { feature: "Certificats vérifiables en ligne avec QR Code", ansella: true, competitor: "Limité (Payant)" },
      { feature: "Génération de cours et quiz par Intelligence Artificielle", ansella: true, competitor: "Basique" },
      { feature: "Propriété totale des données élèves et contacts", ansella: true, competitor: true },
      { feature: "Support multi-devises (USD, EUR, CDF, FCFA, NGN, KES)", ansella: true, competitor: "Limité" },
      { feature: "Éditeur de contenu multimédia interactif par blocs", ansella: true, competitor: true },
    ],
    keyAdvantages: [
      {
        title: "Intégration Panafricaine Native",
        desc: "Encaissez instantanément vos élèves en RDC, Côte d'Ivoire, Sénégal, Cameroun, Kenya sans friction ni passerelle tierce complexe.",
      },
      {
        title: "Frais Réduits et Zéro Commission Cachée",
        desc: "Conservez le fruit de votre travail. Passez au plan Max pour 0% de commission sur vos ventes de cours.",
      },
      {
        title: "Diplômes Infalsifiables",
        desc: "Chaque diplôme généré par ANSELLA dispose d'un identifiant cryptographique et d'un QR code vérifiable mondialement par les recruteurs.",
      },
    ],
    verdict: "Si vous souhaitez vendre vos formations en Afrique et à l'international sans bloquer vos apprenants qui n'ont pas de carte de crédit internationale, ANSELLA est le choix incontestable face à Teachable.",
  },
  {
    slug: "udemy",
    name: "Udemy",
    metaTitle: "ANSELLA vs Udemy : Pourquoi Créer sa Propre Académie Indépendante ?",
    metaDesc: "Comparatif ANSELLA vs Udemy. Gardez 100% du contrôle sur vos prix, vos apprenants et encaissez par Mobile Money & Cartes sans promotions forcées.",
    tagline: "Libérez-vous des promotions forcées et possédez votre propre marque",
    heroSummary: "Sur Udemy, vous perdez le contrôle de vos tarifs (cours bradés à 9,99$) et Udemy conserve jusqu'à 63% de vos revenus sans vous donner les e-mails de vos apprenants. Avec ANSELLA, vous êtes propriétaire de votre académie, de vos prix et de votre audience.",
    pricingComparison: {
      ansella: "Vous fixez vos prix libres de 10$ à 1 000$+ et gardez jusqu'à 100%",
      competitor: "Udemy prend de 50% à 63% de commission sur chaque vente",
    },
    featuresTable: [
      { feature: "Propriété des e-mails et coordonnées des apprenants", ansella: true, competitor: false, highlight: true },
      { feature: "Liberté totale de tarification sans soldes imposées", ansella: true, competitor: false, highlight: true },
      { feature: "Paiement Mobile Money direct aux formateurs", ansella: true, competitor: false, highlight: true },
      { feature: "Nom d'académie personnalisé et image de marque", ansella: true, competitor: false },
      { feature: "Évaluations et examens surveillés par IA", ansella: true, competitor: false },
      { feature: "Vente de sessions de mentorat en direct", ansella: true, competitor: false },
      { feature: "Taux de rétention et communauté privée", ansella: true, competitor: "Limité" },
    ],
    keyAdvantages: [
      {
        title: "Construisez votre Propre Marque",
        desc: "Ne soyez plus un simple cours parmi 200 000 sur une place de marché. Développez votre propre réputation et marque personnelle.",
      },
      {
        title: "Revenus Récurrents et Marges Élevées",
        desc: "Vendez vos programmes à leur juste valeur (50$, 200$, 500$) au lieu d'être dévalué par des soldes constantes.",
      },
      {
        title: "Relation Directe avec vos Étudiants",
        desc: "Exportez vos listes d'inscrits, animez votre communauté et faites de l'upselling sur vos nouveaux programmes.",
      },
    ],
    verdict: "Udemy convient aux débutants cherchant une vitrine passive, mais ANSELLA est indispensable pour tout formateur sérieux voulant bâtir un véritable business d'éducation pérenne et rentable.",
  },
  {
    slug: "kajabi",
    name: "Kajabi",
    metaTitle: "ANSELLA vs Kajabi : L'Alternative LMS Moderne et Abordable",
    metaDesc: "Comparatif ANSELLA vs Kajabi. Une puissance pédagogique équivalente, 5 fois moins chère, avec support natif du Mobile Money africain et des Cryptos.",
    tagline: "La puissance d'une plateforme SaaS tout-en-un à un prix juste et accessible",
    heroSummary: "Kajabi est l'une des plateformes les plus chères du marché (dès 149$/mois), sans prise en charge des méthodes de paiement africaines. ANSELLA offre les mêmes fonctionnalités d'académie moderne dès 19$/mois.",
    pricingComparison: {
      ansella: "Dès 19$/m (ou 49$/m en Pro complet)",
      competitor: "Dès 149$/m à 399$/m (très onéreux)",
    },
    featuresTable: [
      { feature: "Tarif accessible pour créateurs émergents", ansella: "Dès 19$/mois", competitor: "Dès 149$/mois", highlight: true },
      { feature: "Support Mobile Money Panafricain", ansella: true, competitor: false, highlight: true },
      { feature: "Paiements Crypto Décentralisés (Solana / BTC)", ansella: true, competitor: false, highlight: true },
      { feature: "Certificats officiels infalsifiables avec QR Code", ansella: true, competitor: "Basique" },
      { feature: "Interface multilingue (Français & Anglais)", ansella: true, competitor: "Anglais dominant" },
      { feature: "Outils de création de cours assistés par IA", ansella: true, competitor: true },
    ],
    keyAdvantages: [
      {
        title: "5x Moins Cher pour un ROI Immédiat",
        desc: "Lancez votre académie sans risque financier majeur avec un abonnement mensuel ultra-compétitif.",
      },
      {
        title: "Adapté au Marché Global et Local",
        desc: "Kajabi ignore les spécificités du continent africain. ANSELLA est pensé dès le départ pour une couverture mondiale et locale.",
      },
      {
        title: "Expérience Apprenant Fluide",
        desc: "Lecteur vidéo haute vitesse sans interruption, compatible mobile et connexions à débit variable.",
      },
    ],
    verdict: "Pourquoi payer plus de 150$/mois quand ANSELLA vous offre une plateforme plus rapide, plus adaptée à vos marchés cibles et intégrant les paiements locaux ?",
  },
  {
    slug: "moodle",
    name: "Moodle",
    metaTitle: "ANSELLA vs Moodle : Pourquoi Choisir un LMS Cloud Moderne ?",
    metaDesc: "Comparatif ANSELLA vs Moodle. Dites adieu à la complexité des serveurs, des plugins obsolètes et des designs austères. ANSELLA est 100% Cloud et clé en main.",
    tagline: "Fini la maintenance de serveurs et les interfaces complexes des années 2000",
    heroSummary: "Moodle est un logiciel open-source lourd nécessitant des compétences techniques poussées, un serveur dédié, des mises à jour manuelles et des plugins complexes. ANSELLA est une solution SaaS moderne, prête à l'emploi en 3 minutes, hébergée sur le Cloud haute performance.",
    pricingComparison: {
      ansella: "Tout inclus (Hébergement, Sécurité, Mises à jour, CDN)",
      competitor: "Logiciel gratuit mais coûts élevés de serveur, infogérance et plugins",
    },
    featuresTable: [
      { feature: "Prêt à l'emploi en 3 minutes sans configuration serveur", ansella: true, competitor: false, highlight: true },
      { feature: "Design ultra-moderne et responsive 100% mobile", ansella: true, competitor: "Complexe / Austère", highlight: true },
      { feature: "Passerelles de paiement intégrées (Mobile Money, Stripe, PayPal)", ansella: true, competitor: "Nécessite plugins payants" },
      { feature: "Génération automatique d'examens et quiz par IA", ansella: true, competitor: false },
      { feature: "Vérification publique de certificat en 1 clic", ansella: true, competitor: "Configuration complexe" },
      { feature: "Sécurité et sauvegardes automatiques dans le Cloud", ansella: true, competitor: "À votre charge" },
    ],
    keyAdvantages: [
      {
        title: "Zéro Compétence Technique Requise",
        desc: "Concentrez-vous sur votre pédagogie et vos ventes, ANSELLA s'occupe de toute la technologie.",
      },
      {
        title: "Interface Sexy et Engaging",
        desc: "Vos étudiants profitent d'un design digne des meilleurs standards SaaS (Dark mode, progression visuelle, lecteur immersif).",
      },
      {
        title: "Économies Massives d'Infogérance",
        desc: "Évitez les factures d'ingénieurs serveurs et les pannes lors des pics d'affluence.",
      },
    ],
    verdict: "Moodle appartient à l'ancienne génération du e-learning universitaire. Pour une académie dynamique, rentable et moderne, ANSELLA est la solution idéale.",
  },
  {
    slug: "thinkific",
    name: "Thinkific",
    metaTitle: "ANSELLA vs Thinkific : Le Comparatif des Plateformes de Cours en Ligne",
    metaDesc: "Comparatif ANSELLA vs Thinkific. Découvrez les avantages d'ANSELLA pour les créateurs de cours avec intégration Mobile Money, Crypto et certifications vérifiables.",
    tagline: "L'alternative internationale avec paiements locaux universels",
    heroSummary: "Thinkific est une solution reconnue en Amérique du Nord et Europe mais reste limitée pour les paiements locaux en Afrique et les cryptomonnaies. ANSELLA offre le meilleur des deux mondes.",
    pricingComparison: {
      ansella: "Plans clairs et transparents de 19$ à 200$/mois",
      competitor: "De 49$/m à 199$/m et 499$/m pour le plan Plus",
    },
    featuresTable: [
      { feature: "Mobile Money Panafricain intégré", ansella: true, competitor: false, highlight: true },
      { feature: "Crypto Gateway Web3 (Solana USDC / BTC)", ansella: true, competitor: false, highlight: true },
      { feature: "Quiz IA et correction intelligente", ansella: true, competitor: "Limité" },
      { feature: "Diplômes vérifiables en ligne avec QR Code", ansella: true, competitor: "Via intégration tierce" },
      { feature: "Support francophone et anglophone dédié", ansella: true, competitor: "Anglais uniquement" },
    ],
    keyAdvantages: [
      {
        title: "Conversion Maximale en Afrique & Diaspora",
        desc: "Permettez à 100% de vos prospects de payer, qu'ils soient à Paris, Abidjan, Kinshasa, Lagos ou Montréal.",
      },
      {
        title: "Technologie Next-Gen IA & Web3",
        desc: "Bénéficiez des dernières innovations pour structurer vos cours et certifier vos apprenants.",
      },
      {
        title: "Assistance Réactive et Proche de Vous",
        desc: "Une équipe qui comprend vos enjeux et vous accompagne dans le déploiement de votre école.",
      },
    ],
    verdict: "ANSELLA est la solution parfaite pour les créateurs qui souhaitent une portée internationale sans exclure les marchés à forte croissance grâce aux paiements hybrides.",
  }
];
