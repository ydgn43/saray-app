-- Insert roles
INSERT INTO Role (role_name) VALUES 
    ('admin'), 
    ('hoca'), 
    ('yoklamaci');

-- Insert users
INSERT INTO User (username, password, role_name) VALUES
    ('admin1', 'password123', 'admin'),
    ('hoca1', 'password123', 'hoca'),
    ('yoklamaci1', 'password123', 'yoklamaci');

-- Insert passwords (assuming userid starts from 1)
INSERT INTO Password (password, creation_date, userid) VALUES
    ('password123', NOW(), 1),
    ('password123', NOW(), 2),
    ('password123', NOW(), 3);

-- Insert seasons
INSERT INTO Season (season_year) VALUES 
    ('2023/2024'), 
    ('2024/2025'), 
    ('2025/2026');

-- Insert classes
INSERT INTO Class (class_name) VALUES
    ('kuranikerim'), 
    ('hazirlik'), 
    ('ihzari'), 
    ('ibtidai'), 
    ('tekamul alti'), 
    ('mevzun tekamul alti');

-- Insert students
INSERT INTO Student (first_name, last_name, birth_date, season_year, class_name) VALUES
    ('Ali', 'Demir', '2005-05-15', '2024/2025', 'kuranikerim'),
    ('Ayşe', 'Yılmaz', '2006-08-20', '2024/2025', 'hazirlik'),
    ('Mehmet', 'Kaya', '2005-11-10', '2024/2025', 'ihzari'),
    ('Fatma', 'Şahin', '2007-01-05', '2024/2025', 'ibtidai'),
    ('Ahmet', 'Çelik', '2004-07-12', '2024/2025', 'tekamul alti'),
    ('Elif', 'Öztürk', '2003-09-25', '2024/2025', 'mevzun tekamul alti');

-- Insert attendance types
INSERT INTO AttendanceType (attendance_type_name) VALUES 
    ('var'), 
    ('gec'), 
    ('izinli'), 
    ('yok');

-- Insert programs
INSERT INTO Program (program_name) VALUES
    ('sabah namazi'), 
    ('oglen namazi'), 
    ('ikindi namazi'), 
    ('aksam namazi'), 
    ('yatsi namazi'), 
    ('hatim'), 
    ('other');

-- Insert attendance records
INSERT INTO Attendance (studentid, date, attendance_type_name, program_name) VALUES
    (1, '2023-10-01', 'var', 'sabah namazi'),
    (1, '2023-10-01', 'var', 'oglen namazi'),
    (1, '2023-10-01', 'yok', 'ikindi namazi'),
    (1, '2023-10-01', 'gec', 'aksam namazi'),
    (2, '2023-10-01', 'var', 'sabah namazi'),
    (2, '2023-10-01', 'var', 'oglen namazi'),
    (2, '2023-10-01', 'var', 'ikindi namazi'),
    (2, '2023-10-01', 'var', 'aksam namazi'),
    (3, '2023-10-01', 'izinli', 'sabah namazi'),
    (3, '2023-10-01', 'var', 'oglen namazi'),
    (3, '2023-10-01', 'var', 'ikindi namazi'),
    (3, '2023-10-01', 'var', 'aksam namazi'),
    (4, '2023-10-01', 'var', 'sabah namazi'),
    (4, '2023-10-01', 'gec', 'oglen namazi'),
    (4, '2023-10-01', 'var', 'ikindi namazi'),
    (4, '2023-10-01', 'var', 'aksam namazi');
