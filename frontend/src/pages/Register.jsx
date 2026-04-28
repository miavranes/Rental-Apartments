import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
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
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+1 234 567 890" style={styles.input}
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
                <div style={styles.row}>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Password</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange}
                      placeholder="••••••••" required style={styles.input}
                      onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                      onBlur={e => e.target.style.borderColor = '#ddd'} />
                  </div>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Confirm password</label>
                    <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                      placeholder="••••••••" required style={styles.input}
                      onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                      onBlur={e => e.target.style.borderColor = '#ddd'} />
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
                  placeholder="123456"
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
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { width: '100%', padding: '13px 16px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', color: '#222', backgroundColor: '#fff' },
  button: { width: '100%', padding: '14px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', transition: 'background-color 0.2s', letterSpacing: '0.3px' },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '15px', color: '#888', margin: '24px 0 0' },
  link: { color: '#0F4C5C', textDecoration: 'none', fontWeight: '700', borderBottom: '1px solid #E8A87C', cursor: 'pointer' },
};