# Privacy

This document explains what Passagr collects, why it is collected, and what controls users have.

## Product role

Passagr is a personal planning space for immigration research and task tracking. It is not legal representation, legal advice, or a government filing system.

## Data we collect

We collect only data needed to operate core features:
- Account identifiers needed for sign-in and account recovery
- Saved visa paths
- User-authored notes and references
- Checklist progress and related planning state
- Basic operational telemetry for reliability and abuse prevention

## Why login exists

Login exists to:
- Keep each user data space isolated
- Synchronize planning data across sessions/devices
- Enable account-level controls (export, deletion, session revocation)

## Encryption and privacy boundaries

### Encrypted
- Network traffic (TLS)
- Stored database and object data at rest
- Sensitive user-authored content (for example, note/reference bodies) with additional content-layer encryption where feasible

### Not encrypted at content layer
Some metadata remains plaintext for core operation:
- IDs and ownership links
- Timestamps
- Canonical path relations
- Non-sensitive status fields and ordering fields

Reason: access control checks, indexing, joins, and efficient product behavior require these fields.

## What we will never store

Passagr will not intentionally store:
- Plaintext passwords
- Password hints or security-question answers
- Payment card data or banking credentials
- Full government ID numbers by default, unless required for a specific user-initiated feature
- Full document scans by default
- Raw MFA seeds in plaintext
- Private note/reference plaintext inside analytics events

## User controls

Users can:
- Export their data in a portable format
- Request permanent deletion of account data from active systems
- Review what may remain temporarily (for example, encrypted backups until expiry)

## What remains after deletion

After deletion completes in active systems:
- User content is removed from active databases and active storage
- Encrypted backup copies may remain until backup TTL expiry
- Minimal security/audit records may remain where operationally required

We do not claim immediate removal from every backup snapshot. We do commit to fixed backup retention windows and expiry.

## Privacy commitments we can keep

- We collect the minimum data needed for core planning features.
- We protect data in transit and at rest.
- We provide export and deletion controls.
- We do not use deleted content for product features after deletion from active systems.
- We state limits and retention windows plainly.
