
-- Wrapped JSON snapshot for Australia (AU)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162313', 
  'publish_snapshot_migration', 
  'Australia', 
  'AU', 
  $json$
{
  "country_identity": 12,
  "country": {
    "iso2": "AU",
    "name": "Australia",
    "region": "oceania",
    "subregion": "australia_and_new_zealand",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 4.5,
    "lgbtq_notes": "Australia is in the high‑protection tier, with federal anti‑discrimination protections for sexual orientation and race and additional state‑level hate‑crime laws; rights are strong but implementation is still monitored by human‑rights groups.[web:69][web:259]",
    "abortion_status": "legal_on_request_with_state_variation",
    "abortion_notes": "Abortion is legal in all states and territories, generally on request in early pregnancy, though specific rules and gestational limits vary by state.[web:59][web:259]",
    "hate_crime_protections": "mixed_federal_and_state",
    "hate_crime_notes": "Hate‑crime and vilification protections exist but are split between federal and state frameworks, and recent reviews highlight the need for improved human‑rights oversight.[web:69][web:259]"
  },
  "healthcare": {
    "system_type": "medicare_public_with_private_option",
    "access_notes": "Australia runs a universal Medicare system; access for expats depends on visa class and any reciprocal agreements, and many temporary visa holders rely partly on private insurance.[file:258][web:259]",
    "cost_notes": "Typical GP visits for those covered by Medicare are subsidized, while private visits commonly run about AUD 150–300; Sydney’s cost‑of‑living index is around 75.1 with central one‑bedroom rents about AUD 2,500–3,500 and single‑person monthly budgets roughly AUD 3,500–5,000.[file:258][web:259]"
  },
  "taxation": {
    "tax_system_type": "residence_based_worldwide",
    "tax_notes": "Australia taxes residents on worldwide income at progressive rates of roughly 19–45 percent plus a 2 percent Medicare levy, placing it among high‑tax countries.[web:259]",
    "special_regimes": [],
    "us_tax_treaty": true
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "No dedicated digital‑nomad visa",
      "job_offer_required": null,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "AUD",
        "period": "monthly",
        "notes": "Australia does not offer a specific digital‑nomad or passive‑income visa; long stays typically require work, study, or family visas and may not legally support full‑time foreign‑employer remote work under all subclasses.[web:259]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing depends entirely on the underlying visa (e.g., skilled, student, visitor) rather than a dedicated remote‑work route.[web:259]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Remote workers generally use standard skilled or other visas if they intend to base themselves in Australia long term.[web:259]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Skilled Independent (Subclass 189) / Skilled Nominated (Subclass 190)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "AUD",
        "period": "annual",
        "notes": "These are points‑based permanent visas; there is no single salary minimum, but applicants must meet occupation, skill, and points thresholds rather than a fixed income bar.[web:70][web:71]"
      },
      "processing_time_months": {
        "min": 8,
        "max": 19,
        "notes": "Current processing is about 8–18 months for Subclass 189 and 9–19 months for Subclass 190, with times fluctuating by queue and case complexity.[web:70][web:71][web:259]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": {
        "min": 4,
        "max": 4
      },
      "notes": "These visas grant permanent residency on arrival; citizenship is typically available after about 4 years of lawful residence, including at least 1 year as a permanent resident.[file:262][web:259]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Protection Visa / Humanitarian Program",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "none",
        "notes": "Access is based on meeting refugee or complementary‑protection criteria, not on income or employment.[web:259]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing times vary widely; applications may be lodged onshore or via offshore humanitarian channels, sometimes with UNHCR referral.[web:259]"
      },
      "leads_to_pr": true,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Recognized refugees usually transition to permanent status and may become eligible for citizenship after fulfilling residence and character requirements.[web:259]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "english_required_in_pr_points_and_citizenship_test",
    "difficulty": "moderate",
    "family_reunification_wait_months": 0,
    "eligible_family_members": [
      "spouse_or_partner",
      "dependent_children"
    ],
    "years_to_pr": 0,
    "years_to_citizenship": {
      "min": 4,
      "max": 4
    },
    "dual_citizenship_allowed": true,
    "notes": "English is not a separate formal requirement for PR beyond points‑test scoring, but applicants must satisfy English criteria for skilled visas and later pass a citizenship test; family members are usually included in the primary skilled visa; citizenship normally follows after about 4 years of total residence including 1 year as a permanent resident, and dual citizenship is permitted.[file:262][web:259]"
  },
  "quality_of_life": {
    "climate": "varied_temperate_to_tropical",
    "english_proficiency": "native_english_speaking",
    "major_expat_hubs": [
      "Sydney",
      "Melbourne",
      "Brisbane",
      "Perth"
    ],
    "time_zone_from_us_est": "+14_to_+16",
    "direct_flights_from_us": "direct_flights_to_sydney_and_melbourne",
    "notes": "Australia combines high living standards and English‑speaking cities with relatively high urban costs; Sydney’s cost index is about 75.1 and central rents are significantly above many European cities.[file:258][web:259]"
  },
  "tax_notes_for_us_citizens": {
    "treaty_status": "has_us_tax_treaty",
    "feie_vs_ftc": "Because Australia’s marginal rates reach roughly 45 percent plus a Medicare levy, U.S. citizens often favor the Foreign Tax Credit over the FEIE, especially at higher incomes.[web:259]"
  }
}

$json$
);
