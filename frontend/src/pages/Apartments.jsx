import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apartmentService from '../services/apartmentService';
import ApartmentCard from '../components/ApartmentCard';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import {
  Wifi, Car, Snowflake, Waves, UtensilsCrossed, WashingMachine, Tv, PawPrint,
  Flame, Building, Sparkles, Dumbbell, ConciergeBell, Sailboat, Mountain,
  Coffee, Sunrise, Sun, MoonStar, SlidersHorizontal
} from 'lucide-react';

const AMENITY_FILTERS = [
  { key: 'wifi',            label: 'WiFi',             Icon: Wifi },
  { key: 'car',             label: 'Parking',          Icon: Car },
  { key: 'snowflake',       label: 'Air Conditioning', Icon: Snowflake },
  { key: 'waves',           label: 'Pool',             Icon: Waves },
  { key: 'utensils',        label: 'Kitchen',          Icon: UtensilsCrossed },
  { key: 'washing-machine', label: 'Washing Machine',  Icon: WashingMachine },
  { key: 'tv',              label: 'TV',               Icon: Tv },
  { key: 'paw-print',       label: 'Pet Friendly',     Icon: PawPrint },
  { key: 'flame',           label: 'Grill',            Icon: Flame },
  { key: 'building',        label: 'Balcony',          Icon: Building },
  { key: 'spa',             label: 'Spa',              Icon: Sparkles },
  { key: 'gym',             label: 'Gym',              Icon: Dumbbell },
  { key: 'room-service',    label: 'Room Service',     Icon: ConciergeBell },
  { key: 'sea-view',        label: 'Sea View',         Icon: Sailboat },
  { key: 'mountain-view',   label: 'Mountain View',    Icon: Mountain },
  { key: 'kettle',          label: 'Kettle',           Icon: Coffee },
  { key: 'breakfast',       label: 'Breakfast',        Icon: Sunrise },
  { key: 'lunch',           label: 'Lunch',            Icon: Sun },
  { key: 'dinner',          label: 'Dinner',           Icon: MoonStar },
];

const AMENITY_KEYS = new Set(AMENITY_FILTERS.map(a => a.key));

const parseAmenitiesParam = (raw) =>
  (raw ? raw.split(',').map(k => k.trim()).filter(k => AMENITY_KEYS.has(k)) : []);

const emptyDraft = { minPrice: '', maxPrice: '', minBedrooms: 0, minRating: 0, petFriendly: false, amenities: [] };

export default function Apartments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  const amenitiesParam = searchParams.get('amenities') ?? '';
  const urlAmenities = parseAmenitiesParam(amenitiesParam);

  // Draft state — what user is editing in the sidebar
  const [draft, setDraft] = useState(() => ({ ...emptyDraft, amenities: urlAmenities }));

  // Applied state — what's actually filtering the results (non-amenity fields)
  const [applied, setApplied] = useState(() => ({ ...emptyDraft, amenities: urlAmenities }));

  // Keep sidebar checkboxes in sync when URL amenities change (e.g. after search)
  useEffect(() => {
    const parsed = parseAmenitiesParam(amenitiesParam);
    setDraft(d => ({ ...d, amenities: parsed }));
    setApplied(d => ({ ...d, amenities: parsed }));
  }, [amenitiesParam]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (searchParams.get('location')) params.location = searchParams.get('location');
    if (searchParams.get('checkIn'))  params.check_in  = searchParams.get('checkIn');
    if (searchParams.get('checkOut')) params.check_out = searchParams.get('checkOut');
    if (searchParams.get('guests'))   params.guests    = searchParams.get('guests');
    if (urlAmenities.length > 0) params.amenities = urlAmenities.join(',');

    apartmentService.getAll(params)
      .then(setApartments)
      .catch(() => setApartments([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const setUrlAmenities = (keys) => {
    const params = new URLSearchParams(searchParams);
    if (keys.length > 0) params.set('amenities', keys.join(','));
    else params.delete('amenities');
    setSearchParams(params, { replace: true });
  };

  const toggleAmenity = (key) => {
    const next = urlAmenities.includes(key)
      ? urlAmenities.filter(k => k !== key)
      : [...urlAmenities, key];
    setUrlAmenities(next);
    setDraft(d => ({ ...d, amenities: next }));
    setApplied(d => ({ ...d, amenities: next }));
  };

  const applyFilters = () => setApplied({ ...draft });

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('amenities');
    setSearchParams(params, { replace: true });
    setDraft(emptyDraft);
    setApplied(emptyDraft);
  };

  const hasDraftChanges = JSON.stringify(draft) !== JSON.stringify(applied);
  const hasAppliedFilters = applied.minPrice || applied.maxPrice || applied.minBedrooms > 0 || applied.minRating > 0 || applied.petFriendly || urlAmenities.length > 0;

  const filtered = useMemo(() => {
    return apartments.filter(a => {
      if (applied.minPrice && a.price_per_night < Number(applied.minPrice)) return false;
      if (applied.maxPrice && a.price_per_night > Number(applied.maxPrice)) return false;
      if (applied.minBedrooms > 0 && a.bedrooms < applied.minBedrooms) return false;
      if (applied.minRating > 0 && (a.avg_rating || 0) < applied.minRating) return false;
      if (applied.petFriendly) {
        const icons = (a.amenities || []).map(am => am.icon || am);
        if (!icons.includes('paw-print')) return false;
      }
      return true;
    });
  }, [apartments, applied]);

  const hasSearchFilters = searchParams.get('location') || searchParams.get('checkIn') || searchParams.get('checkOut') || searchParams.get('guests');

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link to="/" style={s.brand}>Rentura</Link>
        <div style={s.navLinks}>
          {user ? (
            <>
              {user.role === 'owner' && <Link to="/owner" style={s.navLink}>My listings</Link>}
              <Link to="/profile" style={s.navProfile}>
                <div style={s.navAvatar}>{user.name?.charAt(0).toUpperCase()}</div>
                <span>{user.name?.split(' ')[0]}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" style={s.navLink}>Log in</Link>
              <Link to="/register" style={s.navButtonLink}>Sign up</Link>
            </>
          )}
        </div>
      </nav>

      <div style={s.searchWrap}>
        <SearchBar />
      </div>

      <div style={s.body}>
        {/* ── Filter Sidebar ── */}
        {showFilters && (
          <aside style={s.sidebar}>
            <div style={s.sidebarHeader}>
              <span style={s.sidebarTitle}>Filters</span>
              {hasAppliedFilters && (
                <button onClick={clearFilters} style={s.resetBtn}>Clear all</button>
              )}
            </div>

            {/* Price */}
            <div style={s.filterSection}>
              <p style={s.filterLabel}>Price per night ($)</p>
              <div style={s.priceRow}>
                <input
                  type="number" min="0" placeholder="Min"
                  value={draft.minPrice} onChange={e => setDraft(d => ({ ...d, minPrice: e.target.value }))}
                  style={s.priceInput}
                />
                <span style={{ color: '#ccc', fontSize: 14 }}>—</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={draft.maxPrice} onChange={e => setDraft(d => ({ ...d, maxPrice: e.target.value }))}
                  style={s.priceInput}
                />
              </div>
            </div>

            <div style={s.divider} />

            {/* Bedrooms */}
            <div style={s.filterSection}>
              <p style={s.filterLabel}>Bedrooms (min)</p>
              <div style={s.bedroomRow}>
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setDraft(d => ({ ...d, minBedrooms: n }))}
                    style={{ ...s.bedroomBtn, ...(draft.minBedrooms === n ? s.bedroomBtnActive : {}) }}
                  >
                    {n === 0 ? 'Any' : n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.divider} />

            {/* Rating */}
            <div style={s.filterSection}>
              <p style={s.filterLabel}>Minimum rating</p>
              <div style={s.bedroomRow}>
                {[0, 3, 3.5, 4, 4.5].map(n => (
                  <button
                    key={n}
                    onClick={() => setDraft(d => ({ ...d, minRating: n }))}
                    style={{ ...s.bedroomBtn, ...(draft.minRating === n ? s.bedroomBtnActive : {}) }}
                  >
                    {n === 0 ? 'Any' : `${n}★`}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.divider} />

            {/* Pet friendly */}
            <div style={s.filterSection}>
              <label style={s.checkRow}>
                <input
                  type="checkbox"
                  checked={draft.petFriendly}
                  onChange={e => setDraft(d => ({ ...d, petFriendly: e.target.checked }))}
                  style={{ accentColor: '#0F4C5C', width: 16, height: 16 }}
                />
                <span style={s.checkLabel}>Pet Friendly only</span>
              </label>
            </div>

            <div style={s.divider} />

            {/* Amenities */}
            <div style={s.filterSection}>
              <p style={s.filterLabel}>Amenities</p>
              <div style={s.amenityList}>
                {AMENITY_FILTERS.map(({ key, label, Icon }) => (
                  <label key={key} style={s.amenityRow}>
                    <input
                      type="checkbox"
                      checked={urlAmenities.includes(key)}
                      onChange={() => toggleAmenity(key)}
                      style={{ accentColor: '#0F4C5C', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <Icon size={15} color="#0F4C5C" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <span style={s.amenityLabel}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={s.filterActions}>
              {hasAppliedFilters && (
                <button onClick={clearFilters} style={s.clearBtn}>
                  Remove filters
                </button>
              )}
            </div>
          </aside>
        )}

        {/* ── Results ── */}
        <section style={s.results}>
          <div style={s.resultsHeader}>
            <div>
              <h2 style={s.sectionTitle}>
                {hasSearchFilters ? 'Search results' : 'All apartments'}
              </h2>
              <p style={s.sectionSub}>
                {loading ? 'Searching...' : `${filtered.length} place${filtered.length !== 1 ? 's' : ''} found`}
                {hasAppliedFilters && !loading && <span style={s.filterBadge}> · filters active</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {hasSearchFilters && (
                <button
                  type="button"
                  style={s.clearLink}
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (urlAmenities.length > 0) params.set('amenities', urlAmenities.join(','));
                    navigate(`/apartments${params.toString() ? `?${params}` : ''}`);
                  }}
                >
                  Clear search
                </button>
              )}
              <button
                onClick={() => setShowFilters(v => !v)}
                style={s.toggleFiltersBtn}
              >
                <SlidersHorizontal size={15} style={{ marginRight: 6 }} />
                {showFilters ? 'Hide filters' : 'Show filters'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={s.grid}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} style={s.skeleton} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <p style={s.emptyText}>No apartments match your filters.</p>
              <button onClick={clearFilters} style={s.emptyLink}>Clear filters</button>
            </div>
          ) : (
            <div style={s.grid}>
              {filtered.map(a => <ApartmentCard key={a.id} apartment={a} />)}
            </div>
          )}
        </section>
      </div>

      <footer style={s.footer}>
        <span style={s.footerText}>© {new Date().getFullYear()} Rentura. All rights reserved.</span>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },
  nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', backgroundColor: '#fff', borderBottom: '1px solid #ebebeb', boxShadow: '0 1px 8px rgba(15,76,92,0.06)' },
  brand: { fontSize: '22px', fontWeight: '800', color: '#0F4C5C', textDecoration: 'none', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
  navLink: { color: '#333', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
  navProfile: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#333', fontSize: '14px', fontWeight: '500', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ccc' },
  navAvatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0F4C5C', color: '#fff', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navButtonLink: { background: '#0F4C5C', color: '#fff', textDecoration: 'none', borderRadius: '20px', padding: '8px 20px', fontSize: '14px', fontWeight: '600' },
  searchWrap: { backgroundColor: '#0F4C5C', padding: '28px 24px' },

  body: { display: 'flex', maxWidth: '1300px', margin: '0 auto', padding: '40px 24px 64px', gap: 32, alignItems: 'flex-start' },

  // Sidebar
  sidebar: { width: 260, flexShrink: 0, backgroundColor: '#fff', borderRadius: 16, border: '1px solid #ebebeb', padding: '24px 20px', position: 'sticky', top: 90 },
  sidebarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sidebarTitle: { fontSize: 16, fontWeight: 700, color: '#0F4C5C' },
  resetBtn: { background: 'none', border: 'none', fontSize: 13, color: '#E8A87C', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: "'Segoe UI', sans-serif" },
  filterSection: { marginBottom: 4 },
  filterLabel: { fontSize: 12, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' },
  divider: { height: 1, backgroundColor: '#f0f0f0', margin: '16px 0' },
  priceRow: { display: 'flex', alignItems: 'center', gap: 8 },
  priceInput: { flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', color: '#222', fontFamily: "'Segoe UI', sans-serif", width: '100%', boxSizing: 'border-box' },
  bedroomRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  bedroomBtn: { padding: '6px 12px', border: '1px solid #ddd', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#555', fontFamily: "'Segoe UI', sans-serif", transition: 'all 0.15s' },
  bedroomBtnActive: { backgroundColor: '#0F4C5C', color: '#fff', borderColor: '#0F4C5C', fontWeight: 600 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  checkLabel: { fontSize: 14, color: '#333' },
  amenityList: { display: 'flex', flexDirection: 'column', gap: 8 },
  amenityRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  amenityLabel: { fontSize: 13, color: '#444' },
  filterActions: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 },
  applyBtn: { width: '100%', padding: '11px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Segoe UI', sans-serif", transition: 'background 0.15s' },
  clearBtn: { width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#c0392b', border: '1px solid #ffd0d0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },

  // Results
  results: { flex: 1, minWidth: 0 },
  resultsHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 },
  sectionTitle: { fontSize: '24px', fontWeight: '700', color: '#0F4C5C', margin: '0 0 4px' },
  sectionSub: { fontSize: '14px', color: '#999', margin: 0 },
  filterBadge: { color: '#E8A87C', fontWeight: 600 },
  clearLink: { fontSize: '14px', fontWeight: '600', color: '#0F4C5C', textDecoration: 'none', borderBottom: '1px solid #E8A87C', paddingBottom: '1px' },
  toggleFiltersBtn: { display: 'flex', alignItems: 'center', padding: '8px 16px', border: '1px solid #ddd', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#333', fontFamily: "'Segoe UI', sans-serif" },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  skeleton: { borderRadius: '16px', backgroundColor: '#e8e8e8', height: '280px' },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyText: { color: '#888', fontSize: '16px', margin: '0 0 12px' },
  emptyLink: { color: '#0F4C5C', fontWeight: '600', fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif", textDecoration: 'underline' },
  footer: { borderTop: '1px solid #ebebeb', padding: '28px', textAlign: 'center', backgroundColor: '#fff' },
  footerText: { fontSize: '13px', color: '#bbb' },
};
