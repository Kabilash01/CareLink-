'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import { ArrowLeft, User, Calendar, FileText, Pill, Loader2 } from 'lucide-react';
import { formatDate, formatTime, getInitials } from '@/lib/utils';
import Link from 'next/link';

interface PatientProfile {
  id: string;
  full_name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
}

interface PatientAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  mode: string;
  status: string;
  reason: string | null;
}

interface PatientConsultation {
  id: string;
  symptoms: string | null;
  diagnosis: string | null;
  status: string;
  created_at: string;
}

interface PatientPrescription {
  id: string;
  diagnosis: string | null;
  is_fulfilled: boolean;
  created_at: string;
  items: { medicine_name: string; dosage: string | null; frequency: string | null }[];
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [consultations, setConsultations] = useState<PatientConsultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'appointments' | 'consultations' | 'prescriptions'>('appointments');

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: doc } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!doc) return;

      // Patient profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      setPatient(profile);

      // Appointments
      const { data: appts } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, mode, status, reason')
        .eq('doctor_id', doc.id)
        .eq('patient_id', id)
        .order('appointment_date', { ascending: false });
      setAppointments(appts || []);

      // Consultations
      const { data: consults } = await supabase
        .from('consultations')
        .select('id, symptoms, diagnosis, status, created_at')
        .eq('doctor_id', doc.id)
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      setConsultations(consults || []);

      // Prescriptions
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('id, diagnosis, is_fulfilled, created_at, items:prescription_items(medicine_name, dosage, frequency)')
        .eq('doctor_id', doc.id)
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      setPrescriptions((prescriptionsData || []) as unknown as PatientPrescription[]);

      setLoading(false);
    };

    loadPatient();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center text-[#8A8A9A] py-16">Patient not found</div>;
  }

  const tabs = [
    { key: 'appointments', label: 'Appointments', icon: Calendar, count: appointments.length },
    { key: 'consultations', label: 'Consultations', icon: FileText, count: consultations.length },
    { key: 'prescriptions', label: 'Prescriptions', icon: Pill, count: prescriptions.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/doctor/patients" className="inline-flex items-center gap-2 text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </Link>

      {/* Patient Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F2B866] to-[#C97D3A] flex items-center justify-center text-white text-lg font-bold">
            {getInitials(patient.full_name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">{patient.full_name}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-[#8A8A9A]">
              {patient.age && <span>{patient.age} years</span>}
              {patient.gender && <span>{patient.gender}</span>}
              {patient.blood_group && <span>Blood: {patient.blood_group}</span>}
              {patient.phone && <span>Phone: {patient.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#DDDDE8] w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[#EEEEF9] text-[#6B6BCC]'
                : 'text-[#8A8A9A] hover:text-[#4A4A4A]'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className="text-xs bg-[#F0EFF8] px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {tab === 'appointments' && (
          <div className="divide-y divide-[#DDDDE8]">
            {appointments.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8A8A9A]">No appointments</div>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="px-6 py-4 hover:bg-[#F7F7FC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{formatDate(a.appointment_date)} at {formatTime(a.appointment_time)}</p>
                      <p className="text-xs text-[#8A8A9A]">{a.mode} · {a.reason || 'No reason specified'}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'consultations' && (
          <div className="divide-y divide-[#DDDDE8]">
            {consultations.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8A8A9A]">No consultations</div>
            ) : (
              consultations.map((c) => (
                <Link key={c.id} href={`/doctor/consultations/${c.id}`} className="block px-6 py-4 hover:bg-[#F7F7FC]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{c.diagnosis || 'Pending diagnosis'}</p>
                      <p className="text-xs text-[#8A8A9A]">{c.symptoms || 'No symptoms recorded'} · {formatDate(c.created_at)}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === 'prescriptions' && (
          <div className="divide-y divide-[#DDDDE8]">
            {prescriptions.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8A8A9A]">No prescriptions</div>
            ) : (
              prescriptions.map((p) => (
                <div key={p.id} className="px-6 py-4 hover:bg-[#F7F7FC]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#1A1A1A]">{p.diagnosis || 'No diagnosis'}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.is_fulfilled ? 'completed' : 'pending'} />
                      <span className="text-xs text-[#8A8A9A]">{formatDate(p.created_at)}</span>
                    </div>
                  </div>
                  {p.items?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {p.items.map((item, i) => (
                        <span key={i} className="text-xs bg-[#EEEEF9] text-[#6B6BCC] px-2 py-1 rounded-lg">
                          {item.medicine_name} {item.dosage || ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
