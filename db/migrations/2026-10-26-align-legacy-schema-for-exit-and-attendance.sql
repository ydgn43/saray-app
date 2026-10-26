-- Purpose: align legacy DB schema with current backend models used by attendance + exit tracking
-- Compatible with MySQL 8.x where ALTER ... ADD COLUMN IF NOT EXISTS may not be available.

USE saray_appdb;

-- =============================
-- 1) ATTENDANCE TABLE ALIGNMENT
-- =============================

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'attendance_type_name'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE attendance ADD COLUMN attendance_type_name VARCHAR(45) NULL',
    'SELECT ''attendance.attendance_type_name already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'program_name'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE attendance ADD COLUMN program_name VARCHAR(45) NULL',
    'SELECT ''attendance.program_name already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'sebep'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE attendance ADD COLUMN sebep VARCHAR(255) NULL',
    'SELECT ''attendance.sebep already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill program_name from programid
UPDATE attendance a
LEFT JOIN program p ON p.programid = a.programid
SET a.program_name = p.program_name
WHERE a.program_name IS NULL;

-- Backfill attendance_type_name from legacy status
UPDATE attendance
SET attendance_type_name = CASE
    WHEN status IS NULL THEN 'yok'
    WHEN LOWER(TRIM(status)) IN ('var', 'present') THEN 'var'
    WHEN LOWER(TRIM(status)) IN ('yok', 'absent') THEN 'yok'
    WHEN LOWER(TRIM(status)) IN ('gec', 'late') THEN 'gec'
    WHEN LOWER(TRIM(status)) IN ('izinli', 'excused') THEN 'izinli'
    ELSE 'yok'
END
WHERE attendance_type_name IS NULL;

-- Fallback where program_name still NULL
UPDATE attendance
SET program_name = 'hatim'
WHERE program_name IS NULL;

-- Remove duplicates for unique (studentid, date, program_name), keep largest id
DELETE a1
FROM attendance a1
JOIN attendance a2
  ON a1.studentid = a2.studentid
 AND a1.date = a2.date
 AND a1.program_name = a2.program_name
 AND a1.id < a2.id;

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND INDEX_NAME = 'uq_attendance_student_date_program'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE attendance ADD UNIQUE INDEX uq_attendance_student_date_program (studentid, date, program_name)',
    'SELECT ''attendance.uq_attendance_student_date_program already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND INDEX_NAME = 'idx_attendance_yurt_date_program'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE attendance ADD INDEX idx_attendance_yurt_date_program (yurtid, date, program_name)',
    'SELECT ''attendance.idx_attendance_yurt_date_program already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- =================================
-- 2) ATTENDANCE TYPE TABLE ALIGNMENT
-- =================================

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendancetype' AND COLUMN_NAME = 'attendance_type_name'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE attendancetype ADD COLUMN attendance_type_name VARCHAR(45) NULL',
    'SELECT ''attendancetype.attendance_type_name already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE attendancetype
SET attendance_type_name = type_name
WHERE attendance_type_name IS NULL;

INSERT INTO attendancetype (attendance_type_name, type_name, yurtid, is_active)
SELECT 'var', 'var', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM attendancetype WHERE attendance_type_name = 'var' AND yurtid = 1);

INSERT INTO attendancetype (attendance_type_name, type_name, yurtid, is_active)
SELECT 'yok', 'yok', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM attendancetype WHERE attendance_type_name = 'yok' AND yurtid = 1);

INSERT INTO attendancetype (attendance_type_name, type_name, yurtid, is_active)
SELECT 'gec', 'gec', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM attendancetype WHERE attendance_type_name = 'gec' AND yurtid = 1);

INSERT INTO attendancetype (attendance_type_name, type_name, yurtid, is_active)
SELECT 'izinli', 'izinli', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM attendancetype WHERE attendance_type_name = 'izinli' AND yurtid = 1);

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendancetype' AND INDEX_NAME = 'idx_attendancetype_name_yurt'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE attendancetype ADD INDEX idx_attendancetype_name_yurt (attendance_type_name, yurtid)',
    'SELECT ''attendancetype.idx_attendancetype_name_yurt already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- =====================================
-- 3) OPTIONAL EXIT THRESHOLD ENHANCEMENT
-- =====================================

SET @col_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_out_logs' AND COLUMN_NAME = 'max_allowed_minutes'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE student_out_logs ADD COLUMN max_allowed_minutes INT NOT NULL DEFAULT 60',
    'SELECT ''student_out_logs.max_allowed_minutes already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_out_logs' AND INDEX_NAME = 'idx_out_logs_yurt_student_status'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE student_out_logs ADD INDEX idx_out_logs_yurt_student_status (yurtid, studentid, status)',
    'SELECT ''student_out_logs.idx_out_logs_yurt_student_status already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- ==========================
-- 4) POST-MIGRATION CHECKS
-- ==========================
SELECT COUNT(*) AS attendance_rows FROM attendance;
SELECT COUNT(*) AS attendance_missing_program_name FROM attendance WHERE program_name IS NULL;
SELECT COUNT(*) AS attendance_missing_type_name FROM attendance WHERE attendance_type_name IS NULL;
SELECT COUNT(*) AS exit_logs_rows FROM student_out_logs;
