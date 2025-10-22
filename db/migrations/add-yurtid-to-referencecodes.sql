-- Migration: Add yurtid column to ReferenceCodes table
-- Date: October 22, 2025
-- Purpose: Store which yurt a reference code belongs to

USE saraydb;

-- Add yurtid column to ReferenceCodes table
ALTER TABLE `ReferenceCodes` 
ADD COLUMN `yurtid` INT NULL COMMENT 'Yurt ID that this reference code belongs to' AFTER `description`;

-- Add foreign key constraint (optional, for data integrity)
ALTER TABLE `ReferenceCodes`
ADD CONSTRAINT `fk_referencecode_yurt`
FOREIGN KEY (`yurtid`) REFERENCES `Yurt` (`yurtid`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Update existing reference codes to default yurt (ID 1) if needed
-- Comment this out if you want existing codes to remain without a yurt
-- UPDATE `ReferenceCodes` SET `yurtid` = 1 WHERE `yurtid` IS NULL;

SELECT 'Migration completed: yurtid column added to ReferenceCodes table' AS status;
