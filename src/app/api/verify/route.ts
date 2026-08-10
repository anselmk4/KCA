import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize admin client to bypass RLS restrictions for public certificate verification
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/verify?code=CERT-XXXXXX-YYYY
 * Route publique — vérifie un code de certificat.
 * Retourne les infos du certificat si valide.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'code est requis', valid: false }, { status: 400 });
    }

    // Query certificates table using admin client to bypass RLS
    const { data: cert, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        id,
        code,
        issued_at,
        status,
        student_id,
        course_id,
        courses!course_id(title, level, instructor_id)
      `)
      .eq('code', code)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message, valid: false }, { status: 400 });
    }

    if (!cert) {
      return NextResponse.json({ valid: false, message: 'Certificat introuvable ou invalide.' }, { status: 404 });
    }

    if (cert.status === 'REVOKED') {
      return NextResponse.json({ valid: false, message: 'Ce certificat a été révoqué.' }, { status: 200 });
    }

    // Récupérer le nom de l'étudiant
    let studentName = 'Apprenant';
    if (cert.student_id) {
      const { data: student } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', cert.student_id)
        .maybeSingle();
      if (student) studentName = student.full_name;
    }

    // Récupérer le nom de l'instructeur et de l'académie
    let instructorName = 'Instructeur ANSELLA';
    let academyName = 'ANSELLA ACADEMY';
    const instructorId = (cert.courses as any)?.instructor_id;
    if (instructorId) {
      const { data: instructor } = await supabaseAdmin
        .from('profiles')
        .select('full_name, academy_name')
        .eq('id', instructorId)
        .maybeSingle();
      if (instructor) {
        instructorName = instructor.full_name;
        if (instructor.academy_name) {
          academyName = instructor.academy_name;
        }
      }
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        code: cert.code,
        issuedAt: cert.issued_at,
        status: cert.status,
        studentName,
        courseTitle: (cert.courses as any)?.title || 'Formation',
        courseLevel: (cert.courses as any)?.level || '',
        instructorName,
        academyName,
      },
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur interne', valid: false }, { status: 500 });
  }
}

