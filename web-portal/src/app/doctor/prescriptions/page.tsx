'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import { Loader2, FileText, Search, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface PrescriptionRow {
  id: string;
  patient_id: string;
  diagnosis: string | null;
  is_fulfilled: boolean;
  created_at: string;
  patient_name?: string;
  item_count?: number;
}

export default function PrescriptionsPage() {
  const supabase = createClient();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!doctor) return;

      const { data: rxs } = await supabase
        .from('prescriptions')
        .select('id, patient_id, diagnosis, is_fulfilled, created_at')
        .eq('doctor_id', doctor.id)
        .order('created_at', { ascending: false });

      if (rxs) {
        const enriched = await Promise.all(rxs.map(async (rx) => {
          const { data: patient } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', rx.patient_id)
            .single();

          const { count } = await supabase
            .from('prescription_items')
            .select('id', { count: 'exact', head: true })
            .eq('prescription_id', rx.id);

          return {
            ...rx,
            patient_name: patient?.full_name || 'Unknown',
            item_count: count || 0,
          };
        }));
        setPrescriptions(enriched);
      }

      setLoading(false);
    };

    load();
  }, [supabase]);

  const filtered = prescriptions.filter((rx) =>
    rx.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    rx.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Prescriptions</h2>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A9A]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient or diagnosis..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DDDDE8] p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <FileText className="w-12 h-12 text-[#DDDDE8] mx-auto mb-3" />
          <p className="text-[#8A8A9A] text-sm">No prescriptions found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDDDE8] bg-[#F7F7FC]">
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Date</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Patient</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Diagnosis</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Medicines</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rx) => (
                  <tr key={rx.id} className="border-b border-[#DDDDE8] last:border-b-0 hover:bg-[#FAFAFE]">
                    <td className="px-6 py-4 text-[#1A1A1A]">{formatDate(rx.created_at)}</td>
                    <td className="px-6 py-4 text-[#1A1A1A] font-medium">{rx.patient_name}</td>
                    <td className="px-6 py-4 text-[#1A1A1A]">{rx.diagnosis || '—'}</td>
                    <td className="px-6 py-4 text-[#8A8A9A]">{rx.item_count} items</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rx.is_fulfilled ? 'fulfilled' : 'pending'} />
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/doctor/prescriptions/${rx.id}`} className="text-[#6B6BCC] hover:text-[#5555BB]">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
