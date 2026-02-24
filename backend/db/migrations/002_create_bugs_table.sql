-- Migration: Create bugs table
-- Description: Stores bug reports submitted by testers with priority, status, and type
-- Requirements: 13.1, 20.1

CREATE TABLE IF NOT EXISTS bugs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  tester_id INTEGER NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('new', 'in_progress', 'fixed', 'closed')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('ui', 'functionality', 'performance', 'crash', 'security', 'other')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fixed_at TIMESTAMP,
  CONSTRAINT fk_bugs_tester FOREIGN KEY (tester_id) REFERENCES testers(id) ON DELETE CASCADE
);

-- Indexes for optimizing queries
CREATE INDEX idx_bugs_tester_id ON bugs(tester_id);
CREATE INDEX idx_bugs_status ON bugs(status);
CREATE INDEX idx_bugs_priority ON bugs(priority);
CREATE INDEX idx_bugs_type ON bugs(type);
CREATE INDEX idx_bugs_created_at ON bugs(created_at DESC);
CREATE INDEX idx_bugs_updated_at ON bugs(updated_at DESC);

-- Comments
COMMENT ON TABLE bugs IS 'Stores bug reports found by testers';
COMMENT ON COLUMN bugs.priority IS 'Bug priority: low, medium, high, or critical';
COMMENT ON COLUMN bugs.status IS 'Bug status: new, in_progress, fixed, or closed';
COMMENT ON COLUMN bugs.type IS 'Bug type: ui, functionality, performance, crash, security, or other';
COMMENT ON COLUMN bugs.fixed_at IS 'Timestamp when bug was marked as fixed';
