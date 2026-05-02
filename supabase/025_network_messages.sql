-- Direct messages for the /network community (auth-gated, anti-spam)
-- Senders must have an anonymous_profile. Rate-limited to 5 per sender per 24h (enforced in API).
-- Identity is shown via sender's anonymous profile (role + city), never real name or email.

CREATE TABLE IF NOT EXISTS public.network_messages (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_profile_id uuid        REFERENCES public.anonymous_profiles(id) ON DELETE SET NULL,
  content           text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  read_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

ALTER TABLE public.network_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender can insert message"
  ON public.network_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Parties can read messages"
  ON public.network_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Recipient can mark read"
  ON public.network_messages FOR UPDATE
  USING  (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS network_messages_recipient_idx
  ON public.network_messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS network_messages_sender_idx
  ON public.network_messages (sender_id, created_at DESC);
