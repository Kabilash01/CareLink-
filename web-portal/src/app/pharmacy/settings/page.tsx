'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Save, Loader2 } from 'lucide-react';

interface PharmacyProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_open: boolean;
  opening_time: string | null;
  closing_time: string | null;
}

export default function PharmacySettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('pharmacies').update({
      name: profile.name,
      phone: profile.phone,
      license_number: profile.license_number,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
      is_open: profile.is_open,
      opening_time: profile.opening_time,
      closing_time: profile.closing_time,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    if (error) {
      setMessage('Failed to save. Please try again.');
    } else {
      setMessage('Profile updated successfully!');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#6B6BCC]" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-[#1A1A1A]">Settings</h2>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#DDDDE8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-[#DDDDE8] flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6B6BCC] to-[#8B5CF6] rounded-2xl flex items-center justify-center text-white text-xl font-bold">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">{profile.name}</h3>
            <p className="text-sm text-[#8A8A9A]">{profile.email}</p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Pharmacy Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Phone</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">License Number</label>
            <input
              type="text"
              value={profile.license_number || ''}
              onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
            />
          </div>

          <div>
            <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Address</label>
            <input
              type="text"
              value={profile.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">City</label>
              <input
                type="text"
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">State</label>
              <input
                type="text"
                value={profile.state || ''}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Pincode</label>
              <input
                type="text"
                value={profile.pincode || ''}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Opening Time</label>
              <input
                type="time"
                value={profile.opening_time || ''}
                onChange={(e) => setProfile({ ...profile, opening_time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Closing Time</label>
              <input
                type="time"
                value={profile.closing_time || ''}
                onChange={(e) => setProfile({ ...profile, closing_time: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F7F7FC] rounded-xl">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Pharmacy Open</p>
              <p className="text-xs text-[#8A8A9A]">Toggle open/closed status</p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, is_open: !profile.is_open })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                profile.is_open ? 'bg-[#2E9E6B]' : 'bg-[#DDDDE8]'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                profile.is_open ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#DDDDE8] flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#6B6BCC] text-white rounded-xl text-sm font-medium hover:bg-[#5555BB] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
