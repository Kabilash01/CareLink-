'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import { ArrowLeft, Loader2, FileText, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface PrescriptionDetail {
  id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string | null;
  notes: string | null;
  is_fulfilled: boolean;
  created_at: string;
}

interface PrescriptionItemRow {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: number | null;
  instructions: string | null;
}

export default function PrescriptionDetailPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [rx, setRx] = useState<PrescriptionDetail | null>(null);
  const [items, setItems] = useState<PrescriptionItemRow[]>([]);
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data: rxData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', id)
        .single();
      if (!rxData) return;
      setRx(rxData);

      const { data: itemsData } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', id);
      setItems(itemsData || []);

      const { data: patient } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', rxData.patient_id)
        .single();
      setPatientName(patient?.full_name || 'Unknown');

      const { data: doctor } = await supabase
        .from('doctors')
        .select('full_name, specialty, license_number')
        .eq('id', rxData.doctor_id)
        .single();
      setDoctorName(doctor?.full_name || 'Unknown');

      setLoading(false);
    };

    load();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  if (!rx) {
    return <div className="text-center text-[#8A8A9A] py-16">Prescription not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/doctor/prescriptions" className="inline-flex items-center gap-2 text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Prescriptions
      </Link>

      <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden print:shadow-none">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#DDDDE8] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#6B6BCC] rounded-xl flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Prescription</h2>
              <p className="text-xs text-[#8A8A9A]">Issued on {formatDate(rx.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={rx.is_fulfilled ? 'fulfilled' : 'pending'} />
            <button
              onClick={() => window.print()}
              className="print:hidden flex items-center gap-2 px-3 py-2 border border-[#DDDDE8] rounded-xl text-sm text-[#8A8A9A] hover:bg-[#F7F7FC]"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="px-8 py-4 grid grid-cols-2 gap-4 border-b border-[#DDDDE8] bg-[#FAFAFE]">
          <div>
            <p className="text-xs text-[#8A8A9A] uppercase font-medium">Patient</p>
            <p className="text-sm text-[#1A1A1A] font-medium">{patientName}</p>
          </div>
          <div>
            <p className="text-xs text-[#8A8A9A] uppercase font-medium">Doctor</p>
            <p className="text-sm text-[#1A1A1A] font-medium">Dr. {doctorName}</p>
          </div>
          <div>
            <p className="text-xs text-[#8A8A9A] uppercase font-medium">Diagnosis</p>
            <p className="text-sm text-[#1A1A1A]">{rx.diagnosis || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[#8A8A9A] uppercase font-medium">Notes</p>
            <p className="text-sm text-[#1A1A1A]">{rx.notes || '—'}</p>
          </div>
        </div>

        {/* Items */}
        <div className="px-8 py-6">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 uppercase tracking-wider">Prescribed Medicines</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DDDDE8]">
                <th className="text-left pb-2 text-xs text-[#8A8A9A] uppercase font-medium">#</th>
                <th className="text-left pb-2 text-xs text-[#8A8A9A] uppercase font-medium">Medicine</th>
                <th className="text-left pb-2 text-xs text-[#8A8A9A] uppercase font-medium">Dosage</th>
                <th className="text-left pb-2 text-xs text-[#8A8A9A] uppercase font-medium">Frequency</th>
                <th className="text-left pb-2 text-xs text-[#8A8A9A] uppercase font-medium">Duration</th>
                <th className="text-left pb-2 text-xs text-[#8A8A9A] uppercase font-medium">Qty</th>
                <th className="text-left pb-2 text-xs text-[#8A8A9A] uppercase font-medium">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-[#DDDDE8] last:border-b-0">
                  <td className="py-3 text-[#8A8A9A]">{idx + 1}</td>
                  <td className="py-3 text-[#1A1A1A] font-medium">{item.medicine_name}</td>
                  <td className="py-3 text-[#1A1A1A]">{item.dosage || '—'}</td>
                  <td className="py-3 text-[#1A1A1A]">{item.frequency || '—'}</td>
                  <td className="py-3 text-[#1A1A1A]">{item.duration || '—'}</td>
                  <td className="py-3 text-[#1A1A1A]">{item.quantity || '—'}</td>
                  <td className="py-3 text-[#8A8A9A]">{item.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
