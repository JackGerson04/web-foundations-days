-- Day 6 assignment: School database (SQLite)
-- This script can be run more than once because it recreates the sample tables.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. Students: each student has a unique email address.
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE
);

-- 2. Courses: each course has a name and a unique course code.
CREATE TABLE courses (
    course_id   INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL UNIQUE,
    course_code TEXT NOT NULL UNIQUE
);

-- 3. Enrolments links students and courses and stores the student's grade.
-- The composite primary key prevents a student enrolling in the same course twice.
CREATE TABLE enrolments (
    student_id INTEGER NOT NULL,
    course_id  INTEGER NOT NULL,
    grade      REAL CHECK (grade IS NULL OR grade BETWEEN 0 AND 100),
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Useful index for finding all students enrolled on a particular course.
CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);

-- Sample students (David has no enrolments for the LEFT JOIN exercise).
INSERT INTO students (student_id, name, email) VALUES
    (1, 'Amina Otieno', 'amina.otieno@example.com'),
    (2, 'Brian Kiptoo', 'brian.kiptoo@example.com'),
    (3, 'Carol Wanjiku', 'carol.wanjiku@example.com'),
    (4, 'David Mwangi', 'david.mwangi@example.com');

-- Sample courses.
INSERT INTO courses (course_id, course_name, course_code) VALUES
    (1, 'Introduction to Programming', 'CIT101'),
    (2, 'Database Systems', 'CIT202'),
    (3, 'Web Development', 'CIT203');

-- Five enrolments across the three courses.
INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 78.0),
    (1, 2, 84.0),
    (2, 1, 67.0),
    (3, 2, 90.0),
    (3, 3, 88.0);

-- QUERY 1: All courses taken by one student, selected by name.
SELECT s.name AS student_name,
       c.course_name,
       e.grade
FROM students AS s
JOIN enrolments AS e ON e.student_id = s.student_id
JOIN courses AS c ON c.course_id = e.course_id
WHERE s.name = 'Amina Otieno'
ORDER BY c.course_name;

-- QUERY 2: All students enrolled on one course.
SELECT c.course_name,
       s.name AS student_name,
       s.email,
       e.grade
FROM courses AS c
JOIN enrolments AS e ON e.course_id = c.course_id
JOIN students AS s ON s.student_id = e.student_id
WHERE c.course_name = 'Introduction to Programming'
ORDER BY s.name;

-- QUERY 3: Number of students enrolled on each course, including courses with zero enrolments.
SELECT c.course_name,
       COUNT(e.student_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e ON e.course_id = c.course_id
GROUP BY c.course_id, c.course_name
ORDER BY c.course_name;

-- QUERY 4: Students who have no enrolments.
SELECT s.student_id,
       s.name,
       s.email
FROM students AS s
LEFT JOIN enrolments AS e ON e.student_id = s.student_id
WHERE e.student_id IS NULL
ORDER BY s.name;

-- QUERY 5: Update one enrolment's grade (Amina's grade in Introduction to Programming).
UPDATE enrolments
SET grade = 82.0
WHERE student_id = (
    SELECT student_id FROM students WHERE name = 'Amina Otieno'
)
AND course_id = (
    SELECT course_id FROM courses WHERE course_name = 'Introduction to Programming'
);
