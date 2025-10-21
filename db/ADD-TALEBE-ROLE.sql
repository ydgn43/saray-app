-- Add new 'talebe' (student) role to the Role table
-- Run this script on your database

USE saraydb;

-- Insert the new talebe role if it doesn't exist
INSERT INTO Role (role_name)
SELECT 'talebe'
WHERE NOT EXISTS (
    SELECT 1 FROM Role WHERE role_name = 'talebe'
);

-- Verify the role was created
SELECT * FROM Role;
