import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apartmentService from '../services/apartmentService';
import ApartmentCard from '../components/ApartmentCard';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';

export default function Apartments() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (searchParams.get('location')) params.location = searchParams.get('location');
    if (searchParams.get('checkIn'))  params.check_in  = searchParams.get('checkIn');
    if (searchParams.get('checkOut')) params.check_out = searchParams.get('checkOut');
    if (searchParams.get('guests'))   params.guests    = searchParams.get('guests');

    apartmentService.getAll(params)
      .then(setApartments)
      .catch(() => setApartments([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const hasFilters = searchParams.get('location') || searchParams.get('checkIn') || searchParams.get('checkOut') || searchParams.get('guests');

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.brand}>Rentura</Link>
        <div style={styles.navLinks}>
          {user ? (
            <>
              {user.role === 'owner' && <Link to="/owner" style={styles.navLink}>My listings</Link>}
              <Link to="/profile" style={styles.navProfile}>
                <div style={styles.navAvatar}>{user.name?.charAt(0).toUpperCase()}</div>
                <span>{user.name?.split(' ')[0]}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.navLink}>Log in</Link>
              <Link to="/register" style={styles.navButtonLink}>Sign up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Search bar */}
      <div style={styles.searchWrap}>
        <SearchBar />
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              {hasFilters ? 'Search results' : 'All apartments'}
            </h2>
            <p style={styles.sectionSub}>
              {loading ? 'Searching...' : `${apartments.length} place${apartments.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          {hasFilters && (
            <Link to="/apartments" style={styles.clearLink}>Clear filters</Link>
          )}
        </div>

        {loading ? (
          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} style={styles.skeleton} />)}
          </div>
        ) : apartments.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No apartments found for your search.</p>
            <Link to="/apartments" style={styles.emptyLink}>Clear filters and browse all</Link>
          </div>
        ) : (
          <div style={styles.grid}>
            {apartments.map(a => <ApartmentCard key={a.id} apartment={a} />)}
          </div>
        )}
      </section>

      <footer style={styles.footer}>
        <span style={styles.footerText}>© {new Date().getFullYear()} Rentura. All rights reserved.</span>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },
  nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', backgroundColor: '#fff', borderBottom: '1px solid #ebebeb', boxShadow: '0 1px 8px rgba(15,76,92,0.06)' },
  brand: { fontSize: '22px', fontWeight: '800', color: '#0F4C5C', textDecoration: 'none', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
  navLink: { color: '#333', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
  navProfile: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#333', fontSize: '14px', fontWeight: '500', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ccc' },
  navAvatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0F4C5C', color: '#fff', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navButtonLink: { background: '#0F4C5C', color: '#fff', textDecoration: 'none', borderRadius: '20px', padding: '8px 20px', fontSize: '14px', fontWeight: '600' },
  searchWrap: { backgroundColor: '#0F4C5C', padding: '28px 24px' },
  section: { maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 64px' },
  sectionHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' },
  sectionTitle: { fontSize: '24px', fontWeight: '700', color: '#0F4C5C', margin: '0 0 4px' },
  sectionSub: { fontSize: '14px', color: '#999', margin: 0 },
  clearLink: { fontSize: '14px', fontWeight: '600', color: '#0F4C5C', textDecoration: 'none', borderBottom: '1px solid #E8A87C', paddingBottom: '1px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
  skeleton: { borderRadius: '16px', backgroundColor: '#e8e8e8', height: '280px' },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyText: { color: '#888', fontSize: '16px', margin: '0 0 12px' },
  emptyLink: { color: '#0F4C5C', fontWeight: '600', textDecoration: 'none', fontSize: '15px' },
  footer: { borderTop: '1px solid #ebebeb', padding: '28px', textAlign: 'center', backgroundColor: '#fff' },
  footerText: { fontSize: '13px', color: '#bbb' },
};
