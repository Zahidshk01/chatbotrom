
-- User-to-user follows
CREATE TABLE public.user_user_follows (
  follower_id uuid NOT NULL,
  followed_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_user_follows TO authenticated;
GRANT ALL ON public.user_user_follows TO service_role;
ALTER TABLE public.user_user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all follows" ON public.user_user_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follow as self" ON public.user_user_follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "unfollow as self" ON public.user_user_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

CREATE INDEX idx_uuf_followed ON public.user_user_follows(followed_id);
CREATE INDEX idx_uuf_follower ON public.user_user_follows(follower_id);

-- Direct messages between users
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
GRANT SELECT, INSERT, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own dms" ON public.direct_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "send as self" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "delete own sent" ON public.direct_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

CREATE INDEX idx_dm_pair ON public.direct_messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_dm_recipient ON public.direct_messages(recipient_id, created_at);
