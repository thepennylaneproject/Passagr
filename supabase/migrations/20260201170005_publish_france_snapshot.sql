
-- Wrapped JSON snapshot for France (FR)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162311', 
  'publish_snapshot_migration', 
  'France', 
  'FR', 
  $json$
{
  "country_identity": 10,
  "country": {
    "iso2": "FR",
    "name": "France",
    "region": "europe",
    "subregion": "western_europe",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 5,
    "lgbtq_notes": "France sits in the top tier of European countries for LGBTQ protections, with comprehensive anti‑discrimination and hate‑crime legislation covering sexual orientation and gender identity.[cite:263][cite:264]",
    "abortion_status": "constitutional_right_on_request",
    "abortion_notes": "Abortion is protected as a constitutional right on request up to about 14 weeks of pregnancy, placing France among the most protective countries globally.[cite:264][cite:263]",
    "hate_crime_protections": "comprehensive",
    "hate_crime_notes": "National law and EU‑aligned directives provide strong hate‑crime protections that explicitly cover race, sexual orientation, and gender identity.[cite:264][cite:263]"
  },
  "healthcare": {
    "system_type": "universal_public_with_private_topups",
    "access_notes": "Residents who are registered with the French social‑security system receive a Carte Vitale and access the universal public healthcare scheme; many supplement it with private ‘mutuelle’ insurance.[cite:258][cite:259]",
    "cost_notes": "Typical GP visits cost around 50–150 USD, much of which is reimbursed by the public system, and private top‑up insurance is in a similar monthly range.[cite:258][cite:259] Paris has high living costs, with a central one‑bedroom around 1,000–2,500 USD and a single‑person monthly budget often 1,500–3,000 USD.[cite:258][cite:259]"
  },
  "taxation": {
    "tax_system_type": "worldwide_residence_based",
    "tax_notes": "France taxes tax‑resident individuals on worldwide income at progressive rates roughly 0–45 percent, plus social charges usually around 9–17 percent, making it a high‑tax jurisdiction.[cite:259]",
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
        "currency": "EUR",
        "period": "monthly",
        "notes": "France does not operate a standalone digital‑nomad or passive‑income visa; long‑stays for remote workers usually rely on regular work, student, or family routes.[cite:259]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing time depends on the underlying visa category, as there is no specific remote‑work route.[cite:259]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Remote workers commonly use Talent Passport or other standard visas if they need to stay in France while working for foreign employers.[cite:259]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Talent Passport – Qualified Employee",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": 39582,
        "currency": "USD",
        "period": "annual",
        "notes": "The Talent Passport – Qualified Employee route requires a minimum salary of about 39,582 USD per year (around 3,298 USD/month), with thresholds adjusted periodically under French rules.[cite:264][cite:259]"
      },
      "processing_time_months": {
        "min": 2,
        "max": 4,
        "notes": "Talent Passport applications are typically processed in about 2–4 months.[cite:264][cite:259]"
      },
      "leads_to_pr": true,
      "years_to_pr": 4,
      "years_to_citizenship": {
        "min": 5,
        "max": 5
      },
      "notes": "After 4 years on a Talent Passport, holders can often obtain a 10‑year resident card, and they are generally eligible for citizenship after 5 years of legal residence in France.[cite:264][cite:262][cite:259]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Talent Passport – EU Blue Card",
      "job_offer_required": true,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": 59373,
        "currency": "USD",
        "period": "annual",
        "notes": "The French implementation of the EU Blue Card requires a higher salary threshold of about 59,373 USD per year, reflecting the highly qualified nature of the route.[cite:264][cite:259]"
      },
      "processing_time_months": {
        "min": 2,
        "max": 4,
        "notes": "EU Blue Card Talent Passport cases typically see 2–4‑month processing times.[cite:264][cite:259]"
      },
      "leads_to_pr": true,
      "years_to_pr": 4,
      "years_to_citizenship": {
        "min": 5,
        "max": 5
      },
      "notes": "Blue Card holders follow similar long‑term residence and citizenship timelines as other Talent Passport residents.[cite:264][cite:262]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "EU Asylum Procedure via OFPRA",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "none",
        "notes": "Asylum eligibility depends on persecution risk and refugee criteria, not financial resources.[cite:264][cite:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing times vary; claims are examined under EU asylum rules by the French Office for the Protection of Refugees and Stateless Persons (OFPRA) and appeal bodies.[cite:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Successful refugees can transition to more secure residence and may later apply for citizenship under standard residence‑duration rules.[cite:263][cite:259]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "french_B1",
    "difficulty": "moderate",
    "family_reunification_wait_months": 0,
    "eligible_family_members": [
      "spouse_or_partner",
      "minor_children"
    ],
    "years_to_pr": 5,
    "years_to_citizenship": {
      "min": 5,
      "max": 5
    },
    "dual_citizenship_allowed": true,
    "notes": "Naturalization typically requires B1‑level French and integration checks; spouses and minor children of French residents usually qualify for immediate family reunification; dual citizenship is permitted.[cite:262][cite:259]"
  },
  "quality_of_life": {
    "climate": "temperate_with_mediterranean_south",
    "english_proficiency": "high_in_paris_moderate_elsewhere",
    "major_expat_hubs": [
      "Paris",
      "Lyon",
      "Bordeaux",
      "Nice"
    ],
    "time_zone_from_us_est": "+6",
    "direct_flights_from_us": "extensive_direct_flights_to_paris_and_other_cities",
    "notes": "France combines a temperate to Mediterranean climate, especially in the south, with strong cultural amenities and extensive direct air links to the U.S., but Paris and some major cities have relatively high living costs.[cite:259]"
  },
  "tax_notes_for_us_citizens": {
    "treaty_status": "has_us_tax_treaty",
    "feie_vs_ftc": "Given France’s high tax and social‑charge levels, U.S. citizens often benefit more from the Foreign Tax Credit than from the Foreign Earned Income Exclusion, especially at higher income levels.[cite:259]"
  }
}

$json$
);
