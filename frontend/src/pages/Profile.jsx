import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, Luggage, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Profile() {
  const { user, updateProfile, switchRole, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [user]);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async () => {
    setSwitchLoading(true);
    try {
      const updated = await switchRole();
      if (updated.role === 'owner') navigate('/owner');
      else navigate('/');
    } catch (err) {
      setError('Failed to switch role.');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to delete your account? This action cannot be undone.'
  );
  if (!confirmed) return;
  try {
    await deleteAccount();
  } catch (err) {
    setError('Failed to delete account.');
  }
};

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.container}>
        <div style={s.headerCard}>
          <div style={s.avatarWrap}>
            <div style={s.avatar}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div style={s.headerInfo}>
            <h1 style={s.name}>{user?.name}</h1>
            <p style={s.roleTag}>
              {user?.role === 'owner' ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Home size={14} />Host</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Luggage size={14} />Tourist</span>}
            </p>
            <p style={s.emailTag}>{user?.email}</p>
          </div>
        </div>

        <div style={s.grid}>
          <div style={s.card} className="anim-fade-in-up">
            <h2 style={s.cardTitle}>Account type</h2>
            <p style={s.cardSub}>
              {user?.role === 'tourist'
                ? 'You are currently browsing as a Tourist. Switch to Host mode to list your property.'
                : 'You are currently in Host mode. Switch to Tourist mode to browse and book apartments.'}
            </p>
            <div style={s.roleRow}>
              <div style={{ ...s.roleBox, ...(user?.role === 'tourist' ? s.roleBoxActive : {}) }}>
                <Luggage size={22} color="#0F4C5C" strokeWidth={1.8} />
                <span style={s.roleLabel}>Tourist</span>
              </div>
              <div style={s.roleArrow}><ArrowRight size={18} color="#ccc" /></div>
              <div style={{ ...s.roleBox, ...(user?.role === 'owner' ? s.roleBoxActive : {}) }}>
                <Home size={22} color="#0F4C5C" strokeWidth={1.8} />
                <span style={s.roleLabel}>Host</span>
              </div>
            </div>
            <button
              onClick={handleSwitchRole}
              disabled={switchLoading}
              style={s.switchBtn}
              className="btn-press"
              onMouseEnter={e => e.target.style.backgroundColor = '#0a3a47'}
              onMouseLeave={e => e.target.style.backgroundColor = '#0F4C5C'}
            >
              {switchLoading
                ? 'Switching...'
                : user?.role === 'tourist' ? 'Switch to Host' : 'Switch to Tourist'}
            </button>
          </div>

          <div style={{ ...s.card, animationDelay: '80ms' }} className="anim-fade-in-up">
            <h2 style={s.cardTitle}>Edit profile</h2>

            {success && <div style={s.success} className="anim-pop-in">{success}</div>}
            {error && <div style={s.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={s.field}>
                <label style={s.label}>Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  style={s.input}
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  style={s.input}
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'}
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+382 69 123 456"
                  style={s.input}
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={s.saveBtn}
                className="btn-press"
                onMouseEnter={e => e.target.style.backgroundColor = '#0a3a47'}
                onMouseLeave={e => e.target.style.backgroundColor = '#0F4C5C'}
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>

        <button
          onClick={handleDeleteAccount}
          style={s.deleteBtn}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#fff0f0';
            e.currentTarget.style.borderColor = '#e57373';
            e.currentTarget.style.color = '#a93226';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#ffd0d0';
            e.currentTarget.style.color = '#c0392b';
          }}
        >
          Delete account
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Segoe UI', sans-serif",
    backgroundColor: '#FAFAF9',
  },
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 48px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ebebeb',
    boxShadow: '0 1px 8px rgba(15,76,92,0.06)',
  },
  brand: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F4C5C',
    textDecoration: 'none',
    letterSpacing: '-0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    color: '#333',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  navLogout: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '20px',
    padding: '8px 18px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#333',
    fontFamily: "'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '40px 24px 64px',
  },
  headerCard: {
    backgroundColor: '#0F4C5C',
    borderRadius: '20px',
    padding: '36px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '28px',
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#E8A87C',
    color: '#fff',
    fontSize: '32px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid rgba(255,255,255,0.2)',
  },
  headerInfo: {
    color: '#fff',
  },
  name: {
    fontSize: '24px',
    fontWeight: '800',
    margin: '0 0 4px',
    letterSpacing: '-0.5px',
  },
  roleTag: {
    fontSize: '14px',
    opacity: 0.8,
    margin: '0 0 4px',
  },
  emailTag: {
    fontSize: '13px',
    opacity: 0.6,
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #ebebeb',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F4C5C',
    margin: '0 0 8px',
  },
  cardSub: {
    fontSize: '14px',
    color: '#888',
    lineHeight: '1.6',
    margin: '0 0 24px',
  },
  roleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  roleBox: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '12px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  roleBoxActive: {
    border: '2px solid #0F4C5C',
    backgroundColor: '#f0f7f9',
  },
  roleIcon: {
    fontSize: '22px',
  },
  roleLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F4C5C',
  },
  roleArrow: {
    fontSize: '18px',
    color: '#ccc',
    flexShrink: 0,
  },
  switchBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0F4C5C',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: "'Segoe UI', sans-serif",
  },
  field: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#222',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#222',
    transition: 'border-color 0.2s',
    fontFamily: "'Segoe UI', sans-serif",
  },
  saveBtn: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#0F4C5C',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background-color 0.2s',
    fontFamily: "'Segoe UI', sans-serif",
  },
  success: {
    backgroundColor: '#f0fff4',
    border: '1px solid #b7ebc8',
    color: '#2d7a47',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  error: {
    backgroundColor: '#fff0f0',
    border: '1px solid #ffd0d0',
    color: '#c0392b',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  logoutBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#888',
    border: '1px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    cursor: 'pointer',
    fontFamily: "'Segoe UI', sans-serif",
  },
  deleteBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#c0392b',
    border: '1px solid #ffd0d0',
    borderRadius: '10px',
    fontSize: '15px',
    cursor: 'pointer',
    fontFamily: "'Segoe UI', sans-serif",
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  },
};
