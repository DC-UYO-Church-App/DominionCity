-- Member-initiated enrolment. A member asks to join an open cohort, and the
-- cohort's staff accept or reject. This is the counterpart to staff adding
-- members directly, and it mirrors cell_join_requests so the two join flows
-- behave the same way.

-- New notification kinds. Added as values on the existing enum, the same way
-- 20260217_add_books.sql extends user_role. Only the values are added here;
-- they are not used until a later transaction, which Postgres requires.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'academy_cohort_open';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'academy_join_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'academy_join_response';

CREATE TABLE IF NOT EXISTS academy_enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES academy_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- At most one pending request per member per cohort. Resolved requests are
-- kept, so a member may request again after a rejection, which mirrors the
-- cell-group rule.
CREATE UNIQUE INDEX IF NOT EXISTS idx_academy_enrollment_requests_pending
  ON academy_enrollment_requests(cohort_id, user_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_academy_enrollment_requests_cohort
  ON academy_enrollment_requests(cohort_id, status);

CREATE INDEX IF NOT EXISTS idx_academy_enrollment_requests_user
  ON academy_enrollment_requests(user_id);
