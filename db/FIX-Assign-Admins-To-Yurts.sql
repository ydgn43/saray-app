-- Fix: Assign all admins to their yurts in UserYurt table
-- This script assigns admins who have a yurtid but are not in the UserYurt table

INSERT INTO UserYurt (accountid, yurtid, is_primary, assigned_by, assigned_at)
SELECT 
    u.accountid,
    u.yurtid,
    1 as is_primary,  -- Make it their primary yurt
    u.accountid as assigned_by,  -- Self-assigned
    NOW() as assigned_at
FROM User u
WHERE u.role IN ('admin', 'super-admin')
AND u.yurtid IS NOT NULL
AND NOT EXISTS (
    SELECT 1 
    FROM UserYurt uy 
    WHERE uy.accountid = u.accountid 
    AND uy.yurtid = u.yurtid
);

-- Show the results
SELECT 
    u.username,
    u.role,
    uy.yurtid,
    y.yurt_name,
    uy.is_primary
FROM UserYurt uy
JOIN User u ON uy.accountid = u.accountid
JOIN Yurt y ON uy.yurtid = y.yurtid
WHERE u.role IN ('admin', 'super-admin')
ORDER BY u.username, uy.is_primary DESC;
