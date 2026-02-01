
-- Wrapped JSON snapshot for Japan (JP)
INSERT INTO staging_country_research (import_batch_id, source_label, country_name, iso2, payload)
VALUES (
  'migration_20260201162309', 
  'publish_snapshot_migration', 
  'Japan', 
  'JP', 
  $json$
{
  "country_identity": 6,
  "country": {
    "iso2": "JP",
    "name": "Japan",
    "region": "asia",
    "subregion": "eastern_asia",
    "policy_volatility": "medium",
    "last_verified_at": "2026-01-31T00:00:00Z",
    "verification_status": "proposed"
  },
  "rights_and_safety": {
    "lgbtq_rights_score": 2.5,
    "lgbtq_notes": "Japan lacks comprehensive LGBTQ‑specific hate‑crime laws and nationwide anti‑discrimination protection, and equality indices therefore rate its legal environment considerably weaker than Western high‑protection countries.[web:58][file:264]",
    "abortion_status": "legal_with_restrictions",
    "abortion_notes": "Abortion is legal but regulated with requirements such as spousal consent in many cases and permitted grounds tied to health and socio‑economic reasons up to roughly 22 weeks.[web:59][file:263]",
    "hate_crime_protections": "limited",
    "hate_crime_notes": "There is no comprehensive national hate‑crime statute explicitly covering sexual orientation and gender identity, and existing protections are piecemeal.[web:58][file:264]"
  },
  "healthcare": {
    "system_type": "universal_public_insurance",
    "access_notes": "Residents, including expats with medium‑ to long‑term visas, must enroll in national or employees’ health insurance, which typically covers 70–80 percent of approved medical costs with patients paying a 20–30 percent copay.[file:259][file:258]",
    "quality_notes": "Japan’s system offers high‑quality care with predictable copays, but major cities like Tokyo are expensive, with central one‑bedroom rents around 100,000–180,000 JPY and realistic single budgets in the 200,000–350,000 JPY per‑month range.[file:258]"
  },
  "taxation": {
    "tax_system_type": "worldwide_residence_based",
    "tax_notes": "Japan has a U.S. tax treaty and taxes residents on worldwide income at progressive national rates of about 5–45 percent plus a typical 10 percent local residence tax, so U.S. citizens often rely on a mix of FEIE and foreign tax credits.[file:265][file:259]",
    "special_regimes": []
  },
  "pathways": [
    {
      "pathway_type": "remote_work",
      "name": "No dedicated digital‑nomad visa (Business Manager option requires local entity)",
      "job_offer_required": null,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "JPY",
        "period": "monthly",
        "notes": "Japan does not provide a non‑employment digital‑nomad visa; the Business Manager status requires company setup and capitalization rather than simple foreign passive income.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Processing depends on visa type and local immigration office; there is no standardized remote‑work stream.[file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Remote workers usually enter under regular work or business categories if they have Japanese clients or a local entity, rather than a pure location‑independent route.[file:263]"
    },
    {
      "pathway_type": "skilled_worker",
      "name": "Highly Skilled Professional Visa (points‑based)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": "JPY",
        "period": "annual",
        "notes": "The category is points‑based, emphasizing salary, education, research record, and professional experience rather than a single published minimum; higher income yields more points.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": 1,
        "max": 3,
        "notes": "Typical processing for highly skilled applications is about 1–3 months once a complete file is submitted.[file:264][file:263]"
      },
      "leads_to_pr": true,
      "years_to_pr": 5,
      "years_to_citizenship": 10,
      "notes": "Long‑term residents on work or highly skilled status generally need around 10 years’ residence for naturalization, with some accelerated options for very high‑scoring applicants.[file:262][file:263]"
    },
    {
      "pathway_type": "humanitarian",
      "name": "Refugee Recognition (Immigration Services Agency RSD)",
      "job_offer_required": false,
      "remote_work_allowed": false,
      "income_requirement": {
        "amount": null,
        "currency": null,
        "period": "unknown",
        "notes": "Eligibility is based on refugee‑status criteria; income is not a formal requirement.[file:264][file:263]"
      },
      "processing_time_months": {
        "min": null,
        "max": null,
        "notes": "Case durations vary widely; applicants must submit their claim at a regional immigration office and undergo a status‑determination interview.[file:264][file:263]"
      },
      "leads_to_pr": null,
      "years_to_pr": null,
      "years_to_citizenship": null,
      "notes": "Recognized refugees may later qualify for long‑term residence and, eventually, naturalization under Japan’s general 10‑year residency and integration rules.[file:263]"
    }
  ],
  "language_family_citizenship": {
    "language_for_citizenship": "near_native_japanese",
    "difficulty": "very_difficult",
    "family_reunification_wait_months": 0,
    "eligible_family_members": [
      "spouse",
      "children"
    ],
    "years_to_pr": 10,
    "years_to_citizenship": {
      "min": 10,
      "max": 10
    },
    "dual_citizenship_allowed": false,
    "notes": "Japanese language is not required for basic residence but practical permanent residence and especially citizenship usually demand near‑native proficiency; dependent family can join immediately, PR often comes after roughly 10 years (or faster for some highly skilled), and naturalization normally requires about 10 years and renunciation of other citizenships.[file:262][file:263]"
  },
  "quality_of_life": {
    "climate": "temperate_four_seasons",
    "english_proficiency": "low_to_moderate_in_cities",
    "major_expat_hubs": [
      "Tokyo",
      "Osaka",
      "Kyoto",
      "Fukuoka"
    ],
    "time_zone_from_us_est": "+14",
    "direct_flights_from_us": "extensive_to_tokyo_and_osaka",
    "notes": "Japan has a temperate climate with four distinct seasons, strong infrastructure, and major expat hubs like Tokyo, Osaka, Kyoto, and Fukuoka, but everyday English use is limited and the roughly 14‑hour time difference to U.S. Eastern time can complicate remote work.[file:260][file:263]"
  },
  "tax_notes_for_us_citizens": {
    "treaty_status": "has_us_tax_treaty",
    "feie_vs_ftc": "Because Japan’s effective tax burden is moderate to high once residence and local taxes are included, many U.S. citizens lean on foreign tax credits instead of, or in addition to, the FEIE.[file:265][file:259]"
  }
}

$json$
);
