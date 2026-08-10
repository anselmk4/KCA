import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const homeworkId = searchParams.get("homeworkId");
    const studentId = searchParams.get("studentId");
    const courseId = searchParams.get("courseId");

    // Check roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isPrivileged = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));

    let query = (supabase as any).from("homework_submissions").select("*, profiles:student_id(full_name, email)");

    if (homeworkId) {
      // If student is querying, only let them see their own submission
      if (!isPrivileged) {
        query = query.eq("homework_id", homeworkId).eq("student_id", user.id);
      } else {
        query = query.eq("homework_id", homeworkId);
      }
    } else if (studentId) {
      // If student is querying, they can only see their own
      if (!isPrivileged && studentId !== user.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      query = query.eq("student_id", studentId);
    } else if (courseId && isPrivileged) {
      // Get all homework submissions for this course (instructors/admins only)
      const { data: hwIds } = await (supabase as any)
        .from("homeworks")
        .select("id")
        .eq("course_id", courseId);
      const ids = hwIds?.map((h: any) => h.id) || [];
      if (ids.length === 0) {
        return NextResponse.json({ submissions: [] });
      }
      query = query.in("homework_id", ids);
    } else {
      return NextResponse.json({ error: "Paramètres insuffisants" }, { status: 400 });
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { homeworkId, fileUrl } = body;

    if (!homeworkId || !fileUrl) {
      return NextResponse.json({ error: "homeworkId et fileUrl sont requis" }, { status: 400 });
    }

    // Check if submission already exists (upsert logic)
    const { data: existingSub } = await (supabase as any)
      .from("homework_submissions")
      .select("id")
      .eq("homework_id", homeworkId)
      .eq("student_id", user.id)
      .maybeSingle();

    let result;
    if (existingSub) {
      // Update
      const { data, error } = await (supabase as any)
        .from("homework_submissions")
        .update({
          file_url: fileUrl,
          status: "SUBMITTED", // reset to submitted if re-uploaded
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSub.id)
        .select()
        .single();
      
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      result = data;
    } else {
      // Insert new
      const { data, error } = await (supabase as any)
        .from("homework_submissions")
        .insert({
          homework_id: homeworkId,
          student_id: user.id,
          file_url: fileUrl,
          status: "SUBMITTED"
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      result = data;
    }

    return NextResponse.json({ submission: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Check roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isPrivileged = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
    if (!isPrivileged) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { id, grade, feedback } = body;

    if (!id) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 });
    }

    // Verify instructor owns the course this submission is related to
    const { data: submission } = await (supabase as any)
      .from("homework_submissions")
      .select("homework_id, student_id")
      .eq("id", id)
      .maybeSingle();

    if (!submission) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    const { data: homework } = await (supabase as any)
      .from("homeworks")
      .select("course_id, title")
      .eq("id", submission.homework_id)
      .maybeSingle();

    if (!homework) {
      return NextResponse.json({ error: "Devoir associé introuvable" }, { status: 404 });
    }

    const { data: course } = await (supabase as any)
      .from("courses")
      .select("instructor_id")
      .eq("id", homework.course_id)
      .maybeSingle();

    if (!course || (course.instructor_id !== user.id && !roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r)))) {
      return NextResponse.json({ error: "Non autorisé à corriger ce devoir" }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from("homework_submissions")
      .update({
        grade: grade !== undefined ? parseFloat(grade) : null,
        feedback: feedback || null,
        status: "GRADED",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger notification
    try {
      const { createNotification } = await import("@/lib/supabase/notifications-helper");
      await createNotification({
        userId: submission.student_id,
        title: "Devoir évalué !",
        message: `Votre devoir "${homework?.title || 'Devoir'}" a été évalué avec une note de ${grade}/100.`,
        type: "SUCCESS",
        link: `/dashboard/courses`
      });
    } catch (notifErr) {
      console.error("[API homework-submissions PUT] Error sending notification:", notifErr);
    }

    return NextResponse.json({ submission: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
