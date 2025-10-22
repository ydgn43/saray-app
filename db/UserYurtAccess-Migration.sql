-- ============================================
-- User-Yurt Access Management Migration
-- Purpose: Allow admins to access multiple yurts
-- Date: October 22, 2025
-- ============================================

-- Step 1: Create UserYurt junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS UserYurt (
    user_yurt_id INT PRIMARY KEY AUTO_INCREMENT,
    accountid INT NOT NULL,
    yurtid INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE COMMENT 'User default yurt for login',
    assigned_by INT COMMENT 'Admin who assigned this access',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (accountid) REFERENCES User(accountid) ON DELETE CASCADE,
    FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES User(accountid) ON DELETE SET NULL,
    UNIQUE KEY unique_user_yurt (accountid, yurtid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User-Yurt access control table';

---
-- Step 2: Create index for fast access lookups
CREATE INDEX IF NOT EXISTS idx_user_yurt_access ON UserYurt(accountid, yurtid);
CREATE INDEX IF NOT EXISTS idx_yurt_users ON UserYurt(yurtid, accountid);

---
-- Step 3: Migrate existing users to UserYurt table
-- All existing users get access to their current yurt as primary
INSERT IGNORE INTO UserYurt (accountid, yurtid, is_primary)
SELECT accountid, yurtid, TRUE FROM User;

---
-- Step 4: Grant super-admins access to all yurts
-- Super-admins should have access to all existing yurts
INSERT IGNORE INTO UserYurt (accountid, yurtid, is_primary)
SELECT 
    u.accountid, 
    y.yurtid, 
    (u.yurtid = y.yurtid) -- FIX: Removed 'as is_primary' alias
FROM User u
CROSS JOIN Yurt y
WHERE u.role_name = 'super-admin';

---
-- Step 5: Create admin approval table for signup requests
CREATE TABLE IF NOT EXISTS AdminSignupRequest (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    requested_yurtid INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT COMMENT 'Super-admin who reviewed',
    reviewed_at TIMESTAMP NULL,
    notes TEXT COMMENT 'Review notes or rejection reason',
    FOREIGN KEY (requested_yurtid) REFERENCES Yurt(yurtid) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES User(accountid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Admin signup approval queue';

---
-- Step 6: Create index for pending requests
CREATE INDEX IF NOT EXISTS idx_signup_status ON AdminSignupRequest(status, requested_at);

-- ============================================
-- Verification Queries (Run these to verify)
-- ============================================

-- Check UserYurt table
-- SELECT * FROM UserYurt;

-- Check which yurts each admin can access
-- SELECT u.username, u.role_name, y.yurt_name, uy.is_primary
-- FROM UserYurt uy
-- JOIN User u ON uy.accountid = u.accountid
-- JOIN Yurt y ON uy.yurtid = y.yurtid
-- ORDER BY u.username, uy.is_primary DESC;

-- Check super-admin access
-- SELECT u.username, COUNT(uy.yurtid) as accessible_yurts
-- FROM User u
-- LEFT JOIN UserYurt uy ON u.accountid = uy.accountid
-- WHERE u.role_name = 'super-admin'
-- GROUP BY u.username;

-- Migration complete!