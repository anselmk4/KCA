import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // Step 1: Check if admin_permissions exists by trying a select
  const { error: checkErr } = await supabase.from('admin_permissions').select('id').limit(1);
  
  if (!checkErr) {
    console.log('✅ admin_permissions table already exists');
  } else {
    console.log('❌ Table missing:', checkErr.message);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ACTION REQUISE: Exécutez ce SQL dans Supabase > SQL Editor :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                text          NOT NULL DEFAULT 'SUPPORT_AGENT',
  granted_permissions text[]        DEFAULT '{}',
  revoked_permissions text[]        DEFAULT '{}',
  notes               text,
  assigned_by         uuid          REFERENCES auth.users(id),
  created_at          timestamptz   DEFAULT now(),
  updated_at          timestamptz   DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all" ON public.admin_permissions FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS admin_permissions_user_id_idx ON public.admin_permissions(user_id);
    `);
  }

  // Step 2: Seed extended settings keys
  const newSettings: any[] = [
    { key: 'platform.registration_open',         value: true,       description: 'Permettre les nouvelles inscriptions', group_name: 'general',       is_public: true  },
    { key: 'platform.maintenance_mode',           value: false,      description: 'Mode maintenance',                    group_name: 'general',       is_public: true  },
    { key: 'platform.installments_enabled',       value: true,       description: 'Paiements en tranches',               group_name: 'finance',       is_public: false },
    { key: 'platform.refund_window_days',         value: 7,          description: 'Fenetre de remboursement jours',      group_name: 'finance',       is_public: false },
    { key: 'platform.max_courses_per_instructor', value: 0,          description: 'Limite cours par formateur',          group_name: 'academic',      is_public: false },
    { key: 'notif.email_new_enrollment',          value: true,       description: 'Email inscription',                   group_name: 'notifications', is_public: false },
    { key: 'notif.email_payment_received',        value: true,       description: 'Email paiement',                      group_name: 'notifications', is_public: false },
    { key: 'notif.email_certificate_issued',      value: true,       description: 'Email certificat',                    group_name: 'notifications', is_public: false },
    { key: 'notif.email_new_ticket',              value: true,       description: 'Email ticket',                        group_name: 'notifications', is_public: false },
    { key: 'notif.email_payout_request',          value: true,       description: 'Email retrait',                       group_name: 'notifications', is_public: false },
    { key: 'security.admin_2fa_required',         value: false,      description: '2FA admin',                           group_name: 'security',      is_public: false },
    { key: 'security.session_duration_hours',     value: 24,         description: 'Duree session',                       group_name: 'security',      is_public: false },
    { key: 'security.max_login_attempts',         value: 5,          description: 'Tentatives max',                      group_name: 'security',      is_public: false },
    { key: 'security.audit_trail_enabled',        value: true,       description: 'Audit trail',                         group_name: 'security',      is_public: false },
    { key: 'appearance.primary_color',            value: '#e11d48',  description: 'Couleur principale',                  group_name: 'appearance',    is_public: true  },
    { key: 'appearance.logo_url',                 value: '',         description: 'Logo URL',                            group_name: 'appearance',    is_public: true  },
    { key: 'appearance.favicon_url',              value: '',         description: 'Favicon URL',                         group_name: 'appearance',    is_public: true  },
    { key: 'appearance.default_theme',            value: 'system',   description: 'Theme defaut',                        group_name: 'appearance',    is_public: true  },
  ];

  let inserted = 0;
  let skipped = 0;
  for (const s of newSettings) {
    const { data: existing } = await supabase.from('settings').select('key').eq('key', s.key).maybeSingle();
    if (existing) { skipped++; continue; }
    const { error } = await supabase.from('settings').insert(s);
    if (error) console.error(`Error inserting ${s.key}:`, error.message);
    else inserted++;
  }

  console.log(`\n✅ Settings seeded: ${inserted} inserted, ${skipped} already existed`);
}

run().catch(console.error);
