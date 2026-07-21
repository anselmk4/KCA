"use client";

import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  BookOpen,
  DollarSign,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  CreditCard,
  Target,
  FileText,
  Tag,
  ShieldCheck,
  Zap,
  HelpCircle,
  Eye,
} from "lucide-react";

interface CourseCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: {
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    price: number;
    isPaid: boolean;
    installmentsEnabled: boolean;
    installmentCount: number;
    level: string;
    thumbnailUrl: string;
    prerequisites: string;
  }) => Promise<void>;
  creating: boolean;
}

const CATEGORIES = [
  "Intelligence Artificielle & Data",
  "Blockchain, Web3 & Crypto",
  "Finance & Trading",
  "Marketing Digital & Ventes",
  "Développement Web & Mobile",
  "Design & Multimédia",
  "Business & Entrepreneuriat",
  "Autre Domaine",
];

const PRESET_THUMBNAILS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", // AI Abstract
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000&auto=format&fit=crop", // Crypto Blockchain
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop", // Finance Chart
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop", // Data Analytics
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop", // Cyber Security
];

export function CourseCreationWizardModal({
  isOpen,
  onClose,
  onSubmit,
  creating,
}: CourseCreationWizardModalProps) {
  const [step, setStep] = useState<number>(1);

  // Step 1: Identity & Description
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Intelligence Artificielle & Data");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Pricing & Installments
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [price, setPrice] = useState<string>("49");
  const [installmentsEnabled, setInstallmentsEnabled] = useState<boolean>(false);
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [level, setLevel] = useState("Tous niveaux");

  // Step 3: Thumbnail & Media
  const [thumbnailUrl, setThumbnailUrl] = useState(PRESET_THUMBNAILS[0]);
  const [customThumbnail, setCustomThumbnail] = useState("");

  // Step 4: Prerequisites & Confirmation
  const [prerequisites, setPrerequisites] = useState("Aucun prérequis nécessaire");

  if (!isOpen) return null;

  const currentPriceNumber = isPaid ? parseFloat(price) || 0 : 0;
  const installmentAmount =
    installmentsEnabled && installmentCount > 0
      ? (currentPriceNumber / installmentCount).toFixed(2)
      : "0";

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      alert("Veuillez saisir un titre pour votre cours.");
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinalSubmit = async () => {
    if (!title.trim()) {
      alert("Le titre du cours est obligatoire.");
      setStep(1);
      return;
    }

    const finalThumbnail = customThumbnail.trim() || thumbnailUrl;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || shortDescription.trim() || "Nouveau cours en préparation.",
      shortDescription: shortDescription.trim() || "Aperçu du cours.",
      category,
      price: currentPriceNumber,
      isPaid,
      installmentsEnabled: isPaid && installmentsEnabled,
      installmentCount,
      level,
      thumbnailUrl: finalThumbnail,
      prerequisites,
    });
  };

  const stepsList = [
    { num: 1, label: "Identité", icon: FileText },
    { num: 2, label: "Tarification", icon: CreditCard },
    { num: 3, label: "Visuel & Aperçu", icon: ImageIcon },
    { num: 4, label: "Confirmation", icon: RocketIcon },
  ];

  function RocketIcon(props: any) {
    return <Zap {...props} />;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header & Step Indicator */}
        <div className="bg-gradient-to-r from-zinc-900 via-teal-950 to-zinc-900 p-6 text-white relative shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Assistant de Création de Cours
                </h2>
                <p className="text-xs text-teal-200/70">
                  Configurez votre académie en 4 étapes simples et intuitives.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper progress bar */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
            {stepsList.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;

              return (
                <div key={s.num} className="flex flex-col items-center gap-1.5">
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isDone || isActive ? "bg-teal-400" : "bg-transparent"
                      }`}
                    />
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      isActive
                        ? "text-teal-300 font-extrabold"
                        : isDone
                        ? "text-emerald-400"
                        : "text-zinc-400"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isActive
                          ? "bg-teal-400 text-zinc-900 shadow-md shadow-teal-400/40"
                          : isDone
                          ? "bg-emerald-500 text-white"
                          : "bg-white/10 text-zinc-400"
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3" /> : s.num}
                    </span>
                    <span className="hidden sm:inline text-[11px] truncate">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Body Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: Identité & Description */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Étape 1 : Identité & Présentation du Cours
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Définissez le titre percutant et les descriptions destinées à vos futurs apprenants.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Titre du cours <span className="text-teal-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Masterclass IA & Automation : De Zéro à Pro"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Domaine / Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Niveau recommandé
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium transition-all"
                  >
                    <option value="Tous niveaux">Tous niveaux</option>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé / Expert">Avancé / Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Accroche courte (Aperçu dans le catalogue)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Exposée sur /discover</span>
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Ex: Maîtrisez les outils IA de pointe pour automatiser vos tâches et multiplier votre productivité."
                  maxLength={150}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Description détaillée & Objectifs du programme
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Détaillez le contenu, les modules clés et les compétences que les apprenants acquerront..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Tarification & Paiement par tranches */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Étape 2 : Modèle Économique & Modalités de Paiement
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Définissez si le cours est gratuit ou payant et autorisez le paiement échelonné par tranches.
                </p>
              </div>

              {/* Toggle Gratuit / Payant */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 cursor-pointer ${
                    !isPaid
                      ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md ring-1 ring-teal-500"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-zinc-900 dark:text-white">Gratuit ($0)</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${!isPaid ? "bg-teal-600 text-white" : "border border-zinc-300"}`}>
                      {!isPaid && <Check className="w-3 h-3" />}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Cours accessible à tous les apprenants sans aucun frais d&apos;inscription.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 cursor-pointer ${
                    isPaid
                      ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md ring-1 ring-teal-500"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-zinc-900 dark:text-white">Cours Payant ($)</span>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isPaid ? "bg-teal-600 text-white" : "border border-zinc-300"}`}>
                      {isPaid && <Check className="w-3 h-3" />}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Générez des revenus directs via Mobile Money, Carte bancaire ou Crypto.
                  </p>
                </button>
              </div>

              {isPaid && (
                <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 rounded-3xl space-y-5 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                      Prix Total du Cours ($ USD)
                    </label>
                    <div className="relative max-w-xs">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="1"
                        placeholder="49"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-lg font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      />
                    </div>
                  </div>

                  {/* Payment by Installments (Tranches) Option */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                          Autoriser le Paiement par Tranches (Installments)
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Permet aux apprenants de régler en 2x, 3x ou 4x mensualités.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={installmentsEnabled}
                          onChange={(e) => setInstallmentsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {installmentsEnabled && (
                      <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/40 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center animate-in fade-in">
                        <div>
                          <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 mb-1">
                            Nombre de tranches
                          </label>
                          <select
                            value={installmentCount}
                            onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-white focus:outline-none"
                          >
                            <option value={2}>2 mensualités (2x)</option>
                            <option value={3}>3 mensualités (3x)</option>
                            <option value={4}>4 mensualités (4x)</option>
                          </select>
                        </div>
                        <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-teal-100 dark:border-teal-900/40 text-center">
                          <p className="text-[10px] text-zinc-400 uppercase font-bold">Montant par tranche</p>
                          <p className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                            {installmentAmount} $ <span className="text-xs font-normal text-zinc-400">/ mois</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Visuel de Couverture & Live Preview */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Étape 3 : Visuel de Couverture & Aperçu en Direct
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Choisissez une couverture captivante et vérifiez son rendu instantané dans le catalogue.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left: Thumbnail Selector */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Suggérer une couverture prédéfinie
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_THUMBNAILS.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setThumbnailUrl(img);
                          setCustomThumbnail("");
                        }}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          thumbnailUrl === img && !customThumbnail
                            ? "border-teal-500 ring-2 ring-teal-500/50 scale-95 shadow-lg"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="Thumbnail preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Ou coller une URL d&apos;image personnalisée
                    </label>
                    <input
                      type="url"
                      value={customThumbnail}
                      onChange={(e) => setCustomThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                </div>

                {/* Right: Live Preview Card in Discover Style */}
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800/30 rounded-3xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-teal-600" /> Aperçu en direct dans le catalogue (/discover)
                  </p>

                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg group">
                    <div className="aspect-video relative overflow-hidden bg-zinc-800">
                      <img
                        src={customThumbnail.trim() || thumbnailUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="bg-zinc-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {category.split("&")[0]}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-teal-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md">
                          {isPaid ? `${price} $` : "Gratuit"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
                        <span>{level}</span>
                        <span>•</span>
                        <span>0 modules</span>
                      </div>

                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">
                        {title.trim() || "Titre du cours..."}
                      </h4>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {shortDescription.trim() || "La description courte s'affichera ici..."}
                      </p>

                      {isPaid && installmentsEnabled && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Disponible en {installmentCount}x {installmentAmount}$ / mois
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Prérequis & Confirmation Finale */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Étape 4 : Récapitulatif & Finalisation
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Vérifiez la configuration finale avant de créer votre cours.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Prérequis conseillés
                </label>
                <input
                  type="text"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="Ex: Notions de base en informatique"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium"
                />
              </div>

              {/* Summary Card */}
              <div className="p-5 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-500/20 rounded-3xl space-y-4">
                <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                  Fiche Récapitulative du Cours
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Titre</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{title || "Sans titre"}</span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Domaine & Niveau</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {category} ({level})
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Modèle Tarifaire</span>
                    <span className="font-extrabold text-teal-600 dark:text-teal-400">
                      {isPaid ? `${price} $ USD` : "Gratuit ($0)"}
                      {isPaid && installmentsEnabled && ` (ou ${installmentCount}x ${installmentAmount}$/mois)`}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Statut Inital</span>
                    <span className="font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      DRAFT (Brouillon)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={creating}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Annuler
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={creating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-extrabold shadow-xl shadow-teal-500/30 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                {creating ? (
                  "Création du cours..."
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" /> Créer & Lancer le Cours
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
