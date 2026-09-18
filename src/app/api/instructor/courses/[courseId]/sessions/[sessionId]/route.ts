import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function resolveCourse(dbClient: any, courseIdentifier: string) {
  const rawId = courseIdentifier || "";
  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch {
    // keep rawId
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

  let course: any = null;
  if (isUuid) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .eq("id", rawId)
        .maybeSingle();
      course = data;
    } catch (e) {
      console.warn("[resolveCourse] UUID query error:", e);
    }
  }

  if (!course) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .eq("slug", decodedId)
        .maybeSingle();
      course = data;
    } catch {
      // ignore
    }
  }

  if (!course && decodedId !== rawId) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .eq("slug", rawId)
        .maybeSingle();
      course = data;
    } catch {
      // ignore
    }
  }

  // Fallback: search by title
  if (!course) {
    try {
      const { data } = await (dbClient.from("courses" as any) as any)
        .select("id, title, instructor_id")
        .ilike("title", decodedId)
        .maybeSingle();
      course = data;
    } catch {
      // ignore
    }
  }

  return course;
}

async function checkAccess(supabase: any, dbClient: any, userId: string, course: any) {
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);
  const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
  const isOwnerOrAdmin = course.instructor_id === userId || roles.some((r: any) => ["SUPER_ADMIN", "ADMIN", "ACADEMIC_ADMIN"].includes(r));
  if (isOwnerOrAdmin) return true;

  const { data: collab } = await (dbClient.from("course_collaborators" as any) as any)
    .select("id")
    .eq("course_id", course.id)
    .eq("collaborator_id", userId)
    .maybeSingle();
  return !!collab;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  try {
    const { courseId, sessionId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    const course = await resolveCourse(dbClient, courseId);
    if (!course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    const hasAccess = await checkAccess(supabase, dbClient, user.id, course);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate, status, maxCapacity, isDefault } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (startDate !== undefined) updates.start_date = startDate ? new Date(startDate).toISOString() : null;
    if (endDate !== undefined) updates.end_date = endDate ? new Date(endDate).toISOString() : null;
    if (status !== undefined) updates.status = status;
    if (maxCapacity !== undefined) updates.max_capacity = maxCapacity ? parseInt(maxCapacity, 10) : null;
    if (isDefault !== undefined) {
      updates.is_default = !!isDefault;
      if (isDefault) {
        // unset other defaults
        try {
          await (dbClient.from("course_sessions" as any) as any)
            .update({ is_default: false })
            .eq("course_id", course.id);
        } catch (e) {
          console.warn("[session PATCH] default update warning:", e);
        }
      }
    }

    const { data: updated, error: updateErr } = await (dbClient
      .from("course_sessions" as any) as any)
      .update(updates)
      .eq("id", sessionId)
      .eq("course_id", course.id)
      .select()
      .single();

    if (updateErr) {
      console.error("[session PATCH] error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Session mise à jour avec succès.",
      session: updated,
    });
  } catch (err: any) {
    console.error("[session PATCH] error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  try {
    const { courseId, sessionId } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const dbClient = (process.env.SUPABASE_SERVICE_ROLE_KEY &&
                      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? supabaseAdmin
      : supabase;

    const course = await resolveCourse(dbClient, courseId);
    if (!course) {
      return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });
    }

    const hasAccess = await checkAccess(supabase, dbClient, user.id, course);
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    // Set enrollments in this session to NULL (unassigned) safely
    try {
      await (dbClient.from("enrollments" as any) as any)
        .update({ session_id: null })
        .eq("session_id", sessionId);
    } catch (e) {
      console.warn("[session DELETE] unassign warning:", e);
    }

    // Delete session
    const { error: delErr } = await (dbClient
      .from("course_sessions" as any) as any)
      .delete()
      .eq("id", sessionId)
      .eq("course_id", course.id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Session supprimée avec succès. Les apprenants associés sont maintenant non-assignés.",
    });
  } catch (err: any) {
    console.error("[session DELETE] error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
