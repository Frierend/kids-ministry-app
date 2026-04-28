# Testing Plan

## Current Status

The project does not currently include an automated test suite. Current validation relies on Expo and TypeScript checks plus focused manual testing of core flows.

## Verification Commands

Current baseline checks:

```bash
npx expo install --check
npx expo-doctor
npx tsc --noEmit
git status --short
```

## Priority Test Areas

### Database and Migrations

- Initial migration creates all required tables and indexes.
- Default ministries and app settings are seeded.
- Re-running migrations is idempotent.

### Students

- Create, update, archive, restore, and permanent delete.
- Ministry enrollment and unenrollment behavior.
- Search and filtering by ministry and archive state.

### Attendance

- Draft session creation by ministry/date.
- Present/absent marking.
- Bulk marking.
- Commit awards points once.
- Undo commit removes matching attendance transactions.

### Points Ledger

- Balance is calculated from point transactions.
- Activity awards require positive points.
- Manual adjustments can add or subtract points.
- Ledger pagination and filtering remain stable.

### Market Day

- Items can be created, updated, activated, and deactivated.
- Redemption requires enough points.
- Stock decreases when stock is finite.
- Out-of-stock items cannot be redeemed.

### Security

- PIN setup validates exactly four digits.
- PIN verification records success and failure.
- Temporary lockout is applied.
- Biometric availability and enabled state are respected.
- Auto-lock respects configured timing.

### Backup and Restore

- Export locates the database.
- Import rejects invalid files.
- Import preserves a pre-import snapshot when possible.

## Future Tooling

Recommended future tooling should be selected in a dedicated implementation batch. Likely candidates include Jest for service/unit tests and Expo-compatible component tests for critical UI flows.
