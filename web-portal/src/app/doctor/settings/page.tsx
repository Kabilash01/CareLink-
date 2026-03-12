'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Save, Loader2, User } from 'lucide-react';

interface DoctorProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specialty: string;
  license_number: string | null;
  experience_years: number;
  bio: string | null;
  consultation_fee: number;
  is_available: boolean;
}

export default function DoctorSettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('doctors')
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

    const { error } = await supabase.from('doctors').update({
      full_name: profile.full_name,
      phone: profile.phone,
      specialty: profile.specialty,
      license_number: profile.license_number,
      experience_years: profile.experience_years,
      bio: profile.bio,
      consultation_fee: profile.consultation_fee,
      is_available: profile.is_available,
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
        {/* Avatar + Name */}
        <div className="px-6 py-6 border-b border-[#DDDDE8] flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F4A261] to-[#FFC947] rounded-2xl flex items-center justify-center text-white text-xl font-bold">
            {profile.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Dr. {profile.full_name}</h3>
            <p className="text-sm text-[#8A8A9A]">{profile.email}</p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Full Name</label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Specialty</label>
              <input
                type="text"
                value={profile.specialty}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Phone</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
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
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Experience (years)</label>
              <input
                type="number"
                value={profile.experience_years}
                onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Consultation Fee (₹)</label>
              <input
                type="number"
                value={profile.consultation_fee}
                onChange={(e) => setProfile({ ...profile, consultation_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8A8A9A] uppercase font-medium mb-1 block">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              placeholder="Tell patients about yourself..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-sm text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F7F7FC] rounded-xl">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Available for Consultations</p>
              <p className="text-xs text-[#8A8A9A]">Toggle your availability status</p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, is_available: !profile.is_available })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                profile.is_available ? 'bg-[#2E9E6B]' : 'bg-[#DDDDE8]'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                profile.is_available ? 'translate-x-6' : 'translate-x-0.5'
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
