
-- Wrapped JSON snapshot for Mexico (MX)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162307', 
  'publish_snapshot_migration', 
  'Mexico', 
  'MX', 
  $json$
{
  "country_identity": 3,
  "country": {
    "iso2": "MX",
    "name": "Mexico",
    "region": "americas",
    "subregion": "latin_america_and_the_caribbean",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 3.5,
    "lgbtq_notes": "Mexico has nationwide marriage equality and federal recognition of hate crimes based on sexual orientation, but protections and enforcement still vary significantly by state and locality.[file:263][file:264]",
    "abortion_status": "decriminalized_mixed",
    "abortion_notes": "Abortion was decriminalized at the federal level in 2023, yet practical access and local criminal codes continue to differ across states, creating a patchwork of implementation.[file:263]",
    "hate_crime_protections": "partial",
    "hate_crime_notes": "Federal law recognizes hate crimes based on sexual orientation, but state‑level statutes and consistent enforcement remain uneven.[file:263][file:264]"
  },
  "healthcare": {
    "system_type": "public_plus_private",
    "access_notes": "Residents can access the IMSS public system or private providers; expats typically qualify for IMSS or other public schemes with residency, while many choose low‑cost private clinics and insurance for faster service.[file:258][file:259]",
    "quality_notes": "Mexico City’s cost of living is about 21.6 percent lower than Barcelona’s index, with central one‑bedroom rents around $900–$1,000 and realistic single budgets in the $800–$1,200 range in many areas.[file:258][file:259]"
  },
  "taxation": {
    "tax_system_type": "worldwide_source_based",
    "tax_notes": "Mexico has a U.S. tax treaty and generally taxes residents on Mexican‑source income at progressive rates of about 1.92–35 percent, with temporary residents often taxed only on Mexican‑source income.[file:265][file:259]",
    "special_regimes": []
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "Temporary Resident Visa (Non‑Lucrative / Financial Independence)",
      "job_offer_required": false,
      "remote_work_allowed": true,
      "income_requirement": {
        "amount": 4356,
        "currency": "USD",
        "period": "monthly",
        "notes": "Recent consular guidance for 2026 cites roughly $4,356 per month in verifiable income or about $73,389 in savings as typical minima, with figures varying slightly by consulate and exchange rate.[file:259][file:264]"
      },
      "processing_time_months": {
        "min": 0.5,
        "max": 2,
        "notes": "Most consulates report about 2–8 weeks from appointment to visa issuance, depending on workload.[file:263][file:264]"
      },
      "leads_to_pr": true,
      "years_to_pr": 4,
      "years_to_citizenship": 9,
      "notes": "After four years in temporary status, holders can apply for permanent residency; citizenship typically follows after about five additional years of permanent residence.[file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Temporary Resident Visa with Work Permit",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "MXN",
        "period": "monthly",
        "notes": "Employers must meet local prevailing‑wage and registration requirements; specific salary thresholds vary by sector and change over time.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": 1,
        "max": 3,
        "notes": "Processing typically falls between 4–12 weeks depending on the consulate and whether employer paperwork is already in place.[file:263][file:264]"
      },
      "leads_to_pr": true,
      "years_to_pr": 4,
      "years_to_citizenship": 9,
      "notes": "Time on an employer‑sponsored temporary resident card also counts toward the four‑year requirement for permanent residency and the longer naturalization timeline.[file:263][file:262]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Asylum / Refugee Status (COMAR)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "Eligibility turns on persecution or serious harm under refugee criteria, not on income or savings.[file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Case durations vary widely with COMAR caseload; applicants receive documentation while their claims are assessed.[file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Applicants must be physically present in Mexico and file with an immigration office or COMAR; recognized refugees can later regularize their stay and pursue long‑term residence.[file:263]"
    },
    {
      "pathway_type": "ancestry",
      "name": "Citizenship by Descent (Mexican Parent)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "No financial threshold applies; the key requirement is proof that at least one parent was born in Mexico, supported by civil documents.[file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Timelines depend on consulate and documentation quality; descent cases bypass the normal residency‑based naturalization track.[file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 0,
      "notes": "Successful applicants obtain Mexican nationality directly rather than first holding a separate permanent resident status.[file:263]"
    }
  ],
  "sources": [
    {
      "url": "https://mexicorelocationguide.com/mexican-residency-income-requirements-updates-in-2026",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Details current income and savings thresholds for Mexico temporary residency categories used by U.S. expats.[file:259]"
    },
    {
      "url": "https://www.mexperience.com/financial-criteria-for-residency-in-mexico",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Explains consular variation and example calculations for non‑lucrative residency qualification.[file:259]"
    },
    {
      "url": "https://reproductiverights.org/resources/latin-america-green-wave/",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Summarizes abortion‑law reforms and decriminalization trends in Mexico.[file:263]"
    },
    {
      "url": "https://thedocs.worldbank.org/en/doc/f03e36335f388347d086f66e2a3aaac4-0200022021/original/EQOSOGI-139-156.pdf",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Reviews LGBTQ+ protections and hate‑crime frameworks across Latin America, including Mexico.[file:263][file:264]"
    },
    {
      "url": "research/healthcare.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Provides Mexico City healthcare cost ranges and comparative cost‑of‑living indices.[file:258]"
    },
    {
      "url": "research/taxes.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Outlines Mexico’s U.S. tax treaty, rate bands, and interaction with FEIE/foreign tax credits.[file:265]"
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
        "https://thedocs.worldbank.org/en/doc/f03e36335f388347d086f66e2a3aaac4-0200022021/original/EQOSOGI-139-156.pdf"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "rights_and_safety.abortion_status": {
      "sources": [
        "https://reproductiverights.org/resources/latin-america-green-wave/"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "rights_and_safety.hate_crime_protections": {
      "sources": [
        "https://thedocs.worldbank.org/en/doc/f03e36335f388347d086f66e2a3aaac4-0200022021/original/EQOSOGI-139-156.pdf"
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
    "taxation.tax_notes": {
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
    "notes": "Populated Mexico with LGBTQ/abortion status, IMSS plus private healthcare profile, treaty‑based tax description, financial‑independence temporary residency, work‑permit route, COMAR asylum, and parent‑based citizenship.[file:259][file:263][file:264][file:265]"
  },
  "issues": [
    {
      "severity": "info",
      "code": "OTHER",
      "message": "Exact income and savings thresholds for temporary residency vary by consulate and exchange rate; applicants should confirm current figures with their specific Mexican consulate.",
      "related_fields": [
        "pathways[0].income_requirement"
      ]
    }
  ]
}

$json$
);
