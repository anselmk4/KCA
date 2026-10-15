import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    // 3. Fetch Auth Users with full metadata
    const authUserMap = new Map<string, any>();
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      authData?.users?.forEach(u => {
        authUserMap.set(u.id, u);
      });
    } catch (authErr) {
      console.warn("[admin/users/list] Auth user list warning:", authErr);
    }

    // 4. Map profiles to admin user items
    const profileIds = new Set<string>();
    const users = (profiles || []).map((p: any) => {
      profileIds.add(p.id);
      const userRolesList = roleMap.get(p.id) || [];
      let role = 'STUDENT';
      if (userRolesList.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
      else if (userRolesList.includes('ADMIN')) role = 'ADMIN';
      else if (userRolesList.includes('INSTRUCTOR')) role = 'INSTRUCTOR';

      const authUser = authUserMap.get(p.id);
      const meta = authUser?.user_metadata || {};
      const isEmailConfirmed = !!authUser?.email_confirmed_at;

      let status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' = 'ACTIVE';
      if (p.status === 'SUSPENDED') {
        status = 'SUSPENDED';
      } else if (p.status === 'INACTIVE' || !isEmailConfirmed) {
        status = 'INACTIVE';
      }

      // Merge data from both profiles and auth user_metadata (covering both column naming conventions)
      const resolvedPhone = p.phone || p.phone_number || meta.phone_number || meta.phone || authUser?.phone || '';
      const resolvedCountry = p.country || meta.country || p.nationality || meta.nationality || '';
      const resolvedNationality = p.nationality || meta.nationality || p.country || meta.country || '';
      const resolvedGender = p.gender || meta.gender || '';
      const resolvedBio = p.bio || meta.bio || '';
      const resolvedAcademy = p.academy_name || meta.academy_name || '';
      const resolvedSpecialty = p.specialty || meta.thematic || meta.specialty || '';
      const resolvedLevel = p.level || meta.student_level || 'Débutant';

      // Auto-repair profile if fields were in user_metadata but missing in profiles table
      if ((!p.phone && resolvedPhone) || (!p.country && resolvedCountry) || (!p.gender && resolvedGender)) {
        supabaseAdmin.from('profiles').update({
          phone: resolvedPhone || undefined,
          phone_number: resolvedPhone || undefined,
          country: resolvedCountry || undefined,
          nationality: resolvedNationality || undefined,
          gender: resolvedGender || undefined,
        }).eq('id', p.id).then().catch(() => {});
      }

      return {
        id: p.id,
        name: p.full_name || meta.full_name || meta.name || 'Utilisateur anonyme',
        email: p.email || authUser?.email || '',
        role,
        status,
        plan: p.plan || 'FREE',
        level: resolvedLevel,
        joinedAt: p.created_at || authUser?.created_at || new Date().toISOString(),
        phoneNumber: resolvedPhone,
        country: resolvedCountry,
        gender: resolvedGender,
        bio: resolvedBio,
        nationality: resolvedNationality,
        website: p.website || '',
        twitter: p.twitter || '',
        linkedin: p.linkedin || '',
        youtube: p.youtube || '',
        instagram: p.instagram || '',
        specialty: resolvedSpecialty,
        academyName: resolvedAcademy,
        academyTagline: p.academy_tagline || '',
        academicBackground: p.academic_background || '',
        certifications: p.certifications || '',
        referralCode: p.referral_code || '',
        affiliatePoints: p.affiliate_points || 0,
        isEmailConfirmed
      };
    });

    // Also include any auth users that do not yet have a row in profiles
    for (const [authId, authU] of authUserMap.entries()) {
      if (!profileIds.has(authId)) {
        const meta = authU.user_metadata || {};
        const userRolesList = roleMap.get(authId) || [];
        let role = 'STUDENT';
        if (userRolesList.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
        else if (userRolesList.includes('ADMIN')) role = 'ADMIN';
        else if (userRolesList.includes('INSTRUCTOR')) role = 'INSTRUCTOR';

        const resolvedPhone = meta.phone_number || meta.phone || authU.phone || '';
        const resolvedCountry = meta.country || meta.nationality || '';
        const resolvedNationality = meta.nationality || meta.country || '';
        const resolvedGender = meta.gender || '';

        users.push({
          id: authId,
          name: meta.full_name || meta.name || authU.email?.split('@')[0] || 'Utilisateur',
          email: authU.email || '',
          role: role as any,
          status: authU.email_confirmed_at ? 'ACTIVE' : 'INACTIVE',
          plan: 'FREE',
          level: meta.student_level || 'Débutant',
          joinedAt: authU.created_at || new Date().toISOString(),
          phoneNumber: resolvedPhone,
          country: resolvedCountry,
          gender: resolvedGender,
          bio: meta.bio || '',
          nationality: resolvedNationality,
          website: '',
          twitter: '',
          linkedin: '',
          youtube: '',
          instagram: '',
          specialty: meta.thematic || '',
          academyName: meta.academy_name || '',
          academyTagline: '',
          academicBackground: '',
          certifications: '',
          referralCode: '',
          affiliatePoints: 0,
          isEmailConfirmed: !!authU.email_confirmed_at,
        });
      }
    }

    users.sort((a: any, b: any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("[admin/users/list] Error:", err);
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
