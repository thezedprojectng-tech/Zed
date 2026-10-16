-- ─── 0007_zed_skill.sql ────────────────────────────────────────────────────
-- Zed Skill v1: practical career and digital skills learning tracks.
-- ALL statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- Do NOT run manually; apply via Supabase dashboard or CLI.

-- ── 1. skill_tracks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.skill_tracks (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text           NOT NULL UNIQUE,
  title         text           NOT NULL,
  description   text           NOT NULL,
  is_published  boolean        NOT NULL DEFAULT true,
  created_at    timestamptz    NOT NULL DEFAULT now()
);

-- ── 2. skill_lessons ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.skill_lessons (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      uuid           NOT NULL REFERENCES public.skill_tracks(id) ON DELETE CASCADE,
  title         text           NOT NULL,
  summary       text           NOT NULL,
  content_md    text           NOT NULL,
  content_url   text,
  position      int            NOT NULL DEFAULT 1,
  skill_points  int            NOT NULL DEFAULT 10 CHECK (skill_points >= 0),
  created_at    timestamptz    NOT NULL DEFAULT now()
);

-- ── 3. skill_progress ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.skill_progress (
  id            bigint         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       uuid           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id     uuid           NOT NULL REFERENCES public.skill_lessons(id) ON DELETE CASCADE,
  completed_at  timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT skill_progress_user_lesson_unique UNIQUE (user_id, lesson_id)
);

-- ── 4. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS skill_lessons_track_pos_idx
  ON public.skill_lessons (track_id, position ASC);

CREATE INDEX IF NOT EXISTS skill_progress_user_idx
  ON public.skill_progress (user_id, completed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS skill_lessons_track_pos_uniq
  ON public.skill_lessons (track_id, position);

-- ── 5. Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE public.skill_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;

-- skill_tracks: authenticated can read published tracks; admins read all
DROP POLICY IF EXISTS "skill_tracks: authenticated select published" ON public.skill_tracks;
CREATE POLICY "skill_tracks: authenticated select published"
  ON public.skill_tracks FOR SELECT
  TO authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "skill_tracks: admin select all" ON public.skill_tracks;
CREATE POLICY "skill_tracks: admin select all"
  ON public.skill_tracks FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- skill_lessons: authenticated can read lessons of published tracks; admins read all
DROP POLICY IF EXISTS "skill_lessons: authenticated select published" ON public.skill_lessons;
CREATE POLICY "skill_lessons: authenticated select published"
  ON public.skill_lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.skill_tracks t
      WHERE t.id = skill_lessons.track_id
        AND t.is_published = true
    )
  );

DROP POLICY IF EXISTS "skill_lessons: admin select all" ON public.skill_lessons;
CREATE POLICY "skill_lessons: admin select all"
  ON public.skill_lessons FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- skill_progress: users select own progress only; admins read all
DROP POLICY IF EXISTS "skill_progress: user select own" ON public.skill_progress;
CREATE POLICY "skill_progress: user select own"
  ON public.skill_progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "skill_progress: admin select all" ON public.skill_progress;
CREATE POLICY "skill_progress: admin select all"
  ON public.skill_progress FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- No direct INSERT / UPDATE / DELETE for users
REVOKE INSERT, UPDATE, DELETE ON public.skill_tracks FROM authenticated, anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.skill_lessons FROM authenticated, anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.skill_progress FROM authenticated, anon, PUBLIC;

-- ── 6. Function: complete_lesson() ───────────────────────────────────────────
--
-- Takes p_lesson_id. Uses auth.uid() inside; raises if null.
-- SECURITY DEFINER, SET search_path = public.
-- Requires users.is_verified = true.
-- Idempotent: completing twice awards points only once.
-- Returns jsonb: { ok, points_awarded, total_skill_points, already_completed }

CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id             uuid;
  v_is_verified         boolean;
  v_lesson_points       int;
  v_already_completed   boolean;
  v_points_awarded      int := 0;
  v_total_skill_points  int := 0;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify user
  SELECT is_verified
  INTO   v_is_verified
  FROM   public.users
  WHERE  id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'User is not verified. Account must be verified to complete lessons.';
  END IF;

  -- 3. Check lesson exists and get points
  SELECT l.skill_points
  INTO   v_lesson_points
  FROM   public.skill_lessons l
  JOIN   public.skill_tracks t ON t.id = l.track_id
  WHERE  l.id = p_lesson_id
    AND  t.is_published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  -- 4. Check if already completed (idempotency check)
  SELECT EXISTS (
    SELECT 1 FROM public.skill_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id
  ) INTO v_already_completed;

  IF NOT v_already_completed THEN
    -- First time completion: insert progress record and award points
    INSERT INTO public.skill_progress (user_id, lesson_id, completed_at)
    VALUES (v_user_id, p_lesson_id, now())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    -- If successfully inserted, points awarded = lesson points
    IF FOUND THEN
      v_points_awarded := v_lesson_points;
    ELSE
      v_already_completed := true;
      v_points_awarded := 0;
    END IF;
  ELSE
    v_points_awarded := 0;
  END IF;

  -- 5. Calculate cumulative total skill points earned by user
  SELECT COALESCE(SUM(l.skill_points), 0)::int
  INTO   v_total_skill_points
  FROM   public.skill_progress p
  JOIN   public.skill_lessons l ON l.id = p.lesson_id
  WHERE  p.user_id = v_user_id;

  -- 6. Return response
  RETURN jsonb_build_object(
    'ok',                 true,
    'points_awarded',     v_points_awarded,
    'total_skill_points', v_total_skill_points,
    'already_completed',  v_already_completed
  );
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.complete_lesson(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_lesson(uuid) TO authenticated;

-- ── 7. Starter Seeds (2 practical tracks, 3 lessons each) ────────────────────

DO $$
DECLARE
  v_track1_id uuid;
  v_track2_id uuid;
BEGIN
  -- Track 1: Job Readiness & CV Writing
  INSERT INTO public.skill_tracks (slug, title, description, is_published)
  VALUES (
    'job-readiness-cv',
    'Job Readiness & CV Writing',
    'Learn how to write a competitive Nigerian graduate CV, craft tailored applications, and prepare for entry-level interviews without fluff.',
    true
  )
  ON CONFLICT (slug) DO UPDATE
    SET title = EXCLUDED.title, description = EXCLUDED.description
  RETURNING id INTO v_track1_id;

  -- Lessons for Track 1
  INSERT INTO public.skill_lessons (track_id, title, summary, content_md, position, skill_points)
  VALUES
    (
      v_track1_id,
      'Structuring a Modern Professional CV',
      'Learn the standard single-to-two-page structure that recruiters and automated screening tools look for.',
      '### What a Great Entry-Level CV Looks Like

Recruiters often spend only a few seconds on a first look at a CV. A messy layout or unclear summary can get a strong candidate rejected before their qualifications are even evaluated.

#### Core Structure:
1. **Header**: Full Name (bold), Phone Number, Professional Email (e.g. `firstname.lastname@gmail.com`), City/State, and LinkedIn Profile link. Do not include date of birth, marital status, or state of origin unless a job specifically requires it.
2. **Professional Summary**: 2 to 3 sentences defining your background, strongest skill area, and the practical value you bring.
3. **Education**: Degree title, Institution, Year of Graduation, and Class of Degree (if 2:1 or First Class).
4. **Key Skills**: Group into Technical Tools (e.g. Excel, Canva, SQL, Python) and Soft Skills (e.g. Written Communication, Project Coordination).
5. **Experience / Projects**: List in reverse chronological order with action verbs and quantifiable results.
6. **Leadership & Volunteering**: NYSC CDS participation, university society leadership, or community projects.',
      1,
      15
    ),
    (
      v_track1_id,
      'Writing Impactful Bullet Points & Action Verbs',
      'Transform vague duty descriptions into strong, evidence-backed achievements using the STAR approach.',
      '### Move Beyond "Responsible For"

Generic statements like *"Responsible for customer service"* tell a hiring manager what your duties were, but nothing about how well you performed.

#### The Formula: Action Verb + Context + Result

- **Weak**: "Assisted with inventory management at the warehouse."
- **Strong**: "Reconciled weekly stock counts for 1,200+ inventory items using Excel, cutting reconciliation discrepancies by 25%."

#### Key Action Verbs to Use:
- **Leadership**: Coordinated, Spearheaded, Mentored, Organized, Facilitated
- **Execution**: Designed, Implemented, Automated, Audited, Consolidated
- **Communication**: Negotiated, Presented, Documented, Authored, Resolved

Always proofread carefully. Spelling errors in your CV signal a lack of attention to detail.',
      2,
      15
    ),
    (
      v_track1_id,
      'Entry-Level Interview Preparation & Follow-Up',
      'Prepare for behavioral questions, research employers effectively, and follow up professionally.',
      '### How to Ace Your Entry-Level Interview

An interview is a two-way evaluation. Preparing structured responses and asking informed questions sets you apart from unprepared applicants.

#### 1. Research the Organization Beforehand
- Look up the company website, recent news, and product offerings.
- Understand what problems they solve and what their primary customer base looks like.

#### 2. Master the "Tell Me About Yourself" Pitch
Keep it under 90 seconds covering three phases:
- **Present**: Who you are right now and your current focus.
- **Past**: Key academic background, NYSC experience, or standout project.
- **Future**: Why this role at this organization is the logical next step.

#### 3. Ask Thoughtful Questions
When asked *"Do you have any questions for us?"*, never say no. Ask:
- *"What does success look like in the first 90 days for someone in this role?"*
- *"What are the biggest challenges the team is currently working to resolve?"*',
      3,
      20
    )
  ON CONFLICT (track_id, position) DO NOTHING;

  -- Track 2: Essential Digital Workplace Skills
  INSERT INTO public.skill_tracks (slug, title, description, is_published)
  VALUES (
    'digital-workplace-skills',
    'Essential Digital Workplace Skills',
    'Master cloud collaboration, professional email communication, and basic data safety practices needed for modern distributed workplaces.',
    true
  )
  ON CONFLICT (slug) DO UPDATE
    SET title = EXCLUDED.title, description = EXCLUDED.description
  RETURNING id INTO v_track2_id;

  -- Lessons for Track 2
  INSERT INTO public.skill_lessons (track_id, title, summary, content_md, position, skill_points)
  VALUES
    (
      v_track2_id,
      'Professional Email Etiquette & Remote Communication',
      'Communicate clearly, write concise subject lines, and master workplace chat etiquette.',
      '### The Fundamentals of Workplace Communication

In hybrid and remote workplaces, your written messages are your primary reputation builder.

#### 1. Clear Subject Lines
- Bad: "Help", "Quick question", "Meeting"
- Good: "[Action Required] Q3 Report Review by Friday 3 PM", "[Update] Marketing Campaign Launch Checklist"

#### 2. The 3-Part Message Rule
- **Context**: State what this message is about in one sentence.
- **Core Message / Ask**: Bullet points for readability. Make action items explicit.
- **Next Steps / Deadlines**: State who is responsible for what and when it is due.

#### 3. Tone and Proofreading
- Keep messages professional and polite without sounding overly formal or bureaucratic.
- Always check that attachments mentioned in your text are actually attached before clicking Send.',
      1,
      15
    ),
    (
      v_track2_id,
      'Cloud Collaboration: Google Docs & Spreadsheets',
      'Organize shared documents, manage permission levels safely, and collaborate concurrently.',
      '### Collaborating in the Cloud

Modern teams rarely email file attachments back and forth as Word documents. Instead, they collaborate concurrently in cloud suites like Google Workspace and Microsoft 365.

#### Essential Practices:
1. **Access Permissions**:
   - **Viewer**: When you want people to read only.
   - **Commenter**: Ideal for drafts, reviews, and client feedback.
   - **Editor**: Reserved for team members who actively contribute content.
2. **Version History**:
   - If an error is introduced, do not panic. Use `File > Version History` to restore an earlier snapshot.
3. **Commenting and Assigning**:
   - Use `@Name` in comments to assign specific action items to colleagues so they receive automated notifications.',
      2,
      15
    ),
    (
      v_track2_id,
      'Personal Cybersecurity & Account Hygiene',
      'Protect your professional identity, detect phishing attempts, and configure two-factor authentication.',
      '### Protecting Yourself Online

Cyber threats targeting Nigerian professionals frequently involve credential harvesting, WhatsApp account hijacking, and business email compromise (BEC).

#### Essential Safety Rules:
1. **Enable Two-Factor Authentication (2FA)**:
   - Turn on 2FA on your email, LinkedIn, Google account, and banking apps.
   - Prefer authenticator apps (like Google Authenticator) over SMS verification where available.
2. **Recognizing Phishing Attacks**:
   - Check the sender address carefully. Be cautious when an official-looking password reset comes from a free email address like `@gmail.com` or `@yahoo.com`, and go to the official website directly instead of clicking the link.
   - Never enter your password or OTP on a link sent through unsolicited SMS or WhatsApp messages.
3. **Use a Password Manager**:
   - Avoid reusing the same password across multiple platforms. A breach on one forum should never compromise your primary email.',
      3,
      20
    )
  ON CONFLICT (track_id, position) DO NOTHING;

END $$;
