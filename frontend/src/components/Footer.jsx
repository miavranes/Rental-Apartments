import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer style={s.footer}>
      <div style={s.container}>
        <div style={s.top} className="footer-top">
          {/* Brand */}
          <div style={s.brandCol}>
            <span style={s.brand}>Rentura</span>
            <p style={s.tagline}>{t('footer.tagline')}</p>
          </div>

          {/* Quick links */}
          <div style={s.col}>
            <span style={s.colTitle}>{t('footer.quickLinks')}</span>
            <Link to="/" style={s.link}>{t('footer.home')}</Link>
            <Link to="/apartments" style={s.link}>{t('footer.browse')}</Link>
          </div>

          {/* Contact & social */}
          <div style={s.col}>
            <span style={s.colTitle}>{t('footer.contact')}</span>
            <a href="mailto:hello@rentura.me" style={s.link}>
              <Mail size={14} style={{ marginRight: 6 }} />hello@rentura.me
            </a>
            <div style={s.socials}>
              <button type="button" style={s.socialIcon} aria-label="Instagram"><Instagram size={16} /></button>
              <button type="button" style={s.socialIcon} aria-label="Facebook"><Facebook size={16} /></button>
              <button type="button" style={s.socialIcon} aria-label="Twitter"><Twitter size={16} /></button>
            </div>
          </div>
        </div>

        <div style={s.divider} />

        <div style={s.bottom}>
          <span style={s.copyright}>© {year} Rentura. {t('footer.rights')}</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .footer-top { flex-direction: column !important; gap: 28px !important; }
        }
      `}</style>
    </footer>
  );
}

const s = {
  footer: {
    backgroundColor: '#0F4C5C', color: '#fff',
    fontFamily: "'Segoe UI', sans-serif", marginTop: 'auto',
  },
  container: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px 24px' },
  top: { display: 'flex', justifyContent: 'space-between', gap: 40 },
  brandCol: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 },
  brand: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' },
  tagline: { fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 },
  col: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 },
  colTitle: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  link: { display: 'flex', alignItems: 'center', fontSize: 14, color: 'rgba(255,255,255,0.85)', textDecoration: 'none' },
  socials: { display: 'flex', gap: 10, marginTop: 6 },
  socialIcon: {
    width: 32, height: 32, borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none', border: 'none', cursor: 'pointer',
    padding: 0, fontFamily: "'Segoe UI', sans-serif",
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', margin: '32px 0 20px' },
  bottom: { display: 'flex', justifyContent: 'center' },
  copyright: { fontSize: 12.5, color: 'rgba(255,255,255,0.5)' },
};