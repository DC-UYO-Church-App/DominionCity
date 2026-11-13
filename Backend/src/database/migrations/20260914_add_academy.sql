-- Discipleship academy: the tracks a member works through, the runs of each
-- track, who staffs a run, who is enrolled, and what happened in each meeting.
--
-- Three levels on purpose. A track is the catalogue entry ("DCA Basic"), a
-- cohort is one run of it with dates, and an enrolment puts a member in that
-- run. Collapsing them would make "who is in the current DCA Basic class"
-- unanswerable, leaving only "who has ever done DCA Basic".

CREATE TABLE IF NOT EXISTS academy_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  -- Display order on the member's progress card.
  sequence INT NOT NULL DEFAULT 0,
  -- The track that must be completed first. This, not a hardcoded list, is
  -- what the padlock on the profile card reads from. Null means no gate.
  prerequisite_track_id UUID REFERENCES academy_tracks(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academy_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES academy_tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'open', 'running', 'closed')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Who runs a given cohort. Deliberately a grant per cohort rather than a role
-- on the user: the church needs one person over DCA Basic and a different one
-- over DLI, which a single global role column cannot express. This mirrors
-- departments.hod_id and cell_groups.leader_id.
CREATE TABLE IF NOT EXISTS academy_cohort_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES academy_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  staff_role TEXT NOT NULL DEFAULT 'coordinator'
    CHECK (staff_role IN ('coordinator', 'facilitator', 'assistant')),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cohort_id, user_id)
);

CREATE TABLE IF NOT EXISTS academy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES academy_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled'
    CHECK (status IN ('enrolled', 'in_progress', 'completed', 'withdrawn')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cohort_id, user_id)
);

-- The activities inside a run: one row per class meeting.
CREATE TABLE IF NOT EXISTS academy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES academy_cohorts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  session_date DATE NOT NULL,
  facilitator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kept apart from the `attendance` table on purpose. That one records Sunday
-- services and drives the active / non-active member rule; folding class
-- meetings into it would silently change who counts as non-active.
CREATE TABLE IF NOT EXISTS academy_session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES academy_sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES academy_enrollments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'excused')),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_cohorts_track ON academy_cohorts(track_id);
CREATE INDEX IF NOT EXISTS idx_academy_cohort_staff_user ON academy_cohort_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user ON academy_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_cohort ON academy_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_academy_sessions_cohort ON academy_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_academy_session_attendance_session
  ON academy_session_attendance(session_id);

-- The five tracks the profile card already names. Prerequisites are left null:
-- the real order has to be confirmed with the church, and an invented chain
-- would lock members out of tracks they are entitled to.
INSERT INTO academy_tracks (name, sequence)
VALUES ('DCA Basic', 1), ('DCA Advance', 2), ('Encounter', 3), ('DLI Basic', 4), ('DLI Advance', 5)
ON CONFLICT (name) DO NOTHING;
