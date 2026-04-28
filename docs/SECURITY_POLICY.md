# Security Policy

## Scope

This document describes the current local security posture for the Kids Ministry mobile app. It focuses only on device-local access protection and does not introduce server authentication.

## Current Controls

- A 4-digit PIN is required after setup.
- PIN hashes are stored in SQLite app settings.
- A salt is stored through `expo-secure-store`.
- Failed PIN attempts are tracked in SecureStore.
- Temporary lockout is applied after repeated failed attempts.
- Biometric unlock can be enabled when the device supports enrolled biometrics.
- Auto-lock checks are performed when the app returns to the foreground.
- Teacher name and lock timing are local settings.

## Sensitive Data

The app may store student names, guardian information, attendance history, point history, and local profile photo URIs. All data is currently local to the device SQLite database unless exported through backup/share features.

## Current Limitations

- PIN entropy is low because a 4-digit PIN has only 10,000 combinations.
- Salt generation currently uses JavaScript randomness and should be reviewed before production release.
- Hard lockout behavior should be reviewed because persisted failed attempts may prevent recovery.
- Database contents are not currently encrypted at rest.
- Backup files are raw database copies and should be treated as sensitive.
- There is no remote wipe, account-level authentication, role model, or sync authorization.

## Policy Direction

Future security work should prioritize preserving access for authorized teachers while protecting student data if a device or backup file is lost. Recommended future work belongs in separate implementation batches.
