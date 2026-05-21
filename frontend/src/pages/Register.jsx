import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

const COUNTRIES = [
  { code: 'ME', name: 'Montenegro',      dial: '+382', flag: '🇲🇪' },
  { code: 'RS', name: 'Serbia',          dial: '+381', flag: '🇷🇸' },
  { code: 'BA', name: 'Bosnia',          dial: '+387', flag: '🇧🇦' },
  { code: 'HR', name: 'Croatia',         dial: '+385', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovenia',        dial: '+386', flag: '🇸🇮' },
  { code: 'MK', name: 'N. Macedonia',    dial: '+389', flag: '🇲🇰' },
  { code: 'AL', name: 'Albania',         dial: '+355', flag: '🇦🇱' },
  { code: 'DE', name: 'Germany',         dial: '+49',  flag: '🇩🇪' },
  { code: 'AT', name: 'Austria',         dial: '+43',  flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland',     dial: '+41',  flag: '🇨🇭' },
  { code: 'GB', name: 'United Kingdom',  dial: '+44',  flag: '🇬🇧' },
  { code: 'FR', name: 'France',          dial: '+33',  flag: '🇫🇷' },
  { code: 'IT', name: 'Italy',           dial: '+39',  flag: '🇮🇹' },
  { code: 'ES', name: 'Spain',           dial: '+34',  flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands',     dial: '+31',  flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium',         dial: '+32',  flag: '🇧🇪' },
  { code: 'SE', name: 'Sweden',          dial: '+46',  flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',          dial: '+47',  flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark',         dial: '+45',  flag: '🇩🇰' },
  { code: 'PL', name: 'Poland',          dial: '+48',  flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic',  dial: '+420', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovakia',        dial: '+421', flag: '🇸🇰' },
  { code: 'HU', name: 'Hungary',         dial: '+36',  flag: '🇭🇺' },
  { code: 'RO', name: 'Romania',         dial: '+40',  flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria',        dial: '+359', flag: '🇧🇬' },
  { code: 'GR', name: 'Greece',          dial: '+30',  flag: '🇬🇷' },
  { code: 'TR', name: 'Turkey',          dial: '+90',  flag: '🇹🇷' },
  { code: 'RU', name: 'Russia',          dial: '+7',   flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine',         dial: '+380', flag: '🇺🇦' },
  { code: 'US', name: 'United States',   dial: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',          dial: '+1',   flag: '🇨🇦' },
  { code: 'AU', name: 'Australia',       dial: '+61',  flag: '🇦🇺' },
  { code: 'AE', name: 'UAE',             dial: '+971', flag: '🇦🇪' },
];

export default function Register() {
  const { register, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dialCode, setDialCode] = useState(COUNTRIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters long');

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: `${dialCode.dial}${form.phone}` });
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return setError('Please enter the 6-digit code.');
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-email', { email: form.email, code });
      loginWithToken(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.overlay}>
          <h1 style={styles.brand}>Rentura</h1>
          <p style={styles.tagline}>
            {step === 'register' ? 'Your next favourite place is waiting' : 'One step away from your account'}
          </p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formBox}>

          {step === 'register' ? (
            <>
              <h2 style={styles.title}>Create an account</h2>
              <p style={styles.subtitle}>Join Rentura today — it's free</p>

              {error && <div style={styles.error}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div style={styles.field}>
                  <label style={styles.label}>Full name</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Maria Peterson" required style={styles.input}
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="your@email.com" required style={styles.input}
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone number</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => { setDropdownOpen(v => !v); setSearch(''); }}
                        style={styles.dialBtn}
                      >
                        <span>{dialCode.flag}</span>
                        <span style={{ fontSize: 14, color: '#222' }}>{dialCode.dial}</span>
                        <ChevronDown size={14} color="#888" />
                      </button>
                      {dropdownOpen && (
                        <div style={styles.dropdown}>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.dropdownSearch}
                          />
                          <div style={styles.dropdownList}>
                            {filteredCountries.map(c => (
                              <div
                                key={c.code}
                                onClick={() => { setDialCode(c); setDropdownOpen(false); setSearch(''); }}
                                style={{
                                  ...styles.dropdownItem,
                                  backgroundColor: dialCode.code === c.code ? '#f0f7f9' : 'transparent',
                                }}
                              >
                                <span>{c.flag}</span>
                                <span style={{ flex: 1, fontSize: 14 }}>{c.name}</span>
                                <span style={{ fontSize: 13, color: '#888' }}>{c.dial}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Phone number input */}
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="67 123 456"
                      style={{ ...styles.input, flex: 1 }}
                      onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                      onBlur={e => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                </div>
                <div style={styles.row}>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Password</label>
                    <div style={styles.inputWrapper}>
                      <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                        placeholder="••••••••" required style={styles.input}
                        onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                        onBlur={e => e.target.style.borderColor = '#ddd'} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={styles.eyeBtn} tabIndex={-1}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Confirm password</label>
                    <div style={styles.inputWrapper}>
                      <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                        placeholder="••••••••" required style={styles.input}
                        onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                        onBlur={e => e.target.style.borderColor = '#ddd'} />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} style={styles.eyeBtn} tabIndex={-1}>
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={styles.button}
                  onMouseEnter={e => e.target.style.backgroundColor = '#0a3a47'}
                  onMouseLeave={e => e.target.style.backgroundColor = '#0F4C5C'}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p style={styles.footer}>
                Already have an account?{' '}
                <Link to="/login" style={styles.link}>Login</Link>
              </p>
            </>
          ) : (
            <>
              <h2 style={styles.title}>Verify your email</h2>
              <p style={styles.subtitle}>
                We sent a 6-digit code to <strong>{form.email}</strong>. Check your inbox.
              </p>

              {error && <div style={styles.error}>{error}</div>}

              <div style={styles.field}>
                <label style={styles.label}>Verification code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="XXXXXX"
                  style={{ ...styles.input, letterSpacing: '8px', fontSize: '22px', textAlign: 'center' }}
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'}
                />
              </div>

              <button onClick={handleVerify} disabled={loading} style={styles.button}
                onMouseEnter={e => e.target.style.backgroundColor = '#0a3a47'}
                onMouseLeave={e => e.target.style.backgroundColor = '#0F4C5C'}>
                {loading ? 'Verifying...' : 'Verify email'}
              </button>

              <p style={styles.footer}>
                Didn't receive the code?{' '}
                <span style={styles.link} onClick={() => { setStep('register'); setError(''); setCode(''); }}>
                  Go back
                </span>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', alignItems: 'stretch', fontFamily: "'Segoe UI', sans-serif" },
  left: {
    flex: 1,
    backgroundImage: `linear-gradient(135deg, rgba(15,76,92,0.72) 0%, rgba(14,54,66,0.80) 100%), url('/pristaniste.jpg')`,
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px',
  },
  overlay: { color: '#fff', maxWidth: '380px', textAlign: 'center' },
  brand: { fontSize: '42px', fontWeight: '800', margin: '0 0 20px', letterSpacing: '-1px' },
  tagline: { fontSize: '18px', lineHeight: '1.7', opacity: 0.85, margin: 0, fontWeight: '300' },
  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF9', padding: '40px', overflowY: 'auto' },
  formBox: { width: '100%', maxWidth: '460px', paddingTop: '20px', paddingBottom: '20px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#0F4C5C', margin: '0 0 8px' },
  subtitle: { fontSize: '15px', color: '#888', margin: '0 0 28px' },
  error: { backgroundColor: '#fff5f0', border: '1px solid #f5c6a0', color: '#b85c2a', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px' },
  field: { marginBottom: '18px' },
  row: { display: 'flex', gap: '16px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0', lineHeight: 1, color: '#888' },
  dialBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 12px', height: '49px',
    border: '1px solid #ddd', borderRadius: '10px',
    backgroundColor: '#fff', cursor: 'pointer',
    fontSize: '16px', whiteSpace: 'nowrap',
    fontFamily: "'Segoe UI', sans-serif",
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0,
    zIndex: 999, backgroundColor: '#fff',
    border: '1px solid #ddd', borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    width: '260px', overflow: 'hidden',
  },
  dropdownSearch: {
    width: '100%', padding: '10px 14px',
    border: 'none', borderBottom: '1px solid #eee',
    outline: 'none', fontSize: '14px',
    boxSizing: 'border-box', fontFamily: "'Segoe UI', sans-serif",
  },
  dropdownList: { maxHeight: '220px', overflowY: 'auto' },
  dropdownItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', cursor: 'pointer',
    transition: 'background 0.1s',
  },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { width: '100%', padding: '13px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', color: '#222', backgroundColor: '#fff' },
  button: { width: '100%', padding: '14px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', transition: 'background-color 0.2s', letterSpacing: '0.3px' },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '15px', color: '#888', margin: '24px 0 0' },
  link: { color: '#0F4C5C', textDecoration: 'none', fontWeight: '700', borderBottom: '1px solid #E8A87C', cursor: 'pointer' },
};