ALTER PUBLICATION supabase_realtime ADD TABLE public.user_user_follows;
ALTER TABLE public.user_user_follows REPLICA IDENTITY FULL;