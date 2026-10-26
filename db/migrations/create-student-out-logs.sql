-- Exit/Return tracking with configurable threshold and late-foul counters
CREATE TABLE IF NOT EXISTS student_out_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studentid INT NOT NULL,
    yurtid INT NOT NULL,
    reason VARCHAR(128) NOT NULL DEFAULT 'Market',
    notes TEXT NULL,
    exit_time DATETIME NOT NULL,
    expected_return_time DATETIME NOT NULL,
    actual_return_time DATETIME NULL,
    max_allowed_minutes INT NOT NULL DEFAULT 60,
    is_late TINYINT(1) NOT NULL DEFAULT 0,
    late_minutes INT NOT NULL DEFAULT 0,
    status ENUM('OUT', 'RETURNED') NOT NULL DEFAULT 'OUT',
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_out_logs_student (studentid),
    INDEX idx_out_logs_yurt_status (yurtid, status),
    INDEX idx_out_logs_exit_time (exit_time),

    CONSTRAINT fk_out_logs_student
        FOREIGN KEY (studentid) REFERENCES student(studentid)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_out_logs_yurt
        FOREIGN KEY (yurtid) REFERENCES yurt(yurtid)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_out_logs_user
        FOREIGN KEY (created_by) REFERENCES user(accountid)
        ON DELETE SET NULL ON UPDATE CASCADE
);
