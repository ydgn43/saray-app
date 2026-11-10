-- 2026-11-10  Season improvements (Settings redesign)
--
-- What this does (safe to run more than once):
--   1. season.is_current  : marks the "Güncel sezon" of each yurt (at most one per yurt).
--   2. UNIQUE (yurtid, season_year): the same season name can exist once per yurt
--      (the old table allowed duplicates inside one yurt).
--   3. Every yurt that has seasons but no current season gets its newest season marked as current.
--
-- Nothing is deleted. If duplicate (yurtid, season_year) rows already exist, step 2 is skipped
-- and the duplicates are listed at the end so you can clean them up by hand first.
--
-- BACK UP THE DATABASE BEFORE RUNNING.

-- 1. is_current column
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'season' AND COLUMN_NAME = 'is_current');
SET @sql := IF(@has_col = 0,
    'ALTER TABLE season ADD COLUMN is_current TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT "season.is_current already exists" AS info');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 2. unique (yurtid, season_year), only when there are no duplicates
SET @has_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'season' AND INDEX_NAME = 'uq_season_yurt_year');
SET @dups := (SELECT COUNT(*) FROM (
                 SELECT yurtid, season_year FROM season GROUP BY yurtid, season_year HAVING COUNT(*) > 1) d);
SET @sql := IF(@has_idx = 0 AND @dups = 0,
    'ALTER TABLE season ADD UNIQUE KEY uq_season_yurt_year (yurtid, season_year)',
    IF(@has_idx > 0, 'SELECT "uq_season_yurt_year already exists" AS info',
       'SELECT "SKIPPED unique key: duplicate seasons exist, see list below" AS info'));
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3. every yurt with seasons gets a current season (its newest one)
UPDATE season s
JOIN (SELECT yurtid, MAX(season_year) AS newest FROM season GROUP BY yurtid) n
  ON n.yurtid = s.yurtid AND n.newest = s.season_year
SET s.is_current = 1
WHERE s.yurtid NOT IN (SELECT yurtid FROM (SELECT yurtid FROM season WHERE is_current = 1) c);

-- Result: seasons per yurt, and duplicates (should be empty)
SELECT yurtid, season_year, is_current FROM season ORDER BY yurtid, season_year DESC;
SELECT yurtid, season_year, COUNT(*) AS copies FROM season GROUP BY yurtid, season_year HAVING COUNT(*) > 1;
