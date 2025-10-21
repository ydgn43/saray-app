-- Add reference_code column to Student table
-- Each student gets a unique code that auto-links their account when they sign up

-- Add the reference_code column (nullable for existing students)
ALTER TABLE Student 
ADD COLUMN reference_code VARCHAR(20) NULL UNIQUE;

-- Add index for fast lookups
CREATE INDEX idx_student_reference_code ON Student(reference_code);

-- Optional: Generate codes for existing students
-- UPDATE Student SET reference_code = CONCAT('STU-', LPAD(studentid, 6, '0')) WHERE reference_code IS NULL;
