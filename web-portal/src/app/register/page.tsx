'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Stethoscope, Pill, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialRole = searchParams.get('role') === 'pharmacy' ? 'pharmacy' : 'doctor';
  const [role, setRole] = useState<'doctor' | 'pharmacy'>(initialRole);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Doctor fields
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bio, setBio] = useState('');

  // Pharmacy fields
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyLicense, setPharmacyLicense] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState_] = useState('');
  const [pincode, setPincode] = useState('');

  const specialties = [
    'General Medicine', 'Cardiology', 'Dermatology', 'Endocrinology',
    'Gastroenterology', 'Neurology', 'Oncology', 'Ophthalmology',
    'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology',
    'Radiology', 'Surgery', 'Urology', 'Gynecology',
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } },
      });

      if (authError) throw authError;

      if (data.user) {
        if (role === 'doctor') {
          const { error: profileError } = await supabase.from('doctors').insert({
            user_id: data.user.id,
            full_name: doctorName,
            email,
            phone,
            specialty,
            license_number: licenseNumber,
            experience_years: parseInt(experience) || 0,
            consultation_fee: parseFloat(consultationFee) || 0,
            bio,
          });
          if (profileError) throw profileError;
        } else {
          const { error: profileError } = await supabase.from('pharmacies').insert({
            user_id: data.user.id,
            name: pharmacyName,
            email,
            phone: pharmacyPhone,
            license_number: pharmacyLicense,
            address,
            city,
            state: state,
            pincode,
          });
          if (profileError) throw profileError;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push(role === 'doctor' ? '/doctor/dashboard' : '/pharmacy/dashboard');
        }, 1500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F0EFF8] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 border border-[#DDDDE8] shadow-[0_4px_24px_rgba(0,0,0,0.10)] text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-[#2E9E6B] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Registration Successful!</h2>
          <p className="text-[#8A8A9A] text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EFF8] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_left,rgba(107,107,204,0.1)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F2B866] to-[#C97D3A] flex items-center justify-center shadow-[0_8px_32px_rgba(201,125,58,0.18)]">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]">CareLink</span>
          </Link>
          <p className="text-[#8A8A9A] mt-3">Create your provider account</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => { setRole('doctor'); setStep(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              role === 'doctor'
                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]'
                : 'bg-white text-[#4A4A4A] border-[#DDDDE8] hover:border-[#1C1C1E]'
            }`}
          >
            <Stethoscope className="w-4 h-4" /> Doctor
          </button>
          <button
            type="button"
            onClick={() => { setRole('pharmacy'); setStep(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
              role === 'pharmacy'
                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]'
                : 'bg-white text-[#4A4A4A] border-[#DDDDE8] hover:border-[#1C1C1E]'
            }`}
          >
            <Pill className="w-4 h-4" /> Pharmacy
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-8 border border-[#DDDDE8] shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[#6B6BCC]' : 'bg-[#DDDDE8]'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[#6B6BCC]' : 'bg-[#DDDDE8]'}`} />
            </div>

            {step === 1 && (
              <>
                <h3 className="text-base font-semibold text-[#1A1A1A]">Account Details</h3>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A9A]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!email || !password || password.length < 6) {
                      setError('Please fill all fields. Password must be at least 6 characters.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="w-full py-2.5 bg-[#1C1C1E] text-white rounded-full font-medium hover:bg-[#333] transition-colors text-sm"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && role === 'doctor' && (
              <>
                <h3 className="text-base font-semibold text-[#1A1A1A]">Doctor Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                      placeholder="Dr. John Smith"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Specialty</label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm bg-white"
                    >
                      {specialties.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">License No.</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="MED-12345"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Experience (yrs)</label>
                    <input
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="5"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder="500"
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief professional background..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 bg-white text-[#1C1C1E] rounded-full font-medium border border-[#1C1C1E] hover:bg-[#F7F7FC] transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !doctorName}
                    className="flex-1 py-2.5 bg-[#1C1C1E] text-white rounded-full font-medium hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </>
            )}

            {step === 2 && role === 'pharmacy' && (
              <>
                <h3 className="text-base font-semibold text-[#1A1A1A]">Pharmacy Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Pharmacy Name</label>
                    <input
                      type="text"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      required
                      placeholder="City Care Pharmacy"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">License No.</label>
                    <input
                      type="text"
                      value={pharmacyLicense}
                      onChange={(e) => setPharmacyLicense(e.target.value)}
                      placeholder="PH-12345"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={pharmacyPhone}
                      onChange={(e) => setPharmacyPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Chennai"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState_(e.target.value)}
                      placeholder="Tamil Nadu"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="600001"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#DDDDE8] text-[#1A1A1A] placeholder:text-[#8A8A9A] focus:outline-none focus:ring-2 focus:ring-[#6B6BCC] focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 bg-white text-[#1C1C1E] rounded-full font-medium border border-[#1C1C1E] hover:bg-[#F7F7FC] transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !pharmacyName}
                    className="flex-1 py-2.5 bg-[#1C1C1E] text-white rounded-full font-medium hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-[#8A8A9A] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#6B6BCC] hover:text-[#5555BB] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F0EFF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6B6BCC]" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
