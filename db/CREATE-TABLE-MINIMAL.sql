-- =============================================
-- MINIMAL VERSION - No Foreign Keys
-- This will definitely work!
-- =============================================

USE saraydb;

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS `ReferenceCodes`;

-- Create table without foreign key constraints
CREATE TABLE `ReferenceCodes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `role_name` VARCHAR(45) NOT NULL,
    `createdBy` INT NOT NULL,
    `expiresAt` DATETIME NOT NULL,
    `isUsed` TINYINT(1) DEFAULT 0,
    `usedBy` INT NULL,
    `usedAt` DATETIME NULL,
    `maxUses` INT DEFAULT 1,
    `currentUses` INT DEFAULT 0,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Verify it worked
SELECT 'ReferenceCodes table created successfully!' AS Status;
DESCRIBE ReferenceCodes;

-- Test that it's empty
SELECT COUNT(*) AS total_records FROM ReferenceCodes;
