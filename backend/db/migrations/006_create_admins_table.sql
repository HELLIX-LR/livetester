-- Migration: Create admins table
-- Description: Stores administrator accounts for system access
-- Requirements: 11.2

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Indexes for optimizing queries
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Comments
COMMENT ON TABLE admins IS 'Stores administrator user accounts';
COMMENT ON COLUMN admins.password_hash IS 'bcrypt hashed password with minimum 10 salt rounds';
COMMENT ON COLUMN admins.last_login IS 'Timestamp of last successful login';
