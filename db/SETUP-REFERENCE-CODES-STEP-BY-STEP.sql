-- ============================================
-- STEP-BY-STEP DATABASE SETUP GUIDE
-- For Reference Code Feature
-- ============================================

-- STEP 1: Connect to your MySQL database
-- Use MySQL Workbench, command line, or any MySQL client

-- STEP 2: Select the correct database
USE saraydb;

-- STEP 3: Check your current User table structure
-- (This helps us understand the foreign key reference)
DESCRIBE User;

-- STEP 4: Check your current Role table structure
DESCRIBE Role;

-- STEP 5: Create the ReferenceCodes table
-- This table will store admin-generated codes for signup
CREATE TABLE IF NOT EXISTS `ReferenceCodes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `role_name` VARCHAR(45) NOT NULL,
    `createdBy` INT NOT NULL,
    `expiresAt` DATETIME NOT NULL,
    `isUsed` BOOLEAN DEFAULT FALSE,
    `usedBy` INT NULL,
    `usedAt` DATETIME NULL,
    `maxUses` INT DEFAULT 1,
    `currentUses` INT DEFAULT 0,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_code` (`code`),
    
    -- Foreign Keys (linking to existing tables)
    CONSTRAINT `fk_ReferenceCode_CreatedBy`
        FOREIGN KEY (`createdBy`)
        REFERENCES `User` (`userid`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT `fk_ReferenceCode_UsedBy`
        FOREIGN KEY (`usedBy`)
        REFERENCES `User` (`userid`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT `fk_ReferenceCode_Role`
        FOREIGN KEY (`role_name`)
        REFERENCES `Role` (`role_name`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Indexes for better query performance
    INDEX `idx_code` (`code`),
    INDEX `idx_role_name` (`role_name`),
    INDEX `idx_createdBy` (`createdBy`),
    INDEX `idx_isUsed` (`isUsed`),
    INDEX `idx_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- STEP 6: Verify the table was created successfully
DESCRIBE ReferenceCodes;

-- STEP 7: Check that the table exists
SHOW TABLES LIKE 'ReferenceCodes';

-- STEP 8 (Optional): Create a helpful view for admins
-- This view shows reference codes with readable information
CREATE OR REPLACE VIEW `ReferenceCodeStats` AS
SELECT 
    rc.id,
    rc.code,
    rc.role_name AS roleName,
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
    rc.createdAt,
    rc.updatedAt
FROM ReferenceCodes rc
LEFT JOIN User u ON rc.createdBy = u.userid
ORDER BY rc.createdAt DESC;

-- STEP 9: Test the view
SELECT * FROM ReferenceCodeStats;

-- STEP 10: Verify everything is working
-- This should return 0 rows (empty table)
SELECT COUNT(*) as total_codes FROM ReferenceCodes;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. The table is now ready to use
-- 2. The backend will automatically insert codes
-- 3. When users sign up, the code will be marked as used
-- 4. Make sure your backend is using the correct column names
-- ============================================

-- SUCCESS! Your database is now ready for the reference code feature.
