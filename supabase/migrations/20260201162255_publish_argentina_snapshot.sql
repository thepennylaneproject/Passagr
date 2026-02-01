
-- Wrapped JSON snapshot for Argentina (AR)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162255', 
  'publish_snapshot_migration', 
  'Argentina', 
  'AR', 
  $json$
{
  "country_identity": 17,
  "country": {
    "iso2": "AR",
    "name": "Argentina",
    "region": "americas",
    "subregion": "latin_america_and_the_caribbean",
    "policy_volatility": "high",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 4.5,
    "lgbtq_notes": "Argentina is recognized as a regional leader on LGBTQ+ rights, with marriage equality, gender identity self‑determination, and anti‑discrimination protections that include sexual orientation and gender identity.[file:263]",
    "abortion_status": "legal_protected",
    "abortion_notes": "Abortion has been legal on request up to 14 weeks nationwide since 2020, with additional grounds thereafter, following the national reform sometimes called part of the Latin America 'green wave'.[file:263]",
    "hate_crime_protections": "strong",
    "hate_crime_notes": "Federal hate‑crime and anti‑discrimination frameworks explicitly cover sexual orientation and gender identity, though enforcement quality can vary by province.[file:263]"
  },
  "healthcare": {
    "system_type": "mixed_public_private",
    "access_notes": "Argentina offers free public healthcare to residents and even many visitors, but middle‑class Argentines and expats often rely on low‑cost private clinics and insurance for faster access.[file:258][file:263]",
    "quality_notes": "Buenos Aires is considered affordable by global standards, with central one‑bedroom rents often in the $400–$800 range and monthly single budgets around $1,000–$2,000, trading some system strain and inflation risk for low headline costs.[file:258][file:260]"
  },
  "taxation": {
    "tax_system_type": "worldwide_with_territorial_features",
    "tax_notes": "Tax residents generally face progressive rates of about 5–35 percent on Argentine‑source income, while many forms of foreign‑source income remain lightly taxed or effectively exempt under territorial‑style rules.[file:265][file:259]",
    "special_regimes": [
      {
        "name": "Territorial treatment of foreign income",
        "status": "active",
        "notes": "Argentina’s practice of primarily taxing Argentine‑source income can make it attractive for foreign earners, but U.S. citizens must still coordinate this with FEIE and foreign tax credits.[file:265][file:259]"
      }
    ]
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "Digital Nomad Visa (Transitory Residence)",
      "job_offer_required": false,
      "remote_work_allowed": true,
      "income_requirement": {
        "amount": 2500,
        "currency": "USD",
        "period": "monthly",
        "notes": "Guides suggest an unofficial minimum of roughly $2,500 per month in remote or freelance income for digital nomad applicants, though this is not codified as a fixed statutory floor.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": 2,
        "max": 4,
        "notes": "Consular and immigration sources describe typical processing in about two to four months from application to approval.[file:264][file:263]"
      },
      "leads_to_pr": false,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "The digital nomad status is granted for six months and can usually be renewed once for a total of one year, but does not itself convert directly into permanent residence.[file:264][file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Temporary Work Visa",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "monthly",
        "notes": "Employers must offer at least the sector’s prevailing wage and register with Argentine immigration; explicit nationally published minimums for expat workers vary and are periodically updated.[file:263]"
      },
      "processing_time_months": {
        "min": 2,
        "max": 4,
        "notes": "Work visas are commonly processed in roughly two to four months, depending on employer readiness and office backlogs.[file:264][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 3,
      "years_to_citizenship": 2,
      "notes": "After around three years of temporary residence, many foreign workers are eligible for permanent status; Argentine nationality can in practice be available after roughly two years of legal residence via the courts.[file:262][file:263]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Refugee Status (CONARE)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "No income requirement; claims rest on persecution, generalized violence, or comparable grounds assessed by the National Commission for Refugees (CONARE).[file:264][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Timelines vary by case complexity and caseload; applicants receive documentation while their refugee status determination proceeds.[file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Applicants must be physically present in Argentina and lodge with immigration or CONARE; successful recognition can later support regularization and long‑term residence.[file:264][file:263]"
    }
  ],
  "sources": [
    {
      "url": "https://reproductiverights.org/resources/latin-america-green-wave/",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Explains Argentina’s 2020 reform that legalized abortion on request up to 14 weeks.[file:263]"
    },
    {
      "url": "https://thedocs.worldbank.org/en/doc/f03e36335f388347d086f66e2a3aaac4-0200022021/original/EQOSOGI-139-156.pdf",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "World Bank‑linked review of SOGI protections and hate‑crime coverage in Latin America, including Argentina.[file:263]"
    },
    {
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6836409/",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Academic overview of LGBTQ+ legal environments and hate‑crime enforcement in the region.[file:263]"
    },
    {
      "url": "https://evolvecoliving.io/argentina-digital-nomad-visa/",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Details the Argentina digital nomad visa income expectations, duration, and lack of a direct PR track.[file:263]"
    },
    {
      "url": "research/healthcare.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Healthcare access, rent, and monthly budget ranges for Buenos Aires and other cities.[file:258]"
    },
    {
      "url": "research/taxes.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Tax-treaty, territoriality, and progressive rate information for Argentina.[file:265]"
    },
    {
      "url": "research/passagr_research.md",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Compiled immigration, safety, and pathway data for Argentina used across this object.[file:263]"
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
        "https://thedocs.worldbank.org/en/doc/f03e36335f388347d086f66e2a3aaac4-0200022021/original/EQOSOGI-139-156.pdf",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6836409/"
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
    "notes": "Added Argentina’s high‑protection LGBTQ+/abortion profile, low‑cost mixed healthcare system, territorial‑style tax notes, digital nomad and work visas, and refugee procedures consistent with the research tables.[file:258][file:259][file:263][file:265]"
  },
  "issues": [
    {
      "severity": "info",
      "code": "OTHER",
      "message": "Digital nomad income amounts and the practical application of Argentina’s territorial tax rules are partly based on practitioner consensus; applicants should verify current criteria and tax treatment before relying on them.",
      "related_fields": [
        "pathways[0].income_requirement",
        "taxation.tax_notes"
      ]
    }
  ]
}

$json$
);
