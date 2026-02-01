-- Seed Portugal research findings into the schema.

-- Upsert the country record with the verified snapshot.
insert into countries (
  name, iso2, status, regions, languages, currency, timezones, climate_tags,
  healthcare_overview, tax_snapshot, rights_snapshot,
  lgbtq_rights_index, abortion_access_status, hate_crime_law_snapshot,
  last_verified_at
)
values (
  'Portugal',
  'PT',
  'draft',
  array['europe'],
  array['Portuguese'],
  'EUR',
  array['UTC+0'],
  array['Mediterranean'],
  'Universal SNS (public) supplemented by private insurance; expats enroll after residency, GP visits cost about €5–€20 and private plans run €35–€120 monthly while monthly budgets stay €740–€1,500 in urban centers.',
  'NHR 2.0 (TISRI) offers a 20% flat rate on qualifying Portuguese income and 10% on foreign pensions for ten years; combine FEIE/FTC filings under the U.S. treaty while domestic tax remains 13–48% plus a 2.5–5% solidarity surcharge.',
  'Top-tier LGBTQ+ rights (5/5) with hate crimes covering sexual orientation, gender identity, and race; abortion protected by law for the first 12 weeks.',
  5,
  'Protected by Law (up to 12 weeks)',
  'Comprehensive protections for sexual orientation, gender identity, race',
  '2026-01-31T00:00:00Z'
)
on conflict (iso2) do update set
  status = excluded.status,
  regions = excluded.regions,
  languages = excluded.languages,
  currency = excluded.currency,
  timezones = excluded.timezones,
  climate_tags = excluded.climate_tags,
  healthcare_overview = excluded.healthcare_overview,
  tax_snapshot = excluded.tax_snapshot,
  rights_snapshot = excluded.rights_snapshot,
  lgbtq_rights_index = excluded.lgbtq_rights_index,
  abortion_access_status = excluded.abortion_access_status,
  hate_crime_law_snapshot = excluded.hate_crime_law_snapshot,
  last_verified_at = excluded.last_verified_at;

-- ensure the Portugal record is published so the public UI can consume it.
update countries
set status = 'published'
where iso2 = 'PT';

-- Source references for the research; safely upsert to avoid duplicates.
insert into sources (url, title, publisher, content_type, fetched_at, reliability_score)
values
  ('https://ilga.org/news/pride-month-2025-lgbti-data-maps/', 'ILGA Pride Month 2025 data update', 'ILGA World', 'report', '2026-01-31T00:00:00Z', 5),
  ('https://www.ilga-europe.org/report/rainbow-map-2025/', 'Rainbow Map 2025', 'ILGA-Europe', 'report', '2026-01-31T00:00:00Z', 5),
  ('https://rainbowmap.ilga-europe.org', 'Rainbow Map data portal', 'ILGA-Europe', 'other', '2026-01-31T00:00:00Z', 4),
  ('https://time.com/6173229/countries-abortion-illegal-restrictions/', 'Time: Global abortion restrictions', 'Time', 'article', '2026-01-31T00:00:00Z', 4),
  ('https://reproductiverights.org/wp-content/uploads/2020/12/European-abortion-law-a-comparative-review.pdf', 'European abortion law comparison', 'Center for Reproductive Rights', 'report', '2026-01-31T00:00:00Z', 5),
  ('https://pmc.ncbi.nlm.nih.gov/articles/PMC9086657/', 'Responding to hate speech against LGBTI people in Europe', 'PMC/NCBI', 'article', '2026-01-31T00:00:00Z', 5),
  ('https://getgoldenvisa.com/portugal-golden-visa-program', 'Portugal citizenship reform 2025', 'GoldenVisa', 'article', '2026-01-31T00:00:00Z', 4),
  ('https://immigrantinvest.com/blog/portugal-d7-visa-income-requirements/', 'D7 visa requirements', 'Immigrant Invest', 'blog', '2026-01-31T00:00:00Z', 4),
  ('https://www.globalcitizensolutions.com/portugal-d7-visa/', 'Portugal D7 overview', 'Global Citizen Solutions', 'blog', '2026-01-31T00:00:00Z', 4),
  ('https://www.portugalist.com/d7-changes-2026/', 'D7 changes 2026', 'Portugalist', 'article', '2026-01-31T00:00:00Z', 4),
  ('https://emergency.unhcr.org/protection/legal-framework/refugee-status-determination-rsd', 'UNHCR refugee status determination framework', 'UNHCR', 'report', '2026-01-31T00:00:00Z', 5),
  ('https://asylumineurope.org/reports/country/netherlands/asylum-procedure/general/short-overview-asylum-procedure/', 'EU asylum procedure overview', 'Asylum Information Database', 'report', '2026-01-31T00:00:00Z', 5),
  ('https://www.imidaily.com/eu-citizenship-by-descent/', 'EU citizenship by descent summary', 'IMI Daily', 'article', '2026-01-31T00:00:00Z', 4),
  ('https://www.italiandualcitizenship.net/italian-citizenship-through-parents-grandparents-great-grandparents/', 'Ancestry documentation checklist', 'Italian Dual Citizenship', 'article', '2026-01-31T00:00:00Z', 4)
on conflict (url) do update set
  title = excluded.title,
  publisher = excluded.publisher,
  content_type = excluded.content_type,
  fetched_at = excluded.fetched_at,
  reliability_score = excluded.reliability_score,
  updated_at = now();

-- Visa paths: D7 Passive Income, EU Blue Card, EU asylum, grandparent citizenship.
insert into visa_paths (
  country_id, name, type, description, work_rights,
  min_income_amount, min_income_currency, processing_min_days, processing_max_days,
  in_country_conversion_path, eligibility, last_verified_at
)
select
  c.id,
  'D7 Passive Income Visa',
  'financial_independence',
  'Passive residency path requiring proof of €920/month income and supporting savings; maintains integration requirements and allows remote work.',
  'Remote work allowed',
  920,
  'EUR',
  180,
  270,
  'After 5 years eligible for PR; citizenship eligible after 10 years of legal residence.',
  '["Passive income of at least €920/month","Proof of accommodation and financial means","Maintain ties/integration with Portugal"]'::jsonb,
  '2026-01-31T00:00:00Z'
from countries c
where c.iso2 = 'PT'
on conflict (country_id, name) do update set
  type = excluded.type,
  description = excluded.description,
  work_rights = excluded.work_rights,
  min_income_amount = excluded.min_income_amount,
  min_income_currency = excluded.min_income_currency,
  processing_min_days = excluded.processing_min_days,
  processing_max_days = excluded.processing_max_days,
  in_country_conversion_path = excluded.in_country_conversion_path,
  eligibility = excluded.eligibility,
  last_verified_at = excluded.last_verified_at;

insert into visa_paths (
  country_id, name, type, description, work_rights,
  processing_min_days, processing_max_days, in_country_conversion_path, eligibility, last_verified_at
)
select
  c.id,
  'EU Blue Card / Skilled Worker Visa',
  'skilled_worker',
  'Employment-based pathway (Blue Card / national Skilled Worker) tied to a Portuguese job offer and salary meeting EU thresholds; citizenship follows the standard 5/10-year clocks.',
  'Employment only (remote not allowed)',
  28,
  56,
  'After 5 years eligible for PR; citizenship after 10 years.',
  '["Local job offer required","Degree or equivalent experience","Salary above the Portuguese EU Blue Card threshold"]'::jsonb,
  '2026-01-31T00:00:00Z'
from countries c
where c.iso2 = 'PT'
on conflict (country_id, name) do update set
  type = excluded.type,
  description = excluded.description,
  work_rights = excluded.work_rights,
  processing_min_days = excluded.processing_min_days,
  processing_max_days = excluded.processing_max_days,
  in_country_conversion_path = excluded.in_country_conversion_path,
  eligibility = excluded.eligibility,
  last_verified_at = excluded.last_verified_at;

insert into visa_paths (
  country_id, name, type, description, work_rights,
  processing_min_days, processing_max_days, eligibility, last_verified_at
)
select
  c.id,
  'EU Asylum Procedure (SEF)',
  'humanitarian',
  'Asylum seekers must be physically present to lodge claims with SEF; EU Migration and Asylum Pact sets 12-week border and 6-month regular procedures.',
  'Asylum/work rights granted once protection is recognized',
  84,
  180,
  '["Physical presence required","Persecution ground tied to race/religion/nationality/political opinion/social group","Follow-up biometrics and interviews"]'::jsonb,
  '2026-01-31T00:00:00Z'
from countries c
where c.iso2 = 'PT'
on conflict (country_id, name) do update set
  type = excluded.type,
  description = excluded.description,
  work_rights = excluded.work_rights,
  processing_min_days = excluded.processing_min_days,
  processing_max_days = excluded.processing_max_days,
  eligibility = excluded.eligibility,
  last_verified_at = excluded.last_verified_at;

insert into visa_paths (
  country_id, name, type, description, work_rights,
  eligibility, last_verified_at
)
select
  c.id,
  'Grandparent Citizenship',
  'ancestry',
  'Citizenship by descent for applicants with a Portuguese grandparent; residency or consular submission required along with lineage documents.',
  'Full citizenship rights when granted',
  '["Proof of at least one Portuguese grandparent","Physical presence or consular processing","Submit vital records and Portuguese citizen documentation"]'::jsonb,
  '2026-01-31T00:00:00Z'
from countries c
where c.iso2 = 'PT'
on conflict (country_id, name) do update set
  type = excluded.type,
  description = excluded.description,
  work_rights = excluded.work_rights,
  eligibility = excluded.eligibility,
  last_verified_at = excluded.last_verified_at;

-- publish the visa paths so they appear in the UI.
update visa_paths
set status = 'published'
where country_id = (select id from countries where iso2 = 'PT');

-- Healthcare metrics for Portugal.
insert into country_healthcare_metrics (
  country_id, system_type, public_access_notes,
  gp_visit_cost, private_insurance_cost,
  cost_of_living_index, rent_1br_city_center, monthly_budget_single
)
select
  c.id,
  'Universal SNS (public) + private',
  'Expats enroll after legal residency registration; GP visits cost €5–€20 and private plans €35–€120 per month.',
  '€5–€20',
  '€35–€120',
  'Lower than Spain',
  '€1,200–€1,500',
  '€740–€1,500'
from countries c
where c.iso2 = 'PT'
on conflict (country_id) do update set
  system_type = excluded.system_type,
  public_access_notes = excluded.public_access_notes,
  gp_visit_cost = excluded.gp_visit_cost,
  private_insurance_cost = excluded.private_insurance_cost,
  cost_of_living_index = excluded.cost_of_living_index,
  rent_1br_city_center = excluded.rent_1br_city_center,
  monthly_budget_single = excluded.monthly_budget_single;

-- Tax profile for Portugal.
insert into country_tax_profiles (
  country_id, us_tax_treaty, feie_strategy,
  foreign_tax_credit_strategy, local_incentives,
  standard_income_tax, notes
)
select
  c.id,
  true,
  'Good for income under $130K (2025/2026 FEIE limits).',
  'Use FTC for higher income and to capture solidarity surcharge.',
  'NHR 2.0: 20% flat tax on qualified Portuguese income, 10% on foreign pensions for ten years.',
  '13–48% progressive plus 2.5–5% solidarity surcharge.',
  'Combine FEIE with NHR 2.0 for the most favorable effective rate; continue filing Form 2555/1116.'
from countries c
where c.iso2 = 'PT'
on conflict (country_id) do update set
  us_tax_treaty = excluded.us_tax_treaty,
  feie_strategy = excluded.feie_strategy,
  foreign_tax_credit_strategy = excluded.foreign_tax_credit_strategy,
  local_incentives = excluded.local_incentives,
  standard_income_tax = excluded.standard_income_tax,
  notes = excluded.notes;

-- Language, family, and citizenship timelines.
insert into country_language_profiles (
  country_id, citizenship_language, difficulty, family_reunification_wait,
  eligible_family, years_to_permanent_residency, years_to_citizenship,
  dual_citizenship_allowed, notes
)
select
  c.id,
  'A2 CIPLE (basic Portuguese)',
  'Easiest in the EU (A2-level language requirement).',
  '2 years of legal residence (2025 reform) with exceptions for minors, highly qualified workers, and Golden Visa holders.',
  'Spouse/partner, minor children, dependent adult children, parents in exceptional cases.',
  '5 years',
  '10 years (extended from 5 in 2025).',
  true,
  'Portugal allows dual citizenship without requiring renunciation.'
from countries c
where c.iso2 = 'PT'
on conflict (country_id) do update set
  citizenship_language = excluded.citizenship_language,
  difficulty = excluded.difficulty,
  family_reunification_wait = excluded.family_reunification_wait,
  eligible_family = excluded.eligible_family,
  years_to_permanent_residency = excluded.years_to_permanent_residency,
  years_to_citizenship = excluded.years_to_citizenship,
  dual_citizenship_allowed = excluded.dual_citizenship_allowed,
  notes = excluded.notes;

-- Quality of life metrics.
insert into country_quality_of_life (
  country_id, eiu_liveability, monocle_qol, climate,
  english_proficiency, major_expat_hubs, timezone_from_us, direct_flights, notes
)
select
  c.id,
  'Not in top 10 (2025 EIU).',
  '#8 Lisbon (Monocle QoL 2025).',
  'Mediterranean; 300 days of sun; average 16.8°C.',
  'Moderate, with especially high English proficiency in Algarve and Lisbon.',
  'Lisbon, Porto, Lagos (Algarve).',
  '+5 hours',
  'Yes (Newark, JFK, Boston).',
  'Top quality of life for expats: safety, healthcare, and climate ranks Portugal high in the 2025 research.'
from countries c
where c.iso2 = 'PT'
on conflict (country_id) do update set
  eiu_liveability = excluded.eiu_liveability,
  monocle_qol = excluded.monocle_qol,
  climate = excluded.climate,
  english_proficiency = excluded.english_proficiency,
  major_expat_hubs = excluded.major_expat_hubs,
  timezone_from_us = excluded.timezone_from_us,
  direct_flights = excluded.direct_flights,
  notes = excluded.notes;
