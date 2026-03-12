'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import StatsCard from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Calendar, Users, FileText, TrendingUp, Clock, Stethoscope } from 'lucide-react';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import type { Doctor, Appointment } from '@/types';
import Link from 'next/link';

export default function DoctorDashboard() {
  const supabase = createClient();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayCount: 0,
    completedConsults: 0,
    pendingAppts: 0,
    monthRevenue: 0,
  });
  const [recentConsultations, setRecentConsultations] = useState<Array<{
    id: string;
    patient_name: string;
    diagnosis: string | null;
    status: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get doctor profile
      const { data: doc } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!doc) return;
      setDoctor(doc);

      const today = new Date().toISOString().split('T')[0];

      // Today's appointments
      const { data: appts } = await supabase
        .from('appointments')
        .select('*, patient:profiles!patient_id(full_name, phone, age, gender)')
        .eq('doctor_id', doc.id)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      setTodayAppointments((appts || []) as unknown as Appointment[]);

      // Stats
      const { count: totalPatients } = await supabase
        .from('appointments')
        .select('patient_id', { count: 'exact', head: true })
        .eq('doctor_id', doc.id);

      const { count: pendingAppts } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doc.id)
        .in('status', ['pending', 'confirmed']);

      const { count: completedConsults } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doc.id)
        .eq('status', 'completed');

      setStats({
        totalPatients: totalPatients || 0,
        todayCount: appts?.length || 0,
        completedConsults: completedConsults || 0,
        pendingAppts: pendingAppts || 0,
        monthRevenue: (completedConsults || 0) * (doc.consultation_fee || 0),
      });

      // Recent consultations
      const { data: consults } = await supabase
        .from('consultations')
        .select('id, diagnosis, status, created_at, patient:profiles!patient_id(full_name)')
        .eq('doctor_id', doc.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentConsultations(
        (consults || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          patient_name: (c.patient as Record<string, unknown>)?.full_name as string || 'Unknown',
          diagnosis: c.diagnosis as string | null,
          status: c.status as string,
          created_at: c.created_at as string,
        }))
      );
    };

    loadDashboard();
  }, [supabase]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#F2B866] to-[#C97D3A] rounded-2xl p-6 text-white shadow-[0_8px_32px_rgba(201,125,58,0.18)]">
        <h2 className="text-2xl font-bold">Welcome back, {doctor?.full_name?.split(' ')[0] || 'Doctor'}!</h2>
        <p className="text-white/80 mt-1">You have {stats.todayCount} appointment{stats.todayCount !== 1 ? 's' : ''} today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today&apos;s Appointments"
          value={stats.todayCount}
          icon={Calendar}
          iconBg="bg-[#EEEEF9]"
          iconColor="text-[#6B6BCC]"
        />
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          iconBg="bg-amber-50"
          iconColor="text-[#C97D3A]"
        />
        <StatsCard
          title="Completed Consults"
          value={stats.completedConsults}
          icon={Stethoscope}
          iconBg="bg-green-50"
          iconColor="text-[#2E9E6B]"
        />
        <StatsCard
          title="Est. Revenue"
          value={formatCurrency(stats.monthRevenue)}
          icon={TrendingUp}
          iconBg="bg-[#EEEEF9]"
          iconColor="text-[#6B6BCC]"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDDE8]">
            <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6B6BCC]" />
              Today&apos;s Schedule
            </h3>
            <Link href="/doctor/appointments" className="text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-[#DDDDE8]">
            {todayAppointments.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#8A8A9A]">
                No appointments scheduled for today
              </div>
            ) : (
              todayAppointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="px-6 py-3 hover:bg-[#F7F7FC] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {(appt.patient as unknown as Record<string, string>)?.full_name || 'Patient'}
                      </p>
                      <p className="text-xs text-[#8A8A9A]">
                        {formatTime(appt.appointment_time)} · {appt.mode} · {appt.duration_minutes}min
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Consultations */}
        <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDDE8]">
            <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6B6BCC]" />
              Recent Consultations
            </h3>
            <Link href="/doctor/consultations" className="text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-[#DDDDE8]">
            {recentConsultations.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#8A8A9A]">
                No consultations yet
              </div>
            ) : (
              recentConsultations.map((c) => (
                <Link key={c.id} href={`/doctor/consultations/${c.id}`} className="block px-6 py-3 hover:bg-[#F7F7FC] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{c.patient_name}</p>
                      <p className="text-xs text-[#8A8A9A]">
                        {c.diagnosis || 'No diagnosis'} · {formatDate(c.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <h3 className="text-base font-semibold text-[#1A1A1A] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/doctor/appointments" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F0EFF8] hover:bg-[#E8E8F5] transition-colors">
            <Calendar className="w-6 h-6 text-[#6B6BCC]" />
            <span className="text-xs font-medium text-[#4A4A4A]">View Appointments</span>
          </Link>
          <Link href="/doctor/patients" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F0EFF8] hover:bg-[#E8E8F5] transition-colors">
            <Users className="w-6 h-6 text-[#6B6BCC]" />
            <span className="text-xs font-medium text-[#4A4A4A]">Patient Records</span>
          </Link>
          <Link href="/doctor/prescriptions" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F0EFF8] hover:bg-[#E8E8F5] transition-colors">
            <FileText className="w-6 h-6 text-[#6B6BCC]" />
            <span className="text-xs font-medium text-[#4A4A4A]">Prescriptions</span>
          </Link>
          <Link href="/doctor/settings" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F0EFF8] hover:bg-[#E8E8F5] transition-colors">
            <Stethoscope className="w-6 h-6 text-[#6B6BCC]" />
            <span className="text-xs font-medium text-[#4A4A4A]">My Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
