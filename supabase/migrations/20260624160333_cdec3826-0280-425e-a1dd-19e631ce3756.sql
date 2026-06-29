ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calorie_goal integer NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS protein_goal integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS water_goal_ml integer NOT NULL DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS streak_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS weight_kg numeric(5,2),
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text[],
  ADD COLUMN IF NOT EXISTS loyalty_tier text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;