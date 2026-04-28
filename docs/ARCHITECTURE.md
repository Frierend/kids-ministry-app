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
    atoms/
    molecules/
    organisms/
  constants/
  database/
  navigation/
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
- Navigation: `src/navigation` owns root auth flow, tabs, and feature stacks.
- Screens: `src/screens` contains user-facing flows.
- Components: `src/components` contains reusable UI and domain display components.
- Services: `src/services` contains database-backed business operations.
- Database: `src/database` opens SQLite and runs migrations.
- Types: `src/types/index.ts` currently centralizes domain and navigation types.

## Architecture Rules

- Keep the app offline-first.
- Keep business logic in services, not deeply embedded in UI.
- Keep database access behind database and service modules.
- Prefer small, behavior-preserving moves during restructuring.
- Do not introduce server, .NET, Blazor, ASP.NET, or SQL Server dependencies.
- Do not add new features while performing architecture cleanup batches.

## Near-Term Restructure Direction

Future batches should move screens and services into feature folders, then split shared UI, domain UI, and common utilities. Each batch should keep imports valid and run verification after the move.
