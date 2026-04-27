import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'owner') navigate('/owner');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Wrong email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.overlay}>
          <h1 style={styles.brand}>Rentura</h1>
          <p style={styles.tagline}>Find the perfect stay for your vacation</p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formBox}>
          <h2 style={styles.title}>Welcome back</h2>
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="vas@email.com"
                required
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#FF385C'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={styles.field}>
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

            <button
              type="submit"
              disabled={loading}
              style={styles.button}
              onMouseEnter={e => e.target.style.backgroundColor = '#e0314f'}
              onMouseLeave={e => e.target.style.backgroundColor = '#FF385C'}
            >
              {loading ? 'Loging in...' : 'Login'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerLine} />
          </div>

          <p style={styles.footer}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>
              Sign up
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
    backgroundImage: `linear-gradient(135deg, rgba(59, 105, 203, 0.50) 0%, rgba(173, 76, 112, 0.50) 100%), url('/pristaniste.jpg')`,backgroundSize: 'cover',
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
  textAlign: 'center',
},
tagline: {
  fontSize: '20px',
  lineHeight: '1.6',
  opacity: 0.9,
  margin: 0,
  textAlign: 'center',
},
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: '40px',
  },
  formBox: {
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 50px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#717171',
    margin: '0 0 32px',
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
    marginBottom: '20px',
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
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '28px 0',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#ebebeb',
  },
  dividerText: {
    fontSize: '13px',
    color: '#717171',
  },
  footer: {
    textAlign: 'center',
    fontSize: '15px',
    color: '#717171',
    margin: 0,
  },
  link: {
    color: '#FF385C',
    textDecoration: 'underline',
    fontWeight: '600',
  },
};