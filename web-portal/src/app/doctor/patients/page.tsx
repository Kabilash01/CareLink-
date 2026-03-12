'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Search, Loader2, Phone, Calendar } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import Link from 'next/link';

interface PatientRecord {
  patient_id: string;
  full_name: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  last_visit: string;
  total_visits: number;
}

export default function PatientsPage() {
  const supabase = createClient();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: doc } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!doc) return;

      // Get unique patients from appointments
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('patient_id, appointment_date, patient:profiles!patient_id(full_name, phone, age, gender, blood_group)')
        .eq('doctor_id', doc.id)
        .order('appointment_date', { ascending: false });

      if (appointmentData) {
        const patientMap = new Map<string, PatientRecord>();
        for (const appt of appointmentData) {
          const patientInfo = appt.patient as unknown as Record<string, unknown>;
          if (!patientMap.has(appt.patient_id)) {
            patientMap.set(appt.patient_id, {
              patient_id: appt.patient_id,
              full_name: (patientInfo?.full_name as string) || 'Unknown',
              phone: (patientInfo?.phone as string) || null,
              age: (patientInfo?.age as number) || null,
              gender: (patientInfo?.gender as string) || null,
              blood_group: (patientInfo?.blood_group as string) || null,
              last_visit: appt.appointment_date,
              total_visits: 1,
            });
          } else {
            const existing = patientMap.get(appt.patient_id)!;
            existing.total_visits += 1;
          }
        }
        setPatients(Array.from(patientMap.values()));
      }
      setLoading(false);
    };

    loadPatients();
  }, [supabase]);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Patients</h2>
          <p className="text-sm text-[#8A8A9A]">{patients.length} patients in your care</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-[#DDDDE8]">
          <Search className="w-4 h-4 text-[#8A8A9A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="bg-transparent text-sm text-[#1A1A1A] outline-none w-48 placeholder:text-[#8A8A9A]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No patients found"
          description="Patients who book appointments with you will appear here."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient) => (
            <Link
              key={patient.patient_id}
              href={`/doctor/patients/${patient.patient_id}`}
              className="bg-white rounded-2xl p-5 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F2B866] to-[#C97D3A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {getInitials(patient.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate">{patient.full_name}</p>
                  <p className="text-xs text-[#8A8A9A]">
                    {patient.age ? `${patient.age}y` : ''} {patient.gender || ''} {patient.blood_group ? `· ${patient.blood_group}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#DDDDE8] flex items-center justify-between text-xs text-[#8A8A9A]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Last: {formatDate(patient.last_visit)}
                </span>
                <span>{patient.total_visits} visit{patient.total_visits !== 1 ? 's' : ''}</span>
              </div>
              {patient.phone && (
                <div className="mt-2 flex items-center gap-1 text-xs text-[#8A8A9A]">
                  <Phone className="w-3 h-3" />
                  {patient.phone}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
