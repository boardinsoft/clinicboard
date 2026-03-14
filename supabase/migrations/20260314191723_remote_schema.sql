drop extension if exists "pg_net";

create extension if not exists "pg_trgm" with schema "public";

create type "public"."appointment_status" as enum ('proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow');

create type "public"."encounter_status" as enum ('planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled');

create type "public"."gender_type" as enum ('male', 'female', 'other', 'unknown');

create type "public"."medication_status" as enum ('draft', 'active', 'on-hold', 'cancelled', 'completed', 'stopped', 'unknown');

alter table "public"."appointments" drop constraint "appointments_status_check";

alter table "public"."encounters" drop constraint "encounters_status_check";

alter table "public"."medication_requests" drop constraint "medication_requests_status_check";

alter table "public"."patients" drop constraint "patients_gender_check";

alter table "public"."practitioners" drop constraint "practitioners_gender_check";

drop index if exists "public"."idx_appointments_status";


  create table "public"."cie10" (
    "code" text not null,
    "description" text not null,
    "search_vector" tsvector generated always as (to_tsvector('spanish'::regconfig, ((code || ' '::text) || description))) stored
      );


alter table "public"."cie10" enable row level security;

alter table "public"."allergy_intolerances" alter column "patient_id" set not null;

alter table "public"."appointments" alter column "patient_id" set not null;

alter table "public"."appointments" alter column "practitioner_id" set not null;

alter table "public"."appointments" alter column "status" set default 'proposed'::public.appointment_status;

alter table "public"."appointments" alter column "status" set data type public.appointment_status using "status"::public.appointment_status;

alter table "public"."conditions" alter column "patient_id" set not null;

alter table "public"."encounters" alter column "patient_id" set not null;

alter table "public"."encounters" alter column "practitioner_id" set not null;

alter table "public"."encounters" alter column "status" set default 'planned'::public.encounter_status;

alter table "public"."encounters" alter column "status" set data type public.encounter_status using "status"::public.encounter_status;

alter table "public"."medication_requests" alter column "patient_id" set not null;

alter table "public"."medication_requests" alter column "prescriber_id" set not null;

alter table "public"."medication_requests" alter column "status" set default 'draft'::public.medication_status;

alter table "public"."medication_requests" alter column "status" set data type public.medication_status using "status"::public.medication_status;

alter table "public"."patients" alter column "gender" set default 'unknown'::public.gender_type;

alter table "public"."patients" alter column "gender" set data type public.gender_type using "gender"::public.gender_type;

alter table "public"."practitioners" alter column "gender" set default 'unknown'::public.gender_type;

alter table "public"."practitioners" alter column "gender" set data type public.gender_type using "gender"::public.gender_type;

CREATE UNIQUE INDEX cie10_pkey ON public.cie10 USING btree (code);

CREATE INDEX cie10_search_idx ON public.cie10 USING gin (search_vector);

CREATE INDEX practitioners_auth_user_id_idx ON public.practitioners USING btree (auth_user_id) WHERE (auth_user_id IS NOT NULL);

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);

alter table "public"."cie10" add constraint "cie10_pkey" PRIMARY KEY using index "cie10_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_patients_fuzzy(search_term text, p_id uuid)
 RETURNS TABLE(id uuid, name_given text[], name_family text, similarity_score real)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.name_given, 
    p.name_family,
    similarity(p.name_family || ' ' || array_to_string(p.name_given, ' '), search_term) as similarity_score
  FROM patients p
  WHERE p.practitioner_id = p_id
    AND similarity(p.name_family || ' ' || array_to_string(p.name_given, ' '), search_term) > 0.2
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$function$
;

grant delete on table "public"."cie10" to "anon";

grant insert on table "public"."cie10" to "anon";

grant references on table "public"."cie10" to "anon";

grant select on table "public"."cie10" to "anon";

grant trigger on table "public"."cie10" to "anon";

grant truncate on table "public"."cie10" to "anon";

grant update on table "public"."cie10" to "anon";

grant delete on table "public"."cie10" to "authenticated";

grant insert on table "public"."cie10" to "authenticated";

grant references on table "public"."cie10" to "authenticated";

grant select on table "public"."cie10" to "authenticated";

grant trigger on table "public"."cie10" to "authenticated";

grant truncate on table "public"."cie10" to "authenticated";

grant update on table "public"."cie10" to "authenticated";

grant delete on table "public"."cie10" to "service_role";

grant insert on table "public"."cie10" to "service_role";

grant references on table "public"."cie10" to "service_role";

grant select on table "public"."cie10" to "service_role";

grant trigger on table "public"."cie10" to "service_role";

grant truncate on table "public"."cie10" to "service_role";

grant update on table "public"."cie10" to "service_role";


  create policy "anon_view_allergies"
  on "public"."allergy_intolerances"
  as permissive
  for select
  to anon
using ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.practitioner_id = '00000000-0000-0000-0000-000000000001'::uuid))));



  create policy "Allow read access to all authenticated users"
  on "public"."cie10"
  as permissive
  for select
  to authenticated
using (true);



  create policy "anon_view_conditions"
  on "public"."conditions"
  as permissive
  for select
  to anon
using ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.practitioner_id = '00000000-0000-0000-0000-000000000001'::uuid))));



  create policy "anon_manage_patients"
  on "public"."patients"
  as permissive
  for all
  to anon
using ((practitioner_id = '00000000-0000-0000-0000-000000000001'::uuid))
with check ((practitioner_id = '00000000-0000-0000-0000-000000000001'::uuid));



