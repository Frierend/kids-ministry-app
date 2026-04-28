# Kids Ministry Attendance App

Offline-first mobile app for tracking children, attendance, points, market redemptions, ministries, archives, and app access security for a children's ministry team.

## Tech Stack

| Area | Technology |
| --- | --- |
| Runtime | Expo SDK 54 |
| Mobile framework | React Native |
| Language | TypeScript |
| Database | expo-sqlite |
| Navigation | React Navigation 6 |
| Security storage | expo-secure-store |
| Biometrics | expo-local-authentication |
| File sharing and import | expo-file-system, expo-sharing, expo-document-picker |

## Current Scope

- Home dashboard with quick links and recent attendance sessions.
- Attendance sessions by ministry and date, including draft sessions, present/absent marking, bulk marking, commit, and undo commit.
- Student list, profile, add/edit flow, archive/restore, permanent delete, point balance, and point ledger views.
- Points ledger using append-style transactions for attendance, activities, manual adjustments, and market deductions.
- Market Day item list, item management, student selection, balance check, and redemption confirmation.
- Ministry management with active days, point configuration, archive, and restore.
- PIN setup, PIN lock screen, biometric unlock toggle, auto-lock settings, and teacher name settings.
- Backup and restore screen for database export/import.

## Current Project Layout

```text
src/
  App.tsx
  components/
    atoms/
    molecules/
    organisms/
    ui/
    forms/
    domain/
  constants/
  database/
    client.ts
    migrations.ts
  navigation/
  screens/
    attendance/
    market/
    settings/
    students/
  services/
  types/
```

The app is being moved toward a feature-based and layered mobile structure. Batch 1 only cleans repository hygiene and documentation; feature files and services have not been moved yet.

## Database

The app stores data locally in `kidsministry.db` through `expo-sqlite`. Migrations currently create these tables:

- `students`
- `ministries`
- `enrollments`
- `attendance_sessions`
- `attendance_records`
- `point_transactions`
- `market_items`
- `app_settings`

The database client enables WAL mode and foreign keys when opening the SQLite database.

## Getting Started

```bash
npm install
npm start
```

Useful commands:

```bash
npm run typecheck
npm run lint
npm run doctor
npx expo install --check
```

## Verification Status

Batch 1 keeps the application behavior unchanged. Known baseline issues are tracked in `docs/KNOWN_LIMITATIONS.md`.

Current known verification concerns:

- TypeScript does not pass yet.
- Some Expo SDK 54 dependency versions are out of alignment.
- Backup/restore uses SDK-sensitive file-system APIs and still needs hardening.
- No automated test suite exists yet.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/SECURITY_POLICY.md`
- `docs/BACKUP_RESTORE.md`
- `docs/TESTING_PLAN.md`
- `docs/KNOWN_LIMITATIONS.md`

## Project Discipline

This repository is intentionally documenting architecture, database design, security policy, backup behavior, testing strategy, and known limitations before larger refactors. The app remains a React Native Expo mobile application and does not adopt server-side accounting-system features or technology.
