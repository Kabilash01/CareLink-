'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import { ArrowLeft, Loader2, Send, FileText, Plus, Save, Clock } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

interface ConsultationDetail {
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
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export default function ConsultationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
  const [patientName, setPatientName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Prescription
  const [showRx, setShowRx] = useState(false);
  const [rxItems, setRxItems] = useState<{ medicine_name: string; dosage: string; frequency: string; duration: string; quantity: string; instructions: string }[]>([
    { medicine_name: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' },
  ]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data: c } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', id)
        .single();

      if (!c) return;
      setConsultation(c);
      setDiagnosis(c.diagnosis || '');
      setSymptoms(c.symptoms || '');
      setNotes(c.notes || '');
      setFollowUpDate(c.follow_up_date || '');

      // Patient name
      const { data: patient } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', c.patient_id)
        .single();
      setPatientName(patient?.full_name || 'Unknown');

      // Messages
      const { data: msgs } = await supabase
        .from('consultation_messages')
        .select('id, sender_role, message, created_at')
        .eq('consultation_id', id)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);

      setLoading(false);
    };

    load();
  }, [id, supabase]);

  const saveConsultation = async () => {
    if (!consultation) return;
    setSaving(true);

    await supabase.from('consultations').update({
      diagnosis,
      symptoms,
      notes,
      follow_up_date: followUpDate || null,
    }).eq('id', consultation.id);

    setSaving(false);
  };

  const completeConsultation = async () => {
    if (!consultation) return;
    setSaving(true);

    await supabase.from('consultations').update({
      diagnosis,
      symptoms,
      notes,
      follow_up_date: followUpDate || null,
      status: 'completed',
      ended_at: new Date().toISOString(),
    }).eq('id', consultation.id);

    // Update appointment
    if (consultation.appointment_id) {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', consultation.appointment_id);
    }

    setConsultation({ ...consultation, status: 'completed' });
    setSaving(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !consultation) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await supabase.from('consultation_messages').insert({
      consultation_id: consultation.id,
      sender_id: session.user.id,
      sender_role: 'doctor',
      message: newMessage,
    }).select().single();

    if (data) {
      setMessages([...messages, data]);
      setNewMessage('');
    }
  };

  const createPrescription = async () => {
    if (!consultation) return;
    setSaving(true);

    const validItems = rxItems.filter((i) => i.medicine_name.trim());
    if (validItems.length === 0) return;

    const { data: rx } = await supabase.from('prescriptions').insert({
      consultation_id: consultation.id,
      patient_id: consultation.patient_id,
      doctor_id: consultation.doctor_id,
      diagnosis,
      notes: `Prescription for consultation on ${formatDate(consultation.created_at)}`,
    }).select().single();

    if (rx) {
      await supabase.from('prescription_items').insert(
        validItems.map((item) => ({
          prescription_id: rx.id,
          medicine_name: item.medicine_name,
          dosage: item.dosage || null,
          frequency: item.frequency || null,
          duration: item.duration || null,
          quantity: parseInt(item.quantity) || null,
          instructions: item.instructions || null,
        }))
      );
    }

    setShowRx(false);
    setSaving(false);
    alert('Prescription created successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  if (!consultation) {
    return <div className="text-center text-[#8A8A9A] py-16">Consultation not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/doctor/consultations" className="inline-flex items-center gap-2 text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Consultations
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#1A1A1A]">Consultation with {patientName}</h2>
            <StatusBadge status={consultation.status} />
          </div>
          <p className="text-sm text-[#8A8A9A] mt-1">Started {formatDate(consultation.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {consultation.status === 'active' && (
            <>
              <button onClick={saveConsultation} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DDDDE8] rounded-xl text-sm font-medium hover:bg-[#F7F7FC] disabled:opacity-50">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setShowRx(true)} className="flex items-center gap-2 px-4 py-2 bg-[#6B6BCC] text-white rounded-xl text-sm font-medium hover:bg-[#5555BB]">
                <FileText className="w-4 h-4" /> Write Prescription
              </button>
              <button onClick={completeConsultation} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#2E9E6B] text-white rounded-xl text-sm font-medium hover:bg-[#268b5b] disabled:opacity-50">
                Complete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clinical Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <h3 className="text-base font-semibold text-[#1A1A1A] mb-4">Clinical Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Symptoms</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  disabled={consultation.status !== 'active'}
                  placeholder="Patient reported symptoms..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] resize-none disabled:bg-[#F7F7FC]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  disabled={consultation.status !== 'active'}
                  placeholder="Your diagnosis..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] resize-none disabled:bg-[#F7F7FC]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={consultation.status !== 'active'}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] resize-none disabled:bg-[#F7F7FC]"
                />
              </div>
              <div>
                <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  disabled={consultation.status !== 'active'}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] disabled:bg-[#F7F7FC]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-[#DDDDE8]">
            <h3 className="text-base font-semibold text-[#1A1A1A]">Consultation Chat</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-[#8A8A9A] py-8">No messages yet</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === 'doctor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender_role === 'doctor'
                      ? 'bg-[#6B6BCC] text-white rounded-br-md'
                      : 'bg-[#F0EFF8] text-[#1A1A1A] rounded-bl-md'
                  }`}>
                    <p>{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_role === 'doctor' ? 'text-white/60' : 'text-[#8A8A9A]'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {consultation.status === 'active' && (
            <div className="px-4 py-3 border-t border-[#DDDDE8]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-[#6B6BCC] text-white rounded-xl hover:bg-[#5555BB] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prescription Modal */}
      {showRx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRx(false)} />
          <div className="relative bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDDE8]">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Write Prescription</h2>
              <button onClick={() => setShowRx(false)} className="p-1 hover:bg-[#F7F7FC] rounded-lg text-[#8A8A9A]">✕</button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <p className="text-sm text-[#8A8A9A] mb-1">Patient: <span className="text-[#1A1A1A] font-medium">{patientName}</span></p>
                <p className="text-sm text-[#8A8A9A]">Diagnosis: <span className="text-[#1A1A1A] font-medium">{diagnosis || 'Not specified'}</span></p>
              </div>

              {rxItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 p-3 bg-[#F7F7FC] rounded-xl">
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#8A8A9A] uppercase">Medicine</label>
                    <input
                      value={item.medicine_name}
                      onChange={(e) => {
                        const updated = [...rxItems];
                        updated[idx].medicine_name = e.target.value;
                        setRxItems(updated);
                      }}
                      placeholder="Medicine name"
                      className="w-full px-2 py-1.5 rounded-lg border border-[#DDDDE8] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8A8A9A] uppercase">Dosage</label>
                    <input
                      value={item.dosage}
                      onChange={(e) => {
                        const updated = [...rxItems];
                        updated[idx].dosage = e.target.value;
                        setRxItems(updated);
                      }}
                      placeholder="500mg"
                      className="w-full px-2 py-1.5 rounded-lg border border-[#DDDDE8] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8A8A9A] uppercase">Frequency</label>
                    <input
                      value={item.frequency}
                      onChange={(e) => {
                        const updated = [...rxItems];
                        updated[idx].frequency = e.target.value;
                        setRxItems(updated);
                      }}
                      placeholder="1-0-1"
                      className="w-full px-2 py-1.5 rounded-lg border border-[#DDDDE8] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8A8A9A] uppercase">Duration</label>
                    <input
                      value={item.duration}
                      onChange={(e) => {
                        const updated = [...rxItems];
                        updated[idx].duration = e.target.value;
                        setRxItems(updated);
                      }}
                      placeholder="5 days"
                      className="w-full px-2 py-1.5 rounded-lg border border-[#DDDDE8] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8A8A9A] uppercase">Qty</label>
                    <input
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...rxItems];
                        updated[idx].quantity = e.target.value;
                        setRxItems(updated);
                      }}
                      placeholder="10"
                      className="w-full px-2 py-1.5 rounded-lg border border-[#DDDDE8] text-xs"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => setRxItems([...rxItems, { medicine_name: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' }])}
                className="flex items-center gap-1 text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>
            <div className="px-6 py-4 border-t border-[#DDDDE8] flex justify-end gap-3">
              <button onClick={() => setShowRx(false)} className="px-4 py-2 border border-[#DDDDE8] rounded-xl text-sm font-medium hover:bg-[#F7F7FC]">
                Cancel
              </button>
              <button
                onClick={createPrescription}
                disabled={saving || rxItems.every(i => !i.medicine_name.trim())}
                className="px-4 py-2 bg-[#6B6BCC] text-white rounded-xl text-sm font-medium hover:bg-[#5555BB] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Create Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
