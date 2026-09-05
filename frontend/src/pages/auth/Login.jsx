import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, ArrowRight, UserPlus, Users, Mail, Phone, MapPin } from 'lucide-react';

const TABS = {
  SIGNIN: 'signin',
  SIGNUP_USER: 'signup-user',
  SIGNUP_CONTACT: 'signup-contact',
};

/* ─────────────────── tiny helpers ─────────────────── */
const inputClass =
  'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all';

const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

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
        className={inputClass + ' pr-11'}
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

/* ─────────────────── Left panel – branding ─────────────────── */
function BrandPanel({ activeTab }) {
  const headlines = {
    [TABS.SIGNIN]: {
      title: 'Welcome back.',
      sub: 'Sign in to manage your accounts, orders and financial records.',
    },
    [TABS.SIGNUP_USER]: {
      title: 'Join the team.',
      sub: 'Create a staff account to access the Urban Furniture accounting suite.',
    },
    [TABS.SIGNUP_CONTACT]: {
      title: 'Become a partner.',
      sub: 'Register as a customer or vendor to track your orders and invoices.',
    },
  };
  const { title, sub } = headlines[activeTab] || headlines[TABS.SIGNIN];

  return (
    <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-slate-900 text-white p-12 relative overflow-hidden">
      {/* subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                            radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Logo */}
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

        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight text-white">{title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{sub}</p>
        </div>
      </div>

      {/* Bottom stats strip */}
      <div className="relative z-10 grid grid-cols-2 gap-4">
        {[
          { label: 'Invoices tracked', value: '1,240+' },
          { label: 'Journal entries', value: '8,500+' },
          { label: 'Contacts managed', value: '340+' },
          { label: 'Reports generated', value: '60+' },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── Tab pill strip ─────────────────── */
function TabStrip({ activeTab, setActiveTab }) {
  const tabs = [
    { id: TABS.SIGNIN, label: 'Sign In' },
    { id: TABS.SIGNUP_USER, label: 'Staff Sign Up' },
    { id: TABS.SIGNUP_CONTACT, label: 'Partner Register' },
  ];
  return (
    <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-8">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === t.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────── SIGN IN FORM ─────────────────── */
function SignInForm({ onLogin }) {
  const [email, setEmail] = useState('admin@urbanfurniture.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Role is determined by the backend – we just pass email
    onLogin(email, null);
  };

  const quickAccess = [
    { label: 'System Admin', hint: 'Full access', email: 'admin@urbanfurniture.com', role: 'ADMIN' },
    { label: 'Chief Accountant', hint: 'Ledger & reports', email: 'accountant@urbanfurniture.com', role: 'ACCOUNTANT' },
    { label: 'Customer Portal', hint: 'Mr. Raj', email: 'raj@example.com', role: 'CUSTOMER' },
    { label: 'Vendor Portal', hint: 'Mr. Rahul', email: 'rahul@vendor.com', role: 'VENDOR' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@urbanfurniture.com"
          className={inputClass}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass}>Password</label>
          <button type="button" className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
            Forgot password?
          </button>
        </div>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-sm font-semibold transition-all shadow-sm mt-2"
      >
        Sign In
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Quick demo access */}
      <div className="pt-4 border-t border-slate-100">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
          Demo Quick Access
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickAccess.map((q) => (
            <button
              key={q.role}
              type="button"
              onClick={() => onLogin(q.email, q.role)}
              className="text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
            >
              <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">{q.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{q.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

/* ─────────────────── STAFF SIGN UP ─────────────────── */
function StaffSignUpForm({ onRegister }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ACCOUNTANT' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onRegister({ name: form.name, email: form.email, role: form.role, contact_id: null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>Full Name</label>
        <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. Sarah Jenkins" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Work Email</label>
        <input type="email" required value={form.email} onChange={set('email')} placeholder="sarah@urbanfurniture.com" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Staff Role</label>
        <select value={form.role} onChange={set('role')} className={inputClass}>
          <option value="ACCOUNTANT">Chief Accountant</option>
          <option value="ADMIN">System Admin</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Password</label>
        <PasswordInput value={form.password} onChange={set('password')} />
      </div>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm mt-2"
      >
        <UserPlus className="w-4 h-4" />
        Create Staff Account
      </button>
    </form>
  );
}

/* ─────────────────── PARTNER REGISTER ─────────────────── */
function PartnerRegisterForm({ onRegisterContact }) {
  const [form, setForm] = useState({
    name: '',
    userType: 'CUSTOMER',
    email: '',
    mobile: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    password: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onRegisterContact(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Full Name / Business Name</label>
          <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. Woodcraft Supplies" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Contact Type</label>
          <select value={form.userType} onChange={set('userType')} className={inputClass}>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Email Address</label>
          <input type="email" required value={form.email} onChange={set('email')} placeholder="partner@example.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={form.mobile} onChange={set('mobile')} placeholder="9876543210" className={inputClass + ' pl-10'} />
          </div>
        </div>
        <div>
          <label className={labelClass}>City</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={form.city} onChange={set('city')} className={inputClass + ' pl-10'} />
          </div>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Password</label>
          <PasswordInput value={form.password} onChange={set('password')} />
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
      >
        <Users className="w-4 h-4" />
        Register and Access Portal
      </button>
    </form>
  );
}

/* ─────────────────── ROOT COMPONENT ─────────────────── */
export const Login = () => {
  const { login, register } = useAuth();
  const { addContact } = useApp();
  const [activeTab, setActiveTab] = useState(TABS.SIGNIN);

  const handleLogin = (email, role) => {
    login(email, role);
  };

  const handleUserRegister = (data) => {
    register(data);
  };

  const handleContactRegister = (form) => {
    addContact({
      name: form.name,
      userType: form.userType,
      email: form.email,
      mobile: Number(form.mobile || 9876543210),
      address: { city: form.city, state: form.state, pincode: form.pincode },
      password: form.password || 'password123',
      profileImage: '',
    });
    register({
      name: form.name,
      email: form.email,
      role: 'CONTACT',
      contact_id: form.userType,
    });
  };

  const formTitle = {
    [TABS.SIGNIN]: 'Sign in to your account',
    [TABS.SIGNUP_USER]: 'Create a staff account',
    [TABS.SIGNUP_CONTACT]: 'Register as a partner',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl border border-slate-200 min-h-[600px]">
        {/* Left brand panel */}
        <BrandPanel activeTab={activeTab} />

        {/* Right form panel */}
        <div className="flex-1 bg-white p-10 lg:p-14 flex flex-col justify-center overflow-y-auto">
          {/* Mobile logo (only shown on small screens) */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-900 text-xs tracking-widest shadow">
              UF
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">Urban Furniture</div>
              <div className="text-slate-400 text-xs">Accounting Suite</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">{formTitle[activeTab]}</h2>
          <p className="text-sm text-slate-400 mb-8">
            {activeTab === TABS.SIGNIN
              ? 'Enter your credentials to continue.'
              : activeTab === TABS.SIGNUP_USER
              ? 'Fill in the details to register a new staff member.'
              : 'Provide your business details to get started.'}
          </p>

          <TabStrip activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === TABS.SIGNIN && <SignInForm onLogin={handleLogin} />}
          {activeTab === TABS.SIGNUP_USER && <StaffSignUpForm onRegister={handleUserRegister} />}
          {activeTab === TABS.SIGNUP_CONTACT && <PartnerRegisterForm onRegisterContact={handleContactRegister} />}
        </div>
      </div>
    </div>
  );
};
