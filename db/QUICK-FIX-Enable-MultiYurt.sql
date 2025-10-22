-- ============================================
-- QUICK FIX: Enable Multi-Yurt for Your Admin
-- ============================================

-- INSTRUCTIONS:
-- 1. Find your admin username by running the SELECT below
-- 2. Replace 'YOUR_ADMIN_USERNAME' with your actual username
-- 3. Run all commands

-- Step 1: See all admin users
SELECT 'Your Admin Users:' as Step;
SELECT accountid, username, role, yurtid FROM User WHERE role IN ('admin', 'super-admin');

-- Step 2: Create second test yurt
SELECT 'Creating Test Yurt...' as Step;
INSERT INTO Yurt (yurt_name, description, location, is_active)
VALUES ('My Second Yurt', 'Test yurt for multi-yurt feature', 'Istanbul', TRUE);

-- Step 3: Assign your admin to BOTH yurts
-- REPLACE 'admin' with your actual admin username!
SELECT 'Assigning Admin to Both Yurts...' as Step;

INSERT INTO UserYurt (accountid, yurtid, is_primary)
SELECT accountid, 1, TRUE FROM User WHERE username = 'admin' AND role = 'admin'
ON DUPLICATE KEY UPDATE is_primary = TRUE;

INSERT INTO UserYurt (accountid, yurtid, is_primary)
SELECT u.accountid, y.yurtid, FALSE 
FROM User u
CROSS JOIN Yurt y
WHERE u.username = 'admin' AND u.role = 'admin' AND y.yurt_name = 'My Second Yurt'
ON DUPLICATE KEY UPDATE accountid = u.accountid;

-- Step 4: Verify
SELECT 'Verification - Admin should have 2 yurts:' as Step;
SELECT 
    u.username,
    u.role,
    COUNT(uy.yurtid) as yurt_count,
    GROUP_CONCAT(CONCAT(y.yurt_name, IF(uy.is_primary, ' (Primary)', '')) SEPARATOR ', ') as yurts
FROM User u
LEFT JOIN UserYurt uy ON u.accountid = uy.accountid  
LEFT JOIN Yurt y ON uy.yurtid = y.yurtid
WHERE u.username = 'admin'
GROUP BY u.accountid, u.username, u.role;

-- ============================================
-- IMPORTANT: Replace 'admin' with your actual admin username in Step 3 above!
-- Then logout and login again to see the YurtSelector
-- ============================================
