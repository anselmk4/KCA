"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Captcha } from "@/components/ui/Captcha";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
      setError("Please complete the security check (CAPTCHA).");
      return;
    }

    setLoading(true);

    try {
      // Server-side security check (CAPTCHA verification + Rate Limiting)
      const secRes = await fetch("/api/auth/security-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken, action: "forgot-password" })
      });

      if (!secRes.ok) {
        const secData = await secRes.json();
        throw new Error(secData.error || "Security check failed.");
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (msg.includes("rate limit")) {
          setError("Too many attempts. Please wait a few minutes before trying again.");
        } else {
          setError(resetError.message);
        }
        setCaptchaResetKey(prev => prev + 1); // Reset CAPTCHA on error
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
      setCaptchaResetKey(prev => prev + 1); // Reset CAPTCHA on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/80 dark:border-white/10 p-8 md:p-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center mb-6">
            <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto dark:hidden" priority />
            <Image src="/logo-dark.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto hidden dark:block" priority />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Forgot Password</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
            Enter your email address to receive a reset link.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6 py-4">
            <div className="inline-flex p-4 rounded-full bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Email sent!</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                A reset link has been sent to <strong>{email}</strong>.
                Check your inbox (and spam folder).
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="py-2">
                <Captcha onVerify={setCaptchaToken} resetKey={captchaResetKey} />
              </div>

              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-sm"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/login" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-500 font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
