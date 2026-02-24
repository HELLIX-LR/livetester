-- Migration: Create notifications table
-- Description: Stores system notifications for administrators
-- Requirements: 17.1

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('new_tester', 'critical_bug', 'server_offline', 'info')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Indexes for optimizing queries
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Comments
COMMENT ON TABLE notifications IS 'Stores system notifications for administrators';
COMMENT ON COLUMN notifications.type IS 'Notification type: new_tester, critical_bug, server_offline, or info';
COMMENT ON COLUMN notifications.is_read IS 'Indicates if notification has been read by admin';
COMMENT ON COLUMN notifications.metadata IS 'Additional notification data stored as JSON';
