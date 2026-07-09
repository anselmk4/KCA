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
    const courseId = searchParams.get("courseId");
    const sectionId = searchParams.get("sectionId");

    let query = (supabase as any).from("homeworks").select("*");
    if (courseId) {
      query = query.eq("course_id", courseId);
    } else if (sectionId) {
      query = query.eq("section_id", sectionId);
    } else {
      return NextResponse.json({ error: "courseId ou sectionId est requis" }, { status: 400 });
    }

    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ homeworks: data || [] });
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

    // Verify user role
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isInstructor = roles.some(r => ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(r));
    if (!isInstructor) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { courseId, sectionId, title, description, fileUrl, deadline } = body;

    if (!courseId || !sectionId || !title) {
      return NextResponse.json({ error: "courseId, sectionId et title sont requis" }, { status: 400 });
    }

    // Check course ownership
    const { data: course } = await (supabase as any)
      .from("courses")
      .select("instructor_id")
      .eq("id", courseId)
      .maybeSingle();

    if (!course || (course.instructor_id !== user.id && !roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r)))) {
      return NextResponse.json({ error: "Non autorisé à gérer ce cours" }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from("homeworks")
      .insert({
        course_id: courseId,
        section_id: sectionId,
        title,
        description: description || null,
        file_url: fileUrl || null,
        deadline: deadline || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ homework: data }, { status: 201 });
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

    const body = await req.json();
    const { id, title, description, fileUrl, deadline } = body;

    if (!id) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 });
    }

    // Get homework to check course ownership
    const { data: homework, error: hwError } = await (supabase as any)
      .from("homeworks")
      .select("course_id")
      .eq("id", id)
      .maybeSingle();

    if (hwError || !homework) {
      return NextResponse.json({ error: "Devoir introuvable" }, { status: 404 });
    }

    const { data: course } = await (supabase as any)
      .from("courses")
      .select("instructor_id")
      .eq("id", homework.course_id)
      .maybeSingle();

    // Check roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];

    if (!course || (course.instructor_id !== user.id && !roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r)))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data, error } = await (supabase as any)
      .from("homeworks")
      .update({
        title,
        description,
        file_url: fileUrl,
        deadline,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ homework: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 });
    }

    const { data: homework } = await (supabase as any)
      .from("homeworks")
      .select("course_id")
      .eq("id", id)
      .maybeSingle();

    if (!homework) {
      return NextResponse.json({ error: "Devoir introuvable" }, { status: 404 });
    }

    const { data: course } = await (supabase as any)
      .from("courses")
      .select("instructor_id")
      .eq("id", homework.course_id)
      .maybeSingle();

    // Check roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);
    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];

    if (!course || (course.instructor_id !== user.id && !roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r)))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await (supabase as any)
      .from("homeworks")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
