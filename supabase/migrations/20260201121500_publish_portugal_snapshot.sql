-- Migration to ensure Portugal snapshot and visa paths are published and visible.

update countries
set
  status = 'published',
  last_verified_at = now()
where iso2 = 'PT';

update visa_paths
set
  status = 'published',
  last_verified_at = now()
where country_id = (select id from countries where iso2 = 'PT');

