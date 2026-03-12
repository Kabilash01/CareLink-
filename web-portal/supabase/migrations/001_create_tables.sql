-- ============================================
-- CareLink Web Portal - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Doctors Table
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialty TEXT NOT NULL DEFAULT 'General Medicine',
  license_number TEXT,
  experience_years INTEGER DEFAULT 0,
  bio TEXT,
  avatar_url TEXT,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Pharmacies Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  is_open BOOLEAN DEFAULT true,
  opening_time TIME,
  closing_time TIME,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Medicines Catalog
-- ============================================
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  brand TEXT,
  category TEXT,
  description TEXT,
  dosage_form TEXT,
  strength TEXT,
  manufacturer TEXT,
  requires_prescription BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Pharmacy Inventory
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  stock_quantity INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  expiry_date DATE,
  batch_number TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Appointments
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  mode TEXT CHECK (mode IN ('video', 'audio', 'text')) DEFAULT 'video',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Consultations
-- ============================================
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  symptoms TEXT,
  diagnosis TEXT,
  notes TEXT,
  follow_up_date DATE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. Prescriptions
-- ============================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  diagnosis TEXT,
  notes TEXT,
  is_fulfilled BOOLEAN DEFAULT false,
  fulfilled_by UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. Prescription Items
-- ============================================
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  quantity INTEGER,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. Orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  delivery_mode TEXT CHECK (delivery_mode IN ('pickup', 'delivery')) DEFAULT 'pickup',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. Order Items
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. Consultation Messages
-- ============================================
CREATE TABLE IF NOT EXISTS consultation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('patient', 'doctor')),
  message TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_user_id ON pharmacies(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_id ON orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient_id ON orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_pharmacy_id ON pharmacy_inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation_id ON consultation_messages(consultation_id);

-- ============================================
-- 13. Row Level Security (RLS)
-- ============================================
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;

-- Doctors: can read/update their own data
CREATE POLICY "Doctors can view own profile" ON doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can update own profile" ON doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert doctor" ON doctors FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pharmacies: can read/update their own data
CREATE POLICY "Pharmacies can view own profile" ON pharmacies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Pharmacies can update own profile" ON pharmacies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view pharmacies" ON pharmacies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert pharmacy" ON pharmacies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Medicines: everyone can read
CREATE POLICY "Anyone can view medicines" ON medicines FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert medicines" ON medicines FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Pharmacy Inventory: pharmacy owner can CRUD
CREATE POLICY "Pharmacy owner can view inventory" ON pharmacy_inventory FOR SELECT USING (
  pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = auth.uid())
);
CREATE POLICY "Anyone can view inventory" ON pharmacy_inventory FOR SELECT USING (true);
CREATE POLICY "Pharmacy owner can insert inventory" ON pharmacy_inventory FOR INSERT WITH CHECK (
  pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = auth.uid())
);
CREATE POLICY "Pharmacy owner can update inventory" ON pharmacy_inventory FOR UPDATE USING (
  pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = auth.uid())
);
CREATE POLICY "Pharmacy owner can delete inventory" ON pharmacy_inventory FOR DELETE USING (
  pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = auth.uid())
);

-- Appointments: doctor and patient can view
CREATE POLICY "Doctors can view their appointments" ON appointments FOR SELECT USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Patients can view their appointments" ON appointments FOR SELECT USING (
  patient_id = auth.uid()
);
CREATE POLICY "Anyone authenticated can create appointment" ON appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Doctors can update appointments" ON appointments FOR UPDATE USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Consultations: doctor and patient can view
CREATE POLICY "Doctors can view their consultations" ON consultations FOR SELECT USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Patients can view their consultations" ON consultations FOR SELECT USING (
  patient_id = auth.uid()
);
CREATE POLICY "Doctors can create consultations" ON consultations FOR INSERT WITH CHECK (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can update consultations" ON consultations FOR UPDATE USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);

-- Prescriptions: doctor and patient can view
CREATE POLICY "Doctors can view their prescriptions" ON prescriptions FOR SELECT USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Patients can view their prescriptions" ON prescriptions FOR SELECT USING (
  patient_id = auth.uid()
);
CREATE POLICY "Doctors can create prescriptions" ON prescriptions FOR INSERT WITH CHECK (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can update prescriptions" ON prescriptions FOR UPDATE USING (
  doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Pharmacies can update prescriptions" ON prescriptions FOR UPDATE USING (
  fulfilled_by IN (SELECT id FROM pharmacies WHERE user_id = auth.uid())
);

-- Prescription Items
CREATE POLICY "View prescription items" ON prescription_items FOR SELECT USING (
  prescription_id IN (SELECT id FROM prescriptions WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR patient_id = auth.uid())
);
CREATE POLICY "Doctors can insert prescription items" ON prescription_items FOR INSERT WITH CHECK (
  prescription_id IN (SELECT id FROM prescriptions WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
);

-- Orders
CREATE POLICY "Pharmacy can view their orders" ON orders FOR SELECT USING (
  pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = auth.uid())
);
CREATE POLICY "Patients can view their orders" ON orders FOR SELECT USING (
  patient_id = auth.uid()
);
CREATE POLICY "Anyone authenticated can create order" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Pharmacy can update orders" ON orders FOR UPDATE USING (
  pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = auth.uid())
);

-- Order Items
CREATE POLICY "View order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE pharmacy_id IN (SELECT id FROM pharmacies WHERE user_id = auth.uid()) OR patient_id = auth.uid())
);
CREATE POLICY "Insert order items" ON order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Consultation Messages
CREATE POLICY "Participants can view messages" ON consultation_messages FOR SELECT USING (
  consultation_id IN (SELECT id FROM consultations WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()) OR patient_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON consultation_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);

-- ============================================
-- 14. Seed Data - Sample Medicines
-- ============================================
INSERT INTO medicines (name, generic_name, brand, category, dosage_form, strength, manufacturer, requires_prescription) VALUES
  ('Paracetamol', 'Acetaminophen', 'Dolo 650', 'Analgesic', 'Tablet', '650mg', 'Micro Labs', false),
  ('Amoxicillin', 'Amoxicillin', 'Mox 500', 'Antibiotic', 'Capsule', '500mg', 'Cipla', true),
  ('Cetirizine', 'Cetirizine', 'Cetzine', 'Antihistamine', 'Tablet', '10mg', 'Dr. Reddys', false),
  ('Metformin', 'Metformin HCl', 'Glycomet', 'Antidiabetic', 'Tablet', '500mg', 'USV', true),
  ('Omeprazole', 'Omeprazole', 'Omez', 'Antacid', 'Capsule', '20mg', 'Dr. Reddys', false),
  ('Azithromycin', 'Azithromycin', 'Azithral 500', 'Antibiotic', 'Tablet', '500mg', 'Alembic', true),
  ('Ibuprofen', 'Ibuprofen', 'Brufen', 'NSAID', 'Tablet', '400mg', 'Abbott', false),
  ('Amlodipine', 'Amlodipine', 'Amlong', 'Antihypertensive', 'Tablet', '5mg', 'Micro Labs', true),
  ('Pantoprazole', 'Pantoprazole', 'Pan 40', 'Antacid', 'Tablet', '40mg', 'Alkem', false),
  ('Vitamin D3', 'Cholecalciferol', 'D3 Must', 'Supplement', 'Tablet', '60000 IU', 'Mankind', false),
  ('Cough Syrup', 'Dextromethorphan', 'Benadryl', 'Antitussive', 'Syrup', '100ml', 'Johnson & Johnson', false),
  ('ORS Powder', 'Oral Rehydration Salts', 'Electral', 'Rehydration', 'Powder', '21.8g', 'FDC', false)
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. Useful Views
-- ============================================
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.*,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  p.age AS patient_age,
  p.gender AS patient_gender,
  p.blood_group AS patient_blood_group,
  d.full_name AS doctor_name,
  d.specialty AS doctor_specialty
FROM appointments a
LEFT JOIN profiles p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id;

CREATE OR REPLACE VIEW consultation_details AS
SELECT 
  c.*,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  d.full_name AS doctor_name,
  d.specialty AS doctor_specialty,
  a.mode AS consultation_mode,
  a.appointment_date,
  a.appointment_time
FROM consultations c
LEFT JOIN profiles p ON c.patient_id = p.id
LEFT JOIN doctors d ON c.doctor_id = d.id
LEFT JOIN appointments a ON c.appointment_id = a.id;

CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.*,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  ph.name AS pharmacy_name
FROM orders o
LEFT JOIN profiles p ON o.patient_id = p.id
LEFT JOIN pharmacies ph ON o.pharmacy_id = ph.id;
