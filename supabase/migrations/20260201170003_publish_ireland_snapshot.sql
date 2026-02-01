
-- Wrapped JSON snapshot for Ireland (IE)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162310', 
  'publish_snapshot_migration', 
  'Ireland', 
  'IE', 
  $json$
{
  "country_identity": 8,
  "country": {
    "iso2": "IE",
    "name": "Ireland",
    "region": "europe",
    "subregion": "northern_europe",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 4.5,
    "lgbtq_notes": "Ireland has strong statutory protections for sexual orientation and gender identity and ranks among high‑protection countries in recent equality and hate‑crime law surveys.[file:264][file:263]",
    "abortion_status": "legal_on_request_with_limits",
    "abortion_notes": "Abortion has been legal on request up to 12 weeks since 2018, with broader grounds thereafter, aligning Ireland with other liberal European regimes.[file:264][file:263]",
    "hate_crime_protections": "comprehensive",
    "hate_crime_notes": "National hate‑crime legislation explicitly includes protections related to sexual orientation and gender identity alongside other protected characteristics.[file:264][file:263]"
  },
  "healthcare": {
    "system_type": "public_private_mixed",
    "access_notes": "Residents with legal permission to stay can access the public system, with costs free or heavily subsidized for those who qualify for a Medical Card, while others often combine public care with private insurance.[file:258][file:259]",
    "cost_notes": "Typical GP visits fall around 100–250 USD equivalent, monthly private premiums often range 108–271 USD, and Dublin is relatively expensive, with central one‑bedroom rents about 1,955–2,715 USD and single‑person monthly budgets roughly 2,715–4,345 USD.[file:258][file:259]"
  },
  "taxation": {
    "tax_system_type": "worldwide_residence_based",
    "tax_notes": "Ireland has a U.S. tax treaty and taxes residents on worldwide income at progressive rates around 20–40 percent plus USC of 0.5–8 percent and a 4 percent PRSI charge; the Special Assignee Relief Program (SARP) can reduce Irish tax for certain inbound employees.[file:265][file:259]",
    "special_regimes": [
      "SARP_for_inbound_employees"
    ]
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "No dedicated digital‑nomad visa",
      "job_offer_required": null,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "EUR",
        "period": "monthly",
        "notes": "Ireland does not currently operate a non‑employment digital‑nomad or passive‑income visa; long‑stay options are usually tied to work, study, or specific schemes.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing depends on the underlying permission type rather than a dedicated remote‑work route.[file:264][file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Remote workers typically use standard employment or other long‑stay permissions instead of a purpose‑built nomad visa.[file:264][file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Critical Skills Employment Permit",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "EUR",
        "period": "annual",
        "notes": "The permit targets high‑demand occupations with minimum salary thresholds set by occupation list rather than a single fixed number.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": 2,
        "max": 3,
        "notes": "Typical processing time is about 8–12 weeks for complete Critical Skills Employment Permit applications.[file:264][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 5,
      "years_to_citizenship": 5,
      "notes": "Permit holders can normally qualify for long‑term residence after around 5 years of reckonable residence, and citizenship applications typically require 5 years’ residence including 1 year continuous immediately before application.[file:262][file:263]"
    },
    {
      "pathway_type": "humanitarian_or_heritage",
      "name": "International Protection (Asylum) and Grandparent Citizenship",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "none",
        "notes": "Eligibility is based on refugee criteria or documented Irish ancestry, not income.[file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Asylum timelines vary; ancestry‑based citizenship via an Irish‑born grandparent is available and follows standard citizenship processing once documentation is accepted.[file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 0,
      "notes": "Asylum applicants must file with the International Protection Office; those with an Irish‑born grandparent can often claim citizenship directly through the Foreign Births Register without prior PR.[file:263]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "english_(no_formal_test)_irish_helpful",
    "difficulty": "moderate",
    "family_reunification_wait_months": 0,
    "eligible_family_members": [
      "spouse_or_partner",
      "dependent_children"
    ],
    "years_to_pr": 5,
    "years_to_citizenship": {
      "min": 5,
      "max": 5
    },
    "dual_citizenship_allowed": true,
    "notes": "There is no formal language‑test requirement for citizenship, but everyday English is necessary; spouses and dependent children of work‑permit holders can usually join immediately; dual citizenship is permitted.[file:262][file:263]"
  },
  "quality_of_life": {
    "climate": "temperate_maritime_rainy",
    "english_proficiency": "native_english_speaking",
    "major_expat_hubs": [
      "Dublin",
      "Cork",
      "Galway"
    ],
    "time_zone_from_us_est": "+5",
    "direct_flights_from_us": "direct_flights_to_dublin_and_shannon",
    "notes": "Ireland offers a temperate but often rainy climate, strong English‑speaking communities, and direct transatlantic links, though Dublin’s housing and living costs are comparatively high.[file:259][file:263]"
  },
  "tax_notes_for_us_citizens": {
    "treaty_status": "has_us_tax_treaty",
    "feie_vs_ftc": "Given Ireland’s 20–40 percent income‑tax bands plus USC and PRSI, many U.S. citizens use either the FEIE for mid‑level incomes or foreign tax credits, sometimes combined with SARP where available.[file:265][file:259]"
  }
}

$json$
);
