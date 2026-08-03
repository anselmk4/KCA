const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.dwhtfoqqbwsycthpksqu',
    password: '4PHXIh0F6qTgvAfF',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Migrating community_posts and community_comments tables...");

    await client.query(`
      -- Add missing columns to community_posts
      ALTER TABLE public.community_posts
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'REFLECTIONS',
        ADD COLUMN IF NOT EXISTS resource_url TEXT,
        ADD COLUMN IF NOT EXISTS media_urls TEXT[],
        ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS reactions_count JSONB DEFAULT '{"LIKE":0,"BRAVO":0,"INTERESTING":0,"GENIUS":0,"LOVE":0}'::jsonb,
        ADD COLUMN IF NOT EXISTS author_name TEXT,
        ADD COLUMN IF NOT EXISTS author_avatar TEXT,
        ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'STUDENT';

      -- Add missing columns to community_comments
      ALTER TABLE public.community_comments
        ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS author_name TEXT,
        ADD COLUMN IF NOT EXISTS author_avatar TEXT,
        ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'STUDENT';

      -- Table for user post reactions to prevent duplicate likes
      CREATE TABLE IF NOT EXISTS public.community_post_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        reaction_type TEXT NOT NULL DEFAULT 'LIKE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(post_id, user_id)
      );

      -- Index for fast retrieval
      CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_comments(post_id);
    `);

    console.log("Community tables migration completed successfully!");

  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    await client.end();
  }
}

run();
