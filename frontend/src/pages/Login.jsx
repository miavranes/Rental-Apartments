import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'owner') navigate('/owner');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.wrongCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <LanguageSwitcher variant="floating" />
      <div style={styles.left}>
        <div style={styles.overlay}>
          <h1 style={styles.brand}>Rentura</h1>
          <p style={styles.tagline}>{t('auth.loginTagline')}</p>
        </div>
      </div>
      <div style={styles.right}>
        <div style={styles.formBox}>
          <h2 style={styles.title}>{t('auth.welcomeBack')}</h2>
          <p style={styles.subtitle}>{t('auth.signInAccount')}</p>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={styles.field}>
              <label style={styles.label}>{t('auth.email')}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="your@email.com" required style={styles.input} autoComplete="off"
                onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                onBlur={e => e.target.style.borderColor = '#ddd'} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('auth.password')}</label>
              <div style={styles.inputWrapper}>
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" required style={styles.input} autoComplete="new-password"
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={styles.eyeBtn} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={styles.button}
              onMouseEnter={e => e.target.style.backgroundColor = '#0a3a47'}
              onMouseLeave={e => e.target.style.backgroundColor = '#0F4C5C'}>
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>
          <div style={styles.divider}><span style={styles.dividerLine} /></div>
          <p style={styles.footer}>
            {t('auth.noAccount')}{' '}<Link to="/register" style={styles.link}>{t('nav.signUp')}</Link>
          </p>
          <p style={{ ...styles.footer, marginTop: 10 }}>
            <Link to="/forgot-password" style={{ ...styles.link, fontWeight: 500, borderBottom: 'none', color: '#888' }}>
              {t('auth.forgotPassword')}
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
    position: 'relative',
  },
  left: {
    flex: 1,
    backgroundImage: `linear-gradient(135deg, rgba(15,76,92,0.72) 0%, rgba(14,54,66,0.80) 100%), url('/pristaniste.jpg')`,
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
  tagline: {
    fontSize: '18px',
    lineHeight: '1.7',
    opacity: 0.85,
    margin: 0,
    fontWeight: '300',
  },
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAF9',
    padding: '40px',
  },
  formBox: {
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0F4C5C',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#888',
    margin: '0 0 36px',
  },
  error: {
    backgroundColor: '#fff5f0',
    border: '1px solid #f5c6a0',
    color: '#b85c2a',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0',
    lineHeight: 1,
    color: '#888',
  },
  label: {
    marginTop: '20px',
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
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
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#0F4C5C',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'background-color 0.2s',
    letterSpacing: '0.3px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '28px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#ebebeb',
  },
  footer: {
    textAlign: 'center',
    fontSize: '15px',
    color: '#888',
    margin: 0,
  },
  link: {
    color: '#0F4C5C',
    textDecoration: 'none',
    fontWeight: '700',
    borderBottom: '1px solid #E8A87C',
  },
};