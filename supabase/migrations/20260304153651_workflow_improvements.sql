-- ============================================
-- Clinicboard Schema Adjustments (MVP Workflow Improvements)
-- ============================================

-- 1. Encounter Categorization & SOAP Model
ALTER TABLE encounters 
  ADD COLUMN IF NOT EXISTS encounter_category TEXT,
  ADD COLUMN IF NOT EXISTS encounter_subcategory TEXT,
  ADD COLUMN IF NOT EXISTS subjective TEXT,
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS analysis TEXT,
  ADD COLUMN IF NOT EXISTS physical_exam JSONB DEFAULT '{}';

-- 2. Patient Background Additions
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS personal_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS family_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS habits JSONB DEFAULT '{}';

-- 3. Text Macros / Templates
CREATE TABLE IF NOT EXISTS text_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  title TEXT,
  practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Order Kits (Combos of Labs/Meds)
CREATE TABLE IF NOT EXISTS order_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  diagnosis_code TEXT,
  practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES order_kits(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('medication', 'laboratory', 'study')),
  medication_code TEXT,
  medication_display TEXT,
  dosage_instruction JSONB,
  laboratory_name TEXT,
  laboratory_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE text_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_kit_items ENABLE ROW LEVEL SECURITY;

-- Macros RLS
CREATE POLICY "practitioners_read_macros" ON text_macros
  FOR SELECT USING (
    practitioner_id = (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()) 
    OR practitioner_id IS NULL
  );
  
CREATE POLICY "practitioners_write_macros" ON text_macros
  FOR ALL USING (
    practitioner_id = (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
  );

-- Order Kits RLS
CREATE POLICY "practitioners_read_kits" ON order_kits
  FOR SELECT USING (
    practitioner_id = (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()) 
    OR practitioner_id IS NULL
  );

CREATE POLICY "practitioners_write_kits" ON order_kits
  FOR ALL USING (
    practitioner_id = (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
  );

-- Kit Items RLS
CREATE POLICY "practitioners_read_kit_items" ON order_kit_items
  FOR SELECT USING (
    kit_id IN (
      SELECT id FROM order_kits 
      WHERE practitioner_id = (SELECT id FROM practitioners WHERE auth_user_id = auth.uid()) 
      OR practitioner_id IS NULL
    )
  );

CREATE POLICY "practitioners_write_kit_items" ON order_kit_items
  FOR ALL USING (
    kit_id IN (
      SELECT id FROM order_kits 
      WHERE practitioner_id = (SELECT id FROM practitioners WHERE auth_user_id = auth.uid())
    )
  );

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE TRIGGER set_updated_at_text_macros
  BEFORE UPDATE ON text_macros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_order_kits
  BEFORE UPDATE ON order_kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_order_kit_items
  BEFORE UPDATE ON order_kit_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
