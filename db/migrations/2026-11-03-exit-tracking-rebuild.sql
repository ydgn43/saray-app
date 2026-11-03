-- =====================================================================
-- Exit tracking rebuild
-- Database : saray_appdb (MySQL 8.0)
-- Branch   : feature/new-yurt-demo
--
-- WHAT THIS DOES
--   1. yurt                : adds `timezone` (deadlines are calculated in the yurt's own zone)
--   2. student             : adds UNIQUE (studentid, yurtid) so other tables can prove
--                            "this student belongs to THIS yurt" at the database level
--   3. exit_rules (new)    : generic izin rules per yurt (name + deadline weekday + time)
--   4. student_out_logs    : tightened and cleaned
--        - yurtid NOT NULL, no default (a bug can no longer silently use yurt 1)
--        - composite FK (studentid, yurtid) -> student  => cross-yurt rows are impossible
--        - FK yurtid -> yurt, created_by -> user, rule_id -> exit_rules
--        - status is an ENUM('OUT','RETURNED')
--        - only ONE open exit (status='OUT') per student, enforced by a unique index
--        - new nullable rule_id
--        - DROPPED (derivable from the times): is_late, late_minutes, max_allowed_minutes
--        - CHECKs: returned <=> has a return time; return time not before exit time
--
-- NOT TOUCHED: exit_settings (decided to look at it later), all other tables.
--
-- TIME CONVENTION: all DATETIME values in student_out_logs are stored in UTC.
--
-- HOW TO RUN
--   1. Take a backup first:  mysqldump saray_appdb > backup_before_exit_rebuild.sql
--   2. Run section 0 on its own. EVERY query must return 0 rows. If one does not,
--      stop and fix that data first (the migration would fail or lose meaning).
--   3. Run sections 1-4.
--   4. Sections 5 and 6 are OPTIONAL and commented out. Read before using.
--
-- MySQL DDL is not transactional: if a statement fails half-way, restore the backup.
-- =====================================================================

USE saray_appdb;

-- ---------------------------------------------------------------------
-- 0. PRE-CHECKS (read-only). Each query should return no rows.
-- ---------------------------------------------------------------------

SELECT 'log has unknown/NULL status' AS problem, id
FROM student_out_logs
WHERE status IS NULL OR status NOT IN ('OUT', 'RETURNED');

SELECT 'log has NULL reason' AS problem, id
FROM student_out_logs
WHERE reason IS NULL;

SELECT 'log has no student, or yurt differs from the student''s yurt' AS problem, l.id
FROM student_out_logs l
LEFT JOIN student s ON s.studentid = l.studentid
WHERE s.studentid IS NULL OR l.yurtid IS NULL OR s.yurtid IS NULL OR l.yurtid <> s.yurtid;

SELECT 'log points to a yurt that does not exist' AS problem, l.id
FROM student_out_logs l
LEFT JOIN yurt y ON y.yurtid = l.yurtid
WHERE y.yurtid IS NULL;

SELECT 'log has created_by of a user that does not exist' AS problem, l.id
FROM student_out_logs l
LEFT JOIN `user` u ON u.accountid = l.created_by
WHERE l.created_by IS NOT NULL AND u.accountid IS NULL;

SELECT 'student has more than one open exit' AS problem, studentid, COUNT(*) AS open_exits
FROM student_out_logs
WHERE status = 'OUT'
GROUP BY studentid
HAVING COUNT(*) > 1;

SELECT 'status and return time do not match' AS problem, id
FROM student_out_logs
WHERE (status = 'OUT' AND actual_return_time IS NOT NULL)
   OR (status = 'RETURNED' AND actual_return_time IS NULL);

SELECT 'return time is before exit time' AS problem, id
FROM student_out_logs
WHERE actual_return_time IS NOT NULL AND actual_return_time < exit_time;

-- ---------------------------------------------------------------------
-- 1. yurt: time zone
--    CHECK THE DEFAULT: 'Europe/Berlin' is a guess. Set the right value per yurt, e.g.
--      UPDATE yurt SET timezone = 'Europe/Istanbul' WHERE yurtid = 2;
--    (any IANA name works, e.g. Europe/Berlin, Europe/Istanbul, Europe/Vienna)
-- ---------------------------------------------------------------------

ALTER TABLE yurt
    ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'Europe/Berlin' AFTER location;

-- ---------------------------------------------------------------------
-- 2. student: allow (studentid, yurtid) to be referenced as a pair
--    studentid is already unique, so this index never rejects existing data.
-- ---------------------------------------------------------------------

ALTER TABLE student
    ADD UNIQUE KEY uq_student_id_yurt (studentid, yurtid);

-- ---------------------------------------------------------------------
-- 3. exit_rules: izin rules created by Admin / SuperAdmin per yurt
--    deadline_weekday: 0 = Sunday ... 6 = Saturday (same as JavaScript getDay())
--    deadline_time   : local time in the yurt's time zone
-- ---------------------------------------------------------------------

CREATE TABLE exit_rules (
    id               INT          NOT NULL AUTO_INCREMENT,
    yurtid           INT          NOT NULL,
    name             VARCHAR(100) NOT NULL,
    deadline_weekday TINYINT      NOT NULL,
    deadline_time    TIME         NOT NULL,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_by       INT          NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_exit_rules_yurt_name (yurtid, name),
    CONSTRAINT chk_exit_rules_weekday CHECK (deadline_weekday BETWEEN 0 AND 6),
    CONSTRAINT fk_exit_rules_yurt
        FOREIGN KEY (yurtid) REFERENCES yurt (yurtid)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_exit_rules_user
        FOREIGN KEY (created_by) REFERENCES `user` (accountid)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- 4. student_out_logs
-- ---------------------------------------------------------------------

-- 4a. columns: drop derivable ones, tighten the rest, add rule_id
ALTER TABLE student_out_logs
    DROP COLUMN max_allowed_minutes,
    DROP COLUMN is_late,
    DROP COLUMN late_minutes,
    MODIFY COLUMN yurtid               INT          NOT NULL,
    MODIFY COLUMN reason               VARCHAR(100) NOT NULL,
    MODIFY COLUMN status               ENUM('OUT', 'RETURNED') NOT NULL DEFAULT 'OUT',
    MODIFY COLUMN exit_time            DATETIME     NOT NULL COMMENT 'UTC',
    MODIFY COLUMN expected_return_time DATETIME     NULL     COMMENT 'UTC. NULL = no deadline (never late)',
    MODIFY COLUMN actual_return_time   DATETIME     NULL     COMMENT 'UTC',
    ADD COLUMN rule_id INT NULL COMMENT 'rule used when the exit was recorded (deadline is a snapshot)' AFTER reason,
    -- Helper column: holds the studentid only while the exit is open. The unique index
    -- below then allows at most one open exit per student (NULLs are not compared).
    ADD COLUMN open_student_id INT GENERATED ALWAYS AS (IF(status = 'OUT', studentid, NULL)) VIRTUAL;

-- 4b. indexes: replace the old ones
ALTER TABLE student_out_logs
    DROP INDEX idx_student,
    DROP INDEX idx_exit_status,
    DROP INDEX idx_out_logs_yurt_student_status,
    ADD INDEX idx_out_logs_student_yurt (studentid, yurtid),
    ADD INDEX idx_out_logs_yurt_status (yurtid, status),
    ADD INDEX idx_out_logs_yurt_exit_time (yurtid, exit_time),
    ADD INDEX idx_out_logs_rule (rule_id),
    ADD UNIQUE KEY uq_one_open_exit_per_student (open_student_id);

-- 4c. constraints
ALTER TABLE student_out_logs
    ADD CONSTRAINT chk_out_logs_return_matches_status
        CHECK ((status = 'OUT'      AND actual_return_time IS NULL)
            OR (status = 'RETURNED' AND actual_return_time IS NOT NULL)),
    ADD CONSTRAINT chk_out_logs_return_after_exit
        CHECK (actual_return_time IS NULL OR actual_return_time >= exit_time),
    -- composite FK: the student MUST belong to the same yurt as the log
    ADD CONSTRAINT fk_out_logs_student_yurt
        FOREIGN KEY (studentid, yurtid) REFERENCES student (studentid, yurtid)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_out_logs_yurt
        FOREIGN KEY (yurtid) REFERENCES yurt (yurtid)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_out_logs_user
        FOREIGN KEY (created_by) REFERENCES `user` (accountid)
        ON DELETE SET NULL ON UPDATE CASCADE,
    -- if a rule is deleted, old logs keep their saved deadline; only the link is cleared.
    -- (That the rule belongs to the same yurt is checked by the backend.)
    ADD CONSTRAINT fk_out_logs_rule
        FOREIGN KEY (rule_id) REFERENCES exit_rules (id)
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- 5. OPTIONAL: remove the dev test rows in student_out_logs
--    (the 4 rows from 26-27 Oct have times from mixed clocks, see the audit).
--    Uncomment only if they are really just test data.
-- ---------------------------------------------------------------------

-- DELETE FROM student_out_logs;

-- ---------------------------------------------------------------------
-- 6. OPTIONAL: unused duplicate tables (left over from macOS case-sensitivity).
--    The Sequelize models only use the lowercase names (student, yurt, class, program,
--    season, attendance, attendancetype, activitylog, referencecodes).
--    NOT dropped automatically. Compare row counts first, then drop what you confirm:
-- ---------------------------------------------------------------------

-- SELECT 'Students' t, COUNT(*) FROM Students UNION ALL SELECT 'student', COUNT(*) FROM student
-- UNION ALL SELECT 'Yurts', COUNT(*) FROM Yurts UNION ALL SELECT 'yurt', COUNT(*) FROM yurt
-- UNION ALL SELECT 'Classes', COUNT(*) FROM Classes UNION ALL SELECT 'class', COUNT(*) FROM class
-- UNION ALL SELECT 'Programs', COUNT(*) FROM Programs UNION ALL SELECT 'program', COUNT(*) FROM program
-- UNION ALL SELECT 'Seasons', COUNT(*) FROM Seasons UNION ALL SELECT 'season', COUNT(*) FROM season
-- UNION ALL SELECT 'Attendances', COUNT(*) FROM Attendances UNION ALL SELECT 'attendance', COUNT(*) FROM attendance
-- UNION ALL SELECT 'attendance_type', COUNT(*) FROM attendance_type UNION ALL SELECT 'attendancetype', COUNT(*) FROM attendancetype
-- UNION ALL SELECT 'activity_log', COUNT(*) FROM activity_log UNION ALL SELECT 'activitylog', COUNT(*) FROM activitylog
-- UNION ALL SELECT 'reference_codes', COUNT(*) FROM reference_codes UNION ALL SELECT 'referencecodes', COUNT(*) FROM referencecodes;

-- DROP TABLE Students, Yurts, Classes, Programs, Seasons, Attendances,
--            attendance_type, activity_log, reference_codes;
