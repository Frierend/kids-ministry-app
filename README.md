# Kids Ministry Attendance App

Offline-first Expo React Native mobile app for tracking children, attendance, points, market redemptions, ministries, archives, backup/restore, and local app access security for a children's ministry team.

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
  app/
    AppBootstrap.tsx
    providers/
      AppProviders.tsx
  components/
    ui/
    forms/
    domain/
  constants/
  database/
    db.ts
    migrations.ts
  features/
    attendance/
      attendance.service.ts
    home/
    market/
      market.service.ts
    ministries/
      ministry.service.ts
    security/
      security.service.ts
    settings/
    students/
      student.service.ts
  navigation/
  services/
    BackupService.ts
    TransactionService.ts
  types/
```

The app now uses a feature-based structure for screens and feature-specific services. The `src/app` layer owns app bootstrap/provider composition, `src/components` is split into `ui`, `forms`, and `domain`, and shared services remain in `src/services`.

## Database

The app stores data locally in `kidsministry.db` through `expo-sqlite`. `src/database/db.ts` opens the database and exposes transaction helpers. `src/database/migrations.ts` creates these tables:

- `students`
- `ministries`
- `enrollments`
- `attendance_sessions`
- `attendance_records`
- `point_transactions`
- `market_items`
- `app_settings`

The database client enables WAL mode, foreign keys, and the configured SQLite cache size when opening the database.

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

Current validation set:

```bash
npx expo install --check
npx expo-doctor
npx tsc --noEmit
git status --short
```

## Verification Status

Current documentation and restructure batches keep application behavior unchanged. Known limitations and future testing priorities are tracked in `docs/KNOWN_LIMITATIONS.md` and `docs/TESTING_PLAN.md`.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/SECURITY_POLICY.md`
- `docs/BACKUP_RESTORE.md`
- `docs/TESTING_PLAN.md`
- `docs/KNOWN_LIMITATIONS.md`

## Project Discipline

This repository keeps architecture, database design, security policy, backup behavior, testing strategy, and known limitations documented alongside behavior-preserving refactors. The app remains a React Native Expo mobile application and does not adopt server-side accounting-system features or technology.
