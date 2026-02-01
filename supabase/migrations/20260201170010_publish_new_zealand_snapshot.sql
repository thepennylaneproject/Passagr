-- Wrapped JSON snapshot for New Zealand (NZ)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201163558', 
  'publish_snapshot_migration', 
  'New Zealand', 
  'NZ', 
  $json$
{
      "country_identity": 14,
      "country": {
        "iso2": "NZ",
        "name": "New Zealand",
        "region": "oceania",
        "subregion": "australia_and_new_zealand",
        "policy_volatility": "medium",
        "last_verified_at": "2026-01-31T00:00:00Z",
        "verification_status": "proposed"
      },
      "rights_and_safety": {
        "lgbtq_rights_score": 4.5,
        "lgbtq_notes": "New Zealand is in the high‑protection tier, with strong anti‑discrimination and hate‑crime protections that explicitly include sexual orientation and gender identity.[cite:259][cite:264]",
        "abortion_status": "legal_on_request_with_limits",
        "abortion_notes": "Abortion is legal on request up to around 20 weeks, placing New Zealand among liberal jurisdictions for reproductive rights.[cite:259][cite:264]",
        "hate_crime_protections": "comprehensive",
        "hate_crime_notes": "Hate‑crime and hate‑speech laws protect LGBTQ people alongside other protected characteristics.[cite:259][cite:264]"
      },
      "healthcare": {
        "system_type": "public_with_private_option",
        "access_notes": "Public healthcare is available to residents, while temporary visa holders may have more limited access and often rely on private insurance; costs are subsidized once resident status is granted.[cite:258][cite:259]",
        "cost_notes": "Typical GP visits cost about NZD 100–250, with private insurance around NZD 60–150 per month; Christchurch’s cost‑of‑living index is about 59.4, with city‑center one‑bedroom rents roughly NZD 2,000–3,000 and single budgets around NZD 3,000–4,500 per month.[cite:258][cite:259]"
      },
      "taxation": {
        "tax_system_type": "worldwide_residence_based",
        "tax_notes": "New Zealand taxes residents on worldwide income at progressive rates of roughly 10.5–39 percent; there is no broad expat‑specific income‑tax regime.[cite:259]",
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
            "currency": "NZD",
            "period": "monthly",
            "notes": "New Zealand does not have a stand‑alone digital‑nomad visa; long‑term stays for remote workers typically rely on standard work, study, or partner visas.[cite:259]"
          },
          "processing_time_months": {
            "min": null,
            "max": null,
            "notes": "Processing time depends on the underlying visa category, not a specific remote‑work route.[cite:259]"
          },
          "leads_to_pr": null,
          "years_to_pr": null,
          "years_to_citizenship": null,
          "notes": "Remote workers usually look at Skilled Migrant or other employment‑based visas if they want to settle long‑term.[cite:259]"
        },
        {
          "pathway_type": "skilled_worker",
          "name": "Skilled Migrant Category Resident Visa",
          "job_offer_required": true,
          "remote_work_allowed": false,
          "income_requirement": {
            "amount": null,
            "currency": "NZD",
            "period": "annual",
            "notes": "Requires an accredited‑employer job offer that meets occupation and wage thresholds; wage floors are adjusted periodically.[cite:259][cite:73][cite:74]"
          },
          "processing_time_months": {
            "min": 6,
            "max": 12,
            "notes": "Current indications suggest about 6–12 months from application to decision, depending on volume and completeness.[cite:259][cite:264]"
          },
          "leads_to_pr": true,
          "years_to_pr": 0,
          "years_to_citizenship": {
            "min": 5,
            "max": 5
          },
          "notes": "The Skilled Migrant Category Resident Visa directly grants residence; citizenship is typically available after about 5 years of residence, subject to presence and character requirements.[cite:262][cite:259]"
        },
        {
          "pathway_type": "humanitarian",
          "name": "Refugee / Protection Pathways via Immigration New Zealand",
          "job_offer_required": false,
          "remote_work_allowed": false,
          "income_requirement": {
            "amount": null,
            "currency": null,
            "period": "none",
            "notes": "Eligibility is based on refugee or protection status, not financial resources.[cite:259][cite:264]"
          },
          "processing_time_months": {
            "min": null,
            "max": null,
            "notes": "Applications may be made in New Zealand or via offshore resettlement channels with UNHCR involvement; timeframes vary.[cite:259][cite:264]"
          },
          "leads_to_pr": true,
          "years_to_pr": null,
          "years_to_citizenship": null,
          "notes": "Recognized refugees can obtain long‑term residence and may later qualify for citizenship under the standard 5‑year residence rule.[cite:259]"
        }
      ],
      "language_family_citizenship": {
        "language_for_citizenship": "english_required_for_citizenship_test",
        "difficulty": "moderate",
        "family_reunification_wait_months": 0,
        "eligible_family_members": [
          "spouse_or_partner",
          "dependent_children"
        ],
        "years_to_pr": 0,
        "years_to_citizenship": {
          "min": 5,
          "max": 5
        },
        "dual_citizenship_allowed": true,
        "notes": "English is not formally required for residency but helps in points‑based assessments; family members are generally included in the main visa; citizenship normally follows after about 5 years of residence, and dual citizenship is allowed.[cite:262][cite:259]"
      },
      "quality_of_life": {
        "climate": "temperate_maritime",
        "english_proficiency": "native_english_speaking",
        "major_expat_hubs": [
          "Auckland",
          "Wellington",
          "Christchurch"
        ],
        "time_zone_from_us_est": "+17_to_+18",
        "direct_flights_from_us": "direct_flights_to_auckland",
        "notes": "New Zealand has a mild, oceanic climate, high overall quality of life, and English‑speaking cities, but it is geographically distant from North America with long travel times.[cite:259]"
      },
      "tax_notes_for_us_citizens": {
        "treaty_status": "has_us_tax_treaty",
        "feie_vs_ftc": "At moderate incomes the FEIE can work, but for higher incomes New Zealand’s 10.5–39 percent rates often make the Foreign Tax Credit competitive; optimal choice depends on individual income mix.[cite:259]"
      }


}
$json$
);
