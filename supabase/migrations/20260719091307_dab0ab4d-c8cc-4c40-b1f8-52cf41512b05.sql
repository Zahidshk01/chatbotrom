
-- Reports table
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_target text NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_reports TO authenticated;
GRANT ALL ON public.user_reports TO service_role;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own reports" ON public.user_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users see own reports" ON public.user_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Blocks table
CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL,
  blocked_target text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_target)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own blocks" ON public.user_blocks
  FOR ALL TO authenticated USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);
