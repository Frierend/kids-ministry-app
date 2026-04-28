# Architecture

## Purpose

Kids Ministry Attendance App is an offline-first Expo React Native application for teachers and ministry workers. It tracks students, attendance, points, market redemptions, ministry groups, archives, and local app access security.

## Current Runtime Stack

- Expo SDK 54
- React Native
- TypeScript
- React Navigation 6
- expo-sqlite
- expo-secure-store
- expo-local-authentication

## Current Source Organization

The current source tree is transitional: Home, Attendance, Settings, Ministries, Security, Students, and Market screens have moved into feature folders. Feature-specific services live with their matching features, while shared services remain under `src/services`.

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
    RootNavigator.tsx
    MainTabs.tsx
    AttendanceStack.tsx
    StudentsStack.tsx
    MarketStack.tsx
    SettingsStack.tsx
    navigation.types.ts
  services/
  types/
```

This is functional but still transitional. Later batches should keep moving toward feature-based modules while preserving behavior:

```text
src/
  app/
  navigation/
  components/
    ui/
    forms/
    domain/
  features/
  database/
  services/
  utils/
  types/
```

## Current Layers

- App shell: `src/App.tsx` is a thin Expo entry wrapper. `src/app/AppBootstrap.tsx` composes the app providers with the root navigator, and `src/app/providers/AppProviders.tsx` owns the existing gesture-handler and safe-area wrappers.
- Navigation: `src/navigation/RootNavigator.tsx` owns the root auth/app flow, `MainTabs.tsx` owns the bottom tabs, stack files own each tab's nested routes, and `navigation.types.ts` owns route param-list types.
- Features: `src/features/home`, `src/features/attendance`, `src/features/settings`, `src/features/ministries`, `src/features/security`, `src/features/students`, and `src/features/market` contain the migrated screen groups and their feature-specific services.
- Screens: legacy screen folders have been removed after migrating the market flow.
- Components: `src/components/ui` contains generic display and feedback primitives, `src/components/forms` contains reusable input controls, and `src/components/domain` contains ministry-specific display components.
- Services: `src/services` contains shared database-backed business operations, currently backup/restore and transactions. Feature-specific services live in their matching feature folders.
- Database: `src/database/db.ts` opens SQLite and exposes transaction helpers. `src/database/migrations.ts` runs migrations.
- Types: `src/types/index.ts` centralizes domain and service types. Navigation route types live in `src/navigation/navigation.types.ts`.

## Architecture Rules

- Keep the app offline-first.
- Keep business logic in services, not deeply embedded in UI.
- Keep database access behind database and service modules.
- Prefer small, behavior-preserving moves during restructuring.
- Do not introduce server, .NET, Blazor, ASP.NET, or SQL Server dependencies.
- Do not add new features while performing architecture cleanup batches.

## Near-Term Restructure Direction

Future batches should continue moving shared code into clearer homes only when it can be done without behavior changes. Each batch should keep imports valid and run verification after the move.
