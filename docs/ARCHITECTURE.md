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

The current source tree is screen/service oriented:

```text
src/
  App.tsx
  components/
    ui/
    forms/
    domain/
  constants/
  database/
  navigation/
    RootNavigator.tsx
    MainTabs.tsx
    AttendanceStack.tsx
    StudentsStack.tsx
    MarketStack.tsx
    SettingsStack.tsx
    navigation.types.ts
  screens/
  services/
  types/
```

This is functional but still transitional. A later batch should move toward feature-based modules while preserving behavior:

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

- App shell: `src/App.tsx` wraps the root navigator with gesture and safe-area providers.
- Navigation: `src/navigation/RootNavigator.tsx` owns the root auth/app flow, `MainTabs.tsx` owns the bottom tabs, stack files own each tab's nested routes, and `navigation.types.ts` owns route param-list types.
- Screens: `src/screens` contains user-facing flows.
- Components: `src/components/ui` contains generic display and feedback primitives, `src/components/forms` contains reusable input controls, and `src/components/domain` contains ministry-specific display components.
- Services: `src/services` contains database-backed business operations.
- Database: `src/database` opens SQLite and runs migrations.
- Types: `src/types/index.ts` centralizes domain and service types. Navigation route types live in `src/navigation/navigation.types.ts`.

## Architecture Rules

- Keep the app offline-first.
- Keep business logic in services, not deeply embedded in UI.
- Keep database access behind database and service modules.
- Prefer small, behavior-preserving moves during restructuring.
- Do not introduce server, .NET, Blazor, ASP.NET, or SQL Server dependencies.
- Do not add new features while performing architecture cleanup batches.

## Near-Term Restructure Direction

Future batches should move screens and services into feature folders, then split common utilities where useful. Each batch should keep imports valid and run verification after the move.
