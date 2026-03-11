# Kids Ministry App

Production-grade React Native (Expo) app for tracking student attendance and points.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 52 |
| Language | TypeScript (strict) |
| Navigation | React Navigation 6 (native stack + bottom tabs) |
| Database | expo-sqlite (WAL mode, 9 tables) |
| State | TanStack React Query v5 |
| Security | expo-secure-store + expo-local-authentication |
| Styling | StyleSheet (glassmorphism design system) |

## Project Structure

```
KidsMinistry/
├── App.tsx                    # Root entry — DB init, QueryClient, SafeArea
├── app.json                   # Expo config
├── src/
│   ├── theme/index.ts         # Colors, Typography, Spacing, Radius, Shadows
│   ├── types/index.ts         # All TypeScript interfaces + nav param types
│   ├── database/
│   │   └── schema.ts          # SQLite init, 9 tables, all indexes, WAL mode
│   ├── services/
│   │   ├── StudentService.ts  # CRUD, search, archive, enrollments
│   │   ├── AttendanceService.ts # Sessions, records, atomic commit
│   │   ├── TransactionService.ts # Point ledger, redemptions
│   │   ├── MinistryService.ts  # Ministry CRUD
│   │   ├── MarketService.ts    # Market items CRUD
│   │   └── SecurityService.ts  # PIN (SHA-256+salt), biometrics, auto-lock
│   ├── hooks/
│   │   ├── useStudents.ts     # React Query hooks for students
│   │   ├── useAttendance.ts   # React Query hooks for sessions
│   │   └── useData.ts         # Transactions, ministries, market hooks
│   ├── components/
│   │   ├── atomic/
│   │   │   ├── GlassCard.tsx  # Glass surface card component
│   │   │   └── index.tsx      # Avatar, Badge, PointsBadge, PrimaryButton, EmptyState…
│   │   ├── domain/
│   │   │   └── index.tsx      # StudentRow, AttendanceCheckbox, TransactionItem…
│   │   └── navigation/
│   │       └── ScreenWrapper.tsx # GradientBackground, StackHeader, FAB
│   ├── screens/
│   │   ├── auth/LockScreen.tsx
│   │   ├── home/HomeScreen.tsx
│   │   ├── attendance/
│   │   │   ├── AttendanceHomeScreen.tsx
│   │   │   └── SessionDetailScreen.tsx
│   │   ├── students/
│   │   │   ├── StudentListScreen.tsx
│   │   │   ├── StudentDetailScreen.tsx
│   │   │   ├── StudentAddScreen.tsx
│   │   │   └── PointsLedgerScreen.tsx  # + AwardPointsScreen
│   │   ├── market/
│   │   │   └── MarketHomeScreen.tsx
│   │   └── settings/
│   │       ├── SettingsHomeScreen.tsx
│   │       ├── MinistriesScreen.tsx
│   │       ├── MinistryAddScreen.tsx
│   │       └── SecuritySettingsScreen.tsx
│   └── navigation/
│       └── AppNavigator.tsx   # Full nav tree + custom frosted tab bar
```

## Quick Start

```bash
cd KidsMinistry
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

## Key Architecture Decisions

### Offline-First SQLite
- No network required — entire app runs on-device SQLite
- WAL mode enabled for concurrent reads during writes
- UUID primary keys for future sync/export compatibility

### Append-Only Point Ledger
- `point_transactions` rows are NEVER updated or deleted
- Balance = `SUM(points)` from all rows for a student
- Makes balance corruption mathematically detectable

### Atomic Session Commit
- `commitSession()` wraps all point inserts in `BEGIN TRANSACTION`
- If any insert fails, entire commit rolls back (session stays "draft")
- `UNIQUE(session_id, student_id)` constraint prevents double-awards

### Security
- PIN stored as `SHA-256(deviceSalt + pin + deviceSalt)` in SQLite
- Device salt generated once, stored in iOS Keychain / Android Keystore
- 5-attempt lockout with 30s cooldown
- Auto-lock on background (configurable: 1/5/10/30min/Never)
- Biometrics with Keychain fallback

### React Query Caching
| Data | Stale Time |
|------|-----------|
| Student lists | 60s |
| Point balances | 30s |
| Sessions | 10s |
| Market items | 30s |

## Points System

| Day | Points |
|-----|--------|
| Saturday | 20 pts |
| Sunday | 50 pts |

These values are validated in `MinistryService` and cannot be changed per blueprint spec.

## Database Schema Summary

```
students           — first/last name, photo, DOB, archived flag
ministries         — name, color, sat/sun point values
enrollments        — student↔ministry relationships (soft unenroll)
attendance_sessions — one per ministry per date, draft→committed
attendance_records  — one per student per session, present/absent
point_transactions  — append-only ledger, NEVER update/delete
market_items       — store items with point costs and quantities
app_settings       — pin_hash, biometrics_enabled, auto_lock, teacher_name
```

## Next Steps (Phase 2)

- [ ] Student photo capture with expo-image-picker
- [ ] CSV export via expo-file-system + expo-sharing
- [ ] SQLite database backup/restore (BackupScreen)
- [ ] EnrollStudentScreen (multi-ministry enrollment UI)
- [ ] MinistryDetailScreen (edit ministry, view enrolled students)
- [ ] MarketItemAddScreen (full form for new items)
- [ ] StudentEditScreen (update existing student)
- [ ] Push notification reminders for session days
- [ ] Charts on HomeScreen (attendance trends)
