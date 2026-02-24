-- Migration: Create screenshots table
-- Description: Stores screenshot attachments for bug reports
-- Requirements: 20.1

CREATE TABLE IF NOT EXISTS screenshots (
  id SERIAL PRIMARY KEY,
  bug_id INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/jpg', 'image/gif')),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_screenshots_bug FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE
);

-- Indexes for optimizing queries
CREATE INDEX IF NOT EXISTS idx_screenshots_bug_id ON screenshots(bug_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_uploaded_at ON screenshots(uploaded_at DESC);

-- Comments
COMMENT ON TABLE screenshots IS 'Stores screenshot attachments for bug reports';
COMMENT ON COLUMN screenshots.file_size IS 'File size in bytes (max 5MB = 5242880 bytes)';
COMMENT ON COLUMN screenshots.mime_type IS 'MIME type: image/png, image/jpeg, image/jpg, or image/gif';
