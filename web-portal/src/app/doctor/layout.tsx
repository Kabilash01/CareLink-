'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';
import type { Doctor } from '@/types';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!doctorData) {
        router.replace('/login');
        return;
      }

      setDoctor(doctorData);
      setLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EFF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EFF8]">
      <Sidebar
        role="doctor"
        userName={doctor?.full_name || 'Doctor'}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <Header
          title="Doctor Portal"
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
