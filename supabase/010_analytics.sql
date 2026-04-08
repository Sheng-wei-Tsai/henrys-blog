-- Analytics: page_views table
-- INSERT is open (beacon fires without auth)
-- SELECT is admin-only via RLS

CREATE TABLE IF NOT EXISTS page_views (
  id          bigserial PRIMARY KEY,
  path        text        NOT NULL,
  referrer    text,
  country     text,
  city        text,
  device      text        CHECK (device IN ('mobile', 'tablet', 'desktop')),
  session_id  text        NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx       ON page_views (path);
CREATE INDEX IF NOT EXISTS page_views_session_idx    ON page_views (session_id, path);

-- Dedup: one row per session+path per day
CREATE UNIQUE INDEX IF NOT EXISTS page_views_dedup_idx
  ON page_views (session_id, path, (created_at::date));

-- RLS: anyone can insert, only admins can read
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert" ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
