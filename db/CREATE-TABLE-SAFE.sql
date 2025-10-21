-- =============================================
-- SAFE SETUP: ReferenceCodes Table
-- This script checks your structure first
-- =============================================

USE saraydb;

-- STEP 1: Check your User table structure
-- Run this first to see what columns exist
DESCRIBE User;

-- STEP 2: Check your Role table structure
DESCRIBE Role;

-- =============================================
-- BASED ON YOUR SCHEMA, TRY THIS VERSION
-- =============================================

-- First, let's try creating the table WITHOUT foreign keys
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
    
    INDEX `idx_code` (`code`),
    INDEX `idx_role_name` (`role_name`),
    INDEX `idx_createdBy` (`createdBy`),
    INDEX `idx_isUsed` (`isUsed`),
    INDEX `idx_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- STEP 3: Verify table was created
DESCRIBE ReferenceCodes;

-- =============================================
-- OPTIONAL: Add foreign keys AFTER table creation
-- Only run these if the columns match
-- =============================================

-- Uncomment and run these ONE AT A TIME after checking your User table:

-- For Role foreign key:
-- ALTER TABLE `ReferenceCodes`
-- ADD CONSTRAINT `fk_ReferenceCode_Role`
--     FOREIGN KEY (`role_name`)
--     REFERENCES `Role` (`role_name`)
--     ON DELETE CASCADE
--     ON UPDATE CASCADE;

-- For CreatedBy foreign key (check if User.userid exists):
-- ALTER TABLE `ReferenceCodes`
-- ADD CONSTRAINT `fk_ReferenceCode_CreatedBy`
--     FOREIGN KEY (`createdBy`)
--     REFERENCES `User` (`userid`)
--     ON DELETE CASCADE
--     ON UPDATE CASCADE;

-- For UsedBy foreign key:
-- ALTER TABLE `ReferenceCodes`
-- ADD CONSTRAINT `fk_ReferenceCode_UsedBy`
--     FOREIGN KEY (`usedBy`)
--     REFERENCES `User` (`userid`)
--     ON DELETE SET NULL
--     ON UPDATE CASCADE;

-- DONE! The table is ready to use.
-- Foreign keys can be added later if needed.
