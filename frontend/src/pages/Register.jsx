import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.overlay}>
          <h1 style={styles.brand}>Rentura</h1>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formBox}>
          <h2 style={styles.title}>Create an account</h2>
          <p style={styles.subtitle}>Join Rentura today</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Maria Peterson"
                required
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#FF385C'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#FF385C'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#FF385C'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#FF385C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'}
                />
              </div>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>Confirm password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#FF385C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.button}
              onMouseEnter={e => e.target.style.backgroundColor = '#e0314f'}
              onMouseLeave={e => e.target.style.backgroundColor = '#FF385C'}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={styles.footer}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'stretch',
    fontFamily: "'Segoe UI', sans-serif",
  },
  left: {
    flex: 1,
    backgroundImage: `linear-gradient(135deg, rgba(59, 105, 203, 0.50) 0%, rgba(173, 76, 112, 0.50) 100%), url('/pristaniste.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
  },
  overlay: {
    color: '#fff',
    maxWidth: '380px',
    textAlign: 'center',
  },
  brand: {
    fontSize: '42px',
    fontWeight: '800',
    margin: '0 0 20px',
    letterSpacing: '-1px',
  },
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: '40px',
    overflowY: 'auto',
  },
  formBox: {
    width: '100%',
    maxWidth: '460px',
    paddingTop: '20px',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#717171',
    margin: '0 0 28px',
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
  field: {
    marginBottom: '18px',
  },
  row: {
    display: 'flex',
    gap: '16px',
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
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    color: '#222',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FF385C',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '15px',
    color: '#717171',
    margin: '20px 0 0',
  },
  link: {
    color: '#FF385C',
    textDecoration: 'underline',
    fontWeight: '600',
  },
};