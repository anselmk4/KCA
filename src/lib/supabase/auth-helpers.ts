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
  role: 'STUDENT' | 'INSTRUCTOR' | 'TEACHING_ASSISTANT' | 'ADMIN' | 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'ACADEMIC_ADMIN' | 'SUPPORT_AGENT';
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
    else if (roleNames.includes('FINANCE_ADMIN')) role = 'FINANCE_ADMIN';
    else if (roleNames.includes('ACADEMIC_ADMIN')) role = 'ACADEMIC_ADMIN';
    else if (roleNames.includes('SUPPORT_AGENT')) role = 'SUPPORT_AGENT';
    else if (roleNames.includes('INSTRUCTOR')) role = 'INSTRUCTOR';
    else if (roleNames.includes('TEACHING_ASSISTANT')) role = 'TEACHING_ASSISTANT';

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
    // Check if the profile already exists (normally created via database trigger on auth.users)
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[auth-helpers] error checking existing profile:', fetchError.message);
    }

    if (existing) {
      // If it exists, update it to avoid needing the INSERT RLS policy required by upsert
      const { error } = await supabase
        .from('profiles')
        .update({
          email,
          full_name: fullName || email.split('@')[0],
        })
        .eq('id', userId);
      if (error) console.error('[auth-helpers] ensureProfile update error:', error.message);
    } else {
      // If it does not exist, insert it (requires INSERT policy or trigger fallback)
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        email,
        full_name: fullName || email.split('@')[0],
        status: 'ACTIVE',
        plan: 'FREE',
      });
      if (error) console.error('[auth-helpers] ensureProfile insert error:', error.message);
    }

    // Ensure STUDENT role exists
    const { data: studentRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'STUDENT')
      .single();

    if (studentRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role_id: studentRole.id }, { onConflict: 'user_id,role_id', ignoreDuplicates: true });
      if (roleError) console.error('[auth-helpers] ensureProfile user_roles upsert error:', roleError.message);
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
  let redirectTo = '/dashboard';
  if (
    profile.role === 'SUPER_ADMIN' ||
    profile.role === 'ADMIN' ||
    profile.role === 'FINANCE_ADMIN' ||
    profile.role === 'ACADEMIC_ADMIN' ||
    profile.role === 'SUPPORT_AGENT'
  ) {
    redirectTo = '/admin';
  } else if (profile.role === 'INSTRUCTOR' || profile.role === 'TEACHING_ASSISTANT') {
    redirectTo = '/instructor';
  }

  return { profile, redirectTo };
}
