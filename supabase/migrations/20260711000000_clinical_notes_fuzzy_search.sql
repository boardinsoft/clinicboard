-- ============================================
-- Búsqueda fuzzy en notas clínicas (clinical_notes)
-- Busca en los campos subjective y plan usando pg_trgm similarity
-- Devuelve los encounter_ids que coinciden, para que la UI pueda
-- filtrar encounters por contenido de la nota clínica.
-- ============================================

CREATE OR REPLACE FUNCTION public.search_clinical_notes_fuzzy(
    search_term text,
    p_practitioner_id uuid
)
RETURNS TABLE(encounter_id uuid, similarity_score real)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cn.encounter_id,
    GREATEST(
      similarity(cn.subjective, search_term),
      similarity(cn.plan, search_term),
      similarity(cn.evolution_note, search_term)
    ) AS similarity_score
  FROM clinical_notes cn
  INNER JOIN encounters e ON e.id = cn.encounter_id
  WHERE e.practitioner_id = p_practitioner_id
    AND (
      similarity(COALESCE(cn.subjective, ''), search_term) > 0.2
      OR similarity(COALESCE(cn.plan, ''), search_term) > 0.2
      OR similarity(COALESCE(cn.evolution_note, ''), search_term) > 0.2
    )
  ORDER BY similarity_score DESC
  LIMIT 100;
END;
$function$
;

GRANT EXECUTE ON FUNCTION public.search_clinical_notes_fuzzy(text, uuid) TO authenticated;
