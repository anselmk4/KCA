"use client";

import { useEffect, useState } from "react";
import { getDB, addUser, initDB, Database } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";
import {
  Users,
  Mail,
  Search,
  UserPlus,
  TrendingUp,
  MoreHorizontal,
  X,
  CheckCircle2,
} from "lucide-react";

export default function StudentsPage() {
  const [db, setDb] = useState<Database | null>(null);
  const [session, setSession] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    initDB();
    setDb(getDB());
    setSession(getSimulatedSession());
  }, []);

  if (!db || !session) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  const myCourseIds = db.courses.filter(c => c.instructorId === session.userId).map(c => c.id);
  const myEnrollments = db.enrollments.filter(e => myCourseIds.includes(e.courseId));
  const enrolledStudentIds = [...new Set(myEnrollments.map(e => e.studentId))];
  const students = db.users.filter(u => enrolledStudentIds.includes(u.id) && u.role === "STUDENT");

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = db.users.find(u => u.email === inviteEmail);
    if (!existing) {
      addUser({ name: inviteName, email: inviteEmail, role: "STUDENT", level: "Débutant", activeCourse: "", plan: "FREE" });
      setDb(getDB());
    }
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mes Étudiants</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {students.length} apprenant{students.length !== 1 ? "s" : ""} inscrit{students.length !== 1 ? "s" : ""} à vos cours.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Inviter un Étudiant
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total inscrits", value: students.length, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20" },
          { label: "Actifs cette semaine", value: Math.ceil(students.length * 0.7), color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Certifiés", value: db.certificates.filter(c => myCourseIds.includes(c.courseId)).length, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Progression moy.", value: `${myEnrollments.length > 0 ? Math.round(myEnrollments.reduce((s, e) => s + e.progressPercent, 0) / myEnrollments.length) : 0}%`, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className={`text-2xl font-extrabold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Rechercher un étudiant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2.5 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        />
      </div>

      {/* Students table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Liste des Apprenants</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucun étudiant trouvé.</p>
            <button onClick={() => setShowInvite(true)} className="mt-4 text-teal-600 text-sm font-semibold hover:underline">
              + Inviter un premier étudiant
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map(student => {
              const enr = myEnrollments.filter(e => e.studentId === student.id);
              const avgProg = enr.length > 0 ? Math.round(enr.reduce((s, e) => s + e.progressPercent, 0) / enr.length) : 0;
              const course = db.courses.find(c => c.id === enr[0]?.courseId);
              return (
                <div key={student.id} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                    {student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{student.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{student.email}</p>
                  </div>
                  <div className="hidden md:block text-xs text-zinc-500 truncate max-w-[140px]">
                    {course?.title || "—"}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-28">
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${avgProg}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-8 text-right">{avgProg}%</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    student.status === "Actif"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {student.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Inviter un Étudiant</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            {inviteSuccess ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-teal-500" />
                <p className="font-semibold text-zinc-900 dark:text-white">Invitation envoyée !</p>
                <p className="text-sm text-zinc-500">L'étudiant a été ajouté à votre liste.</p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nom complet</label>
                  <input required type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Jean Dupont" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Adresse Email</label>
                  <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="etudiant@exemple.com" className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">Un lien d'invitation sera simulé dans la plateforme.</p>
                </div>
                <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors">
                  Envoyer l'invitation
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
