import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, BookOpen, Building, LogOut, LogIn, Globe, ChevronDown, Heart, MessageCircle, BarChart3, Search, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import chatService from '../services/chatService';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'sr', label: 'SR', name: 'Srpski' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'fr', label: 'FR', name: 'Francais' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const langRef = useRef(null);

  const isActive = (path) => location.pathname === path;
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

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

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav style={s.nav}>
      <style>{`
        .navbar-toggle { display: none; }
        @media (max-width: 860px) {
          .navbar-toggle { display: flex; }
          .navbar-links {
            display: none;
            position: absolute; top: 60px; left: 0; right: 0;
            flex-direction: column; align-items: stretch;
            background: #fff; border-bottom: 1px solid #ebebeb;
            padding: 10px 16px 18px; gap: 4px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.08);
            max-height: calc(100vh - 60px); overflow-y: auto;
          }
          .navbar-links.open { display: flex; }
          .navbar-links .navbar-divider { display: none; }
          .navbar-links .navbar-lang-wrap { align-self: flex-start; margin-top: 8px; }
          .navbar-links .navbar-avatar-row { margin-top: 8px; }
        }
      `}</style>

      <Link to="/" style={s.brand}>Rentura</Link>

      <button
        className="navbar-toggle"
        onClick={() => setMobileOpen(v => !v)}
        style={s.toggleBtn}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`navbar-links${mobileOpen ? ' open' : ''}`} style={s.links}>
        <Link to="/" style={{ ...s.link, ...(isActive('/') ? s.linkActive : {}) }}>
          <Home size={15} style={s.linkIcon} /> {t('nav.home')}
        </Link>
        <Link to="/apartments" style={{ ...s.link, ...(isActive('/apartments') ? s.linkActive : {}) }}>
          <Search size={15} style={s.linkIcon} /> {t('nav.browse')}
        </Link>

        {user ? (
          <>
            {user.role === 'tourist' && (
              <>
                <Link to="/reservations" style={{ ...s.link, ...(isActive('/reservations') ? s.linkActive : {}) }}>
                  <BookOpen size={15} style={s.linkIcon} /> {t('nav.myBookings')}
                </Link>
                <Link to="/favorites" style={{ ...s.link, ...(isActive('/favorites') ? s.linkActive : {}) }}>
                  <Heart size={15} style={s.linkIcon} /> {t('nav.favorites')}
                </Link>
              </>
            )}
            {user.role === 'owner' && (
              <>
                <Link to="/owner" style={{ ...s.link, ...(isActive('/owner') ? s.linkActive : {}) }}>
                  <Building size={15} style={s.linkIcon} /> {t('nav.myListings')}
                </Link>
                <Link to="/owner/reservations" style={{ ...s.link, ...(isActive('/owner/reservations') ? s.linkActive : {}) }}>
                  <BookOpen size={15} style={s.linkIcon} /> {t('nav.bookings')}
                </Link>
                <Link to="/owner/analytics" style={{ ...s.link, ...(isActive('/owner/analytics') ? s.linkActive : {}) }}>
                  <BarChart3 size={15} style={s.linkIcon} /> {t('nav.analytics')}
                </Link>
              </>
            )}
            <Link to="/messages" style={{ ...s.link, ...(isActive('/messages') ? s.linkActive : {}) }}>
              <MessageCircle size={15} style={s.linkIcon} /> {t('nav.messages')}
              {unreadCount > 0 && <span style={s.navBadge}>{unreadCount}</span>}
            </Link>
            <div className="navbar-divider" style={s.divider} />
            <div className="navbar-avatar-row" style={s.avatarRow}>
              <Link to="/profile" style={s.avatar} title={user.name}>
                {user.name?.charAt(0).toUpperCase()}
              </Link>
              <button onClick={logout} style={s.logoutBtn} title={t('nav.signOut')}>
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={s.link}><LogIn size={15} style={s.linkIcon} />{t('nav.logIn')}</Link>
            <Link to="/register" style={s.signupBtn}>{t('nav.signUp')}</Link>
          </>
        )}

        <div className="navbar-divider" style={s.divider} />

        {/* Language dropdown */}
        <div className="navbar-lang-wrap" ref={langRef} style={s.langWrap}>
          <button onClick={() => setLangOpen(v => !v)} style={s.langTrigger}>
            <Globe size={14} color="#555" />
            <span style={s.langLabel}>{currentLang.label}</span>
            <ChevronDown size={12} color="#888" style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {langOpen && (
            <div style={s.langDropdown}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                  style={{
                    ...s.langOption,
                    ...(i18n.language === lang.code ? s.langOptionActive : {}),
                  }}
                >
                  <span style={s.langCode}>{lang.label}</span>
                  <span style={s.langName}>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
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
  links: { display: 'flex', alignItems: 'center', gap: 4 },
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
  // Language dropdown
  langWrap: { position: 'relative' },
  langTrigger: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 10px', borderRadius: 8,
    background: 'none', border: '1px solid #e0e0e0',
    cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif",
  },
  langLabel: { fontSize: 13, fontWeight: 600, color: '#333' },
  langDropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
    backgroundColor: '#fff', border: '1px solid #ebebeb',
    borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    overflow: 'hidden', minWidth: 140, zIndex: 200,
  },
  langOption: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left', fontFamily: "'Segoe UI', sans-serif",
    transition: 'background 0.1s',
  },
  langOptionActive: { backgroundColor: '#f0f7f9' },
  langCode: { fontSize: 12, fontWeight: 700, color: '#0F4C5C', minWidth: 24 },
  langName: { fontSize: 13, color: '#444' },
};
