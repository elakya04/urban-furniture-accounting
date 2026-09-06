import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowRight, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

/* ─────────────────── shared style tokens ─────────────────── */
const inputCls =
  'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all';

const labelCls =
  'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

/* ─────────────────── password toggle ─────────────────── */
function PasswordInput({ value, onChange, onBlur, placeholder = '••••••••', hasError, isValid, ...rest }) {
  const [show, setShow] = useState(false);
  const borderCls = hasError
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
    : isValid
    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10'
    : 'border-slate-200 focus:border-slate-400 focus:ring-slate-900/10';

  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all pr-11 ${borderCls}`}
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

  const [touched, setTouched] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState('');

  const isContact = form.userType === 'CONTACT';

  const markTouched = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const setField = (k) => (e) => {
    let val = e.target.value;
    // Specialized sanitization during typing for mobile, pincode, loginId
    if (k === 'mobile') {
      val = val.replace(/\D/g, '').slice(0, 10);
    } else if (k === 'pincode') {
      val = val.replace(/\D/g, '').slice(0, 6);
    } else if (k === 'loginId') {
      val = val.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
    }
    setForm((f) => ({ ...f, [k]: val }));
    setServerError('');
  };

  // Compute validation errors
  const errors = {};
  if (!form.name.trim()) {
    errors.name = 'Full name is required';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!form.loginId) {
    errors.loginId = 'Login ID is required';
  } else if (form.loginId.length < 6 || form.loginId.length > 12) {
    errors.loginId = 'Must be 6–12 alphanumeric characters';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!form.mobile) {
    errors.mobile = 'Mobile number is required';
  } else if (form.mobile.length !== 10) {
    errors.mobile = 'Must be exactly 10 digits';
  }

  if (!form.city.trim()) {
    errors.city = 'City is required';
  }

  if (!form.state.trim()) {
    errors.state = 'State is required';
  }

  if (!form.pincode) {
    errors.pincode = 'Pincode is required';
  } else if (form.pincode.length !== 6) {
    errors.pincode = 'Must be 6 digits';
  }

  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 8) {
    errors.password = 'Must be at least 8 characters';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm your password';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!agreeTerms) {
    errors.agreeTerms = 'You must accept the terms to proceed';
  }

  const getFieldState = (k) => {
    const isFieldTouched = touched[k] || submitAttempted;
    const hasErr = Boolean(isFieldTouched && errors[k]);
    const isValid = Boolean(isFieldTouched && !errors[k] && form[k]);
    return { hasErr, isValid, errorMsg: hasErr ? errors[k] : '' };
  };

  const getDynamicInputCls = (k) => {
    const { hasErr, isValid } = getFieldState(k);
    if (hasErr) {
      return 'w-full bg-white border border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all';
    }
    if (isValid) {
      return 'w-full bg-white border border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all';
    }
    return inputCls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError('');

    // Check for any validation errors
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      // Mark all fields as touched to show errors
      const allTouched = {};
      Object.keys(form).forEach((k) => (allTouched[k] = true));
      setTouched(allTouched);
      setServerError(errors[errorKeys[0]]);
      return;
    }

    const payload = {
      name: form.name.trim(),
      loginId: form.loginId.trim(),
      userType: form.userType,
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      profile: form.profile || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      password: form.password,
    };

    if (isContact) {
      payload.contactRole = form.contactRole;
    }

    try {
      await onRegister(payload);
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
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
                onChange={setField('userType')}
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
                  onChange={setField('contactRole')}
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
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Full Name</label>
            {getFieldState('name').isValid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <input
            type="text"
            required
            value={form.name}
            onChange={setField('name')}
            onBlur={markTouched('name')}
            placeholder="Enter full name"
            className={getDynamicInputCls('name')}
          />
          {getFieldState('name').hasErr && (
            <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {getFieldState('name').errorMsg}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>
              Login ID <span className="normal-case text-slate-400 font-normal">({form.loginId.length}/12)</span>
            </label>
            {getFieldState('loginId').isValid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <input
            type="text"
            required
            minLength={6}
            maxLength={12}
            value={form.loginId}
            onChange={setField('loginId')}
            onBlur={markTouched('loginId')}
            placeholder="6–12 characters"
            className={getDynamicInputCls('loginId')}
          />
          {getFieldState('loginId').hasErr ? (
            <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {getFieldState('loginId').errorMsg}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">Letters, numbers, _, -</p>
          )}
        </div>
      </div>

      {/* ── Email + Mobile ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Email</label>
            {getFieldState('email').isValid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <input
            type="email"
            required
            value={form.email}
            onChange={setField('email')}
            onBlur={markTouched('email')}
            placeholder="name@example.com"
            className={getDynamicInputCls('email')}
          />
          {getFieldState('email').hasErr && (
            <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {getFieldState('email').errorMsg}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>
              Mobile <span className="normal-case text-slate-400 font-normal">({form.mobile.length}/10)</span>
            </label>
            {getFieldState('mobile').isValid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <input
            type="tel"
            required
            maxLength={10}
            value={form.mobile}
            onChange={setField('mobile')}
            onBlur={markTouched('mobile')}
            placeholder="10-digit number"
            className={getDynamicInputCls('mobile')}
          />
          {getFieldState('mobile').hasErr && (
            <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {getFieldState('mobile').errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* ── City / State / Pincode ── */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>City</label>
            {getFieldState('city').isValid && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          </div>
          <input
            type="text"
            required
            value={form.city}
            onChange={setField('city')}
            onBlur={markTouched('city')}
            placeholder="City"
            className={getDynamicInputCls('city')}
          />
          {getFieldState('city').hasErr && (
            <p className="text-[10px] text-red-500 mt-1">{getFieldState('city').errorMsg}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>State</label>
            {getFieldState('state').isValid && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          </div>
          <input
            type="text"
            required
            value={form.state}
            onChange={setField('state')}
            onBlur={markTouched('state')}
            placeholder="State"
            className={getDynamicInputCls('state')}
          />
          {getFieldState('state').hasErr && (
            <p className="text-[10px] text-red-500 mt-1">{getFieldState('state').errorMsg}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Pincode</label>
            {getFieldState('pincode').isValid && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          </div>
          <input
            type="text"
            required
            maxLength={6}
            value={form.pincode}
            onChange={setField('pincode')}
            onBlur={markTouched('pincode')}
            placeholder="6 digits"
            className={getDynamicInputCls('pincode')}
          />
          {getFieldState('pincode').hasErr && (
            <p className="text-[10px] text-red-500 mt-1">{getFieldState('pincode').errorMsg}</p>
          )}
        </div>
      </div>

      {/* ── Password ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Password</label>
            {getFieldState('password').isValid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <PasswordInput
            required
            value={form.password}
            onChange={setField('password')}
            onBlur={markTouched('password')}
            placeholder="Min 8 characters"
            hasError={getFieldState('password').hasErr}
            isValid={getFieldState('password').isValid}
          />
          {getFieldState('password').hasErr ? (
            <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {getFieldState('password').errorMsg}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">Min. 8 characters</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Confirm Password</label>
            {getFieldState('confirmPassword').isValid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <PasswordInput
            required
            value={form.confirmPassword}
            onChange={setField('confirmPassword')}
            onBlur={markTouched('confirmPassword')}
            placeholder="Repeat password"
            hasError={getFieldState('confirmPassword').hasErr}
            isValid={getFieldState('confirmPassword').isValid}
          />
          {getFieldState('confirmPassword').hasErr && (
            <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {getFieldState('confirmPassword').errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* ── Formcheck: Terms & Accuracy Agreement ── */}
      <div className="pt-2">
        <label className="flex items-start gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            id="signup-formcheck-agreement"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              setServerError('');
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
          <span className="text-xs text-slate-600 group-hover:text-slate-800 leading-snug">
            I confirm that the details entered are accurate and agree to the{' '}
            <span className="font-semibold text-slate-900 underline">Terms of Service</span> &{' '}
            <span className="font-semibold text-slate-900 underline">Privacy Policy</span>.
          </span>
        </label>
        {submitAttempted && !agreeTerms && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1.5">
            <AlertCircle className="w-3 h-3 shrink-0" />
            Please check this box to confirm and complete registration
          </p>
        )}
      </div>

      {serverError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
