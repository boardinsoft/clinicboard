-- Prescription Audit Log
-- Tracks all status transitions and changes to prescriptions for clinical traceability

CREATE TABLE IF NOT EXISTS prescription_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES medication_requests(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'activate', 'cancel', 'complete', 'pause', 'resume', 'create'
    old_status TEXT,
    new_status TEXT,
    changed_by UUID REFERENCES practitioners(id),
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescription_audit_log_prescription_id ON prescription_audit_log(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_audit_log_changed_at ON prescription_audit_log(changed_at);

-- RLS
ALTER TABLE prescription_audit_log ENABLE ROW LEVEL SECURITY;

-- READ: allow if the prescription this audit entry belongs to is owned by the current practitioner
DROP POLICY IF EXISTS "prescription_audit_log_read" ON prescription_audit_log;
CREATE POLICY "prescription_audit_log_read" ON prescription_audit_log FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM medication_requests mr
        WHERE mr.id = prescription_audit_log.prescription_id
        AND mr.prescriber_id IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
    )
);

-- INSERT: allow if the changed_by practitioner belongs to the current auth user
DROP POLICY IF EXISTS "prescription_audit_log_insert" ON prescription_audit_log;
CREATE POLICY "prescription_audit_log_insert" ON prescription_audit_log FOR INSERT WITH CHECK (
    changed_by IN (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
);
