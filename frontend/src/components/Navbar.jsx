import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, User, BookOpen, Building, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.brand}>Rentura</Link>

      <div style={s.links}>
        <Link to="/" style={{ ...s.link, ...(isActive('/') ? s.linkActive : {}) }}>
          <Home size={15} style={s.linkIcon} /> Home
        </Link>
        <Link to="/apartments" style={{ ...s.link, ...(isActive('/apartments') ? s.linkActive : {}) }}>
          <Building size={15} style={s.linkIcon} /> Browse
        </Link>

        {user ? (
          <>
            {user.role === 'tourist' && (
              <Link to="/reservations" style={{ ...s.link, ...(isActive('/reservations') ? s.linkActive : {}) }}>
                <BookOpen size={15} style={s.linkIcon} /> My Bookings
              </Link>
            )}
            {user.role === 'owner' && (
              <>
                <Link to="/owner" style={{ ...s.link, ...(isActive('/owner') ? s.linkActive : {}) }}>
                  <Building size={15} style={s.linkIcon} /> My Listings
                </Link>
                <Link to="/owner/reservations" style={{ ...s.link, ...(isActive('/owner/reservations') ? s.linkActive : {}) }}>
                  <BookOpen size={15} style={s.linkIcon} /> Bookings
                </Link>
              </>
            )}
            <div style={s.divider} />
            <Link to="/profile" style={s.avatar} title={user.name}>
              {user.name?.charAt(0).toUpperCase()}
            </Link>
            <button onClick={logout} style={s.logoutBtn} title="Sign out">
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={s.link}><LogIn size={15} style={s.linkIcon} />Log in</Link>
            <Link to="/register" style={s.signupBtn}>Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const s = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: 60,
    backgroundColor: '#fff', borderBottom: '1px solid #ebebeb',
    boxShadow: '0 1px 8px rgba(15,76,92,0.06)',
    fontFamily: "'Segoe UI', sans-serif",
  },
  brand: {
    fontSize: 20, fontWeight: 800, color: '#0F4C5C',
    textDecoration: 'none', letterSpacing: '-0.5px',
  },
  links: { display: 'flex', alignItems: 'center', gap: 4 },
  link: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 8,
    color: '#555', textDecoration: 'none', fontSize: 14, fontWeight: 500,
    transition: 'background 0.15s, color 0.15s',
  },
  linkActive: { backgroundColor: '#f0f7f9', color: '#0F4C5C', fontWeight: 600 },
  linkIcon: { flexShrink: 0 },
  divider: { width: 1, height: 24, backgroundColor: '#ebebeb', margin: '0 8px' },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    backgroundColor: '#0F4C5C', color: '#fff',
    fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none', flexShrink: 0,
  },
  logoutBtn: {
    background: 'none', border: '1px solid #ddd', borderRadius: 8,
    padding: '6px 10px', cursor: 'pointer', color: '#888',
    display: 'flex', alignItems: 'center',
  },
  signupBtn: {
    backgroundColor: '#0F4C5C', color: '#fff',
    textDecoration: 'none', borderRadius: 20,
    padding: '7px 18px', fontSize: 14, fontWeight: 600, marginLeft: 4,
  },
};
