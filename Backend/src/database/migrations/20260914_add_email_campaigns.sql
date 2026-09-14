-- Bulk email sends to the members list, tracked here rather than in memory so
-- that progress survives a restart and the admin UI can poll it from any
-- instance. One row per send; per-recipient failures live in `failures`.
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (audience IN ('active', 'non_active')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'completed', 'failed', 'interrupted')),
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  batch_size INT NOT NULL,
  batch_delay_ms INT NOT NULL,
  total_batches INT NOT NULL DEFAULT 0,
  completed_batches INT NOT NULL DEFAULT 0,
  failures JSONB NOT NULL DEFAULT '[]',
  error TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);
