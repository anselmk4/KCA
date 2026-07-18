import { NextRequest, NextResponse } from "next/server";
import { createClient as createDirectClient } from "@supabase/supabase-js";

const supabaseAdmin = createDirectClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    // 1. Fetch profile
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, plan, status')
      .eq('id', userId)
      .maybeSingle();

    // 2. If profile is missing, auto-create it (repair)
    if (!profile && email) {
      const fullName = email.split('@')[0] || 'Utilisateur';
      
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          status: 'ACTIVE',
          plan: 'FREE',
        })
        .select('id, email, full_name, plan, status')
        .single();

      if (insertError) {
        console.error('[login-profile] Auto-repair insert error:', insertError.message);
      } else {
        profile = newProfile;
      }
      
      // Ensure STUDENT role exists in user_roles if no role exists
      const { data: existingRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId);

      if (!existingRoles || existingRoles.length === 0) {
        const { data: studentRole } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'STUDENT')
          .single();

        if (studentRole) {
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: userId, role_id: studentRole.id });
        }
      }
    }

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // 3. Fetch roles
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', userId);

    let role = 'STUDENT';
    const roleNames: string[] = [];
    userRoles?.forEach((ur: any) => {
      const name = ur.roles?.name;
      if (name) roleNames.push(name);
    });

    if (roleNames.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
    else if (roleNames.includes('ADMIN')) role = 'ADMIN';
    else if (roleNames.includes('FINANCE_ADMIN')) role = 'FINANCE_ADMIN';
    else if (roleNames.includes('ACADEMIC_ADMIN')) role = 'ACADEMIC_ADMIN';
    else if (roleNames.includes('SUPPORT_AGENT')) role = 'SUPPORT_AGENT';
    else if (roleNames.includes('INSTRUCTOR')) role = 'INSTRUCTOR';
    else if (roleNames.includes('TEACHING_ASSISTANT')) role = 'TEACHING_ASSISTANT';

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email || email || '',
        full_name: profile.full_name,
        role,
        plan: profile.plan || 'FREE',
        status: profile.status || 'ACTIVE',
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error("[login-profile] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
