# Known Limitations

## Verification

- `npx tsc --noEmit` currently fails.
- `npx expo install --check` currently reports SDK 54 package version mismatches.
- No automated tests are currently configured.

## Architecture

- The app is still organized by broad `screens`, `services`, and `components` folders.
- Feature-based module folders have not been introduced yet.
- Most screens call services directly instead of using a shared query/cache layer.
- `src/types/index.ts` currently contains both domain types and navigation param types.

## Data and Database

- Migrations currently have only one version.
- Database backups need additional WAL and schema-validation hardening.
- Large lists may need better pagination behavior at the screen level.

## Security

- PINs are limited to four digits.
- Database contents are not encrypted at rest.
- Salt generation and hard lockout recovery need review before production release.
- Raw database backups should be treated as sensitive data.

## UI and Feature Coverage

- Student profile fields exist in the schema but are not all exposed in add/edit forms.
- Photo-related dependencies and permissions exist, but photo capture/selection is not fully wired into current forms.
- Some terminal output shows mojibake for icons or decorative comments; user-facing rendering should be verified on devices.

## Documentation

- Documentation has been updated for the current app shape, but future restructure batches should keep docs in sync as files move.
