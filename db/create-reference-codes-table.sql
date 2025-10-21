-- SQL Script to create ReferenceCodes table
-- Run this script in your MySQL database (saraydb)

USE saraydb;

CREATE TABLE IF NOT EXISTS ReferenceCodes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    roleId VARCHAR(45) NOT NULL,
    createdBy INT NOT NULL,
    expiresAt DATETIME NOT NULL,
    isUsed BOOLEAN DEFAULT FALSE,
    usedBy INT NULL,
    usedAt DATETIME NULL,
    maxUses INT DEFAULT 1,
    currentUses INT DEFAULT 0,
    description VARCHAR(255) NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (createdBy) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (usedBy) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (roleId) REFERENCES Roles(name) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_code (code),
    INDEX idx_roleId (roleId),
    INDEX idx_createdBy (createdBy),
    INDEX idx_isUsed (isUsed),
    INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
DESCRIBE ReferenceCodes;

-- Optional: Create a view to see reference code statistics
CREATE OR REPLACE VIEW ReferenceCodeStats AS
SELECT 
    rc.id,
    rc.code,
    rc.roleId,
    u.username AS createdByUsername,
    rc.expiresAt,
    rc.isUsed,
    rc.currentUses,
    rc.maxUses,
    CASE 
        WHEN rc.currentUses >= rc.maxUses THEN 'Kullanıldı'
        WHEN rc.expiresAt < NOW() THEN 'Süresi Doldu'
        ELSE 'Aktif'
    END AS status,
    rc.description,
    rc.createdAt
FROM ReferenceCodes rc
LEFT JOIN Users u ON rc.createdBy = u.id
ORDER BY rc.createdAt DESC;
