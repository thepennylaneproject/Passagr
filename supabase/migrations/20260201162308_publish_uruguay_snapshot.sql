
-- Wrapped JSON snapshot for Uruguay (UY)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162308', 
  'publish_snapshot_migration', 
  'Uruguay', 
  'UY', 
  $json$
{
  "country_identity": 4,
  "country": {
    "iso2": "UY",
    "name": "Uruguay",
    "region": "americas",
    "subregion": "latin_america_and_the_caribbean",
    "policy_volatility": "low",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 4.5,
    "lgbtq_notes": "Uruguay offers strong protections for sexual orientation and gender identity in law, with comprehensive hate‑crime and anti‑discrimination provisions and recognition as a high‑protection jurisdiction in regional rights surveys.[file:259][file:263]",
    "abortion_status": "legal_on_request",
    "abortion_notes": "Abortion is legal on request up to 12 weeks of pregnancy, with nationally implemented access frameworks.[file:259][file:263]",
    "hate_crime_protections": "comprehensive",
    "hate_crime_notes": "National legislation explicitly includes sexual orientation and gender identity within hate‑crime and anti‑discrimination protections.[file:259][file:263]"
  },
  "healthcare": {
    "system_type": "public_plus_private",
    "access_notes": "Residents, including expats with legal residency, can access low‑cost public services or join private mutualista plans, with GP visits roughly 40–80 USD in public and 100–250 USD in private clinics.[file:258]",
    "quality_notes": "Overall healthcare and living costs are lower than in North America and Western Europe, with typical single‑person monthly budgets in Montevideo around 1,500–2,500 USD and central one‑bedroom rents around 800–1,500 USD.[file:258]"
  },
  "taxation": {
    "tax_system_type": "territorial",
    "tax_notes": "Uruguay has no U.S. tax treaty but operates a territorial system that, for at least the first five years of tax residency, generally does not tax most foreign‑source income while applying progressive rates of about 0–36 percent on Uruguay‑source income.[file:259]",
    "special_regimes": [
      {
        "name": "First‑five‑years foreign‑income exemption",
        "description": "New tax residents may elect a regime under which foreign‑source income is exempt from Uruguay tax for their first five years of residency, making FEIE strategies particularly attractive for U.S. citizens.[file:259]"
      }
    ]
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "Independent Means / Rentista Visa",
      "job_offer_required": false,
      "remote_work_allowed": true,
      "income_requirement": {
        "amount": 1500,
        "currency": "USD",
        "period": "monthly",
        "notes": "Applicants must show at least 1,500 USD per month in stable passive income from abroad; exact documentation and indexing rules are set by immigration authorities.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": 0,
        "max": 1,
        "notes": "Independent‑means applicants receive immediate temporary residency upon approval, with administrative issuance typically within a few weeks.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 3,
      "notes": "This route grants immediate permanent residency or converts from temporary to permanent within 6–12 months, and citizenship is generally available after 3–5 total years of residence depending on family status and physical‑presence criteria.[file:259][file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "General Work Visa / Employment‑Based Residency",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "UYU",
        "period": "monthly",
        "notes": "Employers must register and comply with local labor and social‑security rules; minimum salary depends on sector and current national wage standards.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": 0.5,
        "max": 1,
        "notes": "Employment‑based residence typically processes in about 2–4 months from filing to card issuance.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 3,
      "notes": "Work‑based residents can move into or directly obtain permanent residency in roughly 6–12 months, counting toward the 3–5 year citizenship clock.[file:259][file:262][file:263]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Refugee Status Determination (CONARE)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "Eligibility depends on persecution or serious harm under refugee definitions, not on income.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Durations vary by case; applicants receive documentation while CONARE evaluates their claim.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 3,
      "notes": "Recognized refugees receive residence status and can later qualify for permanent residency and citizenship under standard time‑in‑country rules.[file:259][file:263]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "basic_spanish",
    "difficulty": "easy",
    "family_reunification_wait_months": 0,
    "eligible_family_members": [
      "spouse_or_partner",
      "children",
      "dependent_parents"
    ],
    "years_to_pr": 0,
    "years_to_citizenship": {
      "min": 3,
      "max": 5
    },
    "dual_citizenship_allowed": true,
    "notes": "Spanish is not required for residency and only basic competency is needed for naturalization; family members can usually join immediately, permanent residency is effectively immediate, and dual citizenship is allowed.[file:259][file:262]"
  },
  "quality_of_life": {
    "climate": "temperate_mild",
    "english_proficiency": "low",
    "major_expat_hubs": [
      "Montevideo",
      "Punta del Este"
    ],
    "time_zone_from_us_est": "-2",
    "direct_flights_from_us": "limited_via_buenos_aires",
    "notes": "Uruguay has a mild temperate climate with four seasons, concentrated expat communities in Montevideo and Punta del Este, lower general English proficiency, a roughly 2‑hour time difference from U.S. Eastern time, and most U.S. connections routed via Buenos Aires.[file:259][file:260]"
  },
  "sources": [
    {
      "url": "https://goldenharbors.com/articles/uruguay-independent-means-visa",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Explains Uruguay’s independent‑means visa income thresholds and residency consequences.[file:259]"
    },
    {
      "url": "https://www.globalcitizensolutions.com/independent-means-visa-uruguay",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Provides additional detail on the rentista passive‑income requirement and permanent‑residency timeline.[file:259]"
    },
    {
      "url": "research/healthcare.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Contains healthcare cost ranges, system type, and cost‑of‑living figures for Montevideo.[file:258]"
    },
    {
      "url": "research/language.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Summarizes language, family‑reunification, PR, and citizenship timelines for Uruguay.[file:262]"
    }
  ],
  "field_provenance": {
    "rights_and_safety": {
      "sources": [
        "research/passagr_research_v2.md",
        "research/passagr_research.md"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "healthcare": {
      "sources": [
        "research/healthcare.csv"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    },
    "taxation": {
      "sources": [
        "research/passagr_research_v2.md"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    },
    "pathways": {
      "sources": [
        "research/passagr_research_v2.md",
        "research/passagr_research.md"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    },
    "language_family_citizenship": {
      "sources": [
        "research/language.csv"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "quality_of_life": {
      "sources": [
        "research/liveability.csv",
        "research/healthcare.csv"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    }
  },
  "diff_summary": {
    "has_changes": true,
    "changed_fields": [
      "taxation",
      "pathways",
      "language_family_citizenship",
      "quality_of_life"
    ],
    "notes": "Captured Uruguay’s independent‑means residency, territorial tax regime, fast PR and citizenship timing, and healthcare and cost‑of‑living profile for expats.[file:259][file:258][file:262]"
  },
  "issues": []
}

$json$
);
