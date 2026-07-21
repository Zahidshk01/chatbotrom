
-- push_subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

-- notifications_state
CREATE TABLE public.notifications_state (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, character_id)
);

GRANT SELECT ON public.notifications_state TO authenticated;
GRANT ALL ON public.notifications_state TO service_role;

ALTER TABLE public.notifications_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notification state"
  ON public.notifications_state FOR SELECT
  USING (auth.uid() = user_id);

-- Enable cron/net
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule hourly reminder trigger
SELECT cron.schedule(
  'send-character-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--96b47234-871a-4d26-a83b-f54bbedeeed8.lovable.app/api/public/hooks/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_usKkqstlxXRef2O_1w6KCw_KU5qk9Q8'
    ),
    body := '{}'::jsonb
  );
  $$
);
