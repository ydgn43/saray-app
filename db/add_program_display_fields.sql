-- Add display_name and display_order columns to program table
-- Run this script on your database

ALTER TABLE `program` 
ADD COLUMN `display_name` VARCHAR(100) NULL AFTER `program_name`,
ADD COLUMN `display_order` INT NULL DEFAULT 0 AFTER `display_name`;

-- Set display_order for existing programs (optional - assigns sequential order)
SET @order = 0;
UPDATE `program` 
SET `display_order` = (@order := @order + 1)
ORDER BY `program_name`;

-- You can manually update display_order for specific programs to set your preferred order
-- Example:
-- UPDATE `program` SET `display_order` = 1 WHERE `program_name` = 'sabah_namazi';
-- UPDATE `program` SET `display_order` = 2 WHERE `program_name` = 'oglen_namazi';
-- etc.
