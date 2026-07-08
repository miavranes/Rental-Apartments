import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apartmentService from '../services/apartmentService';
import ApartmentCard from '../components/ApartmentCard';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apartmentService
      .getAll()
      .then((data) => {
        const sorted = [...data].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        setFeatured(sorted.slice(0, 3));
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <Navbar />

      <section style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent} className="anim-fade-in-up">
          <h1 style={styles.heroTitle}>{t('home.heroTitle')}</h1>
          <p style={styles.heroSubtitle}>{t('home.heroSubtitle')}</p>
          <SearchBar />
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>{t('home.featuredTitle')}</h2>
            <p style={styles.sectionSub}>{t('home.featuredSub')}</p>
          </div>
          <Link to="/apartments" style={styles.seeAll} className="btn-press">{t('home.viewAll')}</Link>
        </div>

        {loading ? (
          <div style={styles.grid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={styles.skeleton} className="skeleton-shimmer" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>{t('home.noApartments')}</p>
            {user?.role === 'owner' && (
              <Link to="/owner/new" style={styles.emptyLink}>{t('home.addFirst')}</Link>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {featured.map((a, i) => (
              <ApartmentCard key={a.id} apartment={a} index={i} />
            ))}
          </div>
        )}
      </section>

      {!user && (
        <section style={styles.cta}>
          <div style={styles.ctaInner}>
            <p style={styles.ctaEyebrow}>{t('home.ctaEyebrow')}</p>
            <h2 style={styles.ctaTitle}>{t('home.ctaTitle')}</h2>
            <p style={styles.ctaText}>{t('home.ctaText')}</p>
            <Link to="/register" style={styles.ctaButton}>{t('home.ctaBtn')}</Link>
          </div>
        </section>
      )}
    </div>
  );
}

const styles = {
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
  navProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: '#333',
    fontSize: '14px',
    fontWeight: '500',
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #ccc',
  },
  navAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor:  '#0F4C5C',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLink: {
    background: '#0F4C5C',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  hero: {
    position: 'relative',
    minHeight: '520px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: `linear-gradient(135deg, rgba(15,76,92,0.72) 0%, rgba(14,54,66,0.80) 100%), url('/pristaniste.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '80px 24px',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(232,168,124,0.12), transparent 65%)',
  },
  heroContent: {
    position: 'relative',
    textAlign: 'center',
    maxWidth: '900px',
    width: '100%',
  },
  heroTitle: {
    fontSize: '52px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 14px',
    letterSpacing: '-1.5px',
    lineHeight: 1.1,
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.80)',
    margin: '0 0 40px',
    fontWeight: '300',
    letterSpacing: '0.2px',
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0F4C5C',
    margin: '0 0 4px',
  },
  sectionSub: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  seeAll: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F4C5C',
    textDecoration: 'none',
    borderBottom: '1px solid #E8A87C',
    paddingBottom: '1px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  skeleton: {
    borderRadius: '16px',
    height: '280px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 0',
  },
  emptyText: {
    color: '#888',
    fontSize: '16px',
    margin: '0 0 12px',
  },
  emptyLink: {
    color: '#0F4C5C',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '15px',
  },
  cta: {
    backgroundColor: '#0F4C5C',
    padding: '72px 24px',
    textAlign: 'center',
  },
  ctaInner: {
    maxWidth: '560px',
    margin: '0 auto',
  },
  ctaEyebrow: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#E8A87C',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    margin: '0 0 16px',
  },
  ctaTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 14px',
    letterSpacing: '-0.5px',
  },
  ctaText: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.70)',
    margin: '0 0 32px',
    fontWeight: '300',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#E8A87C',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '30px',
    padding: '14px 36px',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.2px',
  },
};