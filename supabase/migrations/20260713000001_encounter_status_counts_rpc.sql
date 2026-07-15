-- ============================================
-- RPC para counts de encounters por status
-- Reemplaza 7 queries individuales con una sola query GROUP BY status.
-- Uso: SELECT * FROM get_encounter_status_counts(practitioner_id, ...)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_encounter_status_counts(
    p_practitioner_id uuid,
    p_clinic_id uuid DEFAULT NULL,
    p_date_from text DEFAULT NULL,
    p_date_to text DEFAULT NULL,
    p_search_encounter_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(status text, count bigint)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.status::text,
    COUNT(e.id)::bigint
  FROM encounters e
  WHERE e.practitioner_id = p_practitioner_id
    AND (
      p_clinic_id IS NULL
      OR e.clinic_id = p_clinic_id
    )
    AND (
      p_date_from IS NULL
      OR e.start_time >= p_date_from::timestamptz
    )
    AND (
      p_date_to IS NULL
      OR e.start_time <= p_date_to::timestamptz
    )
    AND (
      p_search_encounter_ids IS NULL
      OR p_search_encounter_ids = ARRAY[]::uuid[]
      OR e.id = ANY(p_search_encounter_ids)
    )
  GROUP BY e.status;
END;
$function$
;

GRANT EXECUTE ON FUNCTION public.get_encounter_status_counts(uuid, uuid, text, text, uuid[]) TO authenticated;
