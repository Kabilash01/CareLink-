'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Loader2, ShoppingCart, Search, Eye, Package, Truck, CheckCircle, X } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface OrderRow {
  id: string;
  patient_id: string;
  patient_name: string;
  prescription_id: string | null;
  status: string;
  total_amount: number | null;
  payment_status: string;
  delivery_mode: string;
  notes: string | null;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pharmacyId, setPharmacyId] = useState('');

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
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

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, patient_id, prescription_id, status, total_amount, payment_status, delivery_mode, notes, created_at')
        .eq('pharmacy_id', pharmacy.id)
        .order('created_at', { ascending: false });

      if (ordersData) {
        const enriched = await Promise.all(ordersData.map(async (o) => {
          const { data: p } = await supabase.from('profiles').select('full_name').eq('id', o.patient_id).single();
          return { ...o, patient_name: p?.full_name || 'Unknown' };
        }));
        setOrders(enriched);
      }

      setLoading(false);
    };
    load();
  }, [supabase]);

  const viewOrder = async (order: OrderRow) => {
    setSelectedOrder(order);
    setLoadingItems(true);

    const { data: items } = await supabase
      .from('order_items')
      .select('id, medicine_name, quantity, unit_price, total_price')
      .eq('order_id', order.id);

    setOrderItems(items || []);
    setLoadingItems(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const statuses = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  const filtered = orders.filter(o => {
    const matchesSearch = o.patient_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1A1A1A]">Orders</h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A9A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-[#6B6BCC] text-white'
                  : 'bg-white border border-[#DDDDE8] text-[#8A8A9A] hover:bg-[#F7F7FC]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DDDDE8] p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <ShoppingCart className="w-12 h-12 text-[#DDDDE8] mx-auto mb-3" />
          <p className="text-[#8A8A9A] text-sm">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDDDE8] bg-[#F7F7FC]">
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Date</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Patient</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Amount</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Delivery</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Payment</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-[#DDDDE8] last:border-b-0 hover:bg-[#FAFAFE]">
                    <td className="px-6 py-4 text-[#1A1A1A]">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-[#1A1A1A] font-medium">{order.patient_name}</td>
                    <td className="px-6 py-4 text-[#1A1A1A]">{order.total_amount ? formatCurrency(order.total_amount) : '—'}</td>
                    <td className="px-6 py-4 text-[#1A1A1A] capitalize">{order.delivery_mode}</td>
                    <td className="px-6 py-4"><StatusBadge status={order.payment_status} /></td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4">
                      <button onClick={() => viewOrder(order)} className="text-[#6B6BCC] hover:text-[#5555BB]">
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

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Patient</p>
                <p className="text-sm text-[#1A1A1A] font-medium">{selectedOrder.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Order Date</p>
                <p className="text-sm text-[#1A1A1A]">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Delivery Mode</p>
                <p className="text-sm text-[#1A1A1A] capitalize">{selectedOrder.delivery_mode}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium">Status</p>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-xs text-[#8A8A9A] uppercase font-medium mb-1">Notes</p>
                <p className="text-sm text-[#1A1A1A] bg-[#F7F7FC] rounded-xl p-3">{selectedOrder.notes}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Items</h4>
              {loadingItems ? (
                <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin inline text-[#6B6BCC]" /></div>
              ) : orderItems.length === 0 ? (
                <p className="text-sm text-[#8A8A9A]">No items</p>
              ) : (
                <div className="border border-[#DDDDE8] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F7F7FC] border-b border-[#DDDDE8]">
                        <th className="text-left px-4 py-2 text-xs text-[#8A8A9A] uppercase">Medicine</th>
                        <th className="text-left px-4 py-2 text-xs text-[#8A8A9A] uppercase">Qty</th>
                        <th className="text-left px-4 py-2 text-xs text-[#8A8A9A] uppercase">Unit Price</th>
                        <th className="text-left px-4 py-2 text-xs text-[#8A8A9A] uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-b border-[#DDDDE8] last:border-b-0">
                          <td className="px-4 py-2 text-[#1A1A1A] font-medium">{item.medicine_name}</td>
                          <td className="px-4 py-2 text-[#1A1A1A]">{item.quantity}</td>
                          <td className="px-4 py-2 text-[#1A1A1A]">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-[#1A1A1A] font-medium">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedOrder.total_amount && (
                <div className="flex justify-end mt-3">
                  <div className="text-right">
                    <p className="text-xs text-[#8A8A9A]">Total Amount</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#DDDDE8]">
              {selectedOrder.status === 'pending' && (
                <>
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100">
                    <CheckCircle className="w-4 h-4" /> Confirm
                  </button>
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')} className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-medium hover:bg-amber-100">
                  <Package className="w-4 h-4" /> Start Preparing
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'ready')} className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-medium hover:bg-green-100">
                  <Package className="w-4 h-4" /> Mark Ready
                </button>
              )}
              {selectedOrder.status === 'ready' && (
                <button onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')} className="flex items-center gap-1.5 px-4 py-2 bg-[#6B6BCC] text-white rounded-xl text-sm font-medium hover:bg-[#5555BB]">
                  <Truck className="w-4 h-4" /> Mark Delivered
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
