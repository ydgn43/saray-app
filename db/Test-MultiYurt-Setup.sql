-- Quick Test: Create Second Yurt and Assign to Admin
-- Run this in your MySQL client to test the YurtSelector

-- Step 1: Check current situation
SELECT 'Current Admin Users:' as Info;
SELECT accountid, username, role, yurtid FROM User WHERE role IN ('admin', 'super-admin');

SELECT 'Current UserYurt Assignments:' as Info;
SELECT uy.user_yurt_id, uy.accountid, u.username, uy.yurtid, y.yurt_name, uy.is_primary
FROM UserYurt uy
JOIN User u ON uy.accountid = u.accountid
JOIN Yurt y ON uy.yurtid = y.yurtid
WHERE u.role IN ('admin', 'super-admin');

-- Step 2: Create a test yurt if needed
INSERT INTO Yurt (yurt_name, description, location, is_active)
VALUES ('Test Yurt 2', 'Second yurt for testing multi-yurt feature', 'Test Location', TRUE)
ON DUPLICATE KEY UPDATE yurt_name = yurt_name; -- Do nothing if exists

-- Step 3: Get the admin accountid (replace with your admin username)
SET @admin_accountid = (SELECT accountid FROM User WHERE username = 'YOUR_ADMIN_USERNAME' AND role = 'admin' LIMIT 1);

-- If you don't know your admin username, uncomment this to see all admins:
-- SELECT accountid, username, role FROM User WHERE role IN ('admin', 'super-admin');

-- Step 4: Get the new yurt ID
SET @new_yurtid = (SELECT yurtid FROM Yurt WHERE yurt_name = 'Test Yurt 2' LIMIT 1);

-- Step 5: Assign admin to the new yurt (if you have an admin)
-- Replace YOUR_ADMIN_USERNAME with your actual admin username before running
-- INSERT INTO UserYurt (accountid, yurtid, is_primary)
-- VALUES (@admin_accountid, @new_yurtid, FALSE);

-- Step 6: Verify the assignment
SELECT 'After Assignment:' as Info;
SELECT uy.accountid, u.username, uy.yurtid, y.yurt_name, uy.is_primary
FROM UserYurt uy
JOIN User u ON uy.accountid = u.accountid
JOIN Yurt y ON uy.yurtid = y.yurtid
WHERE u.role IN ('admin', 'super-admin')
ORDER BY u.username, uy.yurtid;

-- Quick Summary
SELECT 
    u.username,
    u.role,
    COUNT(uy.yurtid) as yurt_count,
    GROUP_CONCAT(y.yurt_name SEPARATOR ', ') as accessible_yurts
FROM User u
LEFT JOIN UserYurt uy ON u.accountid = uy.accountid
LEFT JOIN Yurt y ON uy.yurtid = y.yurtid
WHERE u.role IN ('admin', 'super-admin')
GROUP BY u.accountid, u.username, u.role;
