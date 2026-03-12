'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { FileText, Loader2, Search, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface ConsultationRow {
  id: string;
  symptoms: string | null;
  diagnosis: string | null;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  follow_up_date: string | null;
  patient: { full_name: string; age: number | null; gender: string | null } | null;
  appointment: { mode: string; appointment_date: string } | null;
}

export default function ConsultationsPage() {
  const supabase = createClient();
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadConsultations = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: doc } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!doc) return;

      let query = supabase
        .from('consultations')
        .select('*, patient:profiles!patient_id(full_name, age, gender), appointment:appointments!appointment_id(mode, appointment_date)')
        .eq('doctor_id', doc.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;
      setConsultations((data || []) as unknown as ConsultationRow[]);
      setLoading(false);
    };

    loadConsultations();
  }, [supabase, statusFilter]);

  const filtered = consultations.filter((c) =>
    (c.patient?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.diagnosis || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Consultations</h2>
          <p className="text-sm text-[#8A8A9A]">View and manage all consultations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#DDDDE8]">
            <Search className="w-4 h-4 text-[#8A8A9A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-sm outline-none w-36 placeholder:text-[#8A8A9A]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#DDDDE8] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No consultations found"
            description="Consultations will appear here once you start seeing patients."
          />
        ) : (
          <div className="divide-y divide-[#DDDDE8]">
            {filtered.map((c) => (
              <Link
                key={c.id}
                href={`/doctor/consultations/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F7FC] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-[#1A1A1A]">{c.patient?.full_name || 'Unknown'}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-[#8A8A9A] mt-1">
                    {c.diagnosis || 'No diagnosis yet'} · {c.symptoms ? `Symptoms: ${c.symptoms.slice(0, 50)}...` : 'No symptoms'}
                  </p>
                  <p className="text-xs text-[#8A8A9A] mt-0.5">
                    {formatDate(c.created_at)} · {c.appointment?.mode || 'N/A'}
                  </p>
                </div>
                {c.follow_up_date && (
                  <span className="text-xs text-[#6B6BCC] bg-[#EEEEF9] px-2 py-1 rounded-lg ml-4">
                    Follow-up: {formatDate(c.follow_up_date)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
