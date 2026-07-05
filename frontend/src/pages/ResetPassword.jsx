import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <p style={{ color: '#c0392b' }}>Invalid reset link. <Link to="/forgot-password" style={s.link}>Request a new one.</Link></p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card} className="anim-fade-in-up">
        <h1 style={s.title}>Set new password</h1>

        {done ? (
          <div style={s.success} className="anim-pop-in">
            <p style={{ margin: 0, fontSize: 15, color: '#2e7d32' }}>✓ Password reset! Redirecting to login...</p>
          </div>
        ) : (
          <>
            {error && <div style={s.errorBox}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <label style={s.label}>New password</label>
              <div style={s.inputWrap}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 characters"
                  style={s.input}
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={s.eye}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <label style={{ ...s.label, marginTop: 16 }}>Confirm password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat password"
                style={{ ...s.input, marginBottom: 20 }}
                onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
              <button type="submit" disabled={loading} style={s.btn} className="btn-press">
                {loading ? 'Saving...' : 'Reset password'}
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
  title: { fontSize: 26, fontWeight: 800, color: '#0F4C5C', margin: '0 0 24px', letterSpacing: '-0.5px' },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 4 },
  input: { width: '100%', padding: '13px 16px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#222', fontFamily: "'Segoe UI', sans-serif" },
  eye: { position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0 },
  btn: { width: '100%', padding: 14, backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  errorBox: { backgroundColor: '#fff0f0', border: '1px solid #ffd0d0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  success: { backgroundColor: '#f0fff4', border: '1px solid #b7dfc5', borderRadius: 10, padding: '16px 20px' },
  link: { color: '#0F4C5C', fontWeight: 600 },
};
