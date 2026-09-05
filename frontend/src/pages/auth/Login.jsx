import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';

/* ─────────────────── shared style tokens ─────────────────── */
const inputCls =
  'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all';

const labelCls =
  'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

/* ─────────────────── password toggle ─────────────────── */
function PasswordInput({ value, onChange, placeholder = '••••••••', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls + ' pr-11'}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ─────────────────── left branding panel ─────────────────── */
function BrandPanel({ isSignUp }) {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 bg-slate-900 text-white p-12 relative overflow-hidden">
      {/* dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-900 text-sm tracking-widest shadow-lg">
            UF
          </div>
          <div>
            <div className="font-bold text-white text-base leading-tight">Urban Furniture</div>
            <div className="text-slate-400 text-xs">Accounting Suite</div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-snug text-white">
            {isSignUp ? 'Create your account.' : 'Welcome back.'}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            {isSignUp
              ? 'Register as a staff member or partner to access the accounting suite.'
              : 'Sign in to manage your accounts, orders and financial records.'}
          </p>
        </div>
      </div>

      {/* bottom features */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        {[
          { label: 'Core System', value: 'Double Entry' },
          { label: 'Billing & Portals', value: 'Invoices & Bills' },
          { label: 'Access Control', value: 'Role-Based' },
          { label: 'Compliance', value: 'Audit-Ready' },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-sm font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── tab strip ─────────────────── */
function TabStrip({ active, setActive }) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-8">
      {['signin', 'signup'].map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setActive(t)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            active === t
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────── SIGN IN FORM ─────────────────── */
function SignInForm({ onLogin }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginId || !password) {
      setError('Please enter your Login ID and password.');
      return;
    }
    try {
      await onLogin(loginId, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>Login ID</label>
        <input
          type="text"
          required
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="Enter your login ID"
          className={inputCls}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls}>Password</label>
        </div>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      {error && (
        <p className="text-xs text-red-500 -mt-1">{error}</p>
      )}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-sm font-semibold transition-all shadow-sm mt-2"
      >
        Sign In
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

/* ─────────────────── SIGN UP FORM ─────────────────── */
const CONTACT_ROLES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'BOTH', label: 'Both' },
];

function SignUpForm({ onRegister }) {
  const [form, setForm] = useState({
    name: '',
    loginId: '',
    userType: 'ACCOUNTANT',   // maps to Contact.userType / User.role
    contactRole: 'CUSTOMER',  // only used when userType === CONTACT (maps to User.contact_role)
    email: '',
    mobile: '',
    city: '',
    state: '',
    pincode: '',
    profile: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isContact = form.userType === 'CONTACT';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.loginId.length < 6 || form.loginId.length > 12) {
      setError('Login ID must be between 6 and 12 characters.');
      return;
    }

    const payload = {
      name: form.name,
      loginId: form.loginId,
      userType: form.userType,
      email: form.email,
      mobile: form.mobile,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      profile: form.profile || '',
      password: form.password,
    };

    if (isContact) {
      payload.contactRole = form.contactRole;
    }

    try {
      await onRegister(payload);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Account type ── */}
      <div>
        <label className={labelCls}>Account Type</label>
        <div className="flex gap-3">
          {[
            { value: 'ACCOUNTANT', label: 'Accountant' },
            { value: 'CONTACT', label: 'Contact (Partner)' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex items-center gap-2.5 cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                form.userType === opt.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="userType"
                value={opt.value}
                checked={form.userType === opt.value}
                onChange={set('userType')}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Contact role (only for CONTACT) ── */}
      {isContact && (
        <div>
          <label className={labelCls}>Partner Type</label>
          <div className="flex gap-3">
            {CONTACT_ROLES.map((opt) => (
              <label
                key={opt.value}
                className={`flex-1 flex items-center gap-2.5 cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                  form.contactRole === opt.value
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="contactRole"
                  value={opt.value}
                  checked={form.contactRole === opt.value}
                  onChange={set('contactRole')}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Name + Login ID ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Full Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={set('name')}
            placeholder="Enter full name"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Login ID <span className="normal-case text-slate-400">(6–12 chars)</span></label>
          <input
            type="text"
            required
            minLength={6}
            maxLength={12}
            value={form.loginId}
            onChange={set('loginId')}
            placeholder="Enter login ID"
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Email + Mobile ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            placeholder="Enter email address"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Mobile</label>
          <input
            type="tel"
            required
            value={form.mobile}
            onChange={set('mobile')}
            placeholder="Enter mobile number"
            className={inputCls}
          />
        </div>
      </div>

      {/* ── City / State / Pincode ── */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>City</label>
          <input
            type="text"
            required
            value={form.city}
            onChange={set('city')}
            placeholder="Enter city"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input
            type="text"
            required
            value={form.state}
            onChange={set('state')}
            placeholder="Enter state"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Pincode</label>
          <input
            type="text"
            required
            value={form.pincode}
            onChange={set('pincode')}
            placeholder="Enter pincode"
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Password ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Password</label>
          <PasswordInput
            required
            value={form.password}
            onChange={set('password')}
            placeholder="Min 8 characters"
          />
        </div>
        <div>
          <label className={labelCls}>Confirm Password</label>
          <PasswordInput
            required
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Repeat password"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
      >
        <UserPlus className="w-4 h-4" />
        {isContact ? 'Register as Partner' : 'Create Account'}
      </button>
    </form>
  );
}

/* ─────────────────── ROOT COMPONENT ─────────────────── */
export const Login = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('signin');

  const handleLogin = (loginId, password) => {
    login(loginId, password);
  };

  const handleRegister = (payload) => {
    register(payload);
  };

  const isSignUp = tab === 'signup';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl border border-slate-200 min-h-[600px]">
        {/* Left branding */}
        <BrandPanel isSignUp={isSignUp} />

        {/* Right form panel */}
        <div className="flex-1 bg-white flex flex-col justify-start overflow-y-auto p-10 lg:p-14">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-900 text-xs tracking-widest shadow">
              UF
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">Urban Furniture</div>
              <div className="text-slate-400 text-xs">Accounting Suite</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="text-sm text-slate-400 mb-8">
            {isSignUp
              ? 'Fill in the details below to get started.'
              : 'Enter your Login ID and password to continue.'}
          </p>

          <TabStrip active={tab} setActive={setTab} />

          {tab === 'signin' && <SignInForm onLogin={handleLogin} />}
          {tab === 'signup' && <SignUpForm onRegister={handleRegister} />}
        </div>
      </div>
    </div>
  );
};
