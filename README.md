# Passagr — AI-powered immigration research platform

> Part of <a href="https://thepennylaneproject.org">The Penny Lane Project</a> — technology that serves the individual.

## What This Is

Passagr is a structured, human-reviewed immigration data platform that helps individuals research visa pathways, residency requirements, and quality-of-life factors across countries. It is built around a multi-agent pipeline that extracts, validates, and stages immigration policy data for editorial review before publication. The goal is to provide accurate, source-backed information — not AI hallucinations dressed up as facts.

## Current Status

**Alpha** — The data pipeline (fetch → extract → validate → diff → editorial review → publish) works end-to-end, and the public map/search UI renders live data. Active development is focused on expanding country coverage, improving the editorial tooling, and hardening the search index sync.

## Technical Overview

- **Frontend:** React 19, Vite, MapLibre GL, Tailwind CSS v4
- **Backend:** Express API (TypeScript) + Netlify Functions for edge endpoints
- **Database:** PostgreSQL via Supabase (row-level security, views, migrations)
- **AI:** OpenAI GPT-4 Turbo for structured data extraction; AJV for schema validation
- **Search:** Typesense for full-text and faceted search
- **Deployment:** Netlify (frontend + functions); Supabase (database + auth)

## Architecture

Passagr follows a JAMstack pattern with a serverless edge layer. The core data flow is a staged pipeline:

```
Source URL → Fetcher → Extractor (LLM) → Validator → Differ → Editorial Queue → Publisher → Live DB
```

Background jobs (freshness scan, link check, index refresh) run on a cron schedule via Netlify Functions secured with a shared `CRON_SECRET`. The frontend communicates with the Express API for admin/editorial flows and directly with Netlify Functions for public endpoints.

## Development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + OpenAI credentials

# Run API and UI in parallel
npm run dev

# Run API only
npm run dev:api

# Run UI only
npm run dev:ui

# Run via Netlify CLI (includes functions)
npm run dev:netlify
```

### Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## License

All rights reserved — The Penny Lane Project.
