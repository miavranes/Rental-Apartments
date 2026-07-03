import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/login" style={s.back}>← Back to login</Link>
        <h1 style={s.title}>Reset password</h1>

        {sent ? (
          <div style={s.success}>
            <p style={{ margin: 0, fontSize: 15, color: '#2e7d32' }}>
              ✓ If that email exists, a reset link has been sent. Check your inbox.
            </p>
          </div>
        ) : (
          <>
            <p style={s.sub}>Enter your email and we'll send you a link to reset your password.</p>
            {error && <div style={s.errorBox}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <label style={s.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF9', fontFamily: "'Segoe UI', sans-serif", padding: 24 },
  card: { width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 20, padding: 40, border: '1px solid #ebebeb', boxShadow: '0 4px 24px rgba(15,76,92,0.08)' },
  back: { fontSize: 13, color: '#0F4C5C', textDecoration: 'none', fontWeight: 600 },
  title: { fontSize: 26, fontWeight: 800, color: '#0F4C5C', margin: '20px 0 8px', letterSpacing: '-0.5px' },
  sub: { fontSize: 14, color: '#888', margin: '0 0 24px' },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  input: { width: '100%', padding: '13px 16px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#222', fontFamily: "'Segoe UI', sans-serif", marginBottom: 20 },
  btn: { width: '100%', padding: 14, backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  errorBox: { backgroundColor: '#fff0f0', border: '1px solid #ffd0d0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  success: { backgroundColor: '#f0fff4', border: '1px solid #b7dfc5', borderRadius: 10, padding: '16px 20px' },
};
