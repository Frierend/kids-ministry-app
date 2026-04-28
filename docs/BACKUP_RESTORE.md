# Backup and Restore

## Current Behavior

The app includes a Backup & Restore screen under Settings. It currently attempts to:

- Locate the SQLite database file.
- Copy it to a cache location for sharing/export.
- Pick a `.db` file for import.
- Copy the selected file over the current database path.
- Preserve a pre-import snapshot when possible.

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

## Current Limitations

- The current implementation uses Expo file-system APIs that need SDK 54 compatibility review.
- WAL and SHM files may affect backup consistency if the database is open while copying.
- Import does not currently validate schema version before replacing the database.
- Import requires restart guidance but does not enforce a full app restart.
- Raw `.db` backup files are sensitive and should be stored carefully.

## Future Hardening Direction

Backup/restore should eventually be moved behind a dedicated backup service. That service should close or checkpoint the database before export, validate imports, handle WAL files correctly, and provide clear recovery behavior.
