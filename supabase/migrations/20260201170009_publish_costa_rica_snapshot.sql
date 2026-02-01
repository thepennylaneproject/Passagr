
-- Wrapped JSON snapshot for Unknown (UNKNOWN)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201163558', 
  'publish_snapshot_migration', 
  'Unknown', 
  'UNKNOWN', 
  $json$
{
  "countries": [
    {
      "country_identity": 13,
      "country": {
        "iso2": "CR",
        "name": "Costa Rica",
        "region": "latin_america",
        "subregion": "central_america",
        "policy_volatility": "medium",
        "last_verified_at": "2026-01-31T00:00:00Z",
        "verification_status": "proposed"
      },
      "rights_and_safety": {
        "lgbtq_rights_score": 3,
        "lgbtq_notes": "Costa Rica offers moderate LGBTQ protections but lacks specific LGBTQ‑focused hate‑crime laws and falls below top‑tier equality countries.[cite:259][cite:264]",
        "abortion_status": "highly_restricted",
        "abortion_notes": "Abortion is highly restricted and generally only permitted to protect life or health or in cases of rape, making access significantly tighter than in most of Europe.[cite:259][cite:264]",
        "hate_crime_protections": "limited",
        "hate_crime_notes": "There are limited hate‑crime provisions and no dedicated national framework explicitly covering LGBTQ status.[cite:259][cite:264]"
      },
      "healthcare": {
        "system_type": "public_caja_with_private_option",
        "access_notes": "Residents join the Caja Costarricense de Seguro Social (CCSS) system; expats with residency can enroll and also commonly use private clinics.[cite:258][cite:259]",
        "cost_notes": "Public care is low‑cost, with GP visits roughly 50–100 USD in public and 70–200 USD in private clinics; overall healthcare is cheaper than in most developed countries.[cite:258][cite:259]"
      },
      "taxation": {
        "tax_system_type": "territorial",
        "tax_notes": "Costa Rica taxes only Costa‑Rica‑sourced income for residents; foreign‑sourced income is generally exempt, making it a favorable low‑tax base for foreign earners.[cite:259]",
        "special_regimes": [],
        "us_tax_treaty": false
      },
      "pathways": [
        {
          "pathway_type": "remote_work",
          "name": "Rentista Visa (Passive Income)",
          "job_offer_required": false,
          "remote_work_allowed": true,
          "income_requirement": {
            "amount": 2500,
            "currency": "USD",
            "period": "monthly",
            "notes": "Applicants must show 2,500 USD per month in guaranteed income or a 60,000 USD deposit, often via an annuity or stable remote income.[cite:259][cite:264]"
          },
          "processing_time_months": {
            "min": 3,
            "max": 6,
            "notes": "Typical processing ranges about 3–6 months.[cite:259][cite:264]"
          },
          "leads_to_pr": true,
          "years_to_pr": 3,
          "years_to_citizenship": {
            "min": 7,
            "max": 7
          },
          "notes": "After 3 years on Rentista status you can usually apply for permanent residency; citizenship is commonly available after about 7 years of total residence.[cite:259][cite:264]"
        },
        {
          "pathway_type": "skilled_worker",
          "name": "General Work Permit",
          "job_offer_required": true,
          "remote_work_allowed": false,
          "income_requirement": {
            "amount": null,
            "currency": "CRC",
            "period": "monthly",
            "notes": "Salaries must meet local labor‑law minima for the specific occupation, but there is no single, uniform threshold.[cite:259]"
          },
          "processing_time_months": {
            "min": 2,
            "max": 4,
            "notes": "General work permits usually process in about 2–4 months.[cite:259][cite:264]"
          },
          "leads_to_pr": true,
          "years_to_pr": 3,
          "years_to_citizenship": {
            "min": 7,
            "max": 7
          },
          "notes": "Time on a work permit counts toward the ~3‑year window for permanent residency and the ~7‑year citizenship track.[cite:259]"
        },
        {
          "pathway_type": "humanitarian",
          "name": "Refugee Status Determination",
          "job_offer_required": false,
          "remote_work_allowed": false,
          "income_requirement": {
            "amount": null,
            "currency": null,
            "period": "none",
            "notes": "Eligibility is based on persecution and refugee criteria, not financial capacity.[cite:259][cite:264]"
          },
          "processing_time_months": {
            "min": null,
            "max": null,
            "notes": "Cases are handled by Costa Rican immigration authorities, sometimes with UNHCR support; timelines vary widely.[cite:259][cite:264]"
          },
          "leads_to_pr": true,
          "years_to_pr": null,
          "years_to_citizenship": null,
          "notes": "Recognized refugees may later transition to permanent status and eventually citizenship under general residence rules.[cite:259]"
        }
      ],
      "language_family_citizenship": {
        "language_for_citizenship": "spanish_B1_for_citizenship",
        "difficulty": "moderate",
        "family_reunification_wait_months": 0,
        "eligible_family_members": [
          "spouse_or_partner",
          "minor_children",
          "dependent_parents"
        ],
        "years_to_pr": 3,
        "years_to_citizenship": {
          "min": 7,
          "max": 7
        },
        "dual_citizenship_allowed": true,
        "notes": "Spanish is not required for residency but B1‑level Spanish is generally needed for citizenship; family reunification covers spouses, minor children, and dependent parents; permanent residence usually follows about 3 years with citizenship around 7 years.[cite:262][cite:259]"
      },
      "quality_of_life": {
        "climate": "tropical_with_cooler_mountain_areas",
        "english_proficiency": "moderate_in_expat_and_tourist_zones",
        "major_expat_hubs": [
          "San Jose",
          "Central_Valley_towns"
        ],
        "time_zone_from_us_est": "-1",
        "direct_flights_from_us": "direct_flights_from_multiple_us_cities_to_san_jose",
        "notes": "Costa Rica offers a tropical climate with cooler highland regions, relatively low costs compared to North America, and established expat communities in and around San José and the Central Valley.[cite:259]"
      },
      "tax_notes_for_us_citizens": {
        "treaty_status": "no_us_tax_treaty",
        "feie_vs_ftc": "The territorial system and lack of tax on foreign income make Costa Rica highly compatible with the Foreign Earned Income Exclusion; the Foreign Tax Credit is usually less relevant because local tax on foreign income is minimal.[cite:259]"
      }
    }
  ]
}
$json$
);
