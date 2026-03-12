'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import StatsCard from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Package, ShoppingCart, FileText, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface DashStats {
  totalProducts: number;
  pendingOrders: number;
  totalOrders: number;
  lowStockItems: number;
}

interface RecentOrder {
  id: string;
  patient_name: string;
  status: string;
  total_amount: number | null;
  created_at: string;
}

export default function PharmacyDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashStats>({ totalProducts: 0, pendingOrders: 0, totalOrders: 0, lowStockItems: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pharmacyName, setPharmacyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: pharmacy } = await supabase
        .from('pharmacies')
        .select('id, name')
        .eq('user_id', session.user.id)
        .single();

      if (!pharmacy) return;
      setPharmacyName(pharmacy.name);

      // Stats
      const { count: totalProducts } = await supabase
        .from('pharmacy_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacy.id);

      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacy.id)
        .in('status', ['pending', 'confirmed']);

      const { count: totalOrders } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacy.id);

      const { count: lowStockItems } = await supabase
        .from('pharmacy_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacy.id)
        .lt('stock_quantity', 10)
        .eq('is_available', true);

      setStats({
        totalProducts: totalProducts || 0,
        pendingOrders: pendingOrders || 0,
        totalOrders: totalOrders || 0,
        lowStockItems: lowStockItems || 0,
      });

      // Recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, patient_id, status, total_amount, created_at')
        .eq('pharmacy_id', pharmacy.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) {
        const enriched = await Promise.all(
          orders.map(async (o) => {
            const { data: p } = await supabase.from('profiles').select('full_name').eq('id', o.patient_id).single();
            return { ...o, patient_name: p?.full_name || 'Unknown' };
          })
        );
        setRecentOrders(enriched);
      }

      setLoading(false);
    };

    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#6B6BCC] to-[#8B5CF6] rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold">Welcome, {pharmacyName}</h2>
        <p className="text-white/70 text-sm mt-1">Here&apos;s your pharmacy overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Products" value={stats.totalProducts} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatsCard title="Pending Orders" value={stats.pendingOrders} icon={ShoppingCart} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard title="Total Orders" value={stats.totalOrders} icon={FileText} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatsCard title="Low Stock Items" value={stats.lowStockItems} icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/pharmacy/inventory" className="bg-white rounded-2xl border border-[#DDDDE8] p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1A1A1A]">Manage Inventory</p>
            <p className="text-xs text-[#8A8A9A]">Add or update medicines</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A8A9A]" />
        </Link>
        <Link href="/pharmacy/orders" className="bg-white rounded-2xl border border-[#DDDDE8] p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1A1A1A]">View Orders</p>
            <p className="text-xs text-[#8A8A9A]">Process pending orders</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A8A9A]" />
        </Link>
        <Link href="/pharmacy/prescriptions" className="bg-white rounded-2xl border border-[#DDDDE8] p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1A1A1A]">Prescriptions</p>
            <p className="text-xs text-[#8A8A9A]">View received prescriptions</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8A8A9A]" />
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DDDDE8] flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1A1A1A]">Recent Orders</h3>
          <Link href="/pharmacy/orders" className="text-sm text-[#6B6BCC] hover:text-[#5555BB] font-medium">
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8A8A9A]">No orders yet</div>
        ) : (
          <div className="divide-y divide-[#DDDDE8]">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#FAFAFE]">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{order.patient_name}</p>
                  <p className="text-xs text-[#8A8A9A]">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  {order.total_amount && (
                    <span className="text-sm font-medium text-[#1A1A1A]">{formatCurrency(order.total_amount)}</span>
                  )}
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
