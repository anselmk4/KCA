"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, HelpCircle, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PricingPage() {
  const rawPlans = [
    {
      id: "free",
      name: "Free Plan",
      monthlyPrice: 0,
      description: "Perfect for launching your academy and validating your first courses with a small group of learners.",
      features: [
        "1 active course maximum",
        "Up to 15 enrolled learners",
        "Simple validation quizzes",
        "Mobile Money & Card collection",
        "Transaction fee: 20%",
        "Community support"
      ],
      popular: false,
      buttonText: "Start for free",
      colorClass: "text-teal-400"
    },
    {
      id: "base",
      name: "Base Plan",
      monthlyPrice: 19,
      description: "For serious creators launching their academy.",
      features: [
        "Up to 3 active courses",
        "Up to 50 enrolled learners",
        "✨ AI Auto-Grader & Homework Correction",
        "🛡️ AI Retention Guard (Anti-Dropout Follow-up)",
        "📝 AI Quiz & Exam Generator",
        "Mobile Money & Card collection",
        "Transaction fee: 10%",
        "Email support"
      ],
      popular: false,
      buttonText: "Start with the Base Plan",
      colorClass: "text-indigo-400"
    },
    {
      id: "pro",
      name: "Pro Plan",
      monthlyPrice: 49,
      description: "The ideal solution for professional instructors and growing academies.",
      features: [
        "Up to 10 active courses",
        "Up to 200 enrolled learners",
        "✨ AI Assessment Copilot & Auto-Grader included",
        "🛡️ AI Retention Guard (AI Dropout Detection)",
        "📝 AI Quiz & Exam Generator",
        "Automated completion certificates",
        "Reduced transaction fee: 5%",
        "Priority support within 24h"
      ],
      popular: true,
      buttonText: "Start with the Pro Plan",
      colorClass: "text-teal-400"
    },
    {
      id: "max",
      name: "Max Plan",
      monthlyPrice: 200,
      description: "For large academies and training schools requiring unlimited power and support.",
      features: [
        "Unlimited online courses",
        "Unlimited learners",
        "✨ Unlimited AI Auto-Grader & Copilot",
        "🛡️ AI Retention Guard & Unlimited Auto-Followup",
        "📝 AI Quiz & Exam Generator",
        "0% transaction fees",
        "Custom domain name (e.g. school.com)",
        "Dedicated account manager & WhatsApp"
      ],
      popular: false,
      buttonText: "Activate the Max Plan",
      colorClass: "text-pink-400"
    }
  ];

  const faqs = [
    {
      q: "How do Mobile Money withdrawals work?",
      a: "As soon as a student purchases your course, the balance is added to your Ansella instructor account. You can then request a transfer to M-Pesa, Orange Money, or Airtel Money directly from your billing dashboard."
    },
    {
      q: "Are there any signup or setup fees?",
      a: "Absolutely none. You can set up your Ansella instructor account entirely for free. For the Free plan, we only charge fees on successful transactions."
    },
    {
      q: "Can I change my plan or cancel at any time?",
      a: "Yes, Ansella has no long-term commitment. You can upgrade, downgrade, or cancel your monthly subscription directly from the billing settings."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-16 relative z-10">
          {/* Title Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              Pricing
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              Simple plans,{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                no hidden surprises.
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400">
              Choose the perfect plan for your academy&apos;s stage of development.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rawPlans.map((plan, index) => {
              return (
                <div 
                  key={index} 
                  className={`group relative rounded-3xl p-8 border flex flex-col h-full bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md transition-all duration-300 ${
                    plan.popular 
                      ? "shadow-[0_0_30px_rgba(20,184,166,0.1)] border-teal-500/80 bg-teal-50/10 dark:bg-[#09101f]/60" 
                      : "border-zinc-200 dark:border-zinc-800/85 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-zinc-950 px-4 py-1 text-xxs font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-zinc-950" /> Recommended
                    </div>
                  )}

                  <div className="space-y-4 mb-8 text-left">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-teal-500 dark:group-hover:text-teal-450 transition-colors">{plan.name}</h3>
                    
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-zinc-900 dark:text-white">${plan.monthlyPrice}</span>
                        <span className="text-xs text-zinc-500 ml-1.5">/ month</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed min-h-[48px]">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <Link 
                      href={`/register?plan=${plan.id}`}
                      className={`block w-full py-3.5 px-4 text-center rounded-xl text-xs font-bold transition-all ${
                        plan.popular
                          ? "bg-teal-500 hover:bg-teal-450 text-zinc-950 shadow-md shadow-teal-500/20"
                          : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {plan.buttonText}
                    </Link>
                  </div>

                  <ul className="space-y-3.5 mt-auto text-xs text-zinc-600 dark:text-zinc-400 text-left">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? "text-teal-500 dark:text-teal-400" : "text-zinc-500"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Secure Payment Badges */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 bg-white/40 dark:bg-zinc-950/20 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-around gap-6 text-sm text-zinc-650 dark:text-zinc-400">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-teal-500 dark:text-teal-400" />
              <span>International security guarantee</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-teal-500 dark:text-teal-400" />
              <span>Flexible billing (Monthly or Annual -10%)</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-teal-500 dark:text-teal-400" />
              <span>Direct Mobile Money withdrawals</span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto space-y-8 pt-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 gap-6 text-left">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/40 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
