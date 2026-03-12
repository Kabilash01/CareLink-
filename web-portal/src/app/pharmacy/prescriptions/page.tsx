'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Loader2, FileText, Search, Eye, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PrescriptionRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name: string;
  doctor_name: string;
  diagnosis: string | null;
  is_fulfilled: boolean;
  created_at: string;
}

interface RxItem {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: number | null;
  instructions: string | null;
}

export default function PharmacyPrescriptionsPage() {
  const supabase = createClient();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pharmacyId, setPharmacyId] = useState('');

  // Detail modal
  const [selectedRx, setSelectedRx] = useState<PrescriptionRow | null>(null);
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: pharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      if (!pharmacy) return;
      setPharmacyId(pharmacy.id);

      // Get prescriptions that belong to orders for this pharmacy, or all unfulfilled ones
      const { data: orderRxIds } = await supabase
        .from('orders')
        .select('prescription_id')
        .eq('pharmacy_id', pharmacy.id)
        .not('prescription_id', 'is', null);

      const rxIdsFromOrders = orderRxIds?.map(o => o.prescription_id).filter(Boolean) || [];

      // Also get prescriptions directly fulfilled by this pharmacy
      const { data: fulfilledRxs } = await supabase
        .from('prescriptions')
        .select('id')
        .eq('fulfilled_by', pharmacy.id);

      const fulfilledIds = fulfilledRxs?.map(r => r.id) || [];
      const allIds = [...new Set([...rxIdsFromOrders, ...fulfilledIds])];

      if (allIds.length === 0) {
        // Show recent unfulfilled prescriptions
        const { data: unfulfilled } = await supabase
          .from('prescriptions')
          .select('id, patient_id, doctor_id, diagnosis, is_fulfilled, created_at')
          .eq('is_fulfilled', false)
          .order('created_at', { ascending: false })
          .limit(20);

        if (unfulfilled) {
          const enriched = await enrichPrescriptions(unfulfilled);
          setPrescriptions(enriched);
        }
      } else {
        const { data: rxs } = await supabase
          .from('prescriptions')
          .select('id, patient_id, doctor_id, diagnosis, is_fulfilled, created_at')
          .in('id', allIds)
          .order('created_at', { ascending: false });

        if (rxs) {
          const enriched = await enrichPrescriptions(rxs);
          setPrescriptions(enriched);
        }
      }

      setLoading(false);
    };

    const enrichPrescriptions = async (rxs: { id: string; patient_id: string; doctor_id: string; diagnosis: string | null; is_fulfilled: boolean; created_at: string }[]) => {
      return Promise.all(rxs.map(async (rx) => {
        const { data: patient } = await supabase.from('profiles').select('full_name').eq('id', rx.patient_id).single();
        const { data: doctor } = await supabase.from('doctors').select('full_name').eq('id', rx.doctor_id).single();
        return {
          ...rx,
          patient_name: patient?.full_name || 'Unknown',
          doctor_name: doctor?.full_name || 'Unknown',
        };
      }));
    };

    load();
  }, [supabase]);

  const viewPrescription = async (rx: PrescriptionRow) => {
    setSelectedRx(rx);
    setLoadingItems(true);

    const { data } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('prescription_id', rx.id);
    setRxItems(data || []);
    setLoadingItems(false);
  };

  const fulfillPrescription = async (rxId: string) => {
    await supabase.from('prescriptions').update({
      is_fulfilled: true,
      fulfilled_by: pharmacyId,
      fulfilled_at: new Date().toISOString(),
    }).eq('id', rxId);

    setPrescriptions(prescriptions.map(rx => rx.id === rxId ? { ...rx, is_fulfilled: true } : rx));
    if (selectedRx?.id === rxId) {
      setSelectedRx({ ...selectedRx, is_fulfilled: true });
    }
  };

  const filtered = prescriptions.filter(rx =>
    rx.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    rx.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
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
      <h2 className="text-2xl font-bold text-[#1A1A1A]">Prescriptions</h2>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A9A]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient, doctor, or diagnosis..."
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
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Doctor</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Diagnosis</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rx) => (
                  <tr key={rx.id} className="border-b border-[#DDDDE8] last:border-b-0 hover:bg-[#FAFAFE]">
                    <td className="px-6 py-4 text-[#1A1A1A]">{formatDate(rx.created_at)}</td>
                    <td className="px-6 py-4 text-[#1A1A1A] font-medium">{rx.patient_name}</td>
                    <td className="px-6 py-4 text-[#1A1A1A]">Dr. {rx.doctor_name}</td>
                    <td className="px-6 py-4 text-[#1A1A1A]">{rx.diagnosis || '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rx.is_fulfilled ? 'fulfilled' : 'pending'} />
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => viewPrescription(rx)} className="text-[#6B6BCC] hover:text-[#5555BB]">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      <Modal isOpen={!!selectedRx} onClose={() => setSelectedRx(null)} title="Prescription Details" size="lg">
        {selectedRx && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Patient</p>
                <p className="text-sm text-[#1A1A1A] font-medium">{selectedRx.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Doctor</p>
                <p className="text-sm text-[#1A1A1A] font-medium">Dr. {selectedRx.doctor_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Diagnosis</p>
                <p className="text-sm text-[#1A1A1A]">{selectedRx.diagnosis || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Date</p>
                <p className="text-sm text-[#1A1A1A]">{formatDate(selectedRx.created_at)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Prescribed Medicines</h4>
              {loadingItems ? (
                <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline text-[#6B6BCC]" /></div>
              ) : rxItems.length === 0 ? (
                <p className="text-sm text-[#8A8A9A]">No items</p>
              ) : (
                <div className="space-y-2">
                  {rxItems.map((item, idx) => (
                    <div key={item.id} className="bg-[#F7F7FC] rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{idx + 1}. {item.medicine_name}</p>
                          <div className="flex gap-4 mt-1 text-xs text-[#8A8A9A]">
                            {item.dosage && <span>Dosage: {item.dosage}</span>}
                            {item.frequency && <span>Freq: {item.frequency}</span>}
                            {item.duration && <span>Duration: {item.duration}</span>}
                            {item.quantity && <span>Qty: {item.quantity}</span>}
                          </div>
                          {item.instructions && (
                            <p className="text-xs text-[#8A8A9A] mt-1">Instructions: {item.instructions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!selectedRx.is_fulfilled && (
              <div className="pt-2 border-t border-[#DDDDE8] flex justify-end">
                <button
                  onClick={() => fulfillPrescription(selectedRx.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2E9E6B] text-white rounded-xl text-sm font-medium hover:bg-[#268b5b]"
                >
                  <Check className="w-4 h-4" /> Mark as Fulfilled
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
