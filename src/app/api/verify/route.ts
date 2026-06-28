import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/verify?code=CERT-XXXXXX-YYYY
 * Route publique — vérifie un code de certificat.
 * Retourne les infos du certificat si valide.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'code est requis', valid: false }, { status: 400 });
    }

    const { data: cert, error } = await supabase
      .from('certificates')
      .select(`
        id,
        code,
        issued_at,
        status,
        student_id,
        course_id,
        profiles!student_id(full_name, email),
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

    // Récupérer le nom de l'instructeur
    let instructorName = 'Instructeur ANSELLA';
    if ((cert.courses as any)?.instructor_id) {
      const { data: instructor } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', (cert.courses as any).instructor_id)
        .maybeSingle();
      if (instructor) instructorName = instructor.full_name;
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        code: cert.code,
        issuedAt: cert.issued_at,
        status: cert.status,
        studentName: (cert.profiles as any)?.full_name || 'Apprenant',
        courseTitle: (cert.courses as any)?.title || 'Formation',
        courseLevel: (cert.courses as any)?.level || '',
        instructorName,
      },
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur interne', valid: false }, { status: 500 });
  }
}
