-- Add studentid column to User table to link talebe users to their Student record
-- This allows talebe users to only see their own statistics

-- Add the studentid column (nullable since not all users are students)
ALTER TABLE User 
ADD COLUMN studentid INT NULL;

-- Add foreign key constraint
ALTER TABLE User
ADD CONSTRAINT fk_user_student
FOREIGN KEY (studentid) REFERENCES Student(studentid)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX idx_user_studentid ON User(studentid);

-- Example: Link existing talebe users to their student records
-- You'll need to update this manually for your specific data:
-- UPDATE User SET studentid = 1 WHERE username = 'student1' AND role_name = 'talebe';
