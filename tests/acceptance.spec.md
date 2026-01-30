# Acceptance Test Suite for passagr

## Test 1: Fee Increase and Editorial Review
**Scenario:** A new official PDF shows an increase in a visa application fee.
**Given:**
- An existing `visa_path` entity for Mexico Digital Nomad with a fee of 100 USD.
- A new source PDF is ingested, containing the same visa information but with the fee listed as 120 USD.
**When:**
- The Fetcher agent processes the new PDF and updates the `sources` table.
- The Extractor agent runs on the new source, pulling the updated fee.
- The Validator agent checks the new entity data and finds it valid.
- The Differ agent compares the new data (120 USD) with the old (100 USD).
- The Editorial Router receives the diff and sees a high-impact change (financial data).
**Then:**
- The `differ` output JSON `change_type` is `update` and `diff_fields` contains an entry like `{ "field": "fees[...].amount", "from": 100, "to": 120 }`.
- An entry is created in the `editorial_reviews` table with `status` set to `pending`.
- The `visa_path` entity's `last_verified_at` and `status` remain unchanged until human approval.

---

## Test 2: Source URL 404
**Scenario:** An official source link for a visa path becomes invalid.
**Given:**
- A `source` entry with a URL that now returns a 404 Not Found error.
- The weekly link checker job is scheduled to run.
**When:**
- The `link-check` cron job is executed.
- The job attempts to fetch the problematic URL.
**Then:**
- The `sources` table entry for that URL is updated with a `last_checked_at` timestamp.
- The system logs a warning or adds a note to the source's entry.
- A task is enqueued to refetch the information, perhaps by using an alternative official URL if one can be found, or a new human review is triggered.

---

## Test 3: Extractor Returns Null
**Scenario:** An official document is missing a specific piece of information.
**Given:**
- A source document for a visa path does not specify the `min_income_amount`.
**When:**
- The Extractor agent processes the document.
- The Extractor sets the `min_income_amount` field to `null` in its output JSON.
- The Validator agent receives the Extractor's output.
**Then:**
- The `validator` output JSON `errors` array is empty.
- The `validator` output JSON `warnings` array contains a message like `"Field 'min_income.amount' is null or empty."`.
- The `valid` field is `true`.
- The `impact` field is correctly set to `medium` due to the warning (if the entity was previously approved) or `high` if it's a new entity.

---

## Test 4: Successful Publication
**Scenario:** A verified entity is published to the public database.
**Given:**
- An entity (e.g., a `visa_path`) has passed validation and has been approved for publication by an editor (or was auto-approved).
**When:**
- The Publisher agent is triggered.
**Then:**
- The corresponding row in the `visa_paths` table is updated with the new data.
- The `last_verified_at` timestamp on that row is updated to the current time.
- A new row is inserted into the `changelogs` table, documenting the change with a human-readable summary, the affected fields, and the source IDs.
- A search index update is triggered for the updated entity.
- The frontend CDN cache is signaled for revalidation for the specific public URL.