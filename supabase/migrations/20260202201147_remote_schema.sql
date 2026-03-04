drop extension if exists "pg_net";


  create table "public"."country_climate_tags" (
    "country_id" uuid not null,
    "tag" text not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."country_languages" (
    "country_id" uuid not null,
    "language" text not null,
    "is_official" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."country_timezones" (
    "country_id" uuid not null,
    "timezone" text not null,
    "created_at" timestamp with time zone not null default now()
      );


CREATE UNIQUE INDEX countries_iso2_unique ON public.countries USING btree (iso2);

CREATE UNIQUE INDEX country_climate_tags_pkey ON public.country_climate_tags USING btree (country_id, tag);

CREATE UNIQUE INDEX country_languages_pkey ON public.country_languages USING btree (country_id, language);

CREATE UNIQUE INDEX country_timezones_pkey ON public.country_timezones USING btree (country_id, timezone);

CREATE INDEX idx_country_climate_tags_tag ON public.country_climate_tags USING btree (tag);

CREATE INDEX idx_country_languages_language ON public.country_languages USING btree (language);

CREATE INDEX idx_country_timezones_timezone ON public.country_timezones USING btree (timezone);

CREATE UNIQUE INDEX visa_paths_country_name_unique ON public.visa_paths USING btree (country_id, name);

alter table "public"."country_climate_tags" add constraint "country_climate_tags_pkey" PRIMARY KEY using index "country_climate_tags_pkey";

alter table "public"."country_languages" add constraint "country_languages_pkey" PRIMARY KEY using index "country_languages_pkey";

alter table "public"."country_timezones" add constraint "country_timezones_pkey" PRIMARY KEY using index "country_timezones_pkey";

alter table "public"."countries" add constraint "countries_iso2_unique" UNIQUE using index "countries_iso2_unique";

alter table "public"."country_climate_tags" add constraint "country_climate_tags_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE not valid;

alter table "public"."country_climate_tags" validate constraint "country_climate_tags_country_id_fkey";

alter table "public"."country_languages" add constraint "country_languages_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE not valid;

alter table "public"."country_languages" validate constraint "country_languages_country_id_fkey";

alter table "public"."country_timezones" add constraint "country_timezones_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE not valid;

alter table "public"."country_timezones" validate constraint "country_timezones_country_id_fkey";

alter table "public"."visa_paths" add constraint "visa_paths_country_name_unique" UNIQUE using index "visa_paths_country_name_unique";

grant delete on table "public"."country_climate_tags" to "anon";

grant insert on table "public"."country_climate_tags" to "anon";

grant references on table "public"."country_climate_tags" to "anon";

grant select on table "public"."country_climate_tags" to "anon";

grant trigger on table "public"."country_climate_tags" to "anon";

grant truncate on table "public"."country_climate_tags" to "anon";

grant update on table "public"."country_climate_tags" to "anon";

grant delete on table "public"."country_climate_tags" to "authenticated";

grant insert on table "public"."country_climate_tags" to "authenticated";

grant references on table "public"."country_climate_tags" to "authenticated";

grant select on table "public"."country_climate_tags" to "authenticated";

grant trigger on table "public"."country_climate_tags" to "authenticated";

grant truncate on table "public"."country_climate_tags" to "authenticated";

grant update on table "public"."country_climate_tags" to "authenticated";

grant delete on table "public"."country_climate_tags" to "service_role";

grant insert on table "public"."country_climate_tags" to "service_role";

grant references on table "public"."country_climate_tags" to "service_role";

grant select on table "public"."country_climate_tags" to "service_role";

grant trigger on table "public"."country_climate_tags" to "service_role";

grant truncate on table "public"."country_climate_tags" to "service_role";

grant update on table "public"."country_climate_tags" to "service_role";

grant delete on table "public"."country_languages" to "anon";

grant insert on table "public"."country_languages" to "anon";

grant references on table "public"."country_languages" to "anon";

grant select on table "public"."country_languages" to "anon";

grant trigger on table "public"."country_languages" to "anon";

grant truncate on table "public"."country_languages" to "anon";

grant update on table "public"."country_languages" to "anon";

grant delete on table "public"."country_languages" to "authenticated";

grant insert on table "public"."country_languages" to "authenticated";

grant references on table "public"."country_languages" to "authenticated";

grant select on table "public"."country_languages" to "authenticated";

grant trigger on table "public"."country_languages" to "authenticated";

grant truncate on table "public"."country_languages" to "authenticated";

grant update on table "public"."country_languages" to "authenticated";

grant delete on table "public"."country_languages" to "service_role";

grant insert on table "public"."country_languages" to "service_role";

grant references on table "public"."country_languages" to "service_role";

grant select on table "public"."country_languages" to "service_role";

grant trigger on table "public"."country_languages" to "service_role";

grant truncate on table "public"."country_languages" to "service_role";

grant update on table "public"."country_languages" to "service_role";

grant delete on table "public"."country_timezones" to "anon";

grant insert on table "public"."country_timezones" to "anon";

grant references on table "public"."country_timezones" to "anon";

grant select on table "public"."country_timezones" to "anon";

grant trigger on table "public"."country_timezones" to "anon";

grant truncate on table "public"."country_timezones" to "anon";

grant update on table "public"."country_timezones" to "anon";

grant delete on table "public"."country_timezones" to "authenticated";

grant insert on table "public"."country_timezones" to "authenticated";

grant references on table "public"."country_timezones" to "authenticated";

grant select on table "public"."country_timezones" to "authenticated";

grant trigger on table "public"."country_timezones" to "authenticated";

grant truncate on table "public"."country_timezones" to "authenticated";

grant update on table "public"."country_timezones" to "authenticated";

grant delete on table "public"."country_timezones" to "service_role";

grant insert on table "public"."country_timezones" to "service_role";

grant references on table "public"."country_timezones" to "service_role";

grant select on table "public"."country_timezones" to "service_role";

grant trigger on table "public"."country_timezones" to "service_role";

grant truncate on table "public"."country_timezones" to "service_role";

grant update on table "public"."country_timezones" to "service_role";


  create policy "Public read published countries"
  on "public"."countries"
  as permissive
  for select
  to public
using ((status = 'published'::text));



  create policy "Public read requirements"
  on "public"."requirements"
  as permissive
  for select
  to public
using (true);



  create policy "Public read steps"
  on "public"."steps"
  as permissive
  for select
  to public
using (true);



  create policy "Public read published visa_paths"
  on "public"."visa_paths"
  as permissive
  for select
  to public
using ((status = 'published'::text));


-- CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

-- CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

-- CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

-- CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

-- CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


