-- Enable RLS on core tables
alter table countries enable row level security;
alter table visa_paths enable row level security;
alter table requirements enable row level security;
alter table steps enable row level security;
alter table cost_items enable row level security;
alter table cities enable row level security;

-- Policies for public read access (Anon key)

-- Countries: Public can read published countries
create policy "Public can view published countries"
on countries for select
to anon, authenticated
using (status = 'published');

-- Visa Paths: Public can read published visa paths
create policy "Public can view published visa paths"
on visa_paths for select
to anon, authenticated
using (status = 'published');

-- Requirements: Public can read all requirements (linked to visa paths)
create policy "Public can view all requirements"
on requirements for select
to anon, authenticated
using (true);

-- Steps: Public can read all steps
create policy "Public can view all steps"
on steps for select
to anon, authenticated
using (true);

-- Cost Items: Public can read all cost items
create policy "Public can view all cost items"
on cost_items for select
to anon, authenticated
using (true);

-- Cities: Public can read all cities
create policy "Public can view all cities"
on cities for select
to anon, authenticated
using (true);
