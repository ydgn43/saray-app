-- =============================================
-- QUICK START: ADD REFERENCECODES TABLE
-- Copy and paste this entire script into MySQL
-- =============================================

-- 1. Make sure you're using the right database
USE saraydb;

-- 2. Create the ReferenceCodes table
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
    
    CONSTRAINT `fk_ReferenceCode_CreatedBy`
        FOREIGN KEY (`createdBy`)
        REFERENCES `User` (`userid`)
        ON DELETE CASCADE,
    
    CONSTRAINT `fk_ReferenceCode_UsedBy`
        FOREIGN KEY (`usedBy`)
        REFERENCES `User` (`userid`)
        ON DELETE SET NULL,
    
    CONSTRAINT `fk_ReferenceCode_Role`
        FOREIGN KEY (`role_name`)
        REFERENCES `Role` (`role_name`)
        ON DELETE CASCADE,
    
    INDEX `idx_code` (`code`),
    INDEX `idx_role_name` (`role_name`),
    INDEX `idx_createdBy` (`createdBy`),
    INDEX `idx_isUsed` (`isUsed`),
    INDEX `idx_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 3. Verify it worked
SELECT 'Table created successfully!' AS status;
DESCRIBE ReferenceCodes;

-- DONE! You can now use the reference code feature.
