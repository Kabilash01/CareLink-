// ============================================
// CareLink Web Portal - Type Definitions
// ============================================

// ---- Auth & Profiles ----
export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  created_at?: string;
}

export type UserRole = 'doctor' | 'pharmacy';

// ---- Doctors ----
export interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specialty: string;
  license_number: string | null;
  experience_years: number;
  bio: string | null;
  avatar_url: string | null;
  consultation_fee: number;
  is_available: boolean;
  rating: number;
  total_consultations: number;
  created_at: string;
  updated_at: string;
}

// ---- Pharmacies ----
export interface Pharmacy {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
  opening_time: string | null;
  closing_time: string | null;
  rating: number;
  created_at: string;
  updated_at: string;
}

// ---- Appointments ----
export type AppointmentMode = 'video' | 'audio' | 'text';
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  mode: AppointmentMode;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  patient?: Profile;
  doctor?: Doctor;
}

// ---- Consultations ----
export type ConsultationStatus = 'active' | 'completed' | 'cancelled';

export interface Consultation {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  symptoms: string | null;
  diagnosis: string | null;
  notes: string | null;
  follow_up_date: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: ConsultationStatus;
  created_at: string;
  // Joined
  patient?: Profile;
  doctor?: Doctor;
  appointment?: Appointment;
  prescription?: Prescription;
}

// ---- Prescriptions ----
export interface Prescription {
  id: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string;
  diagnosis: string | null;
  notes: string | null;
  is_fulfilled: boolean;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  created_at: string;
  // Joined
  patient?: Profile;
  doctor?: Doctor;
  items?: PrescriptionItem[];
  consultation?: Consultation;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: number | null;
  instructions: string | null;
}

// ---- Medicines ----
export interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  category: string | null;
  description: string | null;
  dosage_form: string | null;
  strength: string | null;
  manufacturer: string | null;
  requires_prescription: boolean;
  created_at: string;
}

// ---- Pharmacy Inventory ----
export interface PharmacyInventory {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  stock_quantity: number;
  price: number;
  discount_percent: number;
  expiry_date: string | null;
  batch_number: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  medicine?: Medicine;
}

// ---- Orders ----
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Order {
  id: string;
  patient_id: string;
  pharmacy_id: string;
  prescription_id: string | null;
  status: OrderStatus;
  total_amount: number | null;
  payment_status: PaymentStatus;
  delivery_mode: 'pickup' | 'delivery';
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  patient?: Profile;
  prescription?: Prescription;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  medicine_id: string | null;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ---- Consultation Messages ----
export interface ConsultationMessage {
  id: string;
  consultation_id: string;
  sender_id: string;
  sender_role: 'patient' | 'doctor';
  message: string;
  message_type: 'text' | 'image' | 'file';
  attachment_url: string | null;
  created_at: string;
}

// ---- Dashboard Stats ----
export interface DoctorDashboardStats {
  totalPatients: number;
  todayAppointments: number;
  completedConsultations: number;
  pendingAppointments: number;
  revenue: number;
}

export interface PharmacyDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalMedicines: number;
  lowStockItems: number;
  revenue: number;
}
