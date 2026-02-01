
-- Wrapped JSON snapshot for United Kingdom (GB)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162310', 
  'publish_snapshot_migration', 
  'United Kingdom', 
  'GB', 
  $json$
{
  "country_identity": 9,
  "country": {
    "iso2": "GB",
    "name": "United Kingdom",
    "region": "europe",
    "subregion": "northern_europe",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 3.5,
    "lgbtq_notes": "The UK retains legal protections for sexual orientation and race but has seen weakening gender‑identity protections and dropped to around 22nd place in recent European LGBTQ equality rankings.[file:264][file:259]",
    "abortion_status": "legal_on_request_with_limits",
    "abortion_notes": "Abortion is legal on request up to about 24 weeks in Great Britain, aligning it with other liberal European regimes.[file:264][file:259]",
    "hate_crime_protections": "partial_to_comprehensive",
    "hate_crime_notes": "Hate‑crime statutes cover protected characteristics such as sexual orientation and race, but debates and legal shifts have created uncertainty around the robustness of gender‑identity protections.[file:264][file:259]"
  },
  "healthcare": {
    "system_type": "NHS_public_with_private_option",
    "access_notes": "Medium‑ and long‑term visa holders generally gain access to the NHS by paying the Immigration Health Surcharge; once paid, most NHS services are free at the point of use.[file:258][file:259]",
    "cost_notes": "The Immigration Health Surcharge is about 1,035 USD equivalent per year, typical GP visits outside the NHS range 50–200 USD, and London living costs are high, with city‑center one‑bedroom rents roughly 2,270–3,150 USD and single budgets about 3,150–5,040 USD monthly.[file:258][file:259]"
  },
  "taxation": {
    "tax_system_type": "worldwide_residence_based",
    "tax_notes": "The UK has a U.S. tax treaty and taxes residents on worldwide income at progressive rates around 20–45 percent plus National Insurance; the historic non‑dom tax status was ended in 2025, leaving no broad expat‑specific regime.[file:265][file:259]",
    "special_regimes": []
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "No dedicated digital‑nomad visa",
      "job_offer_required": null,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "GBP",
        "period": "monthly",
        "notes": "The UK does not operate a standalone digital‑nomad or passive‑income visa; most long‑stay routes are tied to work, study, or family.[file:264][file:259]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing times depend entirely on the chosen underlying route rather than a specific remote‑work category.[file:264][file:259]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Remote workers usually rely on standard work or other visa categories if they need to be physically present in the UK.[file:264][file:259]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Skilled Worker Visa (formerly Tier 2)",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "GBP",
        "period": "annual",
        "notes": "Minimum salary thresholds vary by occupation and shortage‑occupation status, rather than a single universal figure.[file:259]"
      },
      "processing_time_months": {
        "min": 0.75,
        "max": 2,
        "notes": "Standard decisions are often in about 3 weeks for applications from outside the UK and 8 weeks from inside.[file:264][file:259]"
      },
      "leads_to_pr": true,
      "years_to_pr": 5,
      "years_to_citizenship": {
        "min": 5,
        "max": 6
      },
      "notes": "Skilled workers can typically apply for indefinite leave to remain after 5 years and then for citizenship after 5–6 years total residence, subject to language and integration tests.[file:262][file:259]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Asylum via UK Visas and Immigration (UKVI)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "none",
        "notes": "Eligibility is based on persecution risk and refugee‑status criteria, not financial capacity.[file:264][file:259]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Asylum processing times vary and can be lengthy; applicants must lodge claims with the Home Office and attend a substantive interview.[file:264][file:259]"
      },
      "leads_to_pr": true,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Recognized refugees can later transition to more secure long‑term residence statuses and eventually pursue citizenship under standard rules.[file:259]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "english_B1_plus_Life_in_the_UK_test",
    "difficulty": "moderate",
    "family_reunification_wait_months": 0,
    "eligible_family_members": [
      "spouse_or_partner",
      "children_under_18"
    ],
    "years_to_pr": 5,
    "years_to_citizenship": {
      "min": 5,
      "max": 6
    },
    "dual_citizenship_allowed": true,
    "notes": "Citizenship normally requires B1‑level English (or another recognized language test) plus the Life in the UK exam; spouses and minor children of visa holders can typically join immediately; dual citizenship is permitted.[file:262][file:259]"
  },
  "quality_of_life": {
    "climate": "temperate_maritime_cool_and_rainy",
    "english_proficiency": "native_english_speaking",
    "major_expat_hubs": [
      "London",
      "Manchester",
      "Edinburgh",
      "Brighton"
    ],
    "time_zone_from_us_est": "+5",
    "direct_flights_from_us": "extensive_direct_flights_to_multiple_UK_cities",
    "notes": "The UK offers a cool, often rainy climate, very high English‑language convenience, and dense transatlantic air links, but major cities such as London are among Europe’s more expensive locations.[file:258][file:259]"
  },
  "tax_notes_for_us_citizens": {
    "treaty_status": "has_us_tax_treaty",
    "feie_vs_ftc": "Because UK tax bands reach 20–45 percent plus National Insurance, U.S. citizens often favor foreign tax credits over the FEIE for higher incomes, though the FEIE can still suit moderate earners.[file:265][file:259]"
  }
}

$json$
);
