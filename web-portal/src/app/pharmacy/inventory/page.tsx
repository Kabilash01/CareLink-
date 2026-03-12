'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Loader2, Package, Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface InventoryItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  stock_quantity: number;
  price: number;
  discount_percent: number;
  expiry_date: string | null;
  batch_number: string | null;
  is_available: boolean;
}

export default function InventoryPage() {
  const supabase = createClient();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pharmacyId, setPharmacyId] = useState('');

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [medicines, setMedicines] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    medicine_id: '',
    medicine_name_new: '',
    stock_quantity: '',
    price: '',
    discount_percent: '0',
    expiry_date: '',
    batch_number: '',
    is_available: true,
  });

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

      // Inventory
      const { data: inv } = await supabase
        .from('pharmacy_inventory')
        .select('id, medicine_id, stock_quantity, price, discount_percent, expiry_date, batch_number, is_available')
        .eq('pharmacy_id', pharmacy.id)
        .order('created_at', { ascending: false });

      if (inv) {
        const enriched = await Promise.all(inv.map(async (i) => {
          const { data: med } = await supabase.from('medicines').select('name').eq('id', i.medicine_id).single();
          return { ...i, medicine_name: med?.name || 'Unknown' };
        }));
        setItems(enriched);
      }

      // Medicines catalog
      const { data: meds } = await supabase.from('medicines').select('id, name').order('name');
      setMedicines(meds || []);

      setLoading(false);
    };
    load();
  }, [supabase]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ medicine_id: '', medicine_name_new: '', stock_quantity: '', price: '', discount_percent: '0', expiry_date: '', batch_number: '', is_available: true });
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setForm({
      medicine_id: item.medicine_id,
      medicine_name_new: '',
      stock_quantity: String(item.stock_quantity),
      price: String(item.price),
      discount_percent: String(item.discount_percent),
      expiry_date: item.expiry_date || '',
      batch_number: item.batch_number || '',
      is_available: item.is_available,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    let medicineId = form.medicine_id;

    // If new medicine name provided, create it
    if (!medicineId && form.medicine_name_new.trim()) {
      const { data: newMed } = await supabase.from('medicines').insert({
        name: form.medicine_name_new.trim(),
      }).select().single();
      if (newMed) {
        medicineId = newMed.id;
        setMedicines([...medicines, { id: newMed.id, name: newMed.name }]);
      }
    }

    if (!medicineId) {
      setSaving(false);
      return;
    }

    const payload = {
      pharmacy_id: pharmacyId,
      medicine_id: medicineId,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      price: parseFloat(form.price) || 0,
      discount_percent: parseFloat(form.discount_percent) || 0,
      expiry_date: form.expiry_date || null,
      batch_number: form.batch_number || null,
      is_available: form.is_available,
      updated_at: new Date().toISOString(),
    };

    if (editItem) {
      await supabase.from('pharmacy_inventory').update(payload).eq('id', editItem.id);
      setItems(items.map(i => i.id === editItem.id ? { ...i, ...payload, medicine_name: editItem.medicine_name } : i));
    } else {
      const { data: newInv } = await supabase.from('pharmacy_inventory').insert(payload).select().single();
      if (newInv) {
        const medName = medicines.find(m => m.id === medicineId)?.name || form.medicine_name_new;
        setItems([{ ...newInv, medicine_name: medName }, ...items]);
      }
    }

    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from inventory?')) return;
    await supabase.from('pharmacy_inventory').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const filtered = items.filter(i => i.medicine_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Inventory</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#6B6BCC] text-white rounded-xl text-sm font-medium hover:bg-[#5555BB]">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A9A]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicines..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#DDDDE8] p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <Package className="w-12 h-12 text-[#DDDDE8] mx-auto mb-3" />
          <p className="text-[#8A8A9A] text-sm">No items in inventory</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDDDE8] bg-[#F7F7FC]">
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Medicine</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Stock</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Price</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Discount</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Expiry</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-xs text-[#8A8A9A] uppercase font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-[#DDDDE8] last:border-b-0 hover:bg-[#FAFAFE]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1A1A1A]">{item.medicine_name}</span>
                        {item.stock_quantity < 10 && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      {item.batch_number && <p className="text-xs text-[#8A8A9A]">Batch: {item.batch_number}</p>}
                    </td>
                    <td className="px-6 py-4 text-[#1A1A1A]">{item.stock_quantity}</td>
                    <td className="px-6 py-4 text-[#1A1A1A]">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-[#1A1A1A]">{item.discount_percent}%</td>
                    <td className="px-6 py-4 text-[#1A1A1A]">{item.expiry_date || '—'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.is_available ? 'available' : 'unavailable'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-[#F7F7FC] rounded-lg text-[#6B6BCC]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Inventory Item' : 'Add Medicine to Inventory'} size="lg">
        <div className="space-y-4 p-6">
          {!editItem && (
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Select Medicine</label>
              <select
                value={form.medicine_id}
                onChange={(e) => setForm({ ...form, medicine_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] bg-white"
              >
                <option value="">— Select or add new below —</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          {!editItem && (
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Or Add New Medicine Name</label>
              <input
                type="text"
                value={form.medicine_name_new}
                onChange={(e) => setForm({ ...form, medicine_name_new: e.target.value })}
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Stock Quantity</label>
              <input
                type="number"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Discount %</label>
              <input
                type="number"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Batch Number</label>
              <input
                type="text"
                value={form.batch_number}
                onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Expiry Date</label>
            <input
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm({ ...form, is_available: !form.is_available })}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.is_available ? 'bg-[#2E9E6B]' : 'bg-[#DDDDE8]'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-[#1A1A1A]">Available</span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#DDDDE8] flex justify-end gap-3">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#DDDDE8] rounded-xl text-sm font-medium hover:bg-[#F7F7FC]">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-[#6B6BCC] text-white rounded-xl text-sm font-medium hover:bg-[#5555BB] disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editItem ? 'Update' : 'Add to Inventory'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
