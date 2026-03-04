# Security Posture

This document describes the practical security model for Passagr.

## Scope and intent

Passagr is a personal planning tool for immigration research and task tracking. It is not a legal decision system and does not determine eligibility or outcomes.

Our security goal is to reduce likely harm with proven controls, while staying usable and transparent about limits.

## Authentication and access

Passagr uses Supabase Auth with user-scoped access controls.

Supported sign-in methods:
- Email and password
- Passkeys (WebAuthn), where available

Optional account hardening:
- MFA (for example, TOTP) is supported and encouraged

Session controls:
- Short-lived access tokens
- Refresh token rotation
- Secure session cookies
- Session revocation on sensitive actions (for example, account deletion)

Authorization model:
- Row Level Security (RLS) is enabled on user data tables
- Users can access only rows owned by their account
- Privileged service operations run server-side only

## Encryption model

### Encrypted in transit
- API traffic between client and backend over TLS

### Encrypted at rest
- Database and storage encryption provided by the hosting platform

### Additional application-layer encryption
Sensitive user content is encrypted at the field/content layer before storage where feasible, including:
- Personal notes
- Saved references and extracted reference text
- Freeform checklist notes

### Data that is intentionally not content-encrypted
Some metadata remains plaintext in the database so the product can function:
- Internal IDs
- `user_id` ownership links
- Timestamps
- Canonical path references (for joins)
- Non-sensitive status fields (for example, checklist completion state)

Reason: these fields are needed for authorization checks, indexing, relational joins, sorting, and product performance.

## Security boundaries and residual risks

Security controls reduce risk; they do not remove all risk.

Residual risks include:
- Metadata visibility (for example, counts, timestamps, record relationships)
- Account compromise on user side (weak password, device compromise, phishing)
- Operational misconfiguration or provider incident
- Temporary unavailability of key infrastructure affecting encrypted-content access

## Logging and monitoring

Passagr uses minimal operational logging for reliability and abuse prevention.

Logging rules:
- Do not log note/reference plaintext content in routine logs
- Do not log credentials or raw authentication secrets
- Restrict production log access to least privilege

## What we will never store

Passagr will not intentionally store:
- Plaintext passwords
- Password hints or security-question answers
- Payment card numbers or bank account credentials
- Full government ID numbers by default (for example, passport or national ID), unless explicitly required for a user-requested feature
- Full document scans by default
- Raw MFA seeds in plaintext
- Unredacted private note/reference content in analytics events

## Security posture statement

Passagr uses standard, proven controls: authenticated access, strict per-user authorization, encryption in transit, encryption at rest, and additional encryption for sensitive user-generated content where appropriate. We minimize data collection and provide data export and deletion controls. No system is risk-free, and we describe known limits plainly.
