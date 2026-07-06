
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS persona text,
  ADD COLUMN IF NOT EXISTS first_message text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS owner_id uuid;

DROP POLICY IF EXISTS "Characters are publicly readable" ON public.characters;

CREATE POLICY "Public or own characters readable"
  ON public.characters FOR SELECT
  USING (visibility = 'public' OR owner_id = auth.uid());

CREATE POLICY "Users can insert own characters"
  ON public.characters FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own characters"
  ON public.characters FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own characters"
  ON public.characters FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

GRANT INSERT, UPDATE, DELETE ON public.characters TO authenticated;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX chat_messages_user_char_time
  ON public.chat_messages (user_id, character_id, created_at);
