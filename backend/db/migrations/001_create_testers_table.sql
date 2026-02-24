-- Migration: Create testers table
-- Description: Stores information about testers including their device info, status, and activity
-- Requirements: 1.3, 13.1

CREATE TABLE IF NOT EXISTS testers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  telegram VARCHAR(100),
  device_type VARCHAR(50) NOT NULL,
  os VARCHAR(50) NOT NULL,
  os_version VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_date TIMESTAMP,
  bugs_count INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimizing queries
CREATE INDEX idx_testers_email ON testers(email);
CREATE INDEX idx_testers_status ON testers(status);
CREATE INDEX idx_testers_rating ON testers(rating DESC);
CREATE INDEX idx_testers_registration_date ON testers(registration_date DESC);

-- Comments
COMMENT ON TABLE testers IS 'Stores tester registration and profile information';
COMMENT ON COLUMN testers.status IS 'Tester status: active, inactive, or suspended';
COMMENT ON COLUMN testers.bugs_count IS 'Cached count of bugs found by this tester';
COMMENT ON COLUMN testers.rating IS 'Calculated rating based on bugs found with priority weights';
