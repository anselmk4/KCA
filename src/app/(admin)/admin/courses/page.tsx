"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getDB } from "@/lib/db";
import { 
  BookOpen, 
  Check, 
  X, 
  Archive, 
  AlertTriangle, 
  Clock, 
  Search, 
  DollarSign, 
  Layers, 
  User, 
  FileText,
  Edit3,
  Trash2
} from "lucide-react";

interface AdminCourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  instructorId: string;
  instructorName: string;
  categoryName: string;
  level: string;
  createdAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "REVIEW" | "PUBLISHED" | "DRAFT">("REVIEW");
  const [editingCourse, setEditingCourse] = useState<AdminCourseItem | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({ title: editingTitle.trim() })
        .eq('id', editingCourse.id);
      
      if (error) throw error;
      
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, title: editingTitle.trim() } : c));
      setEditingCourse(null);
      setEditingTitle("");
      alert("Titre du cours modifié avec succès !");
    } catch (err: any) {
      alert("Erreur lors de la modification du titre : " + err.message);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement ce cours ? Cette action supprimera également toutes ses sections et leçons.")) return;
    try {
      // Supprimer de localStorage pour compatibilité locale synchrone
      const { deleteCourse } = await import("@/lib/db");
      deleteCourse(courseId);

      // Supprimer de Supabase
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) throw error;
      
      setCourses(prev => prev.filter(c => c.id !== courseId));
      alert("Cours supprimé avec succès !");
    } catch (err: any) {
      console.error("Error deleting course:", err.message);
      alert("Erreur de suppression du cours : " + err.message);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // 1. Get courses
      const { data: sbCourses, error: courseErr } = await supabase
        .from('courses')
        .select('*');

      if (courseErr) throw courseErr;

      // 2. Get profiles to map instructor names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

      const instructorMap = new Map<string, string>();
      profiles?.forEach(p => {
        instructorMap.set(p.id, p.full_name || 'Formateur');
      });

      // 3. Get categories
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name');

      const categoryMap = new Map<string, string>();
      categories?.forEach(c => {
        categoryMap.set(c.id, c.name);
      });

      const items: AdminCourseItem[] = (sbCourses || []).map((c: any) => {
        let levelLabel = 'Débutant';
        if (c.level === 'INTERMEDIATE') levelLabel = 'Intermédiaire';
        else if (c.level === 'ADVANCED') levelLabel = 'Avancé';
        else if (c.level === 'EXPERT') levelLabel = 'Expert';

        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description || '',
          price: c.price || 0,
          status: c.status || 'DRAFT',
          instructorId: c.instructor_id,
          instructorName: instructorMap.get(c.instructor_id) || 'Prof. Kuettu',
          categoryName: categoryMap.get(c.category_id) || 'Général',
          level: levelLabel,
          createdAt: c.created_at || new Date().toISOString(),
        };
      });

      setCourses(items);
    } catch (err: any) {
      console.error('[AdminCourses] Error loading from Supabase:', err);
      // Fallback local mock data
      const db = getDB();
      const mapped = db.courses.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        price: c.price,
        status: c.status as any,
        instructorId: c.instructorId,
        instructorName: c.instructorName,
        categoryName: c.category || "Général",
        level: c.level || "Débutant",
        createdAt: c.createdAt,
      }));
      setCourses(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleUpdateStatus = async (courseId: string, nextStatus: AdminCourseItem['status']) => {
    try {
      const res = await fetch("/api/admin/courses/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, nextStatus })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur serveur");
      }

      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: nextStatus } : c));
      alert(`Statut du cours mis à jour avec succès vers : ${nextStatus === 'PUBLISHED' ? 'Publié' : (nextStatus === 'DRAFT' ? 'Renvoyé en Brouillon' : 'Archivé')}`);
    } catch (err: any) {
      console.error('Error changing course status:', err.message);
      alert('Erreur lors de la mise à jour du cours : ' + err.message);
    }
  };

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructorName.toLowerCase().includes(search.toLowerCase()) ||
      c.categoryName.toLowerCase().includes(search.toLowerCase());

    const matchTab =
      activeTab === "ALL" ||
      c.status === activeTab;

    return matchSearch && matchTab;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Validation des Formations</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Passez en revue les cours soumis par les formateurs pour validation ou modification.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["REVIEW", "PUBLISHED", "DRAFT", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/30"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {tab === "REVIEW" ? "En révision ⏳" : tab === "PUBLISHED" ? "Actifs ✓" : tab === "DRAFT" ? "Brouillons" : "Tous"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </div>

      {/* Grid or Table list */}
      {loading ? (
        <div className="p-16 text-center space-y-4">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Chargement des formations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400">
          Aucun cours en attente de révision.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <div 
              key={course.id} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase">
                    {course.categoryName}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Action buttons */}
                    <button
                      onClick={() => {
                        setEditingCourse(course);
                        setEditingTitle(course.title);
                      }}
                      className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      title="Modifier le titre"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Supprimer la formation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 uppercase ${
                      course.status === 'PUBLISHED'
                        ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30'
                        : course.status === 'REVIEW'
                        ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30'
                        : 'text-zinc-500 bg-zinc-50 border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700'
                    }`}>
                      {course.status === 'PUBLISHED' ? 'Publié' : course.status === 'REVIEW' ? 'En révision' : 'Brouillon'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <h3 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 h-8">{course.description}</p>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">{course.instructorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end font-bold text-zinc-900 dark:text-white">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{course.price}$</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{course.level}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span>ID: {course.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                {course.status === 'REVIEW' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(course.id, 'PUBLISHED')}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approuver
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(course.id, 'DRAFT')}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  </>
                )}
                {course.status === 'PUBLISHED' && (
                  <button
                    onClick={() => handleUpdateStatus(course.id, 'ARCHIVED')}
                    className="w-full py-2 bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-red-200 dark:border-red-900/30 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archiver la formation
                  </button>
                )}
                {course.status === 'DRAFT' && (
                  <button
                    onClick={() => handleUpdateStatus(course.id, 'PUBLISHED')}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Publier directement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal Edit Course Title */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 dark:text-white">Modifier le titre du cours</h3>
              <button onClick={() => setEditingCourse(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditCourseSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Titre de la formation</label>
                <input
                  type="text"
                  required
                  placeholder="Nouveau titre"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-zinc-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={!editingTitle.trim()}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Enregistrer la modification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
