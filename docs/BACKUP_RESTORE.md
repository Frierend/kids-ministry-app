# Backup and Restore

## Current Behavior

The app includes a Backup & Restore screen under Settings. Backup and restore behavior is centralized in `src/services/BackupService.ts`.

Export currently:

- Ensures the Expo SQLite directory exists.
- Runs a WAL checkpoint with `PRAGMA wal_checkpoint(TRUNCATE)`.
- Closes the current SQLite connection before copying the database file.
- Confirms the main database file exists and is not empty.
- Copies a timestamped `.db` file to the cache directory for sharing.

Restore currently:

- Requires a `.db` backup file.
- Copies the selected backup to a temporary validation database.
- Opens the temporary database with `expo-sqlite`.
- Runs `PRAGMA integrity_check`.
- Verifies the schema version and required app tables.
- Runs a WAL checkpoint and closes the current app database before replacement.
- Saves a timestamped pre-restore snapshot of the current database.
- Replaces the main database only after validation passes.
- Removes stale `-wal` and `-shm` sidecar files after restore.

## Data Included

The database backup is expected to include:

- Students
- Ministries
- Enrollments
- Attendance sessions and records
- Point transactions
- Market items
- App settings stored in SQLite

SecureStore values, such as salt and failed attempt counters, are outside the SQLite database and are not guaranteed to be included in a raw database backup.

## Safety Notes

- WAL data is checkpointed before export and restore to reduce the chance of copying stale or incomplete data.
- Restore validates the selected backup before replacing the app database.
- Restore creates a pre-restore snapshot in the SQLite directory when a current database exists.
- Import still requires the teacher to restart the app after restore so all screens reopen the restored database cleanly.
- Raw `.db` backup files are sensitive and should be stored carefully.

## Current Limitations

- Backup files are not encrypted.
- SecureStore values, such as the PIN salt and biometric setting state outside SQLite, are not included in the raw `.db` file.
- Restore validates the expected local schema, but it does not merge data.
- A backup created by a newer schema version is rejected by the current app.
