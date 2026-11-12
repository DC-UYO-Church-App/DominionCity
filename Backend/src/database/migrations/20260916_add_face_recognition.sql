-- Facial recognition. A member may register their face; the technical team can
-- then scan a face and have it identified against the register. Biometric data
-- is sensitive, so this stores only what is needed and records consent.

-- New role for the people who run the technical dashboard. Added to the enum
-- the same way 20260217_add_books.sql extends user_role.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'technical';

CREATE TABLE IF NOT EXISTS face_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- One enrolment per member. Re-registering replaces the row.
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- 512 L2-normalised ArcFace floats, stored as JSONB and compared in the
  -- backend by dot product. No pgvector dependency; a church-sized register is
  -- small enough to scan in memory.
  embedding JSONB NOT NULL,
  -- Object key of the captured still in the R2 bucket. The image bytes never
  -- live in Postgres.
  image_key TEXT NOT NULL,
  det_score REAL,
  -- Explicit, timestamped biometric consent. Enrolment is refused without it,
  -- so the record itself carries the proof that consent was given.
  consent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Who captured it: the member themselves, or a technical operator.
  enrolled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_face_enrollments_user ON face_enrollments(user_id);
