import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Verify admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("[list-users] Error reading user roles:", rolesError);
    }

    const roles = userRoles?.map((ur: any) => ur.roles?.name) || [];
    const isAuthorized = roles.some(r => ["SUPER_ADMIN", "ADMIN"].includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé. Droits administrateurs requis." }, { status: 403 });
    }

    // 1. Fetch profiles using admin service role
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profErr) throw profErr;

    // 2. Fetch user roles
    const { data: allUserRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role_id, roles(name)");

    const roleMap = new Map<string, string[]>();
    allUserRoles?.forEach((ur: any) => {
      const name = ur.roles?.name;
      if (name) {
        const list = roleMap.get(ur.user_id) || [];
        list.push(name);
        roleMap.set(ur.user_id, list);
      }
    });

    // 3. Fetch Auth Users to check email_confirmed_at
    const authUserMap = new Map<string, { email_confirmed_at: string | null }>();
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      authData?.users?.forEach(u => {
        authUserMap.set(u.id, { email_confirmed_at: u.email_confirmed_at || null });
      });
    } catch (authErr) {
      console.warn("[admin/users/list] Auth user list warning:", authErr);
    }

    // 4. Map profiles to admin user items
    const users = (profiles || []).map((p: any) => {
      const userRolesList = roleMap.get(p.id) || [];
      let role = 'STUDENT';
      if (userRolesList.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
      else if (userRolesList.includes('ADMIN')) role = 'ADMIN';
      else if (userRolesList.includes('INSTRUCTOR')) role = 'INSTRUCTOR';

      const authUser = authUserMap.get(p.id);
      const isEmailConfirmed = !!authUser?.email_confirmed_at;

      let status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' = 'ACTIVE';
      if (p.status === 'SUSPENDED') {
        status = 'SUSPENDED';
      } else if (p.status === 'INACTIVE' || !isEmailConfirmed) {
        status = 'INACTIVE';
      }

      return {
        id: p.id,
        name: p.full_name || 'Utilisateur anonyme',
        email: p.email || '',
        role,
        status,
        plan: p.plan || 'FREE',
        level: p.level || 'Débutant',
        joinedAt: p.created_at || new Date().toISOString(),
        phoneNumber: p.phone || '',
        country: p.nationality || '',
        gender: p.gender || '',
        bio: p.bio || '',
        nationality: p.nationality || '',
        website: p.website || '',
        twitter: p.twitter || '',
        linkedin: p.linkedin || '',
        youtube: p.youtube || '',
        instagram: p.instagram || '',
        specialty: p.specialty || '',
        academyName: p.academy_name || '',
        academyTagline: p.academy_tagline || '',
        academicBackground: p.academic_background || '',
        certifications: p.certifications || '',
        referralCode: p.referral_code || '',
        affiliatePoints: p.affiliate_points || 0,
        isEmailConfirmed
      };
    });

    users.sort((a: any, b: any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("[admin/users/list] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
