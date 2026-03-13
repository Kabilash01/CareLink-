drop extension if exists "pg_net";


  create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid,
    "doctor_id" uuid,
    "appointment_date" date not null,
    "appointment_time" time without time zone not null,
    "duration_minutes" integer default 30,
    "mode" text default 'video'::text,
    "status" text default 'pending'::text,
    "reason" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."appointments" enable row level security;


  create table "public"."auth_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "event_type" text not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."auth_logs" enable row level security;


  create table "public"."chat_messages" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null,
    "content" text not null,
    "image_url" text,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."chat_messages" enable row level security;


  create table "public"."chat_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text default 'New Chat'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."chat_sessions" enable row level security;


  create table "public"."consultation_messages" (
    "id" uuid not null default gen_random_uuid(),
    "consultation_id" uuid,
    "sender_id" uuid not null,
    "sender_role" text,
    "message" text not null,
    "message_type" text default 'text'::text,
    "attachment_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."consultation_messages" enable row level security;


  create table "public"."consultations" (
    "id" uuid not null default gen_random_uuid(),
    "appointment_id" uuid,
    "patient_id" uuid,
    "doctor_id" uuid,
    "symptoms" text,
    "diagnosis" text,
    "notes" text,
    "follow_up_date" date,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "status" text default 'active'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."consultations" enable row level security;


  create table "public"."doctors" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "full_name" text not null,
    "email" text not null,
    "phone" text,
    "specialty" text not null default 'General Medicine'::text,
    "license_number" text,
    "experience_years" integer default 0,
    "bio" text,
    "avatar_url" text,
    "consultation_fee" numeric(10,2) default 0,
    "is_available" boolean default true,
    "rating" numeric(3,2) default 0,
    "total_consultations" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."doctors" enable row level security;


  create table "public"."medicines" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "generic_name" text,
    "brand" text,
    "category" text,
    "description" text,
    "dosage_form" text,
    "strength" text,
    "manufacturer" text,
    "requires_prescription" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."medicines" enable row level security;


  create table "public"."order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid,
    "medicine_id" uuid,
    "medicine_name" text not null,
    "quantity" integer not null,
    "unit_price" numeric(10,2) not null,
    "total_price" numeric(10,2) not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."order_items" enable row level security;


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "patient_id" uuid,
    "pharmacy_id" uuid,
    "prescription_id" uuid,
    "status" text default 'pending'::text,
    "total_amount" numeric(10,2),
    "payment_status" text default 'pending'::text,
    "delivery_mode" text default 'pickup'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."pharmacies" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "name" text not null,
    "email" text not null,
    "phone" text,
    "license_number" text,
    "address" text,
    "city" text,
    "state" text,
    "pincode" text,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "is_open" boolean default true,
    "opening_time" time without time zone,
    "closing_time" time without time zone,
    "rating" numeric(3,2) default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."pharmacies" enable row level security;


  create table "public"."pharmacy_inventory" (
    "id" uuid not null default gen_random_uuid(),
    "pharmacy_id" uuid,
    "medicine_id" uuid,
    "stock_quantity" integer default 0,
    "price" numeric(10,2) not null,
    "discount_percent" numeric(5,2) default 0,
    "expiry_date" date,
    "batch_number" text,
    "is_available" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."pharmacy_inventory" enable row level security;


  create table "public"."prescription_items" (
    "id" uuid not null default gen_random_uuid(),
    "prescription_id" uuid,
    "medicine_name" text not null,
    "dosage" text,
    "frequency" text,
    "duration" text,
    "quantity" integer,
    "instructions" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."prescription_items" enable row level security;


  create table "public"."prescriptions" (
    "id" uuid not null default gen_random_uuid(),
    "consultation_id" uuid,
    "patient_id" uuid,
    "doctor_id" uuid,
    "diagnosis" text,
    "notes" text,
    "is_fulfilled" boolean default false,
    "fulfilled_by" uuid,
    "fulfilled_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."prescriptions" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text,
    "phone" text,
    "age" smallint,
    "gender" text,
    "avatar_url" text,
    "blood_group" text,
    "address" text,
    "emg_contact_name" text,
    "emg_contact_phone" text,
    "is_onboarded" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."symptom_checks" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "symptoms_text" text not null,
    "symptoms_selected" text[] default '{}'::text[],
    "duration" text,
    "answers" jsonb default '{}'::jsonb,
    "prediction" text,
    "confidence" real,
    "probabilities" jsonb default '{}'::jsonb,
    "rules_triggered" text[] default '{}'::text[],
    "explanation" text,
    "emergency_flag" boolean default false,
    "escalated" boolean default false,
    "model_version" text,
    "request_id" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."symptom_checks" enable row level security;


  create table "public"."user_prescriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "doctor_name" text,
    "hospital_name" text,
    "prescription_date" date,
    "image_url" text,
    "notes" text,
    "tags" text[] default '{}'::text[],
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_prescriptions" enable row level security;


  create table "public"."vlm_scans" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "image_url" text,
    "question" text,
    "analysis" text,
    "findings" jsonb default '[]'::jsonb,
    "model_name" text,
    "model_ready" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."vlm_scans" enable row level security;

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX auth_logs_pkey ON public.auth_logs USING btree (id);

CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id);

CREATE UNIQUE INDEX chat_sessions_pkey ON public.chat_sessions USING btree (id);

CREATE UNIQUE INDEX consultation_messages_pkey ON public.consultation_messages USING btree (id);

CREATE UNIQUE INDEX consultations_pkey ON public.consultations USING btree (id);

CREATE UNIQUE INDEX doctors_pkey ON public.doctors USING btree (id);

CREATE UNIQUE INDEX doctors_user_id_key ON public.doctors USING btree (user_id);

CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);

CREATE INDEX idx_appointments_doctor_id ON public.appointments USING btree (doctor_id);

CREATE INDEX idx_appointments_patient_id ON public.appointments USING btree (patient_id);

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (session_id, created_at);

CREATE INDEX idx_chat_sessions_user ON public.chat_sessions USING btree (user_id, updated_at DESC);

CREATE INDEX idx_consultation_messages_consultation_id ON public.consultation_messages USING btree (consultation_id);

CREATE INDEX idx_consultations_doctor_id ON public.consultations USING btree (doctor_id);

CREATE INDEX idx_consultations_patient_id ON public.consultations USING btree (patient_id);

CREATE INDEX idx_doctors_user_id ON public.doctors USING btree (user_id);

CREATE INDEX idx_orders_patient_id ON public.orders USING btree (patient_id);

CREATE INDEX idx_orders_pharmacy_id ON public.orders USING btree (pharmacy_id);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_pharmacies_user_id ON public.pharmacies USING btree (user_id);

CREATE INDEX idx_pharmacy_inventory_pharmacy_id ON public.pharmacy_inventory USING btree (pharmacy_id);

CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions USING btree (doctor_id);

CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions USING btree (patient_id);

CREATE INDEX idx_symptom_checks_user ON public.symptom_checks USING btree (user_id, created_at DESC);

CREATE INDEX idx_user_prescriptions_user ON public.user_prescriptions USING btree (user_id, created_at DESC);

CREATE INDEX idx_vlm_scans_user ON public.vlm_scans USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX medicines_pkey ON public.medicines USING btree (id);

CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX pharmacies_pkey ON public.pharmacies USING btree (id);

CREATE UNIQUE INDEX pharmacies_user_id_key ON public.pharmacies USING btree (user_id);

CREATE UNIQUE INDEX pharmacy_inventory_pkey ON public.pharmacy_inventory USING btree (id);

CREATE UNIQUE INDEX prescription_items_pkey ON public.prescription_items USING btree (id);

CREATE UNIQUE INDEX prescriptions_pkey ON public.prescriptions USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX symptom_checks_pkey ON public.symptom_checks USING btree (id);

CREATE UNIQUE INDEX user_prescriptions_pkey ON public.user_prescriptions USING btree (id);

CREATE UNIQUE INDEX vlm_scans_pkey ON public.vlm_scans USING btree (id);

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."auth_logs" add constraint "auth_logs_pkey" PRIMARY KEY using index "auth_logs_pkey";

alter table "public"."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY using index "chat_messages_pkey";

alter table "public"."chat_sessions" add constraint "chat_sessions_pkey" PRIMARY KEY using index "chat_sessions_pkey";

alter table "public"."consultation_messages" add constraint "consultation_messages_pkey" PRIMARY KEY using index "consultation_messages_pkey";

alter table "public"."consultations" add constraint "consultations_pkey" PRIMARY KEY using index "consultations_pkey";

alter table "public"."doctors" add constraint "doctors_pkey" PRIMARY KEY using index "doctors_pkey";

alter table "public"."medicines" add constraint "medicines_pkey" PRIMARY KEY using index "medicines_pkey";

alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."pharmacies" add constraint "pharmacies_pkey" PRIMARY KEY using index "pharmacies_pkey";

alter table "public"."pharmacy_inventory" add constraint "pharmacy_inventory_pkey" PRIMARY KEY using index "pharmacy_inventory_pkey";

alter table "public"."prescription_items" add constraint "prescription_items_pkey" PRIMARY KEY using index "prescription_items_pkey";

alter table "public"."prescriptions" add constraint "prescriptions_pkey" PRIMARY KEY using index "prescriptions_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."symptom_checks" add constraint "symptom_checks_pkey" PRIMARY KEY using index "symptom_checks_pkey";

alter table "public"."user_prescriptions" add constraint "user_prescriptions_pkey" PRIMARY KEY using index "user_prescriptions_pkey";

alter table "public"."vlm_scans" add constraint "vlm_scans_pkey" PRIMARY KEY using index "vlm_scans_pkey";

alter table "public"."appointments" add constraint "appointments_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_doctor_id_fkey";

alter table "public"."appointments" add constraint "appointments_mode_check" CHECK ((mode = ANY (ARRAY['video'::text, 'audio'::text, 'text'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_mode_check";

alter table "public"."appointments" add constraint "appointments_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."appointments" validate constraint "appointments_patient_id_fkey";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."auth_logs" add constraint "auth_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."auth_logs" validate constraint "auth_logs_user_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))) not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_role_check";

alter table "public"."chat_messages" add constraint "chat_messages_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_session_id_fkey";

alter table "public"."chat_messages" add constraint "chat_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_messages" validate constraint "chat_messages_user_id_fkey";

alter table "public"."chat_sessions" add constraint "chat_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_sessions" validate constraint "chat_sessions_user_id_fkey";

alter table "public"."consultation_messages" add constraint "consultation_messages_consultation_id_fkey" FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE not valid;

alter table "public"."consultation_messages" validate constraint "consultation_messages_consultation_id_fkey";

alter table "public"."consultation_messages" add constraint "consultation_messages_message_type_check" CHECK ((message_type = ANY (ARRAY['text'::text, 'image'::text, 'file'::text]))) not valid;

alter table "public"."consultation_messages" validate constraint "consultation_messages_message_type_check";

alter table "public"."consultation_messages" add constraint "consultation_messages_sender_role_check" CHECK ((sender_role = ANY (ARRAY['patient'::text, 'doctor'::text]))) not valid;

alter table "public"."consultation_messages" validate constraint "consultation_messages_sender_role_check";

alter table "public"."consultations" add constraint "consultations_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL not valid;

alter table "public"."consultations" validate constraint "consultations_appointment_id_fkey";

alter table "public"."consultations" add constraint "consultations_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL not valid;

alter table "public"."consultations" validate constraint "consultations_doctor_id_fkey";

alter table "public"."consultations" add constraint "consultations_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."consultations" validate constraint "consultations_patient_id_fkey";

alter table "public"."consultations" add constraint "consultations_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."consultations" validate constraint "consultations_status_check";

alter table "public"."doctors" add constraint "doctors_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."doctors" validate constraint "doctors_user_id_fkey";

alter table "public"."doctors" add constraint "doctors_user_id_key" UNIQUE using index "doctors_user_id_key";

alter table "public"."order_items" add constraint "order_items_medicine_id_fkey" FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE SET NULL not valid;

alter table "public"."order_items" validate constraint "order_items_medicine_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."orders" add constraint "orders_delivery_mode_check" CHECK ((delivery_mode = ANY (ARRAY['pickup'::text, 'delivery'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_delivery_mode_check";

alter table "public"."orders" add constraint "orders_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_patient_id_fkey";

alter table "public"."orders" add constraint "orders_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_payment_status_check";

alter table "public"."orders" add constraint "orders_pharmacy_id_fkey" FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_pharmacy_id_fkey";

alter table "public"."orders" add constraint "orders_prescription_id_fkey" FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_prescription_id_fkey";

alter table "public"."orders" add constraint "orders_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'preparing'::text, 'ready'::text, 'delivered'::text, 'cancelled'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_status_check";

alter table "public"."pharmacies" add constraint "pharmacies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pharmacies" validate constraint "pharmacies_user_id_fkey";

alter table "public"."pharmacies" add constraint "pharmacies_user_id_key" UNIQUE using index "pharmacies_user_id_key";

alter table "public"."pharmacy_inventory" add constraint "pharmacy_inventory_medicine_id_fkey" FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE not valid;

alter table "public"."pharmacy_inventory" validate constraint "pharmacy_inventory_medicine_id_fkey";

alter table "public"."pharmacy_inventory" add constraint "pharmacy_inventory_pharmacy_id_fkey" FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE not valid;

alter table "public"."pharmacy_inventory" validate constraint "pharmacy_inventory_pharmacy_id_fkey";

alter table "public"."prescription_items" add constraint "prescription_items_prescription_id_fkey" FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE not valid;

alter table "public"."prescription_items" validate constraint "prescription_items_prescription_id_fkey";

alter table "public"."prescriptions" add constraint "prescriptions_consultation_id_fkey" FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE SET NULL not valid;

alter table "public"."prescriptions" validate constraint "prescriptions_consultation_id_fkey";

alter table "public"."prescriptions" add constraint "prescriptions_doctor_id_fkey" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL not valid;

alter table "public"."prescriptions" validate constraint "prescriptions_doctor_id_fkey";

alter table "public"."prescriptions" add constraint "prescriptions_fulfilled_by_fkey" FOREIGN KEY (fulfilled_by) REFERENCES public.pharmacies(id) ON DELETE SET NULL not valid;

alter table "public"."prescriptions" validate constraint "prescriptions_fulfilled_by_fkey";

alter table "public"."prescriptions" add constraint "prescriptions_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."prescriptions" validate constraint "prescriptions_patient_id_fkey";

alter table "public"."profiles" add constraint "profiles_gender_check" CHECK ((gender = ANY (ARRAY['Male'::text, 'Female'::text, 'Other'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_gender_check";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."symptom_checks" add constraint "symptom_checks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."symptom_checks" validate constraint "symptom_checks_user_id_fkey";

alter table "public"."user_prescriptions" add constraint "user_prescriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_prescriptions" validate constraint "user_prescriptions_user_id_fkey";

alter table "public"."vlm_scans" add constraint "vlm_scans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."vlm_scans" validate constraint "vlm_scans_user_id_fkey";

set check_function_bodies = off;

create or replace view "public"."appointment_details" as  SELECT a.id,
    a.patient_id,
    a.doctor_id,
    a.appointment_date,
    a.appointment_time,
    a.duration_minutes,
    a.mode,
    a.status,
    a.reason,
    a.notes,
    a.created_at,
    a.updated_at,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    p.age AS patient_age,
    p.gender AS patient_gender,
    p.blood_group AS patient_blood_group,
    d.full_name AS doctor_name,
    d.specialty AS doctor_specialty
   FROM ((public.appointments a
     LEFT JOIN public.profiles p ON ((a.patient_id = p.id)))
     LEFT JOIN public.doctors d ON ((a.doctor_id = d.id)));


create or replace view "public"."consultation_details" as  SELECT c.id,
    c.appointment_id,
    c.patient_id,
    c.doctor_id,
    c.symptoms,
    c.diagnosis,
    c.notes,
    c.follow_up_date,
    c.started_at,
    c.ended_at,
    c.status,
    c.created_at,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    d.full_name AS doctor_name,
    d.specialty AS doctor_specialty,
    a.mode AS consultation_mode,
    a.appointment_date,
    a.appointment_time
   FROM (((public.consultations c
     LEFT JOIN public.profiles p ON ((c.patient_id = p.id)))
     LEFT JOIN public.doctors d ON ((c.doctor_id = d.id)))
     LEFT JOIN public.appointments a ON ((c.appointment_id = a.id)));


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, full_name, phone, age, gender)
  values (
    new.id,
    (new.raw_user_meta_data->>'full_name'),
    (new.raw_user_meta_data->>'phone'),
    nullif(new.raw_user_meta_data->>'age', '')::smallint,
    (new.raw_user_meta_data->>'gender')
  )
  on conflict (id) do nothing;
  return new;
end;
$function$
;

create or replace view "public"."order_details" as  SELECT o.id,
    o.patient_id,
    o.pharmacy_id,
    o.prescription_id,
    o.status,
    o.total_amount,
    o.payment_status,
    o.delivery_mode,
    o.notes,
    o.created_at,
    o.updated_at,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    ph.name AS pharmacy_name
   FROM ((public.orders o
     LEFT JOIN public.profiles p ON ((o.patient_id = p.id)))
     LEFT JOIN public.pharmacies ph ON ((o.pharmacy_id = ph.id)));


CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."auth_logs" to "anon";

grant insert on table "public"."auth_logs" to "anon";

grant references on table "public"."auth_logs" to "anon";

grant select on table "public"."auth_logs" to "anon";

grant trigger on table "public"."auth_logs" to "anon";

grant truncate on table "public"."auth_logs" to "anon";

grant update on table "public"."auth_logs" to "anon";

grant delete on table "public"."auth_logs" to "authenticated";

grant insert on table "public"."auth_logs" to "authenticated";

grant references on table "public"."auth_logs" to "authenticated";

grant select on table "public"."auth_logs" to "authenticated";

grant trigger on table "public"."auth_logs" to "authenticated";

grant truncate on table "public"."auth_logs" to "authenticated";

grant update on table "public"."auth_logs" to "authenticated";

grant delete on table "public"."auth_logs" to "service_role";

grant insert on table "public"."auth_logs" to "service_role";

grant references on table "public"."auth_logs" to "service_role";

grant select on table "public"."auth_logs" to "service_role";

grant trigger on table "public"."auth_logs" to "service_role";

grant truncate on table "public"."auth_logs" to "service_role";

grant update on table "public"."auth_logs" to "service_role";

grant delete on table "public"."chat_messages" to "anon";

grant insert on table "public"."chat_messages" to "anon";

grant references on table "public"."chat_messages" to "anon";

grant select on table "public"."chat_messages" to "anon";

grant trigger on table "public"."chat_messages" to "anon";

grant truncate on table "public"."chat_messages" to "anon";

grant update on table "public"."chat_messages" to "anon";

grant delete on table "public"."chat_messages" to "authenticated";

grant insert on table "public"."chat_messages" to "authenticated";

grant references on table "public"."chat_messages" to "authenticated";

grant select on table "public"."chat_messages" to "authenticated";

grant trigger on table "public"."chat_messages" to "authenticated";

grant truncate on table "public"."chat_messages" to "authenticated";

grant update on table "public"."chat_messages" to "authenticated";

grant delete on table "public"."chat_messages" to "service_role";

grant insert on table "public"."chat_messages" to "service_role";

grant references on table "public"."chat_messages" to "service_role";

grant select on table "public"."chat_messages" to "service_role";

grant trigger on table "public"."chat_messages" to "service_role";

grant truncate on table "public"."chat_messages" to "service_role";

grant update on table "public"."chat_messages" to "service_role";

grant delete on table "public"."chat_sessions" to "anon";

grant insert on table "public"."chat_sessions" to "anon";

grant references on table "public"."chat_sessions" to "anon";

grant select on table "public"."chat_sessions" to "anon";

grant trigger on table "public"."chat_sessions" to "anon";

grant truncate on table "public"."chat_sessions" to "anon";

grant update on table "public"."chat_sessions" to "anon";

grant delete on table "public"."chat_sessions" to "authenticated";

grant insert on table "public"."chat_sessions" to "authenticated";

grant references on table "public"."chat_sessions" to "authenticated";

grant select on table "public"."chat_sessions" to "authenticated";

grant trigger on table "public"."chat_sessions" to "authenticated";

grant truncate on table "public"."chat_sessions" to "authenticated";

grant update on table "public"."chat_sessions" to "authenticated";

grant delete on table "public"."chat_sessions" to "service_role";

grant insert on table "public"."chat_sessions" to "service_role";

grant references on table "public"."chat_sessions" to "service_role";

grant select on table "public"."chat_sessions" to "service_role";

grant trigger on table "public"."chat_sessions" to "service_role";

grant truncate on table "public"."chat_sessions" to "service_role";

grant update on table "public"."chat_sessions" to "service_role";

grant delete on table "public"."consultation_messages" to "anon";

grant insert on table "public"."consultation_messages" to "anon";

grant references on table "public"."consultation_messages" to "anon";

grant select on table "public"."consultation_messages" to "anon";

grant trigger on table "public"."consultation_messages" to "anon";

grant truncate on table "public"."consultation_messages" to "anon";

grant update on table "public"."consultation_messages" to "anon";

grant delete on table "public"."consultation_messages" to "authenticated";

grant insert on table "public"."consultation_messages" to "authenticated";

grant references on table "public"."consultation_messages" to "authenticated";

grant select on table "public"."consultation_messages" to "authenticated";

grant trigger on table "public"."consultation_messages" to "authenticated";

grant truncate on table "public"."consultation_messages" to "authenticated";

grant update on table "public"."consultation_messages" to "authenticated";

grant delete on table "public"."consultation_messages" to "service_role";

grant insert on table "public"."consultation_messages" to "service_role";

grant references on table "public"."consultation_messages" to "service_role";

grant select on table "public"."consultation_messages" to "service_role";

grant trigger on table "public"."consultation_messages" to "service_role";

grant truncate on table "public"."consultation_messages" to "service_role";

grant update on table "public"."consultation_messages" to "service_role";

grant delete on table "public"."consultations" to "anon";

grant insert on table "public"."consultations" to "anon";

grant references on table "public"."consultations" to "anon";

grant select on table "public"."consultations" to "anon";

grant trigger on table "public"."consultations" to "anon";

grant truncate on table "public"."consultations" to "anon";

grant update on table "public"."consultations" to "anon";

grant delete on table "public"."consultations" to "authenticated";

grant insert on table "public"."consultations" to "authenticated";

grant references on table "public"."consultations" to "authenticated";

grant select on table "public"."consultations" to "authenticated";

grant trigger on table "public"."consultations" to "authenticated";

grant truncate on table "public"."consultations" to "authenticated";

grant update on table "public"."consultations" to "authenticated";

grant delete on table "public"."consultations" to "service_role";

grant insert on table "public"."consultations" to "service_role";

grant references on table "public"."consultations" to "service_role";

grant select on table "public"."consultations" to "service_role";

grant trigger on table "public"."consultations" to "service_role";

grant truncate on table "public"."consultations" to "service_role";

grant update on table "public"."consultations" to "service_role";

grant delete on table "public"."doctors" to "anon";

grant insert on table "public"."doctors" to "anon";

grant references on table "public"."doctors" to "anon";

grant select on table "public"."doctors" to "anon";

grant trigger on table "public"."doctors" to "anon";

grant truncate on table "public"."doctors" to "anon";

grant update on table "public"."doctors" to "anon";

grant delete on table "public"."doctors" to "authenticated";

grant insert on table "public"."doctors" to "authenticated";

grant references on table "public"."doctors" to "authenticated";

grant select on table "public"."doctors" to "authenticated";

grant trigger on table "public"."doctors" to "authenticated";

grant truncate on table "public"."doctors" to "authenticated";

grant update on table "public"."doctors" to "authenticated";

grant delete on table "public"."doctors" to "service_role";

grant insert on table "public"."doctors" to "service_role";

grant references on table "public"."doctors" to "service_role";

grant select on table "public"."doctors" to "service_role";

grant trigger on table "public"."doctors" to "service_role";

grant truncate on table "public"."doctors" to "service_role";

grant update on table "public"."doctors" to "service_role";

grant delete on table "public"."medicines" to "anon";

grant insert on table "public"."medicines" to "anon";

grant references on table "public"."medicines" to "anon";

grant select on table "public"."medicines" to "anon";

grant trigger on table "public"."medicines" to "anon";

grant truncate on table "public"."medicines" to "anon";

grant update on table "public"."medicines" to "anon";

grant delete on table "public"."medicines" to "authenticated";

grant insert on table "public"."medicines" to "authenticated";

grant references on table "public"."medicines" to "authenticated";

grant select on table "public"."medicines" to "authenticated";

grant trigger on table "public"."medicines" to "authenticated";

grant truncate on table "public"."medicines" to "authenticated";

grant update on table "public"."medicines" to "authenticated";

grant delete on table "public"."medicines" to "service_role";

grant insert on table "public"."medicines" to "service_role";

grant references on table "public"."medicines" to "service_role";

grant select on table "public"."medicines" to "service_role";

grant trigger on table "public"."medicines" to "service_role";

grant truncate on table "public"."medicines" to "service_role";

grant update on table "public"."medicines" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant references on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant trigger on table "public"."order_items" to "anon";

grant truncate on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant references on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant trigger on table "public"."order_items" to "authenticated";

grant truncate on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."pharmacies" to "anon";

grant insert on table "public"."pharmacies" to "anon";

grant references on table "public"."pharmacies" to "anon";

grant select on table "public"."pharmacies" to "anon";

grant trigger on table "public"."pharmacies" to "anon";

grant truncate on table "public"."pharmacies" to "anon";

grant update on table "public"."pharmacies" to "anon";

grant delete on table "public"."pharmacies" to "authenticated";

grant insert on table "public"."pharmacies" to "authenticated";

grant references on table "public"."pharmacies" to "authenticated";

grant select on table "public"."pharmacies" to "authenticated";

grant trigger on table "public"."pharmacies" to "authenticated";

grant truncate on table "public"."pharmacies" to "authenticated";

grant update on table "public"."pharmacies" to "authenticated";

grant delete on table "public"."pharmacies" to "service_role";

grant insert on table "public"."pharmacies" to "service_role";

grant references on table "public"."pharmacies" to "service_role";

grant select on table "public"."pharmacies" to "service_role";

grant trigger on table "public"."pharmacies" to "service_role";

grant truncate on table "public"."pharmacies" to "service_role";

grant update on table "public"."pharmacies" to "service_role";

grant delete on table "public"."pharmacy_inventory" to "anon";

grant insert on table "public"."pharmacy_inventory" to "anon";

grant references on table "public"."pharmacy_inventory" to "anon";

grant select on table "public"."pharmacy_inventory" to "anon";

grant trigger on table "public"."pharmacy_inventory" to "anon";

grant truncate on table "public"."pharmacy_inventory" to "anon";

grant update on table "public"."pharmacy_inventory" to "anon";

grant delete on table "public"."pharmacy_inventory" to "authenticated";

grant insert on table "public"."pharmacy_inventory" to "authenticated";

grant references on table "public"."pharmacy_inventory" to "authenticated";

grant select on table "public"."pharmacy_inventory" to "authenticated";

grant trigger on table "public"."pharmacy_inventory" to "authenticated";

grant truncate on table "public"."pharmacy_inventory" to "authenticated";

grant update on table "public"."pharmacy_inventory" to "authenticated";

grant delete on table "public"."pharmacy_inventory" to "service_role";

grant insert on table "public"."pharmacy_inventory" to "service_role";

grant references on table "public"."pharmacy_inventory" to "service_role";

grant select on table "public"."pharmacy_inventory" to "service_role";

grant trigger on table "public"."pharmacy_inventory" to "service_role";

grant truncate on table "public"."pharmacy_inventory" to "service_role";

grant update on table "public"."pharmacy_inventory" to "service_role";

grant delete on table "public"."prescription_items" to "anon";

grant insert on table "public"."prescription_items" to "anon";

grant references on table "public"."prescription_items" to "anon";

grant select on table "public"."prescription_items" to "anon";

grant trigger on table "public"."prescription_items" to "anon";

grant truncate on table "public"."prescription_items" to "anon";

grant update on table "public"."prescription_items" to "anon";

grant delete on table "public"."prescription_items" to "authenticated";

grant insert on table "public"."prescription_items" to "authenticated";

grant references on table "public"."prescription_items" to "authenticated";

grant select on table "public"."prescription_items" to "authenticated";

grant trigger on table "public"."prescription_items" to "authenticated";

grant truncate on table "public"."prescription_items" to "authenticated";

grant update on table "public"."prescription_items" to "authenticated";

grant delete on table "public"."prescription_items" to "service_role";

grant insert on table "public"."prescription_items" to "service_role";

grant references on table "public"."prescription_items" to "service_role";

grant select on table "public"."prescription_items" to "service_role";

grant trigger on table "public"."prescription_items" to "service_role";

grant truncate on table "public"."prescription_items" to "service_role";

grant update on table "public"."prescription_items" to "service_role";

grant delete on table "public"."prescriptions" to "anon";

grant insert on table "public"."prescriptions" to "anon";

grant references on table "public"."prescriptions" to "anon";

grant select on table "public"."prescriptions" to "anon";

grant trigger on table "public"."prescriptions" to "anon";

grant truncate on table "public"."prescriptions" to "anon";

grant update on table "public"."prescriptions" to "anon";

grant delete on table "public"."prescriptions" to "authenticated";

grant insert on table "public"."prescriptions" to "authenticated";

grant references on table "public"."prescriptions" to "authenticated";

grant select on table "public"."prescriptions" to "authenticated";

grant trigger on table "public"."prescriptions" to "authenticated";

grant truncate on table "public"."prescriptions" to "authenticated";

grant update on table "public"."prescriptions" to "authenticated";

grant delete on table "public"."prescriptions" to "service_role";

grant insert on table "public"."prescriptions" to "service_role";

grant references on table "public"."prescriptions" to "service_role";

grant select on table "public"."prescriptions" to "service_role";

grant trigger on table "public"."prescriptions" to "service_role";

grant truncate on table "public"."prescriptions" to "service_role";

grant update on table "public"."prescriptions" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."symptom_checks" to "anon";

grant insert on table "public"."symptom_checks" to "anon";

grant references on table "public"."symptom_checks" to "anon";

grant select on table "public"."symptom_checks" to "anon";

grant trigger on table "public"."symptom_checks" to "anon";

grant truncate on table "public"."symptom_checks" to "anon";

grant update on table "public"."symptom_checks" to "anon";

grant delete on table "public"."symptom_checks" to "authenticated";

grant insert on table "public"."symptom_checks" to "authenticated";

grant references on table "public"."symptom_checks" to "authenticated";

grant select on table "public"."symptom_checks" to "authenticated";

grant trigger on table "public"."symptom_checks" to "authenticated";

grant truncate on table "public"."symptom_checks" to "authenticated";

grant update on table "public"."symptom_checks" to "authenticated";

grant delete on table "public"."symptom_checks" to "service_role";

grant insert on table "public"."symptom_checks" to "service_role";

grant references on table "public"."symptom_checks" to "service_role";

grant select on table "public"."symptom_checks" to "service_role";

grant trigger on table "public"."symptom_checks" to "service_role";

grant truncate on table "public"."symptom_checks" to "service_role";

grant update on table "public"."symptom_checks" to "service_role";

grant delete on table "public"."user_prescriptions" to "anon";

grant insert on table "public"."user_prescriptions" to "anon";

grant references on table "public"."user_prescriptions" to "anon";

grant select on table "public"."user_prescriptions" to "anon";

grant trigger on table "public"."user_prescriptions" to "anon";

grant truncate on table "public"."user_prescriptions" to "anon";

grant update on table "public"."user_prescriptions" to "anon";

grant delete on table "public"."user_prescriptions" to "authenticated";

grant insert on table "public"."user_prescriptions" to "authenticated";

grant references on table "public"."user_prescriptions" to "authenticated";

grant select on table "public"."user_prescriptions" to "authenticated";

grant trigger on table "public"."user_prescriptions" to "authenticated";

grant truncate on table "public"."user_prescriptions" to "authenticated";

grant update on table "public"."user_prescriptions" to "authenticated";

grant delete on table "public"."user_prescriptions" to "service_role";

grant insert on table "public"."user_prescriptions" to "service_role";

grant references on table "public"."user_prescriptions" to "service_role";

grant select on table "public"."user_prescriptions" to "service_role";

grant trigger on table "public"."user_prescriptions" to "service_role";

grant truncate on table "public"."user_prescriptions" to "service_role";

grant update on table "public"."user_prescriptions" to "service_role";

grant delete on table "public"."vlm_scans" to "anon";

grant insert on table "public"."vlm_scans" to "anon";

grant references on table "public"."vlm_scans" to "anon";

grant select on table "public"."vlm_scans" to "anon";

grant trigger on table "public"."vlm_scans" to "anon";

grant truncate on table "public"."vlm_scans" to "anon";

grant update on table "public"."vlm_scans" to "anon";

grant delete on table "public"."vlm_scans" to "authenticated";

grant insert on table "public"."vlm_scans" to "authenticated";

grant references on table "public"."vlm_scans" to "authenticated";

grant select on table "public"."vlm_scans" to "authenticated";

grant trigger on table "public"."vlm_scans" to "authenticated";

grant truncate on table "public"."vlm_scans" to "authenticated";

grant update on table "public"."vlm_scans" to "authenticated";

grant delete on table "public"."vlm_scans" to "service_role";

grant insert on table "public"."vlm_scans" to "service_role";

grant references on table "public"."vlm_scans" to "service_role";

grant select on table "public"."vlm_scans" to "service_role";

grant trigger on table "public"."vlm_scans" to "service_role";

grant truncate on table "public"."vlm_scans" to "service_role";

grant update on table "public"."vlm_scans" to "service_role";


  create policy "Anyone authenticated can create appointment"
  on "public"."appointments"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Doctors can update appointments"
  on "public"."appointments"
  as permissive
  for update
  to public
using ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Doctors can view their appointments"
  on "public"."appointments"
  as permissive
  for select
  to public
using ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Patients can view their appointments"
  on "public"."appointments"
  as permissive
  for select
  to public
using ((patient_id = auth.uid()));



  create policy "auth_logs: own insert"
  on "public"."auth_logs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "auth_logs: own select"
  on "public"."auth_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users insert own messages"
  on "public"."chat_messages"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users see own messages"
  on "public"."chat_messages"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users delete own sessions"
  on "public"."chat_sessions"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users insert own sessions"
  on "public"."chat_sessions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users see own sessions"
  on "public"."chat_sessions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users update own sessions"
  on "public"."chat_sessions"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Participants can send messages"
  on "public"."consultation_messages"
  as permissive
  for insert
  to public
with check ((sender_id = auth.uid()));



  create policy "Participants can view messages"
  on "public"."consultation_messages"
  as permissive
  for select
  to public
using ((consultation_id IN ( SELECT consultations.id
   FROM public.consultations
  WHERE ((consultations.doctor_id IN ( SELECT doctors.id
           FROM public.doctors
          WHERE (doctors.user_id = auth.uid()))) OR (consultations.patient_id = auth.uid())))));



  create policy "Doctors can create consultations"
  on "public"."consultations"
  as permissive
  for insert
  to public
with check ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Doctors can update consultations"
  on "public"."consultations"
  as permissive
  for update
  to public
using ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Doctors can view their consultations"
  on "public"."consultations"
  as permissive
  for select
  to public
using ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Patients can view their consultations"
  on "public"."consultations"
  as permissive
  for select
  to public
using ((patient_id = auth.uid()));



  create policy "Anyone can view doctors"
  on "public"."doctors"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated users can insert doctor"
  on "public"."doctors"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Doctors can update own profile"
  on "public"."doctors"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Doctors can view own profile"
  on "public"."doctors"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Anyone can view medicines"
  on "public"."medicines"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated can insert medicines"
  on "public"."medicines"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Insert order items"
  on "public"."order_items"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "View order items"
  on "public"."order_items"
  as permissive
  for select
  to public
using ((order_id IN ( SELECT orders.id
   FROM public.orders
  WHERE ((orders.pharmacy_id IN ( SELECT pharmacies.id
           FROM public.pharmacies
          WHERE (pharmacies.user_id = auth.uid()))) OR (orders.patient_id = auth.uid())))));



  create policy "Anyone authenticated can create order"
  on "public"."orders"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Patients can view their orders"
  on "public"."orders"
  as permissive
  for select
  to public
using ((patient_id = auth.uid()));



  create policy "Pharmacy can update orders"
  on "public"."orders"
  as permissive
  for update
  to public
using ((pharmacy_id IN ( SELECT pharmacies.id
   FROM public.pharmacies
  WHERE (pharmacies.user_id = auth.uid()))));



  create policy "Pharmacy can view their orders"
  on "public"."orders"
  as permissive
  for select
  to public
using ((pharmacy_id IN ( SELECT pharmacies.id
   FROM public.pharmacies
  WHERE (pharmacies.user_id = auth.uid()))));



  create policy "Anyone can view pharmacies"
  on "public"."pharmacies"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated users can insert pharmacy"
  on "public"."pharmacies"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Pharmacies can update own profile"
  on "public"."pharmacies"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Pharmacies can view own profile"
  on "public"."pharmacies"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Anyone can view inventory"
  on "public"."pharmacy_inventory"
  as permissive
  for select
  to public
using (true);



  create policy "Pharmacy owner can delete inventory"
  on "public"."pharmacy_inventory"
  as permissive
  for delete
  to public
using ((pharmacy_id IN ( SELECT pharmacies.id
   FROM public.pharmacies
  WHERE (pharmacies.user_id = auth.uid()))));



  create policy "Pharmacy owner can insert inventory"
  on "public"."pharmacy_inventory"
  as permissive
  for insert
  to public
with check ((pharmacy_id IN ( SELECT pharmacies.id
   FROM public.pharmacies
  WHERE (pharmacies.user_id = auth.uid()))));



  create policy "Pharmacy owner can update inventory"
  on "public"."pharmacy_inventory"
  as permissive
  for update
  to public
using ((pharmacy_id IN ( SELECT pharmacies.id
   FROM public.pharmacies
  WHERE (pharmacies.user_id = auth.uid()))));



  create policy "Pharmacy owner can view inventory"
  on "public"."pharmacy_inventory"
  as permissive
  for select
  to public
using ((pharmacy_id IN ( SELECT pharmacies.id
   FROM public.pharmacies
  WHERE (pharmacies.user_id = auth.uid()))));



  create policy "Doctors can insert prescription items"
  on "public"."prescription_items"
  as permissive
  for insert
  to public
with check ((prescription_id IN ( SELECT prescriptions.id
   FROM public.prescriptions
  WHERE (prescriptions.doctor_id IN ( SELECT doctors.id
           FROM public.doctors
          WHERE (doctors.user_id = auth.uid()))))));



  create policy "View prescription items"
  on "public"."prescription_items"
  as permissive
  for select
  to public
using ((prescription_id IN ( SELECT prescriptions.id
   FROM public.prescriptions
  WHERE ((prescriptions.doctor_id IN ( SELECT doctors.id
           FROM public.doctors
          WHERE (doctors.user_id = auth.uid()))) OR (prescriptions.patient_id = auth.uid())))));



  create policy "Doctors can create prescriptions"
  on "public"."prescriptions"
  as permissive
  for insert
  to public
with check ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Doctors can update prescriptions"
  on "public"."prescriptions"
  as permissive
  for update
  to public
using ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Doctors can view their prescriptions"
  on "public"."prescriptions"
  as permissive
  for select
  to public
using ((doctor_id IN ( SELECT doctors.id
   FROM public.doctors
  WHERE (doctors.user_id = auth.uid()))));



  create policy "Patients can view their prescriptions"
  on "public"."prescriptions"
  as permissive
  for select
  to public
using ((patient_id = auth.uid()));



  create policy "Pharmacies can update prescriptions"
  on "public"."prescriptions"
  as permissive
  for update
  to public
using ((fulfilled_by IN ( SELECT pharmacies.id
   FROM public.pharmacies
  WHERE (pharmacies.user_id = auth.uid()))));



  create policy "profiles: own insert"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "profiles: own select"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "profiles: own update"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users insert own checks"
  on "public"."symptom_checks"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users see own checks"
  on "public"."symptom_checks"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users delete own prescriptions"
  on "public"."user_prescriptions"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users insert own prescriptions"
  on "public"."user_prescriptions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users see own prescriptions"
  on "public"."user_prescriptions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users update own prescriptions"
  on "public"."user_prescriptions"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users insert own scans"
  on "public"."vlm_scans"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users see own scans"
  on "public"."vlm_scans"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Public read medical images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'medical-images'::text));



  create policy "Public read prescription images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'prescription-images'::text));



  create policy "Users delete own prescription images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'prescription-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users update own prescription images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'prescription-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users upload own images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'medical-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users upload own prescription images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'prescription-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



