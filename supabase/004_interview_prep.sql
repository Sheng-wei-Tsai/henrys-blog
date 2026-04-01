-- Migration 004: Gamified Interview Prep
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS interview_progress (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role_id           text NOT NULL,
  question_hash     text NOT NULL,
  question_text     text NOT NULL,
  stage             text NOT NULL DEFAULT 'not_started',
  -- not_started | learning | practiced | mastered
  score             int,
  xp_earned         int NOT NULL DEFAULT 0,
  attempts          int NOT NULL DEFAULT 0,
  last_practiced_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id, question_hash)
);

ALTER TABLE interview_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own interview progress" ON interview_progress;
CREATE POLICY "Users manage own interview progress"
  ON interview_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add XP and level to profiles (safe to run multiple times)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS interview_xp    int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interview_level int NOT NULL DEFAULT 1;
