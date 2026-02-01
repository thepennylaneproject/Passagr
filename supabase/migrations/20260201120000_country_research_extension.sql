-- Expand schema to capture richer country research data.

create table country_healthcare_metrics (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade unique,
  system_type text,
  public_access_notes text,
  gp_visit_cost text,
  private_insurance_cost text,
  cost_of_living_index text,
  rent_1br_city_center text,
  monthly_budget_single text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table country_tax_profiles (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade unique,
  us_tax_treaty boolean,
  feie_strategy text,
  foreign_tax_credit_strategy text,
  local_incentives text,
  standard_income_tax text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table country_language_profiles (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade unique,
  citizenship_language text,
  difficulty text,
  family_reunification_wait text,
  eligible_family text,
  years_to_permanent_residency text,
  years_to_citizenship text,
  dual_citizenship_allowed boolean,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table country_quality_of_life (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade unique,
  eiu_liveability text,
  monocle_qol text,
  climate text,
  english_proficiency text,
  major_expat_hubs text,
  timezone_from_us text,
  direct_flights text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace trigger update_country_healthcare_metrics_updated_at
before update on country_healthcare_metrics
for each row execute function update_updated_at_column();

create or replace trigger update_country_tax_profiles_updated_at
before update on country_tax_profiles
for each row execute function update_updated_at_column();

create or replace trigger update_country_language_profiles_updated_at
before update on country_language_profiles
for each row execute function update_updated_at_column();

create or replace trigger update_country_quality_of_life_updated_at
before update on country_quality_of_life
for each row execute function update_updated_at_column();
