-- Migration: Create comments table
-- Description: Stores comments on bug reports from administrators
-- Requirements: 19.1

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  bug_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_edited BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_comments_bug FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE
);

-- Indexes for optimizing queries
CREATE INDEX idx_comments_bug_id ON comments(bug_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Comments
COMMENT ON TABLE comments IS 'Stores comments on bug reports';
COMMENT ON COLUMN comments.author_id IS 'References admin user who created the comment';
COMMENT ON COLUMN comments.is_edited IS 'Indicates if comment was edited after creation';
COMMENT ON COLUMN comments.updated_at IS 'Last update timestamp, used to track edits';
