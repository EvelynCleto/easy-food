-- Persistent conversation history for the AI Coach chat
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.coach_messages TO authenticated;
GRANT ALL ON public.coach_messages TO service_role;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own coach messages" ON public.coach_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS coach_messages_user_time ON public.coach_messages(user_id, created_at);
