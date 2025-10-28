-- Migration script to add display_name and display_order columns to class table
-- This enables flexible, user-friendly display names and custom ordering for classes

-- Add display_name column (nullable, for user-friendly names like "Kur'an-ı Kerim")
-- Add display_order column (nullable, default 0, for custom sorting)
ALTER TABLE `class` 
ADD COLUMN `display_name` VARCHAR(100) NULL AFTER `class_name`,
ADD COLUMN `display_order` INT NULL DEFAULT 0 AFTER `display_name`;

-- Initialize display_order with sequential values for existing classes
-- This ensures all existing classes have a defined order
SET @order = 0;
UPDATE `class` 
SET `display_order` = (@order := @order + 1)
ORDER BY `class_name`;

-- To manually set specific order, you can run queries like:
-- UPDATE `class` SET `display_order` = 1 WHERE `class_name` = 'kuranikerim';
-- UPDATE `class` SET `display_order` = 2 WHERE `class_name` = 'hazirlik';
-- UPDATE `class` SET `display_order` = 3 WHERE `class_name` = 'ibtidai';
-- etc.
