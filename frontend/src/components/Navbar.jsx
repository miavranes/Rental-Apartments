import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, BookOpen, Building, LogOut, LogIn, Heart, MessageCircle, BarChart3, Search, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import chatService from '../services/chatService';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchUnread = () => {
      chatService.getConversations()
        .then(convs => setUnreadCount(convs.reduce((sum, c) => sum + (c.unread_count || 0), 0)))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav style={s.nav}>
      <style>{`
        .navbar-toggle { display: none; }
        .navbar-backdrop { display: none; }
        .navbar-links {
          display: flex; align-items: center; gap: 4px;
        }
        @media (max-width: 860px) {
          .navbar-toggle { display: flex; position: relative; z-index: 150; }
          .navbar-backdrop {
            display: block;
            position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.25);
            z-index: 130;
          }
          .navbar-links {
            display: none;
            position: absolute; top: 60px; left: 0; right: 0;
            flex-direction: column; align-items: stretch;
            background: #fff; border-bottom: 1px solid #ebebeb;
            padding: 10px 16px 18px; gap: 4px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.08);
            max-height: calc(100vh - 60px); overflow-y: auto;
            z-index: 140;
          }
          .navbar-links.open { display: flex; }
          .navbar-links .navbar-divider { display: none; }
          .navbar-links .navbar-lang-wrap { align-self: flex-start; margin-top: 8px; }
          .navbar-links .navbar-avatar-row { margin-top: 8px; }
        }

        @keyframes navBadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .nav-link { transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease; }
        .nav-link:hover { background-color: #f5fafb; transform: translateY(-1px); }
        .nav-badge-pulse { animation: navBadgePulse 1.8s ease-in-out infinite; }
        .brand-anim { transition: transform 0.2s ease; display: inline-block; }
        .brand-anim:hover { transform: scale(1.05); }
        .avatar-anim { transition: transform 0.2s ease; }
        .avatar-anim:hover { transform: scale(1.08); }
        @media (prefers-reduced-motion: reduce) {
          .nav-link, .nav-badge-pulse, .brand-anim, .avatar-anim { animation: none !important; transition: none !important; }
        }
      `}</style>

      <Link to="/" style={s.brand} className="brand-anim">Rentura</Link>

      <button
        className="navbar-toggle"
        onClick={() => setMobileOpen(v => !v)}
        style={s.toggleBtn}
        aria-label="Menu"
        type="button"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setMobileOpen(false)}
          style={s.backdrop}
        />
      )}

      <div className={`navbar-links${mobileOpen ? ' open' : ''}`}>
        <Link to="/" style={{ ...s.link, ...(isActive('/') ? s.linkActive : {}) }} className="nav-link">
          <Home size={15} style={s.linkIcon} /> {t('nav.home')}
        </Link>
        <Link to="/apartments" style={{ ...s.link, ...(isActive('/apartments') ? s.linkActive : {}) }} className="nav-link">
          <Search size={15} style={s.linkIcon} /> {t('nav.browse')}
        </Link>

        {user ? (
          <>
            {user.role === 'tourist' && (
              <>
                <Link to="/reservations" style={{ ...s.link, ...(isActive('/reservations') ? s.linkActive : {}) }} className="nav-link">
                  <BookOpen size={15} style={s.linkIcon} /> {t('nav.myBookings')}
                </Link>
                <Link to="/favorites" style={{ ...s.link, ...(isActive('/favorites') ? s.linkActive : {}) }} className="nav-link">
                  <Heart size={15} style={s.linkIcon} /> {t('nav.favorites')}
                </Link>
              </>
            )}
            {user.role === 'owner' && (
              <>
                <Link to="/owner" style={{ ...s.link, ...(isActive('/owner') ? s.linkActive : {}) }} className="nav-link">
                  <Building size={15} style={s.linkIcon} /> {t('nav.myListings')}
                </Link>
                <Link to="/owner/reservations" style={{ ...s.link, ...(isActive('/owner/reservations') ? s.linkActive : {}) }} className="nav-link">
                  <BookOpen size={15} style={s.linkIcon} /> {t('nav.bookings')}
                </Link>
                <Link to="/owner/analytics" style={{ ...s.link, ...(isActive('/owner/analytics') ? s.linkActive : {}) }} className="nav-link">
                  <BarChart3 size={15} style={s.linkIcon} /> {t('nav.analytics')}
                </Link>
              </>
            )}
            <Link to="/messages" style={{ ...s.link, ...(isActive('/messages') ? s.linkActive : {}) }} className="nav-link">
              <MessageCircle size={15} style={s.linkIcon} /> {t('nav.messages')}
              {unreadCount > 0 && <span style={s.navBadge} className="nav-badge-pulse">{unreadCount}</span>}
            </Link>
            <div className="navbar-divider" style={s.divider} />
            <div className="navbar-avatar-row" style={s.avatarRow}>
              <Link to="/profile" style={s.avatar} title={user.name} className="avatar-anim">
                {user.name?.charAt(0).toUpperCase()}
              </Link>
              <button onClick={logout} style={s.logoutBtn} title={t('nav.signOut')}>
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={s.link} className="nav-link"><LogIn size={15} style={s.linkIcon} />{t('nav.logIn')}</Link>
            <Link to="/register" style={s.signupBtn} className="btn-press">{t('nav.signUp')}</Link>
          </>
        )}

        <div className="navbar-divider" style={s.divider} />

        {/* Language dropdown */}
        <div className="navbar-lang-wrap">
          <LanguageSwitcher />
        </div>
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
  brand: { fontSize: 20, fontWeight: 800, color: '#0F4C5C', textDecoration: 'none', letterSpacing: '-0.5px' },
  toggleBtn: {
    alignItems: 'center', justifyContent: 'center',
    background: 'none', border: '1px solid #e0e0e0', borderRadius: 8,
    padding: '6px 8px', cursor: 'pointer', color: '#0F4C5C',
  },
  backdrop: { border: 'none', padding: 0, margin: 0, cursor: 'default' },
  link: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 8,
    color: '#555', textDecoration: 'none', fontSize: 14, fontWeight: 500,
  },
  linkActive: { backgroundColor: '#f0f7f9', color: '#0F4C5C', fontWeight: 600 },
  linkIcon: { flexShrink: 0 },
  navBadge: {
    backgroundColor: '#E8A87C', color: '#fff', fontSize: 10, fontWeight: 700,
    borderRadius: 20, padding: '1px 6px', marginLeft: 2,
  },
  divider: { width: 1, height: 24, backgroundColor: '#ebebeb', margin: '0 8px' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 10 },
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