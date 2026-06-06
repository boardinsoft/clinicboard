CREATE OR REPLACE FUNCTION cleanup_expired_encounters()
RETURNS void AS $$
DECLARE
    expired_encounter RECORD;
    config_record RECORD;
    max_duration INTEGER;
    grace_period_minutes INTEGER := 15;
    max_extensions INTEGER := 3;
BEGIN
    grace_period_minutes := 15;
    max_extensions := 3;

    FOR expired_encounter IN
        SELECT e.id, e.notified_at, e.extended_count, e.encounter_class, e.start_time
        FROM encounters e
        WHERE e.status = 'in-progress'
          AND e.notified_at IS NOT NULL
    LOOP
        SELECT etc.max_duration_minutes INTO max_duration
        FROM encounter_type_config etc
        WHERE etc.encounter_class = expired_encounter.encounter_class;

        IF max_duration IS NULL THEN
            max_duration := 45;
        END IF;

        IF expired_encounter.extended_count >= max_extensions THEN
            UPDATE encounters
            SET status = 'cancelled',
                timeout_reason = 'timeout',
                end_time = now(),
                updated_at = now()
            WHERE id = expired_encounter.id;

            INSERT INTO encounter_audit_log (
                encounter_id,
                action,
                old_status,
                new_status,
                changed_by,
                changed_at,
                timeout_action,
                actual_duration_minutes,
                original_duration_minutes
            ) VALUES (
                expired_encounter.id,
                'timeout_auto_cancelled',
                'in-progress',
                'cancelled',
                null,
                now(),
                'auto_cancelled',
                EXTRACT(EPOCH FROM (now() - expired_encounter.start_time)) / 60,
                max_duration
            );

        ELSIF expired_encounter.notified_at + (grace_period_minutes || ' minutes')::interval < now() THEN
            UPDATE encounters
            SET status = 'cancelled',
                timeout_reason = 'timeout',
                end_time = now(),
                updated_at = now()
            WHERE id = expired_encounter.id;

            INSERT INTO encounter_audit_log (
                encounter_id,
                action,
                old_status,
                new_status,
                changed_by,
                changed_at,
                timeout_action,
                actual_duration_minutes,
                original_duration_minutes
            ) VALUES (
                expired_encounter.id,
                'timeout_auto_cancelled',
                'in-progress',
                'cancelled',
                null,
                now(),
                'auto_cancelled',
                EXTRACT(EPOCH FROM (now() - expired_encounter.start_time)) / 60,
                max_duration
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule(
    'cleanup-expired-encounters',
    '*/5 * * * *',
    'SELECT cleanup_expired_encounters()'
);