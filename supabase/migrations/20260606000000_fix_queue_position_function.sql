-- ============================================
-- Fix get_next_queue_position_locked function
-- FOR UPDATE cannot be used with aggregate functions
-- ============================================

CREATE OR REPLACE FUNCTION get_next_queue_position_locked(
    p_practitioner_id UUID,
    p_clinic_id UUID,
    p_date DATE
) RETURNS INTEGER AS $$
DECLARE
    next_pos INTEGER;
BEGIN
    SELECT COALESCE(MAX(queue_position), 0) + 1 INTO next_pos
    FROM appointments
    WHERE practitioner_id = p_practitioner_id
      AND clinic_id = p_clinic_id
      AND DATE(start_time) = p_date;

    RETURN next_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;