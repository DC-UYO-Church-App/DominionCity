-- One row per member per year, so a birthday greeting is sent exactly once
-- however many times the job runs. Without this a restart, a re-registered
-- repeatable job, or a second instance all resend to the same person.
CREATE TABLE IF NOT EXISTS birthday_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  greeting_year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INT NOT NULL DEFAULT 1,
  error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, greeting_year)
);

CREATE INDEX IF NOT EXISTS idx_birthday_greetings_year ON birthday_greetings(greeting_year);
CREATE INDEX IF NOT EXISTS idx_birthday_greetings_status ON birthday_greetings(status);
