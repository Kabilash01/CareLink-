'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Calendar, Filter, ChevronLeft, ChevronRight, Video, Phone, MessageSquare, Loader2 } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface AppointmentRow {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  mode: string;
  status: string;
  reason: string | null;
  notes: string | null;
  patient: { full_name: string; phone: string | null; age: number | null; gender: string | null } | null;
}

export default function AppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppt, setSelectedAppt] = useState<AppointmentRow | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadAppointments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: doc } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!doc) return;

    let query = supabase
      .from('appointments')
      .select('*, patient:profiles!patient_id(full_name, phone, age, gender)')
      .eq('doctor_id', doc.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: true });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setAppointments((data || []) as unknown as AppointmentRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    await supabase.from('appointments').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    await loadAppointments();
    setUpdating(false);
    setSelectedAppt(null);
  };

  const startConsultation = async (appt: AppointmentRow) => {
    setUpdating(true);

    // Update appointment to in_progress
    await supabase.from('appointments').update({ status: 'in_progress' }).eq('id', appt.id);

    // Get doctor id
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: doc } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!doc) return;

    // Create consultation
    await supabase.from('consultations').insert({
      appointment_id: appt.id,
      patient_id: appt.patient_id,
      doctor_id: doc.id,
      status: 'active',
      started_at: new Date().toISOString(),
    });

    await loadAppointments();
    setUpdating(false);
    setSelectedAppt(null);
  };

  const modeIcon = (mode: string) => {
    switch (mode) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Phone className="w-4 h-4" />;
      case 'text': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Appointments</h2>
          <p className="text-sm text-[#8A8A9A]">Manage your patient appointments</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8A8A9A]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-12 h-12" />}
            title="No appointments found"
            description="Appointments booked by patients will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F7F7FC]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8A8A9A] uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8A8A9A] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8A8A9A] uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8A8A9A] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#8A8A9A] uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#8A8A9A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDDE8]">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F7F7FC] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{appt.patient?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-[#8A8A9A]">
                          {appt.patient?.age ? `${appt.patient.age}y` : ''} {appt.patient?.gender || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#1A1A1A]">{formatDate(appt.appointment_date)}</p>
                      <p className="text-xs text-[#8A8A9A]">{formatTime(appt.appointment_time)} · {appt.duration_minutes}min</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[#4A4A4A] capitalize">
                        {modeIcon(appt.mode)} {appt.mode}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#4A4A4A] truncate max-w-[200px]">{appt.reason || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedAppt(appt)}
                        className="text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        title="Appointment Details"
        size="md"
      >
        {selectedAppt && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium">Patient</label>
                <p className="text-sm font-medium text-[#1A1A1A]">{selectedAppt.patient?.full_name}</p>
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium">Phone</label>
                <p className="text-sm text-[#1A1A1A]">{selectedAppt.patient?.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium">Date & Time</label>
                <p className="text-sm text-[#1A1A1A]">{formatDate(selectedAppt.appointment_date)} at {formatTime(selectedAppt.appointment_time)}</p>
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium">Mode</label>
                <p className="text-sm text-[#1A1A1A] capitalize flex items-center gap-1">{modeIcon(selectedAppt.mode)} {selectedAppt.mode}</p>
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium">Status</label>
                <div className="mt-1"><StatusBadge status={selectedAppt.status} /></div>
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium">Duration</label>
                <p className="text-sm text-[#1A1A1A]">{selectedAppt.duration_minutes} minutes</p>
              </div>
            </div>
            {selectedAppt.reason && (
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium">Reason</label>
                <p className="text-sm text-[#1A1A1A] mt-1">{selectedAppt.reason}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-[#DDDDE8]">
              {selectedAppt.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedAppt.id, 'confirmed')}
                    disabled={updating}
                    className="px-4 py-2 bg-[#2E9E6B] text-white rounded-xl text-sm font-medium hover:bg-[#268b5b] transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => updateStatus(selectedAppt.id, 'cancelled')}
                    disabled={updating}
                    className="px-4 py-2 bg-[#D94F4F] text-white rounded-xl text-sm font-medium hover:bg-[#c44444] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
              {selectedAppt.status === 'confirmed' && (
                <button
                  onClick={() => startConsultation(selectedAppt)}
                  disabled={updating}
                  className="px-4 py-2 bg-[#6B6BCC] text-white rounded-xl text-sm font-medium hover:bg-[#5555BB] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : modeIcon(selectedAppt.mode)}
                  Start Consultation
                </button>
              )}
              {selectedAppt.status === 'in_progress' && (
                <button
                  onClick={() => updateStatus(selectedAppt.id, 'completed')}
                  disabled={updating}
                  className="px-4 py-2 bg-[#2E9E6B] text-white rounded-xl text-sm font-medium hover:bg-[#268b5b] transition-colors disabled:opacity-50"
                >
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
