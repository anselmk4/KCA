/**
 * auth-helpers.ts
 * Centralized Supabase auth helpers.
 * Reads profile/role directly from Supabase — no localStorage dependency.
 */

import { supabase } from './client';
import { setSimulatedSession } from '../rbac';

export type AuthProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  plan: 'FREE' | 'BASE' | 'PRO' | 'MAX';
  status: string;
};

/**
 * Fetch the profile + primary role for a given user ID directly from Supabase.
 * Returns null if not found or RLS blocks access.
 */
export async function fetchUserProfile(userId: string): Promise<AuthProfile | null> {
  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan, status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[auth-helpers] Profile fetch error:', profileError?.message);
      return null;
    }

    // Fetch roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', userId);

    // Determine primary role (priority order)
    let role: AuthProfile['role'] = 'STUDENT';
    const roleNames: string[] = [];
    userRoles?.forEach((ur: any) => {
      const name = ur.roles?.name;
      if (name) roleNames.push(name);
    });

    if (roleNames.includes('SUPER_ADMIN')) role = 'SUPER_ADMIN';
    else if (roleNames.includes('ADMIN')) role = 'ADMIN';
    else if (roleNames.includes('INSTRUCTOR')) role = 'INSTRUCTOR';

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role,
      plan: (profile.plan as AuthProfile['plan']) || 'FREE',
      status: profile.status || 'ACTIVE',
    };
  } catch (err) {
    console.error('[auth-helpers] Unexpected error fetching profile:', err);
    return null;
  }
}

/**
 * Ensure a profile exists for the given auth user.
 * Creates one via upsert if missing (fallback for trigger failures).
 */
export async function ensureProfile(userId: string, email: string, fullName: string): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName || email.split('@')[0],
        status: 'ACTIVE',
        plan: 'FREE',
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );
    if (error) console.error('[auth-helpers] ensureProfile upsert error:', error.message);

    // Ensure STUDENT role exists
    const { data: studentRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'STUDENT')
      .single();

    if (studentRole) {
      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role_id: studentRole.id }, { onConflict: 'user_id,role_id', ignoreDuplicates: true });
    }
  } catch (err) {
    console.error('[auth-helpers] ensureProfile error:', err);
  }
}

/**
 * Full login flow:
 * 1. signInWithPassword
 * 2. fetchUserProfile (direct Supabase read)
 * 3. If profile missing → ensureProfile (auto-repair)
 * 4. setSimulatedSession
 * Returns { profile, role, redirectTo } or throws with a French error message.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ profile: AuthProfile; redirectTo: string }> {
  const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      throw new Error('Email ou mot de passe incorrect.');
    }
    if (msg.includes('email not confirmed')) {
      throw new Error('Votre email n\'est pas encore confirmé. Vérifiez votre boîte mail.');
    }
    throw new Error(authError.message);
  }

  const sessionUser = data.user;
  if (!sessionUser) throw new Error('Erreur de connexion. Réessayez.');

  // Fetch profile directly from Supabase
  let profile = await fetchUserProfile(sessionUser.id);

  // Auto-repair: profile missing (trigger failed) → create it now
  if (!profile) {
    const fullName =
      sessionUser.user_metadata?.full_name ||
      sessionUser.email?.split('@')[0] ||
      'Utilisateur';
    await ensureProfile(sessionUser.id, sessionUser.email!, fullName);
    profile = await fetchUserProfile(sessionUser.id);
  }

  if (!profile) {
    throw new Error(
      'Profil introuvable. Contactez le support ou réessayez dans quelques secondes.'
    );
  }

  // Set session for the app
  setSimulatedSession({
    userId: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    status: profile.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    plan: profile.plan,
  });

  // Determine redirect
  const redirectTo =
    profile.role === 'INSTRUCTOR' || profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN'
      ? '/instructor'
      : '/dashboard';

  return { profile, redirectTo };
}
