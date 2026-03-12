'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [pharmacy, setPharmacy] = useState<{ id: string; name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase
        .from('pharmacies')
        .select('id, name, email')
        .eq('user_id', session.user.id)
        .single();

      if (!data) {
        router.replace('/login');
        return;
      }

      setPharmacy(data);
      setLoading(false);
    };

    check();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0EFF8]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EFF8]">
      <Sidebar
        role="pharmacy"
        userName={pharmacy?.name || ''}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-64">
        <Header title="Pharmacy Portal" onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
