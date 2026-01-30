-- Add rights and prep-related fields

alter table countries
  add column lgbtq_rights_index int not null default 0,
  add column abortion_access_status text,
  add column hate_crime_law_snapshot text;

alter table visa_paths
  add column in_country_conversion_path text;

alter table requirements
  add column prep_mode text not null default 'remote_only';

insert into freshness_policies (key, ttl_days, criticality) values
  ('lgbtq_rights_index', 90, 'high'),
  ('abortion_access_status', 30, 'critical'),
  ('hate_crime_law_snapshot', 180, 'medium')
on conflict (key) do update
set
  ttl_days = excluded.ttl_days,
  criticality = excluded.criticality;

create index idx_countries_lgbtq_rights_index
  on countries(lgbtq_rights_index);

create index idx_countries_abortion_status
  on countries(abortion_access_status);

create index idx_requirements_prep_mode
  on requirements(prep_mode);
