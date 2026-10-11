# School Database Design

## Tables

- **`students`** stores one record per student. `student_id` is the primary key, `name` is required, and `email` is required and unique so two students cannot share the same email address.
- **`courses`** stores one record per course. `course_id` is the primary key, while both `course_name` and `course_code` are required and unique.
- **`enrolments`** records the relationship between a student and a course, including the student's `grade`. Its `student_id` and `course_id` columns are foreign keys. The composite primary key `(student_id, course_id)` prevents the same student from enrolling in the same course more than once. A grade can be `NULL` before it is assessed; otherwise, the database restricts it to 0–100.

## Relationships

A **one-to-many** relationship exists between `students` and `enrolments`: one student can have many enrolment records, but each enrolment belongs to one student. The same one-to-many relationship exists between `courses` and `enrolments`: one course can have many enrolments, but each enrolment refers to one course.

Together, students and courses have a **many-to-many** relationship. A student can take several courses, and each course can have several students. The `enrolments` join table is needed to represent this relationship without storing multiple course IDs in one student row or repeating student details in course records. It also stores relationship-specific information, such as the grade.

## Index

The SQL script creates an index named `idx_enrolments_course_id` on `enrolments(course_id)`. This helps the database find enrolments for a selected course efficiently, including the query that lists all students on a course. The composite primary key already begins with `student_id`, so a separate index on that column is usually unnecessary for this small design.

## SQL or NoSQL?

I would choose a **relational SQL database** for this school system. Students, courses, and enrolments have clear relationships, and enrolments must refer to valid students and courses. Primary keys, foreign keys, unique constraints, and transactions help protect data consistency and prevent invalid or duplicate enrolments. SQL joins also make it straightforward to list course registrations, count students by course, and find students who have not enrolled. A NoSQL database could work, but its flexible document model is less useful here than the relational structure and integrity rules provided by SQLite or another SQL database.
