'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Stethoscope, Pill, ArrowRight, Shield, Clock, Users } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (doctor) {
          router.replace('/doctor/dashboard');
          return;
        }

        const { data: pharmacy } = await supabase
          .from('pharmacies')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (pharmacy) {
          router.replace('/pharmacy/dashboard');
          return;
        }
      }
    };
    checkSession();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#F0EFF8] relative overflow-hidden">
      {/* Amber gradient blob */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_top_right,rgba(232,168,87,0.25)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_left,rgba(107,107,204,0.1)_0%,transparent_70%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-6 lg:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F2B866] to-[#C97D3A] flex items-center justify-center shadow-[0_8px_32px_rgba(201,125,58,0.18)]">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#1A1A1A]">CareLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-medium text-[#1C1C1E] border border-[#1C1C1E] rounded-full hover:bg-[#1C1C1E] hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#1C1C1E] rounded-full hover:bg-[#333] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 lg:px-12 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#DDDDE8] mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <span className="w-2 h-2 bg-[#2E9E6B] rounded-full animate-pulse" />
              <span className="text-sm text-[#4A4A4A]">Healthcare Provider Portal</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight mb-6">
              Deliver Care,{' '}
              <span className="bg-gradient-to-r from-[#F2B866] to-[#C97D3A] bg-clip-text text-transparent">
                Seamlessly
              </span>
            </h1>
            <p className="text-lg text-[#4A4A4A] max-w-2xl mx-auto mb-8">
              Manage appointments, consultations, prescriptions, and pharmacy inventory —
              all in one powerful platform designed for rural healthcare providers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=doctor"
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1C1C1E] text-white rounded-full font-medium hover:bg-[#333] transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
              >
                <Stethoscope className="w-5 h-5" />
                Join as Doctor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register?role=pharmacy"
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#1C1C1E] rounded-full font-medium border border-[#1C1C1E] hover:bg-[#F7F7FC] transition-colors"
              >
                <Pill className="w-5 h-5" />
                Join as Pharmacy
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EEEEF9] flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#6B6BCC]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Patient Management</h3>
              <p className="text-sm text-[#4A4A4A]">
                View patient records, manage appointments, and track consultation history with ease.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#C97D3A]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Real-time Consultations</h3>
              <p className="text-sm text-[#4A4A4A]">
                Conduct video, audio, or text-based consultations and issue digital prescriptions.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#2E9E6B]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Pharmacy Inventory</h3>
              <p className="text-sm text-[#4A4A4A]">
                Manage medicine stock, fulfill prescriptions, and process orders from patients.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#DDDDE8] px-6 lg:px-12 py-6">
        <p className="text-center text-sm text-[#8A8A9A]">
          © 2026 CareLink. Empowering rural healthcare through technology.
        </p>
      </footer>
    </div>
  );
}
