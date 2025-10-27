-- Add password reset columns to user table
-- Run this script to add the resetToken and resetTokenExpiry columns

USE saray;

ALTER TABLE user 
ADD COLUMN resetToken VARCHAR(255) NULL AFTER studentid,
ADD COLUMN resetTokenExpiry DATETIME NULL AFTER resetToken;

-- Verify the columns were added
DESCRIBE user;
