# Known Limitations

## Verification

- No automated tests are currently configured.

## Architecture

- The app now uses feature folders for screens and feature-specific services, but some shared code still lives in broad top-level folders.
- Most screens call services directly instead of using a shared query/cache layer.
- `src/types/index.ts` remains a central domain/service type file.

## Data and Database

- Migrations currently have only one version.
- Student list browsing now uses explicit pagination, and the home count uses a database count query.
- Market Day loads active student names locally for picker/search so it does not silently cap at 25 students. Very large ministries may eventually need server-side style search/pagination for this picker.

## Security

- PINs are limited to four digits.
- Database contents are not encrypted at rest.
- Raw database backups should be treated as sensitive data.

## UI and Feature Coverage

- Student profile fields exist in the schema but are not all exposed in add/edit forms.
- Photo-related dependencies and permissions exist, but photo capture/selection is not fully wired into current forms.
- Some terminal output shows mojibake for icons or decorative comments; user-facing rendering should be verified on devices.

## Documentation

- Documentation has been updated for the current app shape, but future restructure batches should keep docs in sync as files move.
