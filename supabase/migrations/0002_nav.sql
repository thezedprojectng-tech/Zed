-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_nav.sql
-- Zed Project – Phase 1: Nav progress + Center reports
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Nav Progress ──────────────────────────────────────────────────────────────
CREATE TABLE public.nav_progress (
  user_id           UUID         NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  flow_id           TEXT         NOT NULL,
  current_step      TEXT         NOT NULL,
  completed_steps   JSONB        NOT NULL DEFAULT '[]',
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, flow_id)
);

CREATE TRIGGER nav_progress_updated_at
  BEFORE UPDATE ON public.nav_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: users can only see and modify their own progress
ALTER TABLE public.nav_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nav_progress: select own"
  ON public.nav_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "nav_progress: insert own"
  ON public.nav_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nav_progress: update own"
  ON public.nav_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nav_progress: delete own"
  ON public.nav_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ── Center Reports ────────────────────────────────────────────────────────────
CREATE TABLE public.center_reports (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  center_name   TEXT         NOT NULL,
  state         TEXT         NOT NULL,
  wait_minutes  INT          NOT NULL CHECK (wait_minutes >= 0),
  reported_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- RLS: open read, authenticated insert only
ALTER TABLE public.center_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "center_reports: public read"
  ON public.center_reports FOR SELECT
  USING (TRUE);

CREATE POLICY "center_reports: authenticated insert"
  ON public.center_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);
