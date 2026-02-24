-- Migration: Create activity_history table
-- Description: Tracks tester activity events for audit and history purposes
-- Requirements: 18.1

CREATE TABLE IF NOT EXISTS activity_history (
  id SERIAL PRIMARY KEY,
  tester_id INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('registration', 'bug_found', 'status_changed', 'rating_updated')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_tester FOREIGN KEY (tester_id) REFERENCES testers(id) ON DELETE CASCADE
);

-- Indexes for optimizing queries
CREATE INDEX IF NOT EXISTS idx_activity_tester_id ON activity_history(tester_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_event_type ON activity_history(event_type);

-- Comments
COMMENT ON TABLE activity_history IS 'Tracks tester activity events and changes';
COMMENT ON COLUMN activity_history.event_type IS 'Type of event: registration, bug_found, status_changed, or rating_updated';
COMMENT ON COLUMN activity_history.metadata IS 'Additional event data stored as JSON';
