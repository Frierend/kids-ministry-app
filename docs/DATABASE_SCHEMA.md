# Database Schema

## Overview

The app uses a local SQLite database named `kidsministry.db` through `expo-sqlite`. It is designed for offline-first use on the device.

Database initialization currently lives in:

- `src/database/client.ts`
- `src/database/migrations.ts`

The client enables:

- `PRAGMA journal_mode=WAL`
- `PRAGMA foreign_keys=ON`
- `PRAGMA cache_size=-8000`

The current migration version is `PRAGMA user_version = 1`.

## Tables

### students

Stores child profile information and archive state.

Important fields:

- `id`
- `uuid`
- `first_name`
- `last_name`
- `nickname`
- `birth_date`
- `guardian_name`
- `guardian_contact`
- `photo_uri`
- `is_archived`
- `archived_at`
- `archived_reason`
- `created_at`
- `updated_at`

Indexes:

- `idx_students_archived`
- `idx_students_name`

### ministries

Stores ministry/class definitions and point configuration.

Important fields:

- `id`
- `uuid`
- `name`
- `description`
- `active_days`
- `points_config`
- `is_archived`
- `created_at`
- `updated_at`

### enrollments

Stores student-to-ministry relationships.

Important fields:

- `student_id`
- `ministry_id`
- `enrolled_at`
- `unenrolled_at`

Active duplicate enrollments are blocked by `idx_enrollment_active`.

### attendance_sessions

Stores attendance sessions by ministry and date.

Important fields:

- `ministry_id`
- `session_date`
- `day_of_week`
- `points_awarded`
- `status`
- `committed_at`
- `created_at`

The unique index `idx_session_unique` prevents duplicate sessions for the same ministry and date.

### attendance_records

Stores one student attendance record per session.

Important fields:

- `session_id`
- `student_id`
- `is_present`
- `marked_at`
- `note`

The table enforces `UNIQUE(session_id, student_id)`.

### point_transactions

Stores point ledger entries.

Important fields:

- `student_id`
- `type`
- `points`
- `reason`
- `reference_id`
- `reference_type`
- `awarded_by`
- `created_at`

Balances are calculated from `SUM(points)` by student.

### market_items

Stores redeemable Market Day items.

Important fields:

- `name`
- `description`
- `point_cost`
- `stock`
- `photo_uri`
- `is_active`
- `created_at`

### app_settings

Stores local app settings as key/value rows.

Current seeded keys include:

- `teacher_name`
- `auto_lock_minutes`
- `biometrics_enabled`
- `app_version`

The PIN hash is also stored here after PIN setup.

## Migration Notes

The current migration creates all tables in a single initial version. Future schema changes should add explicit versioned migration steps instead of editing the existing version after release.
