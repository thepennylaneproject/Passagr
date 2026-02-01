
-- Wrapped JSON snapshot for Netherlands (NL)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162312', 
  'publish_snapshot_migration', 
  'Netherlands', 
  'NL', 
  $json$
{
  "country_identity": 7,
  "country": {
    "iso2": "NL",
    "name": "Netherlands",
    "region": "europe",
    "subregion": "western_europe",
    "policy_volatility": "low",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 5,
    "lgbtq_notes": "The Netherlands sits in the top tier of global LGBTQ+ protections, with marriage equality, broad anti‑discrimination law, and comprehensive hate‑crime provisions covering sexual orientation and gender identity.[file:263]",
    "abortion_status": "legal_protected",
    "abortion_notes": "Abortion is legal on request up to 24 weeks, with care integrated into the national health system and regulated by dedicated legislation.[file:263]",
    "hate_crime_protections": "strong",
    "hate_crime_notes": "National criminal law treats bias‑motivated crimes against LGBTQ+ people as aggravating circumstances and implements EU hate‑crime and hate‑speech directives.[file:263]"
  },
  "healthcare": {
    "system_type": "mandatory_insurance",
    "access_notes": "Residents must purchase a basic Dutch health‑insurance policy, which covers GP and most essential care; proof of compliant insurance is normally required for longer‑term residence permits.[file:258][file:259]",
    "quality_notes": "Amsterdam is relatively expensive, with typical basic premiums of about €120–€200 per month and city‑center one‑bedroom rents often €1,500–€2,200, implying single‑person monthly budgets in the €2,000–€3,500 range.[file:258]"
  },
  "taxation": {
    "tax_system_type": "worldwide",
    "tax_notes": "Tax residents are generally taxed on worldwide income at progressive rates of roughly 36.97–49.5 percent, with high overall burdens that make foreign tax credits more attractive than the FEIE for many U.S. citizens.[file:265][file:259]",
    "special_regimes": [
      {
        "name": "30% ruling for highly skilled migrants",
        "status": "active",
        "notes": "Qualifying employees recruited from abroad can receive about 30 percent of their gross salary tax‑free for up to five years, substantially reducing effective tax rates.[file:265][file:259]"
      }
    ]
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "No dedicated digital nomad visa",
      "job_offer_required": false,
      "remote_work_allowed": true,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "monthly",
        "notes": "The Netherlands does not operate a stand‑alone digital nomad visa; remote workers typically rely on other residence bases (highly skilled migrant, intra‑company transfer, entrepreneurship, or EU status).[file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing depends entirely on the underlying residence category rather than a specific nomad route.[file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Long‑term remote workers usually need an employer sponsor, self‑employment approval, or EU free‑movement rights to remain beyond short‑stay Schengen limits.[file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Highly Skilled Migrant Permit",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "EUR",
        "period": "annual",
        "notes": "Applicants must earn at least the IND’s annually adjusted minimum salary for highly skilled migrants, which rose again in 2025 per official wage‑threshold updates.[file:259]"
      },
      "processing_time_months": {
        "min": 1,
        "max": 3,
        "notes": "Digital IND processing can take around 5–10 weeks for recognized sponsors, with a 90‑day outer limit for standard cases.[file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 5,
      "years_to_citizenship": 5,
      "notes": "Continuous legal residence for five years allows both permanent residence and naturalization, subject to language and integration requirements.[file:259][file:262]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "EU Asylum Procedure (via IND)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "Asylum seekers are not assessed on income but on protection needs under EU and Dutch refugee law.[file:263]"
      },
      "processing_time_months": {
        "min": 3,
        "max": 6,
        "notes": "Under the EU Migration and Asylum Pact, border procedures target decisions within roughly 12 weeks, while regular procedures aim for about six months.[file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Applicants must register at the Central Reception Centre in Ter Apel and undergo IND screening and interviews following harmonized EU rules.[file:263]"
    }
  ],
  "sources": [
    {
      "url": "https://rainbowmap.ilga-europe.org",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Provides 2025 LGBTQ+ ranking and legal‑protection overview for the Netherlands.[file:263]"
    },
    {
      "url": "https://reproductiverights.org/maps/world-abortion-laws/",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Summarizes Dutch abortion‑on‑request law and gestational limits.[file:263]"
    },
    {
      "url": "https://ind.nl/en/required-amounts-income-requirements",
      "source_type": "government",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Lists current income thresholds for highly skilled migrants and other residence categories.[file:259]"
    },
    {
      "url": "https://www.jobbatical.com/blog/netherlands-work-permit-reforms-2025-salary-increase-ind-restrictions",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Discusses 2025 salary‑criterion increases and practical processing times for Dutch work permits.[file:259]"
    },
    {
      "url": "https://www.meijburg.com/news/annual-adjustment-salary-criterion-highly-skilled-migrants-2025",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Professional‑services summary of updated highly skilled migrant salary criteria.[file:259]"
    },
    {
      "url": "research/healthcare.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Healthcare, rent, and budget estimates for Amsterdam and the Netherlands.[file:258]"
    },
    {
      "url": "research/taxes.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Outlines Dutch progressive tax rates and the 30% ruling for expats.[file:265]"
    }
  ],
  "field_provenance": {
    "country.policy_volatility": {
      "sources": [
        "research/passagr_research_v2.md"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    },
    "rights_and_safety.lgbtq_rights_score": {
      "sources": [
        "https://rainbowmap.ilga-europe.org"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "rights_and_safety.abortion_status": {
      "sources": [
        "https://reproductiverights.org/maps/world-abortion-laws/"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "rights_and_safety.hate_crime_protections": {
      "sources": [
        "https://www.equaldex.com/issue/hate-crime-protections"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "healthcare.system_type": {
      "sources": [
        "research/healthcare.csv"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    },
    "taxation.special_regimes": {
      "sources": [
        "research/taxes.csv"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    },
    "pathways": {
      "sources": [
        "research/passagr_research.md",
        "research/passagr_research_v2.md"
      ],
      "confidence": "medium",
      "change_type": "updated"
    }
  },
  "diff_summary": {
    "has_changes": true,
    "changed_fields": [
      "rights_and_safety",
      "healthcare",
      "taxation",
      "pathways"
    ],
    "notes": "Structured the Netherlands object with top‑tier LGBTQ and abortion protections, mandatory insurance healthcare, high‑tax plus 30% ruling regime, highly skilled migrant route, and EU asylum process consistent with research tables.[file:258][file:259][file:263][file:265]"
  },
  "issues": [
    {
      "severity": "info",
      "code": "OTHER",
      "message": "Exact salary thresholds for the highly skilled migrant permit change annually; users must confirm current IND amounts before applying.",
      "related_fields": [
        "pathways[1].income_requirement"
      ]
    }
  ]
}

$json$
);
