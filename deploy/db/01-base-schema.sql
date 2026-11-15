-- Fresh-instance base schema for saray-app (structure only, NO data).
-- Derived from the table structure of a working saray_appdb (after the 2026-10-26 alignment)
-- and limited to the tables the backend actually uses. Tables added later
-- (exit_rules, attendance_reasons, ...) come from db/migrations, applied by 1-setup-database.ps1.
-- Safe to re-run: every statement uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS `role` (
  `role_name` varchar(45) NOT NULL,
  PRIMARY KEY (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `activitylog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `details` text,
  `yurtid` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentid` int DEFAULT NULL,
  `programid` int DEFAULT NULL,
  `yurtid` int DEFAULT NULL,
  `date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `attendance_type_name` varchar(45) DEFAULT NULL,
  `program_name` varchar(45) DEFAULT NULL,
  `sebep` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_student_date_program` (`studentid`,`date`,`program_name`),
  KEY `idx_attendance_yurt_date_program` (`yurtid`,`date`,`program_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `attendancetype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(100) NOT NULL,
  `yurtid` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `attendance_type_name` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_attendancetype_name_yurt` (`attendance_type_name`,`yurtid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `class` (
  `classid` int NOT NULL AUTO_INCREMENT,
  `yurtid` int DEFAULT NULL,
  `class_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `display_name` varchar(255) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`classid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `exit_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `yurtid` int DEFAULT '1',
  `default_max_duration_minutes` int DEFAULT '60',
  `curfew_time` time DEFAULT '21:00:00',
  `weekend_curfew_time` time DEFAULT '22:00:00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `program` (
  `programid` int NOT NULL AUTO_INCREMENT,
  `yurtid` int DEFAULT NULL,
  `program_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `display_name` varchar(255) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  PRIMARY KEY (`programid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `referencecodes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `role_name` varchar(50) DEFAULT 'admin',
  `createdBy` int DEFAULT NULL,
  `expiresAt` datetime DEFAULT NULL,
  `isUsed` tinyint(1) DEFAULT '0',
  `usedBy` int DEFAULT NULL,
  `usedAt` datetime DEFAULT NULL,
  `maxUses` int DEFAULT '1',
  `currentUses` int DEFAULT '0',
  `description` varchar(255) DEFAULT NULL,
  `yurtid` int DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `season` (
  `seasonid` int NOT NULL AUTO_INCREMENT,
  `yurtid` int DEFAULT NULL,
  `season_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `season_year` varchar(100) DEFAULT '2026-2027',
  PRIMARY KEY (`seasonid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `student` (
  `studentid` int NOT NULL AUTO_INCREMENT,
  `yurtid` int DEFAULT '1',
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `season_year` varchar(50) DEFAULT NULL,
  `class_name` varchar(100) DEFAULT NULL,
  `reference_code` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`studentid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `student_out_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `studentid` int NOT NULL,
  `yurtid` int DEFAULT '1',
  `reason` varchar(100) DEFAULT 'Market/Kişisel',
  `notes` varchar(255) DEFAULT NULL,
  `exit_time` datetime NOT NULL,
  `expected_return_time` datetime DEFAULT NULL,
  `actual_return_time` datetime DEFAULT NULL,
  `is_late` tinyint(1) DEFAULT '0',
  `late_minutes` int DEFAULT '0',
  `status` varchar(20) DEFAULT 'OUT',
  `created_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `max_allowed_minutes` int NOT NULL DEFAULT '60',
  PRIMARY KEY (`id`),
  KEY `idx_student` (`studentid`),
  KEY `idx_exit_status` (`status`),
  KEY `idx_out_logs_yurt_student_status` (`yurtid`,`studentid`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `user` (
  `accountid` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_name` varchar(50) DEFAULT 'admin',
  `yurtid` int DEFAULT '1',
  `studentid` int DEFAULT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExpiry` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`accountid`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `useryurt` (
  `user_yurt_id` int NOT NULL AUTO_INCREMENT,
  `accountid` int NOT NULL,
  `yurtid` int NOT NULL,
  `is_primary` tinyint(1) DEFAULT '1',
  `assigned_by` varchar(255) DEFAULT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_yurt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS `yurt` (
  `yurtid` int NOT NULL AUTO_INCREMENT,
  `yurt_name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`yurtid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
