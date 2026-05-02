-- Upgrade: profile-scoped DM table for the /network feature.
-- Unlike network_messages (sender/recipient by profiles.id / user identity),
-- dm_messages references anonymous_profiles.id — keeping all communication
-- truly anonymous. Both sender and recipient must be on the network.
-- Application enforces: max 20 messages per sender profile per 24 h (anti-spam).

CREATE TABLE IF NOT EXISTS public.dm_messages (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_profile_id    uuid        NOT NULL REFERENCES public.anonymous_profiles(id) ON DELETE CASCADE,
  recipient_profile_id uuid        NOT NULL REFERENCES public.anonymous_profiles(id) ON DELETE CASCADE,
  content              text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at           timestamptz NOT NULL DEFAULT now(),
  read_at              timestamptz,
  deleted_by_sender    boolean     NOT NULL DEFAULT false,
  deleted_by_recipient boolean     NOT NULL DEFAULT false,
  CONSTRAINT dm_no_self_message CHECK (sender_profile_id <> recipient_profile_id)
);

ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages where they are the sender or recipient
CREATE POLICY "dm_users_read_own_messages"
  ON public.dm_messages FOR SELECT
  USING (
    sender_profile_id    IN (SELECT id FROM public.anonymous_profiles WHERE user_id = auth.uid())
    OR
    recipient_profile_id IN (SELECT id FROM public.anonymous_profiles WHERE user_id = auth.uid())
  );

-- Users can only insert messages from their own profile
CREATE POLICY "dm_users_send_messages"
  ON public.dm_messages FOR INSERT
  WITH CHECK (
    sender_profile_id IN (SELECT id FROM public.anonymous_profiles WHERE user_id = auth.uid())
  );

-- Users can update (mark read / soft-delete) messages they are a party to
CREATE POLICY "dm_users_update_own_messages"
  ON public.dm_messages FOR UPDATE
  USING (
    sender_profile_id    IN (SELECT id FROM public.anonymous_profiles WHERE user_id = auth.uid())
    OR
    recipient_profile_id IN (SELECT id FROM public.anonymous_profiles WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS dm_messages_sender_idx
  ON public.dm_messages (sender_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS dm_messages_recipient_idx
  ON public.dm_messages (recipient_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS dm_messages_thread_idx
  ON public.dm_messages (sender_profile_id, recipient_profile_id, created_at DESC);
