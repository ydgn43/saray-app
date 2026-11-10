-- =====================================================================
-- Attendance reasons (yoklama "sebep" list), editable per yurt in Settings
-- Database : saray_appdb (MySQL 8.0)
-- Branch   : feature/new-yurt-demo
--
-- WHAT THIS DOES
--   Creates `attendance_reasons`: the list of sebepler offered on the yoklama page
--   (for GEÇ, İZİNLİ and YOK). Until now this list was hard-coded in the frontend.
--   - one list per yurt (FK to yurt, rows are deleted together with the yurt)
--   - unique name per yurt (the collation ignores case and accents: "hasta" = "Hasta")
--   - seeds the four old values for every EXISTING yurt: Banyo, Hasta, Rahatsiz, Okul
--
-- NOT TOUCHED: the `attendance` table. Old records keep their sebep as plain text,
-- so changing the list later never changes old records.
-- "Diğer" (free text) is not stored here; the page always offers it.
--
-- HOW TO RUN: safe to run more than once (IF NOT EXISTS / INSERT IGNORE). Nothing is deleted.
-- =====================================================================

CREATE TABLE IF NOT EXISTS attendance_reasons (
    id          INT          NOT NULL AUTO_INCREMENT,
    yurtid      INT          NOT NULL,
    name        VARCHAR(100) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_reason_yurt_name (yurtid, name),
    CONSTRAINT fk_attendance_reasons_yurt FOREIGN KEY (yurtid) REFERENCES yurt (yurtid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO attendance_reasons (yurtid, name, sort_order)
SELECT y.yurtid, d.name, d.sort_order
FROM yurt y
CROSS JOIN (
    SELECT 'Banyo'    AS name, 1 AS sort_order UNION ALL
    SELECT 'Hasta',            2 UNION ALL
    SELECT 'Rahatsiz',         3 UNION ALL
    SELECT 'Okul',             4
) d;

-- Check: every yurt should now have its reasons.
SELECT yurtid, COUNT(*) AS reasons FROM attendance_reasons GROUP BY yurtid;
