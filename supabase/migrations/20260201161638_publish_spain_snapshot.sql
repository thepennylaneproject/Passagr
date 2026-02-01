
-- Wrapped JSON snapshot for Spain (ES)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201161638', 
  'publish_snapshot_migration', 
  'Spain', 
  'ES', 
  $json$
{
  "country_identity": 2,
  "country": {
    "iso2": "ES",
    "name": "Spain",
    "region": "europe",
    "subregion": "southern_europe",
    "policy_volatility": "low",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 5,
    "lgbtq_notes": "ILGA-Europe ranks Spain among the highest-protection countries, with constitutional and statutory guarantees for sexual orientation and gender identity alongside strong EU anti-discrimination rules.[file:263]",
    "abortion_status": "legal_protected",
    "abortion_notes": "Abortion is protected by law on request up to 14 weeks, with later access on health and other specified grounds under national legislation.[file:263]",
    "hate_crime_protections": "strong",
    "hate_crime_notes": "Spain implements the EU Framework Decision on racism and xenophobia and criminalizes hate crimes explicitly covering race, sexual orientation, and gender identity.[file:263]"
  },
  "healthcare": {
    "system_type": "universal_after_residency",
    "access_notes": "Spain’s SNS provides universal public coverage after roughly 90+ days of legal residence and municipal registration (empadronamiento); GP visits are free with a health card, while private plans typically range from €50–€200 per month.[file:258][file:263]",
    "quality_notes": "Barcelona’s cost of living index is around 59 on Numbeo, with central one-bedroom rents near €1,295 and typical monthly single-person budgets from about €1,000 upward in major cities.[file:258][file:260]"
  },
  "taxation": {
    "tax_system_type": "worldwide",
    "tax_notes": "Spain taxes residents on worldwide income under a progressive system combining state and regional brackets, generally around 19–47 percent for most bands.[file:265]",
    "special_regimes": [
      {
        "name": "Beckham Law (special expat regime)",
        "status": "active",
        "notes": "Eligible inbound workers can elect a fixed-rate regime on Spanish-source employment income for several years, though U.S. citizens must still coordinate this with FEIE or foreign tax credits under the U.S.–Spain tax treaty.[file:265][file:259]"
      }
    ]
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "Digital Nomad Visa (Law 28/2022)",
      "job_offer_required": false,
      "remote_work_allowed": true,
      "income_requirement": {
        "amount": 2762,
        "currency": "EUR",
        "period": "monthly",
        "notes": "Applicants typically must show at least €2,762 net per month (about $3,000) in stable remote work or business income.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": 0.7,
        "max": 1.5,
        "notes": "Official estimates indicate about 20 business days to two months from submission to decision, depending on consular and in-country queues.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 5,
      "years_to_citizenship": 10,
      "notes": "Residence on the digital nomad route can count toward Spain’s five-year permanent residence and ten-year standard citizenship timelines when maintained continuously.[file:259][file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "EU Blue Card / Highly Qualified Professional Visa",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "annual",
        "notes": "Salary must meet updated thresholds for highly qualified workers or EU Blue Card; exact minimums are indexed annually and vary by occupation.[file:263]"
      },
      "processing_time_months": {
        "min": 0.7,
        "max": 2,
        "notes": "Processing often runs from roughly 20 business days to two months once a complete application is lodged.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 5,
      "years_to_citizenship": 10,
      "notes": "Time in highly qualified or EU Blue Card status generally counts toward the standard five-year long-term residence and ten-year citizenship clocks.[file:259][file:263]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "EU Asylum Procedure (Spain)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "No income threshold applies; eligibility hinges on a well-founded fear of persecution or serious harm under EU and Spanish asylum rules.[file:263]"
      },
      "processing_time_months": {
        "min": 3,
        "max": 6,
        "notes": "EU border procedures target decisions within roughly 12 weeks for certain cases, while regular procedures are usually assessed within about six months under the Migration and Asylum Pact framework.[file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Applicants must be physically present in Spain or at its border to register an asylum claim, which is then processed under harmonized EU procedures.[file:263]"
    },
    {
      "pathway_type": "ancestry",
      "name": "Law of Grandchildren (Spanish ancestry)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "No income requirement; applicants must prove descent from a Spanish grandparent or certain exile-descendant categories under the temporary law.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing times depend on consular volume and document complexity during the law’s extended window through late 2025.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 0,
      "notes": "Successful applicants typically obtain nationality directly rather than passing through a separate long-term residence stage.[file:259][file:263]"
    }
  ],
  "sources": [
    {
      "url": "https://ilga.org/news/pride-month-2025-lgbti-data-maps/",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "ILGA global mapping of LGBTQ+ protections, including Spain’s high protection score.[file:263]"
    },
    {
      "url": "https://www.ilga-europe.org/report/rainbow-map-2025/",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Rainbow Map rankings for Spain’s equality and hate-crime frameworks.[file:263]"
    },
    {
      "url": "https://reproductiverights.org/maps/world-abortion-laws/",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Center for Reproductive Rights summary of Spain’s abortion law up to 14 weeks on request.[file:263]"
    },
    {
      "url": "https://prospainconsulting.com/2025/10/07/spain-digital-nomad-visa-requirements-application-process-and-key-advantages/",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Explains Law 28/2022 digital nomad income and processing expectations.[file:263]"
    },
    {
      "url": "https://getgoldenvisa.com/spain-digital-nomad-visa",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Additional digital nomad timelines and residency-to-PR conversion notes.[file:263]"
    },
    {
      "url": "https://immigrantinvest.com/spain-digital-nomad-residence/",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Discussion of how Spain’s digital nomad residence counts toward long-term residence and citizenship.[file:263]"
    },
    {
      "url": "https://reproductiverights.org/resources/latin-america-green-wave/",
      "source_type": "ngo",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Regional context for abortion liberalization in Iberia and Latin America.[file:263]"
    },
    {
      "url": "research/healthcare.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Tabular summary of Spain’s healthcare access, costs, and cost-of-living metrics.[file:258]"
    },
    {
      "url": "research/taxes.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Spain’s local income tax ranges and expat tax regimes including Beckham Law.[file:265]"
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
        "https://ilga.org/news/pride-month-2025-lgbti-data-maps/",
        "https://www.ilga-europe.org/report/rainbow-map-2025/"
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
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC9086657/"
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
    "notes": "Expanded Spain with structured safety indicators, digital nomad and skilled pathways, brief asylum and ancestry options, plus healthcare and tax summaries aligned with existing research tables.[file:258][file:259][file:263][file:265]"
  },
  "issues": [
    {
      "severity": "info",
      "code": "OTHER",
      "message": "Digital nomad income thresholds and Beckham Law parameters adjust periodically; applicants should confirm current figures with official Spanish government guidance before filing.",
      "related_fields": [
        "pathways[0].income_requirement",
        "taxation.special_regimes"
      ]
    }
  ]
}

$json$
);
