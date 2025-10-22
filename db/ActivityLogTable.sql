-- Activity Log Table for tracking user actions
CREATE TABLE IF NOT EXISTS ActivityLog (
    logid INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT 'create, update, delete',
    entity_type VARCHAR(50) NOT NULL COMMENT 'attendance, izinli, student, etc.',
    entity_id TEXT NOT NULL COMMENT 'JSON string with identifiers',
    details TEXT NULL COMMENT 'JSON string with additional details',
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_userid (userid),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
