-- ============================================
-- Búsqueda por partes del nombre (nombre de pila / given names)
-- El problema: name_given es TEXT[] = ['María', 'Isabel']
-- Buscar "isabel" no matcheaba porque cs.{isabel} busca elemento exacto
-- y ILIKE no funciona directamente sobre elementos de un array.
--
-- Esta función permite buscar por cualquier parte del nombre:
-- - Partial match en apellido: name_family ILIKE '%isabel%'
-- - Partial match en cualquier given name: unnest(name_given) ILIKE '%isabel%'
-- - Fuzzy match en nombre completo concatenado
-- ============================================

CREATE OR REPLACE FUNCTION public.search_patients_name_parts(
    search_term text,
    p_id uuid
)
RETURNS TABLE(id uuid, name_given text[], name_family text, similarity_score real)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name_given,
    p.name_family,
    GREATEST(
      similarity(p.name_family, search_term),
      COALESCE(
        (SELECT MAX(similarity(ng, search_term))
         FROM unnest(p.name_given) AS ng),
        0
      ),
      similarity(p.name_family || ' ' || array_to_string(p.name_given, ' '), search_term)
    ) AS similarity_score
  FROM patients p
  WHERE p.practitioner_id = p_id
    AND (
      p.name_family ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p.name_given) AS ng
        WHERE ng ILIKE '%' || search_term || '%'
      )
      OR similarity(p.name_family || ' ' || array_to_string(p.name_given, ' '), search_term) > 0.2
    )
  ORDER BY similarity_score DESC
  LIMIT 50;
END;
$function$
;

GRANT EXECUTE ON FUNCTION public.search_patients_name_parts(text, uuid) TO authenticated;
