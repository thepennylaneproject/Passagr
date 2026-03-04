# Data Lifecycle

This document defines how Passagr handles export, deletion, backups, and retention.

## 1) Export

### User flow
- Path: `Settings -> Privacy -> Export or Delete Data`
- Action: `Export my data`

### Export package
Primary export format is a ZIP bundle with:
- `account.json`
- `saved_paths.json`
- `notes.json`
- `checklists.json`
- `comparisons.json`
- `README.txt` (field definitions and timestamp conventions)

Optional convenience files:
- `saved_paths.csv`
- `notes.csv`

### Export safety controls
- Export is generated server-side
- Download uses a short-lived signed URL
- Export artifact auto-expires after a defined window (for example, 24 hours)
- Expiry is shown to the user at download time

## 2) Deletion

### User flow
- Path: `Settings -> Privacy -> Export or Delete Data`
- Action: `Delete my account and data`

### Confirmation safeguards
- Re-authentication required
- Explicit typed confirmation (`DELETE`)
- Clear irreversible warning
- Clear pre-delete summary of:
  - What will be deleted now
  - What may remain temporarily and why

### Technical deletion sequence
1. Create a deletion request record with timestamps and status
2. Revoke active sessions/refresh tokens
3. Execute asynchronous hard-delete job for user-owned app data
4. Delete encrypted blobs/files and wrapped content keys
5. Remove auth/profile links according to system policy
6. Write deletion audit event with non-content metadata
7. Mark deletion request complete only after store-level confirmations

### Post-delete receipt
Provide a downloadable receipt containing:
- Request ID
- Requested timestamp
- Completion timestamp
- Backup expiry date
- Categories deleted
- Categories retained temporarily and reason

## 3) Backups

Backup policy constraints:
- Backups are for disaster recovery only
- Deleted user data is not reintroduced into active production for normal operations
- Backups have a fixed retention window (for example, 30 days)
- As backups age out, deleted data is removed with them

## 4) Retention

### Active systems
- Keep account and planning data until user deletes it or account is removed

### Deletion/audit metadata
- Keep minimal non-content deletion audit metadata for operational integrity and abuse prevention

### Logs
- Keep minimal operational/security logs for bounded retention windows
- Avoid storing user-authored content plaintext in routine logs

## 5) What we will never store

Passagr will not intentionally store:
- Plaintext passwords
- Password hints or security-question answers
- Payment card data or banking credentials
- Full government ID numbers by default, unless required for a specific user-initiated feature
- Full document scans by default
- Raw MFA seeds in plaintext
- Private note/reference plaintext in analytics events

## 6) Plain-language commitments

- You can export your data in a portable format.
- You can delete your data from active systems.
- Some encrypted backup copies may remain until backup expiry.
- We retain only minimal operational records after deletion.
- We do not promise risk elimination; we commit to clear boundaries and enforceable controls.
