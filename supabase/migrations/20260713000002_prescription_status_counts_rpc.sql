-- ============================================
-- RPC para counts de medication_requests por status
-- Reemplaza 7 queries individuales con una sola query GROUP BY status.
-- Uso: SELECT * FROM get_prescription_status_counts(practitioner_id, ...)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_prescription_status_counts(
    p_prescriber_id uuid,
    p_clinic_id uuid DEFAULT NULL,
    p_date_from text DEFAULT NULL,
    p_date_to text DEFAULT NULL,
    p_search_medication_display text DEFAULT NULL,
    p_search_patient_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(status text, count bigint)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    mr.status::text,
    COUNT(mr.id)::bigint
  FROM medication_requests mr
  WHERE mr.prescriber_id = p_prescriber_id
    AND (
      p_clinic_id IS NULL
      OR mr.clinic_id = p_clinic_id
    )
    AND (
      p_date_from IS NULL
      OR mr.authored_on >= p_date_from::timestamptz
    )
    AND (
      p_date_to IS NULL
      OR mr.authored_on <= p_date_to::timestamptz
    )
    AND (
      p_search_medication_display IS NULL
      OR p_search_medication_display = ''
      OR mr.medication_display ILIKE '%' || p_search_medication_display || '%'
      OR mr.medication_code ILIKE '%' || p_search_medication_display || '%'
    )
    AND (
      p_search_patient_ids IS NULL
      OR p_search_patient_ids = ARRAY[]::uuid[]
      OR mr.patient_id = ANY(p_search_patient_ids)
    )
  GROUP BY mr.status;
END;
$function$
;

GRANT EXECUTE ON FUNCTION public.get_prescription_status_counts(uuid, uuid, text, text, text, uuid[]) TO authenticated;
