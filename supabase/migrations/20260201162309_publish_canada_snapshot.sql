
-- Wrapped JSON snapshot for Canada (CA)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162309', 
  'publish_snapshot_migration', 
  'Canada', 
  'CA', 
  $json$
{
  "country_identity": 5,
  "country": {
    "iso2": "CA",
    "name": "Canada",
    "region": "americas",
    "subregion": "northern_america",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 5.0,
    "lgbtq_notes": "Canada is consistently classified in the highest protection tier, with nationwide anti‑discrimination and hate‑crime protections explicitly covering sexual orientation and gender identity.[file:264][file:263]",
    "abortion_status": "legal_on_request",
    "abortion_notes": "Abortion is legal on request at all stages of pregnancy, regulated primarily as a healthcare service rather than a criminal matter.[file:264][file:263]",
    "hate_crime_protections": "comprehensive",
    "hate_crime_notes": "Federal hate‑crime legislation explicitly includes sexual orientation and gender identity, and these protections are enforced across all provinces and territories.[file:264][file:263]"
  },
  "healthcare": {
    "system_type": "single_payer_provincial",
    "access_notes": "Public healthcare is delivered via provincial systems; expats with permanent residence or eligible work/study status can obtain a provincial health card after any applicable waiting period, with most physician and hospital care free at point of use.[file:259][file:258]",
    "quality_notes": "Major cities have high‑quality care but elevated living costs: for example, typical single budgets run about CAD 2,500–4,000 per month with city‑centre one‑bedroom rents around CAD 1,800–2,900 in Toronto, plus 100–300 CAD for supplemental private insurance if desired.[file:258]"
  },
  "taxation": {
    "tax_system_type": "worldwide_residence_based",
    "tax_notes": "Canada has a U.S. tax treaty and taxes residents on worldwide income at combined federal and provincial rates that typically range from about 15–33 percent federally plus 5–21 percent provincially, making the foreign tax credit generally more effective than the FEIE for U.S. citizens living there.[file:265][file:259]",
    "special_regimes": [
      {
        "name": "U.S.–Canada Totalization Agreement",
        "description": "A bilateral Social Security agreement coordinates U.S. and Canadian contributions so workers typically avoid double payment of payroll taxes on the same earnings.[file:259][file:265]"
      }
    ]
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "No dedicated non‑work digital‑nomad visa",
      "job_offer_required": null,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "CAD",
        "period": "monthly",
        "notes": "Canada does not offer a standalone digital‑nomad or non‑lucrative residency; remote workers generally must qualify under work, study, or family‑based categories.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Remote workers typically apply through regular work‑permit or PR streams whose timelines vary by program and backlog.[file:259][file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Long‑term remote workers commonly use employer‑sponsored work permits or later transition through Express Entry rather than a purpose‑built digital‑nomad route.[file:259][file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Express Entry (Federal Skilled Worker, Canadian Experience Class)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "CAD",
        "period": "annual",
        "notes": "There is no fixed salary minimum, but candidates must meet proof‑of‑funds requirements and score competitively on a points grid that heavily weights age, education, language, and skilled work experience.[file:263]"
      },
      "processing_time_months": {
        "min": 6,
        "max": 14,
        "notes": "Standard processing for Express Entry has historically targeted about 6–7 months, but backlog conditions in early 2026 have pushed many cases into the 10–14 month range.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 3,
      "notes": "Successful Express Entry applicants receive permanent residence upon landing, and can apply for citizenship after 3 years (1,095 days) of physical presence within a 5‑year window.[file:262][file:263]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Refugee Status Determination (IRCC / IRB)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "Eligibility is based on risk of persecution or serious harm, not on financial criteria.[file:259][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Claim duration varies by case and hearing schedule; claimants receive documentation while their protection claim is assessed by the Immigration and Refugee Board.[file:259][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 0,
      "years_to_citizenship": 3,
      "notes": "Recognized refugees can obtain permanent residence and later qualify for citizenship under the standard 3‑years‑in‑5 physical‑presence rule.[file:259][file:263]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "english_or_french_CLB4_6",
    "difficulty": "moderate",
    "family_reunification_wait_months": 0,
    "eligible_family_members": [
      "spouse_or_common_law_partner",
      "dependent_children"
    ],
    "years_to_pr": 0,
    "years_to_citizenship": {
      "min": 3,
      "max": 5
    },
    "dual_citizenship_allowed": true,
    "notes": "Permanent residents must demonstrate English or French at roughly CLB 4–6 for citizenship, immediate family members are often included directly in PR applications, PR is obtained on arrival for Express Entry, and eligibility for citizenship generally arises after 3 years of physical presence within 5 years, with dual citizenship permitted.[file:262][file:259]"
  },
  "quality_of_life": {
    "climate": "continental_cold_winters",
    "english_proficiency": "native_high",
    "major_expat_hubs": [
      "Toronto",
      "Vancouver",
      "Montreal",
      "Calgary"
    ],
    "time_zone_from_us_est": "0_to_-3",
    "direct_flights_from_us": "extensive",
    "notes": "Canada combines native‑English (and French in Quebec) environments with continental climates featuring cold winters and warm summers; major expat hubs like Toronto, Vancouver, Montreal, and Calgary have strong U.S. air links and time‑zone differences ranging roughly 0 to 3 hours from U.S. Eastern time.[file:260][file:259]"
  },
  "sources": [
    {
      "url": "https://immigration.ca/who-qualifies-for-canadian-permanent-residence-skilled-worker-immigration",
      "source_type": "government_or_major_immigration_portal",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "high",
      "notes": "Outlines Express Entry qualification, points system, and basic processing expectations.[file:263]"
    },
    {
      "url": "https://www.visahq.com/news/2026-01-21/ca-express-entry-backlog-swells-to-three-year-high-pushing-skilled-workers-wait-times",
      "source_type": "news",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Discusses 2025–2026 Express Entry processing backlogs and extended timelines.[file:259]"
    },
    {
      "url": "research/healthcare.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Provides cost ranges for housing and supplemental private insurance in Canadian cities.[file:258]"
    },
    {
      "url": "research/taxes.csv",
      "source_type": "other",
      "retrieved_at": "2026-01-31T00:00:00Z",
      "reliability": "medium",
      "notes": "Summarizes Canada’s income‑tax bands and interaction with U.S. FEIE and foreign tax credits for U.S. citizens.[file:265]"
    }
  ],
  "field_provenance": {
    "rights_and_safety": {
      "sources": [
        "research/passagr_research_v2.md"
      ],
      "confidence": "high",
      "change_type": "unchanged"
    },
    "healthcare": {
      "sources": [
        "research/healthcare.csv",
        "research/passagr_research_v2.md"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    },
    "taxation": {
      "sources": [
        "research/taxes.csv",
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
      "change_type": "updated"
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
        "research/passagr_research_v2.md"
      ],
      "confidence": "medium",
      "change_type": "unchanged"
    }
  },
  "diff_summary": {
    "has_changes": true,
    "changed_fields": [
      "pathways",
      "quality_of_life"
    ],
    "notes": "Added structured descriptions of Canada’s lack of a digital‑nomad visa, Express Entry skilled‑worker route, refugee pathway, and expat‑relevant climate and hub information.[file:259][file:263]"
  },
  "issues": []
}

$json$
);
