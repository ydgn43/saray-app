-- Migration: Add Yurt table and multi-tenancy support
-- Created: 2025-10-22
-- Description: Implements multi-tenancy architecture with Yurt isolation

-- Step 1: Create Yurt table
CREATE TABLE IF NOT EXISTS Yurt (
    yurtid INT AUTO_INCREMENT PRIMARY KEY,
    yurt_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    location VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_yurt_active (is_active),
    INDEX idx_yurt_name (yurt_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Insert default Yurt for existing data
INSERT IGNORE INTO Yurt (yurt_name, description, location, is_active) 
VALUES ('Saray Yurdu', 'Default yurt for existing data', 'Ana Merkez', TRUE);

-- Get the default yurt ID (should be 1)
SET @default_yurt_id = (SELECT yurtid FROM Yurt WHERE yurt_name = 'Saray Yurdu');

-- Step 3: Add yurtid column to User table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'User' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE User 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER accountid,
     ADD CONSTRAINT fk_user_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_user_yurt (yurtid)',
    'SELECT "Column yurtid already exists in User table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add yurtid column to Student table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'Student' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE Student 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER studentid,
     ADD CONSTRAINT fk_student_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_student_yurt (yurtid)',
    'SELECT "Column yurtid already exists in Student table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add yurtid column to Class table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'Class' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE Class 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER class_name,
     ADD CONSTRAINT fk_class_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_class_yurt (yurtid)',
    'SELECT "Column yurtid already exists in Class table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add yurtid column to Season table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'Season' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE Season 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER season_year,
     ADD CONSTRAINT fk_season_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_season_yurt (yurtid)',
    'SELECT "Column yurtid already exists in Season table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add yurtid column to Program table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'Program' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE Program 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER program_name,
     ADD CONSTRAINT fk_program_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_program_yurt (yurtid)',
    'SELECT "Column yurtid already exists in Program table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 8: Add yurtid column to AttendanceType table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'AttendanceType' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE AttendanceType 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER attendance_type_name,
     ADD CONSTRAINT fk_attendancetype_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_attendancetype_yurt (yurtid)',
    'SELECT "Column yurtid already exists in AttendanceType table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 9: Add yurtid column to Attendance table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'Attendance' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE Attendance 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER studentid,
     ADD CONSTRAINT fk_attendance_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_attendance_yurt (yurtid)',
    'SELECT "Column yurtid already exists in Attendance table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 10: Add yurtid column to ActivityLog table (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'ActivityLog' 
     AND COLUMN_NAME = 'yurtid') = 0,
    'ALTER TABLE ActivityLog 
     ADD COLUMN yurtid INT NOT NULL DEFAULT 1 AFTER logid,
     ADD CONSTRAINT fk_activitylog_yurt FOREIGN KEY (yurtid) REFERENCES Yurt(yurtid) ON DELETE RESTRICT ON UPDATE CASCADE,
     ADD INDEX idx_activitylog_yurt (yurtid)',
    'SELECT "Column yurtid already exists in ActivityLog table" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 11: Update existing data to use default yurt
UPDATE User SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;
UPDATE Student SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;
UPDATE Class SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;
UPDATE Season SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;
UPDATE Program SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;
UPDATE AttendanceType SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;
UPDATE Attendance SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;
UPDATE ActivityLog SET yurtid = 1 WHERE yurtid IS NULL OR yurtid = 0;

-- Step 12: Create super-admin role if not exists
INSERT IGNORE INTO Role (role_name) 
VALUES ('super-admin');

-- Step 13: Add composite indexes for common queries (if not exists)
SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'Attendance' 
     AND INDEX_NAME = 'idx_attendance_yurt_date_program') = 0,
    'ALTER TABLE Attendance ADD INDEX idx_attendance_yurt_date_program (yurtid, date, program_name)',
    'SELECT "Index idx_attendance_yurt_date_program already exists" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'Student' 
     AND INDEX_NAME = 'idx_student_yurt_season') = 0,
    'ALTER TABLE Student ADD INDEX idx_student_yurt_season (yurtid, season_year)',
    'SELECT "Index idx_student_yurt_season already exists" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'User' 
     AND INDEX_NAME = 'idx_user_yurt_role') = 0,
    'ALTER TABLE User ADD INDEX idx_user_yurt_role (yurtid, role_name)',
    'SELECT "Index idx_user_yurt_role already exists" AS Info'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verification queries
-- SELECT 'Yurt table created' as Status, COUNT(*) as Count FROM Yurt;
-- SELECT 'Users per yurt' as Metric, yurtid, COUNT(*) as Count FROM User GROUP BY yurtid;
-- SELECT 'Students per yurt' as Metric, yurtid, COUNT(*) as Count FROM Student GROUP BY yurtid;
