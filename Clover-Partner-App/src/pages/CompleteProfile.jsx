import { useEffect, useMemo, useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Building2,
  Car,
  FileCheck,
  Home,
  LogOut,
  Save,
  AlertCircle,
  CheckCircle,
  Wallet,
  ShieldCheck,
  Headphones,
  Sparkles,
  BadgeIndianRupee,
  Clock3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CloverShellHeader } from '../components/CloverShellHeader';
import { authService } from '../services/authService';

const sectionFields = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'city',
  'state',
  'zipCode',
  'address',
  'accountHolderName',
  'accountNumber',
  'ifscCode',
  'bankName',
  'vehicleType',
  'vehicleNumber',
  'vehicleModel',
  'panNumber',
  'drivingLicenseNumber',
  'aadharNumber',
  'emergencyContactName',
  'emergencyContactPhone'
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toComparable = (data) => ({
    ...data,
    availabilityRadiusKm: Number(data?.availabilityRadiusKm || 0),
    preferredAreas: String(data?.preferredAreas || ''),
    languages: String(data?.languages || ''),
    isOnDuty: Boolean(data?.isOnDuty),
    isKycVerified: Boolean(data?.isKycVerified)
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const currentTask = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('currentDeliveryTask') || 'null');
    } catch {
      return null;
    }
  }, []);

  const completion = useMemo(() => {
    if (!form) return 0;
    const filled = sectionFields.filter((k) => String(form[k] || '').trim().length > 0).length;
    return Math.round((filled / sectionFields.length) * 100);
  }, [form]);

  const initials = useMemo(() => {
    if (!form) return 'DP';
    const fn = (form.firstName || 'D')[0] || 'D';
    const ln = (form.lastName || 'P')[0] || 'P';
    return `${fn}${ln}`.toUpperCase();
  }, [form]);

  const isDirty = useMemo(() => {
    if (!form || !profile) return false;
    return JSON.stringify(toComparable(form)) !== JSON.stringify(toComparable(profile));
  }, [form, profile]);

  const sectionCompletion = useMemo(() => {
    if (!form) {
      return {
        personal: 0,
        address: 0,
        payout: 0,
        docs: 0,
        safety: 0
      };
    }

    const ratio = (keys) => {
      const filled = keys.filter((k) => String(form[k] || '').trim().length > 0).length;
      return Math.round((filled / keys.length) * 100);
    };

    return {
      personal: ratio(['firstName', 'lastName', 'phone', 'email', 'dateOfBirth', 'gender']),
      address: ratio(['address', 'city', 'state', 'zipCode']),
      payout: ratio(['accountHolderName', 'bankName', 'accountNumber', 'ifscCode', 'upiId']),
      docs: ratio(['vehicleType', 'vehicleNumber', 'vehicleModel', 'panNumber', 'drivingLicenseNumber', 'aadharNumber']),
      safety: ratio(['preferredShift', 'availabilityRadiusKm', 'preferredAreas', 'languages', 'emergencyContactName', 'emergencyContactPhone'])
    };
  }, [form]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const partnerId = localStorage.getItem('partnerId');
      if (!partnerId) {
        navigate('/login', { replace: true });
        return;
      }

      const data = await authService.getProfile(partnerId);
      const normalized = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        dateOfBirth: data.dateOfBirth || '',
        gender: data.gender || 'male',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        accountHolderName: data.accountHolderName || '',
        accountNumber: data.accountNumber || '',
        ifscCode: data.ifscCode || '',
        bankName: data.bankName || '',
        upiId: data.upiId || '',
        vehicleType: data.vehicleType || 'motorcycle',
        vehicleNumber: data.vehicleNumber || '',
        vehicleModel: data.vehicleModel || '',
        panNumber: data.panNumber || '',
        drivingLicenseNumber: data.drivingLicenseNumber || '',
        aadharNumber: data.aadharNumber || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        preferredShift: data.preferredShift || 'flexible',
        availabilityRadiusKm: data.availabilityRadiusKm || 5,
        preferredAreas: Array.isArray(data.preferredAreas) ? data.preferredAreas.join(', ') : '',
        languages: Array.isArray(data.languages) ? data.languages.join(', ') : 'Hindi, English',
        isOnDuty: !!data.isOnDuty,
        isKycVerified: !!data.isKycVerified,
        totalDeliveries: data.totalDeliveries || 0,
        rating: data.rating || 4.8
      };

      setProfile(normalized);
      setForm(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const partnerId = localStorage.getItem('partnerId');
      const payload = {
        ...form,
        preferredAreas: form.preferredAreas
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        languages: form.languages
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      };

      const updated = await authService.updateProfile(partnerId, payload);
      setProfile((prev) => ({ ...prev, ...updated }));
      setForm((prev) => ({ ...prev, ...updated }));
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!profile) return;
    setForm(profile);
    setError('');
    setSuccess('Changes discarded');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      authService.logout();
      navigate('/login', { replace: true });
    }
  };

  if (loading || !form) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.10),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] flex items-center justify-center px-4">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 px-8 py-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
            <User size={28} />
          </div>
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,#f8fbf8_0%,#eef7f2_55%,#f8fafc_100%)] pb-24">
      <div className="w-full space-y-5">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <CloverShellHeader
            title={`${form.firstName || 'Delivery'} ${form.lastName || 'Partner'}`}
            subtitle="A professional control center for identity, payouts, KYC, and safety readiness."
            badge={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{form.isKycVerified ? 'KYC verified' : 'KYC pending'}</span>}
            actions={[
              { label: form.isOnDuty ? 'On duty' : 'Go on duty', onClick: () => update('isOnDuty', !form.isOnDuty), tone: form.isOnDuty ? 'brand' : 'secondary', icon: <Sparkles size={14} />, chevron: false },
              { label: 'Payout section', onClick: () => scrollToSection('section-bank'), tone: 'secondary', icon: <Home size={14} />, chevron: false },
              { label: 'Dashboard', onClick: () => navigate('/dashboard'), tone: 'secondary', icon: <Home size={14} />, chevron: false }
            ]}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="page-card p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
              <span className="font-bold uppercase tracking-wider">Profile completion</span>
              <span className="font-black text-slate-950 text-lg">{completion}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_20px_rgba(16,185,129,0.22)]" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={BadgeIndianRupee} label="Avg daily" value={`₹${Math.round((profile.averageWeeklyEarnings || 3500) / 7)}`} />
            <Stat icon={ShieldCheck} label="KYC" value={form.isKycVerified ? 'Verified' : 'Pending'} />
            <Stat icon={Sparkles} label="Rating" value={`${Number(form.rating || 4.8).toFixed(1)} ⭐`} />
            <Stat icon={Clock3} label="Deliveries" value={String(form.totalDeliveries || 0)} />
          </div>
        </div>

        {currentTask && (
          <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
            <div className="page-card border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-title">Current delivery</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">{currentTask.restaurant}</h3>
                  <p className="mt-1 text-sm text-slate-600">{currentTask.routeSummary}</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                  ₹{currentTask.projectedEarning} projected
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniTaskStat label="Accepted" value={new Date(currentTask.acceptedAt).toLocaleTimeString()} />
                <MiniTaskStat label="Customer" value={currentTask.customerName} />
                <MiniTaskStat label="Path" value={currentTask.pathPoints?.length ? `${currentTask.pathPoints.length} stops` : 'Ready'} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
            <div className="flex gap-2 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
            <div className="flex gap-2 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <CheckCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {isDirty && (
          <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="text-sm font-semibold">You have unsaved profile changes</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscard}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-amber-900"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save now'}
                </button>
              </div>
            </div>
          </div>
        )}

          <div className="mx-auto max-w-7xl p-4 sm:px-6 sm:py-6">
            <div className="mb-5 rounded-[1.5rem] border border-slate-200 bg-white/90 p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <NavPill onClick={() => scrollToSection('section-personal')} label="Personal" progress={sectionCompletion.personal} />
                <NavPill onClick={() => scrollToSection('section-address')} label="Address" progress={sectionCompletion.address} />
                <NavPill onClick={() => scrollToSection('section-bank')} label="Payout" progress={sectionCompletion.payout} />
                <NavPill onClick={() => scrollToSection('section-docs')} label="Vehicle & KYC" progress={sectionCompletion.docs} />
                <NavPill onClick={() => scrollToSection('section-safety')} label="Safety" progress={sectionCompletion.safety} />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <QuickAction icon={Wallet} title="Payout Settings" desc="Bank + UPI details" />
                  <QuickAction icon={ShieldCheck} title="KYC Documents" desc="PAN, Aadhaar, DL" />
                  <QuickAction icon={Sparkles} title="Incentives" desc="Boost and bonuses" />
                  <QuickAction icon={Headphones} title="Support" desc="Chat and help center" />
                </div>

                <Section id="section-personal" title="Personal Details" subtitle="Identity and contact information used across deliveries" icon={User}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="First Name" value={form.firstName} onChange={(v) => update('firstName', v)} />
                    <Input label="Last Name" value={form.lastName} onChange={(v) => update('lastName', v)} />
                    <Input label="Phone" value={form.phone} onChange={(v) => update('phone', v.replace(/\D/g, '').slice(0, 10))} />
                    <Input label="Email" value={form.email} onChange={(v) => update('email', v)} />
                    <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} />
                    <Select
                      label="Gender"
                      value={form.gender}
                      onChange={(v) => update('gender', v)}
                      options={[
                        ['male', 'Male'],
                        ['female', 'Female'],
                        ['other', 'Other']
                      ]}
                    />
                  </div>
                </Section>

                <Section id="section-address" title="Address Details" subtitle="Your home and city details for routing and compliance" icon={MapPin}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Address" value={form.address} onChange={(v) => update('address', v)} className="md:col-span-2" />
                    <Input label="City" value={form.city} onChange={(v) => update('city', v)} />
                    <Input label="State" value={form.state} onChange={(v) => update('state', v)} />
                    <Input label="Zip Code" value={form.zipCode} onChange={(v) => update('zipCode', v.replace(/\D/g, '').slice(0, 6))} />
                  </div>
                </Section>

                <Section id="section-bank" title="Payout & Bank" subtitle="Settlement details used for weekly partner payouts" icon={Building2}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input label="Account Holder Name" value={form.accountHolderName} onChange={(v) => update('accountHolderName', v)} />
                    <Input label="Bank Name" value={form.bankName} onChange={(v) => update('bankName', v)} />
                    <Input label="Account Number" value={form.accountNumber} onChange={(v) => update('accountNumber', v.replace(/\D/g, '').slice(0, 18))} />
                    <Input label="IFSC Code" value={form.ifscCode} onChange={(v) => update('ifscCode', v.toUpperCase())} />
                    <Input label="UPI ID" value={form.upiId} onChange={(v) => update('upiId', v)} />
                  </div>
                </Section>

                <Section id="section-docs" title="Vehicle & Documents" subtitle="Delivery asset and KYC documents verification" icon={Car}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select
                      label="Vehicle Type"
                      value={form.vehicleType}
                      onChange={(v) => update('vehicleType', v)}
                      options={[
                        ['motorcycle', 'Motorcycle'],
                        ['scooter', 'Scooter'],
                        ['bicycle', 'Bicycle'],
                        ['car', 'Car']
                      ]}
                    />
                    <Input label="Vehicle Number" value={form.vehicleNumber} onChange={(v) => update('vehicleNumber', v.toUpperCase())} />
                    <Input label="Vehicle Model" value={form.vehicleModel} onChange={(v) => update('vehicleModel', v)} />
                    <Input label="PAN Number" value={form.panNumber} onChange={(v) => update('panNumber', v.toUpperCase())} />
                    <Input label="Driving License Number" value={form.drivingLicenseNumber} onChange={(v) => update('drivingLicenseNumber', v.toUpperCase())} />
                    <Input label="Aadhaar Number" value={form.aadharNumber} onChange={(v) => update('aadharNumber', v.replace(/\D/g, '').slice(0, 12))} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <FileCheck size={16} className={form.isKycVerified ? 'text-emerald-600' : 'text-amber-600'} />
                    <span className={form.isKycVerified ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {form.isKycVerified ? 'KYC verified' : 'KYC pending - add PAN, Aadhaar and DL'}
                    </span>
                  </div>
                </Section>

                <Section id="section-safety" title="Preferences & Safety" subtitle="Shift preferences and emergency contacts for safer operations" icon={ShieldCheck}>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Select
                      label="Preferred Shift"
                      value={form.preferredShift}
                      onChange={(v) => update('preferredShift', v)}
                      options={[
                        ['morning', 'Morning'],
                        ['afternoon', 'Afternoon'],
                        ['evening', 'Evening'],
                        ['night', 'Night'],
                        ['flexible', 'Flexible']
                      ]}
                    />
                    <Input
                      label="Availability Radius (KM)"
                      type="number"
                      value={String(form.availabilityRadiusKm || 5)}
                      onChange={(v) => update('availabilityRadiusKm', Number(v) || 5)}
                    />
                    <Input label="Preferred Areas (comma separated)" value={form.preferredAreas} onChange={(v) => update('preferredAreas', v)} className="md:col-span-2" />
                    <Input label="Languages (comma separated)" value={form.languages} onChange={(v) => update('languages', v)} className="md:col-span-2" />
                    <Input label="Emergency Contact Name" value={form.emergencyContactName} onChange={(v) => update('emergencyContactName', v)} />
                    <Input label="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(v) => update('emergencyContactPhone', v.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                </Section>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-[1.25rem] bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 py-3.5 font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {saving ? 'Saving Profile...' : 'Save Detailed Profile'}
                  </button>
                </div>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-6 self-start">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Command center</p>
                  <h3 className="text-xl font-black text-slate-950 mt-2">Profile actions</h3>
                  <p className="text-sm text-slate-600 mt-2 font-medium">Save updates and keep your partner account ready for priority deliveries.</p>

                  <div className="mt-4 space-y-2">
                    <ProgressItem label="Profile completion" value={`${completion}%`} tone={completion >= 80 ? 'green' : 'blue'} />
                    <ProgressItem label="KYC status" value={form.isKycVerified ? 'Verified' : 'Pending'} tone={form.isKycVerified ? 'green' : 'amber'} />
                    <ProgressItem label="Duty mode" value={form.isOnDuty ? 'On duty' : 'Off duty'} tone={form.isOnDuty ? 'green' : 'slate'} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full rounded-[1.25rem] bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 py-3.5 font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      {saving ? 'Saving Profile...' : 'Save Detailed Profile'}
                    </button>
                    <button
                      onClick={handleDiscard}
                      disabled={!isDirty || saving}
                      className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 py-3.5 font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Discard Changes
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-bold text-slate-900">Pro tip</p>
                  <p className="text-sm text-slate-700 mt-2 font-medium">Complete PAN, Aadhaar, and bank details to reduce payout delays and unlock higher priority routing.</p>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-700">Readiness check</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-800 font-medium">
                    <p className="flex items-center justify-between"><span>Personal details</span><span className="font-bold text-slate-900">{form.firstName && form.phone ? 'Ready' : 'Pending'}</span></p>
                    <p className="flex items-center justify-between"><span>Bank details</span><span className="font-bold text-slate-900">{form.accountNumber && form.ifscCode ? 'Ready' : 'Pending'}</span></p>
                    <p className="flex items-center justify-between"><span>KYC</span><span className="font-bold text-slate-900">{form.isKycVerified ? 'Verified' : 'Pending'}</span></p>
                  </div>
                </div>
              </aside>
            </div>
          </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-xl md:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[1rem] bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 py-3 font-black text-white shadow-[0_12px_30px_rgba(37,99,235,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

const NavPill = ({ label, onClick, progress = 0 }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
  >
    <span>{label}</span>
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${progress >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
      {progress}%
    </span>
  </button>
);

const Section = ({ id, title, subtitle, icon: IconComp, children }) => (
  <div id={id} className="scroll-mt-28 rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-5">
    <h3 className="mb-1 flex items-center gap-2 text-lg font-black text-slate-950">
      <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
        <IconComp size={18} />
      </span>
      {title}
    </h3>
    {subtitle && <p className="mb-4 text-sm text-slate-600 font-medium">{subtitle}</p>}
    {children}
  </div>
);

const QuickAction = ({ icon: IconComp, title, desc }) => (
  <button className="text-left rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 transition w-full shadow-sm hover:-translate-y-0.5 hover:shadow-lg">
    <div className="mb-2 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 shadow-sm">
        <IconComp size={16} />
      </span>
      <p className="text-sm font-bold text-slate-900">{title}</p>
    </div>
    <p className="text-xs leading-5 text-slate-700 font-medium">{desc}</p>
  </button>
);

const MiniTaskStat = ({ label, value }) => (
  <div className="rounded-[1.25rem] border border-white/70 bg-white px-4 py-3 shadow-sm">
    <p className="text-xs uppercase tracking-wider font-bold text-slate-800\">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
  </div>
);

function ProgressItem({ label, value, tone = 'slate' }) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : tone === 'blue'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-slate-200 text-slate-700';

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>{value}</span>
    </div>
  );
}

const Stat = ({ icon: IconComp, label, value }) => (
  <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white/90 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 shadow-sm">
      <IconComp size={17} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wider font-bold text-slate-700">{label}</p>
      <p className="font-black text-base text-slate-950">{value}</p>
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', className = '' }) => (
  <div className={className}>
    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
    />
  </div>
);

const Badge = ({ children, tone = 'slate' }) => {
  const styles = {
    slate: 'bg-white/10 text-white border-white/15',
    blue: 'bg-blue-500/20 text-cyan-50 border-blue-300/20',
    emerald: 'bg-emerald-500/18 text-emerald-50 border-emerald-300/20',
    amber: 'bg-amber-500/18 text-amber-50 border-amber-300/20'
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${styles[tone]}`}>
      {children}
    </span>
  );
};
