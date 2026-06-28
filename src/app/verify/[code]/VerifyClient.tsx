"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2, XCircle, Loader2, Award, Calendar,
  GraduationCap, User, BookOpen, ExternalLink,
} from "lucide-react";

type CertInfo = {
  code: string;
  issuedAt: string;
  status: string;
  studentName: string;
  courseTitle: string;
  courseLevel: string;
  instructorName: string;
};

type VerifyResult =
  | { valid: true; certificate: CertInfo }
  | { valid: false; message: string };

export default function VerifyClient({ code }: { code: string }) {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/verify?code=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => { setResult({ valid: false, message: "Erreur réseau." }); setLoading(false); });
  }, [code]);

  const issuedDate = result?.valid
    ? new Date(result.certificate.issuedAt).toLocaleDateString("fr-FR", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900 flex flex-col items-center justify-center p-6 font-sans">

      {/* Header */}
      <Link href="/" className="flex items-center gap-3 mb-10 group">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <Award className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-extrabold text-xl tracking-wide">ANSELLA</span>
      </Link>

      <div className="w-full max-w-2xl">

        {/* Loading */}
        {loading && (
          <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 rounded-3xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm font-medium">Vérification du certificat en cours...</p>
            <p className="text-zinc-600 text-xs mt-1 font-mono">{code}</p>
          </div>
        )}

        {/* Certificat valide */}
        {!loading && result?.valid && (
          <div className="space-y-6">
            {/* Badge de validation */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-3">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
                <CheckCircle2 className="w-16 h-16 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Certificat Authentique</h1>
              <p className="text-emerald-400 font-semibold text-sm">
                Ce certificat a été vérifié et est authentique.
              </p>
            </div>

            {/* Détails du certificat */}
            <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 rounded-3xl overflow-hidden">
              {/* Visuel miniature */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex items-center justify-center">
                <div className="w-full max-w-sm bg-white/95 rounded-xl p-6 text-center shadow-2xl">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-xs text-zinc-400 uppercase tracking-[0.2em] font-serif mb-1">
                    Certificat d&apos;Accomplissement
                  </p>
                  <p className="text-sm font-bold text-zinc-900 line-clamp-2 mb-2">
                    {result.certificate.courseTitle}
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-12 h-[1px] bg-amber-400" />
                    <span className="text-xs text-zinc-500 font-semibold">{result.certificate.studentName}</span>
                    <div className="w-12 h-[1px] bg-amber-400" />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-2">{result.certificate.code}</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: User, label: "Diplômé", value: result.certificate.studentName },
                    { icon: BookOpen, label: "Formation", value: result.certificate.courseTitle },
                    { icon: GraduationCap, label: "Instructeur", value: result.certificate.instructorName },
                    { icon: Calendar, label: "Date d'émission", value: issuedDate! },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-700/40">
                      <div className="p-2 bg-blue-600/10 rounded-lg">
                        <Icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
                        <p className="text-sm text-white font-semibold mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Code */}
                <div className="p-3 bg-zinc-900/70 rounded-xl border border-zinc-700/40 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Code de vérification</p>
                    <p className="text-sm font-mono text-emerald-400 font-bold">{result.certificate.code}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">VALIDE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Découvrir ANSELLA
              </Link>
            </div>
          </div>
        )}

        {/* Certificat invalide */}
        {!loading && result !== null && !result.valid && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center space-y-5">
            <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <XCircle className="w-16 h-16 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Certificat Non Valide</h1>
            <p className="text-red-400 font-medium text-sm max-w-md mx-auto">
              {result.message || "Ce certificat est introuvable ou a été révoqué. Si vous pensez qu'il s'agit d'une erreur, contactez le support."}
            </p>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-700/40 inline-block">
              <p className="text-xs text-zinc-500 font-mono">Code fourni : <span className="text-zinc-300">{code}</span></p>
            </div>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          © {new Date().getFullYear()} ANSELLA Crypto Academy · Certificats vérifiables
        </p>
      </div>
    </div>
  );
}
