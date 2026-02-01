
-- Wrapped JSON snapshot for Thailand (TH)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162309', 
  'publish_snapshot_migration', 
  'Thailand', 
  'TH', 
  $json$
{
  "country_identity": 7,
  "country": {
    "iso2": "TH",
    "name": "Thailand",
    "region": "asia",
    "subregion": "south_eastern_asia",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 3.5,
    "lgbtq_notes": "Thailand legalized same‑sex marriage on January 23, 2025, becoming the first country in Southeast Asia to do so, but broader hate‑crime and anti‑discrimination protections remain partial rather than comprehensive.[file:264][file:263]",
    "abortion_status": "legal_with_restrictions",
    "abortion_notes": "Abortion is legal with gestational limits and specific grounds such as health and socio‑economic reasons, generally permitted up to about 22 weeks with some procedural restrictions.[file:264][file:263]",
    "hate_crime_protections": "limited",
    "hate_crime_notes": "The Gender Equality Act 2015 offers some protection against discrimination, but there is no fully developed nationwide hate‑crime framework explicitly covering sexual orientation and gender identity.[file:264][file:263]"
  },
  "healthcare": {
    "system_type": "mixed_public_private",
    "access_notes": "Public facilities exist but many expats rely on private hospitals and clinics, where out‑of‑pocket costs are relatively low by global standards.[file:259]",
    "cost_notes": "Typical GP‑level visits range roughly 10–30 USD in public settings and 30–80 USD in private clinics, with private insurance premiums often around 50–150 USD per month for basic coverage.[file:259]"
  },
  "economics_and_cost_of_living": {
    "overall_cost_level": "low",
    "rent_1br_city_center_usd": {
      "min": 400,
      "max": 800
    },
    "monthly_budget_single_usd": {
      "min": 1000,
      "max": 2000
    },
    "notes": "Thailand, especially Bangkok and major provincial cities, offers a significantly lower cost of living than Western Europe or North America, making it attractive for budget‑conscious expats.[file:259][file:263]"
  },
  "taxation": {
    "tax_system_type": "territorial_with_progressive_rates",
    "tax_notes": "Thailand taxes primarily Thai‑source income at progressive rates of about 0–35 percent, and foreign income is generally not taxed if it is not remitted to Thailand within the same tax year.[file:265][file:259]",
    "special_regimes": [
      "territorial_non_remittance"
    ]
  },
  "pathways": [
    {
      "pathway_type": "remote_work_financial_independence",
      "name": "Elite Visa / Long‑Term Resident (LTR) structures",
      "job_offer_required": false,
      "remote_work_allowed": true,
      "income_requirement": {
        "amount": 25000,
        "currency": "USD",
        "period": "one_time_deposit_for_elite",
        "notes": "Common Elite packages require a lump‑sum fee around 25,000 USD; some LTR categories also set income or asset thresholds rather than monthly proof.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": 1,
        "max": 3,
        "notes": "Typical Elite or LTR approvals fall in roughly a 4–12 week window depending on visa type.[file:264][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": {
        "min": 3,
        "max": 10
      },
      "years_to_citizenship": null,
      "notes": "Long‑stay visas can count toward permanent residency after approximately 3–10 years depending on category, but citizenship remains difficult and slow.[file:264][file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "BOI‑sponsored Work Permit – Non‑Immigrant B",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "THB",
        "period": "monthly",
        "notes": "Salary thresholds vary by role, employer type, and Board of Investment sponsorship rather than a single universal minimum.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": 1,
        "max": 2,
        "notes": "Processing for BOI‑linked Non‑Immigrant B work visas is typically about 4–8 weeks.[file:264][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": {
        "min": 3,
        "max": 10
      },
      "years_to_citizenship": 10,
      "notes": "Work‑permit holders can become eligible for permanent residence after several years of continuous stay; citizenship usually requires around 10 years and stringent criteria.[file:262][file:263]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Refugee Status Determination – Ministry of Interior with UNHCR support",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "none",
        "notes": "Protection is based on refugee criteria rather than financial capacity.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Timelines vary and depend on Ministry and UNHCR procedures.[file:264][file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Applicants must be physically present in Thailand and lodge claims with the immigration bureau, often with UNHCR assistance.[file:264][file:263]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "basic_thai",
    "difficulty": "very_difficult_for_citizenship",
    "family_reunification_wait_months": {
      "min": 0,
      "max": 0
    },
    "eligible_family_members": [
      "spouse",
      "children"
    ],
    "years_to_pr": {
      "min": 3,
      "max": 10
    },
    "years_to_citizenship": 10,
    "dual_citizenship_allowed": true,
    "notes": "Thai language is not required for visas but basic proficiency is needed for naturalization; family members such as spouses and children can accompany primary visa holders; permanent residence generally takes 3–10 years, and citizenship is rare and typically requires around 10 years plus language and integration tests.[file:262][file:263]"
  },
  "quality_of_life": {
    "climate": "tropical_hot_humid",
    "english_proficiency": "moderate_in_tourist_areas_low_elsewhere",
    "major_expat_hubs": [
      "Bangkok",
      "Chiang Mai",
      "Phuket",
      "Hua Hin"
    ],
    "time_zone_from_us_est": "+12",
    "direct_flights_from_us": "direct_flights_to_bangkok_available",
    "notes": "Thailand offers a warm tropical climate, large urban and beach‑town expat communities, and strong connectivity, but the 12‑hour time difference to U.S. Eastern time can be challenging for synchronous work.[file:259][file:263]"
  },
  "tax_notes_for_us_citizens": {
    "treaty_status": "has_us_tax_treaty",
    "feie_vs_ftc": "Because Thailand uses a territorial system with 0–35 percent rates only on Thai‑source income and non‑remitted foreign income often outside scope, U.S. citizens commonly prioritize the FEIE, sometimes with limited foreign tax credits.[file:265][file:259]"
  }
}

$json$
);
