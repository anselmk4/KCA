"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, CreditCard, Smartphone, Wallet } from "lucide-react";
import { addUser, addTransaction, initDB } from "@/lib/db";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [module, setModule] = useState<string>("blockchain");
  const [level, setLevel] = useState<string>("Débutant");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("stripe");
  const [mobileOperator, setMobileOperator] = useState<string>("airtel");

  useEffect(() => {
    initDB();
    const mod = searchParams.get("module");
    if (mod) setModule(mod);
  }, [searchParams]);

  const moduleNames: Record<string, string> = {
    blockchain: "Fondamentaux de la Blockchain",
    trading: "Crypto-monnaie / Trading",
    ai: "Intelligence Artificielle",
    web3: "Développement Web3"
  };

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUser = addUser({
      name: name || "Ansel",
      email: email || "ansel@example.com",
      level: level || "Débutant",
      activeCourse: module
    });

    const priceMap: Record<string, number> = { blockchain: 300, trading: 500, ai: 1000, web3: 1500 };
    
    addTransaction({
      userId: newUser.id,
      userName: newUser.name,
      amount: priceMap[module] || 300,
      courseId: module,
      status: paymentMethod === "paypal" ? "En attente" : "Complété",
      method: paymentMethod === "mobile" ? "Mobile Money" : "Carte"
    });

    // Keep old variables for student dashboard compatibility
    localStorage.setItem("kuettu_active_module", module);
    localStorage.setItem("kuettu_user_level", level || "Débutant");
    localStorage.setItem("kuettu_user_name", name || "Ansel");
    
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8 relative overflow-hidden">
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex flex-col items-center mb-8 mt-4">
        <Link href="/" className="flex items-center space-x-2 mb-4">
          <GraduationCap className="h-10 w-10 text-blue-600" />
          <span className="font-bold text-2xl text-zinc-900 dark:text-white">Kuettu</span>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 text-center">
          {step === 1 && "Créer un compte"}
          {step === 2 && "Profil & Niveau"}
          {step === 3 && "Paiement Sécurisé"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
          {step === 1 && "Rejoignez l'élite du Web3 en Afrique dès aujourd'hui."}
          {step === 2 && `Vous avez sélectionné : ${moduleNames[module] || moduleNames["blockchain"]}`}
          {step === 3 && "Finalisez votre inscription pour accéder à vos cours."}
        </p>
      </div>

      <form onSubmit={step === 3 ? handleComplete : (e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
        
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nom complet</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Adresse Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Mot de passe</label>
              <input required type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
          </div>
        )}

        {/* STEP 2: Level & Course Selection Validation */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Quel est votre niveau actuel ?</label>
              <div className="grid grid-cols-1 gap-3">
                {["Débutant", "Intermédiaire", "Avancé"].map((lvl) => (
                  <div 
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                      level === lvl 
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300"
                    }`}
                  >
                    <span className="font-medium text-zinc-900 dark:text-white">{lvl}</span>
                    {level === lvl && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-zinc-500">Total à payer</p>
                <p className="font-bold text-lg text-zinc-900 dark:text-white">
                  {module === "ai" ? "1000$" : module === "trading" ? "500$" : module === "web3" ? "1500$" : "300$"}
                </p>
              </div>
              {paymentMethod === "stripe" && <CreditCard className="w-8 h-8 text-zinc-400" />}
              {paymentMethod === "paypal" && <Wallet className="w-8 h-8 text-zinc-400" />}
              {paymentMethod === "mobile" && <Smartphone className="w-8 h-8 text-zinc-400" />}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <button type="button" onClick={() => setPaymentMethod("stripe")} className={`p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'stripe' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-blue-300'}`}>
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-semibold">Carte</span>
              </button>
              <button type="button" onClick={() => setPaymentMethod("paypal")} className={`p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-blue-300'}`}>
                <Wallet className="w-6 h-6" />
                <span className="text-xs font-semibold">PayPal</span>
              </button>
              <button type="button" onClick={() => setPaymentMethod("mobile")} className={`p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'mobile' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-blue-300'}`}>
                <Smartphone className="w-6 h-6" />
                <span className="text-xs font-semibold text-center">Mobile</span>
              </button>
            </div>

            {paymentMethod === "stripe" && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Numéro de carte</label>
                  <input required type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Date d'exp.</label>
                    <input required type="text" placeholder="MM/YY" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">CVC</label>
                    <input required type="text" placeholder="123" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 text-center animate-in fade-in">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Vous serez redirigé vers PayPal pour finaliser votre paiement de manière sécurisée.</p>
                <div className="inline-flex items-center justify-center px-6 py-3 bg-[#003087] text-white font-bold rounded-full w-full">
                  Payer avec PayPal
                </div>
              </div>
            )}

            {paymentMethod === "mobile" && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Opérateur (RDC)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['airtel', 'mpesa', 'orange'].map(op => (
                      <button 
                        key={op}
                        type="button" 
                        onClick={() => setMobileOperator(op)}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                          mobileOperator === op 
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/30' 
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-blue-300'
                        }`}
                      >
                        {op === 'airtel' && 'Airtel Money'}
                        {op === 'mpesa' && 'M-Pesa'}
                        {op === 'orange' && 'Orange Money'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Numéro de téléphone</label>
                  <div className="flex">
                    <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-l-xl border-transparent text-zinc-500 font-medium">
                      +243
                    </div>
                    <input required type="tel" placeholder="99 000 0000" className="w-full px-4 py-3 rounded-r-xl bg-zinc-100 dark:bg-zinc-800 border-l-0 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button 
              type="button" 
              onClick={handlePrev}
              className="px-4 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button 
            type="submit"
            className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            {step === 3 ? "Payer et Accéder au Dashboard" : "Suivant"}
            {step < 3 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {step === 1 && (
        <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-semibold">
            Se connecter
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Suspense fallback={<div>Chargement...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
