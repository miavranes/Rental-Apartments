import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apartmentService from '../services/apartmentService';
import ApartmentCard from '../components/ApartmentCard';
import SearchBar from '../components/SearchBar';
import Navbar from '../components/Navbar';
import {
  Wifi, Car, Snowflake, Waves, UtensilsCrossed, WashingMachine, Tv, PawPrint,
  Flame, Building, Sparkles, Dumbbell, ConciergeBell, Sailboat, Mountain,
  Coffee, Sunrise, Sun, MoonStar, SlidersHorizontal
} from 'lucide-react';

const AMENITY_FILTERS = [
  { key: 'wifi',            Icon: Wifi },
  { key: 'car',             Icon: Car },
  { key: 'snowflake',       Icon: Snowflake },
  { key: 'waves',           Icon: Waves },
  { key: 'utensils',        Icon: UtensilsCrossed },
  { key: 'washing-machine', Icon: WashingMachine },
  { key: 'tv',              Icon: Tv },
  { key: 'paw-print',       Icon: PawPrint },
  { key: 'flame',           Icon: Flame },
  { key: 'building',        Icon: Building },
  { key: 'spa',             Icon: Sparkles },
  { key: 'gym',             Icon: Dumbbell },
  { key: 'room-service',    Icon: ConciergeBell },
  { key: 'sea-view',        Icon: Sailboat },
  { key: 'mountain-view',   Icon: Mountain },
  { key: 'kettle',          Icon: Coffee },
  { key: 'breakfast',       Icon: Sunrise },
  { key: 'lunch',           Icon: Sun },
  { key: 'dinner',          Icon: MoonStar },
];

const AMENITY_KEYS = new Set(AMENITY_FILTERS.map(a => a.key));

const parseAmenitiesParam = (raw) =>
  (raw ? raw.split(',').map(k => k.trim()).filter(k => AMENITY_KEYS.has(k)) : []);

const emptyFilters = { minPrice: '', maxPrice: '', minBedrooms: 0, minRating: 0, petFriendly: false };

export default function Apartments() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  const amenitiesParam = searchParams.get('amenities') ?? '';
  const urlAmenities = useMemo(() => parseAmenitiesParam(amenitiesParam), [amenitiesParam]);
  const [filters, setFilters] = useState(emptyFilters);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (searchParams.get('location')) params.location = searchParams.get('location');
    if (searchParams.get('country'))  params.country  = searchParams.get('country');
    if (searchParams.get('checkIn'))  params.check_in  = searchParams.get('checkIn');
    if (searchParams.get('checkOut')) params.check_out = searchParams.get('checkOut');
    if (searchParams.get('guests'))   params.guests    = searchParams.get('guests');
    if (urlAmenities.length > 0) params.amenities = urlAmenities.join(',');

    apartmentService.getAll(params)
      .then(setApartments)
      .catch(() => setApartments([]))
      .finally(() => setLoading(false));
  }, [searchParams, urlAmenities]);

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
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('amenities');
    setSearchParams(params, { replace: true });
    setFilters(emptyFilters);
  };

  const hasAppliedFilters = filters.minPrice || filters.maxPrice || filters.minBedrooms > 0 || filters.minRating > 0 || filters.petFriendly || urlAmenities.length > 0;

  const filtered = useMemo(() => {
    return apartments.filter(a => {
      if (filters.minPrice && a.price_per_night < Number(filters.minPrice)) return false;
      if (filters.maxPrice && a.price_per_night > Number(filters.maxPrice)) return false;
      if (filters.minBedrooms > 0 && a.bedrooms < filters.minBedrooms) return false;
      if (filters.minRating > 0 && (a.avg_rating || 0) < filters.minRating) return false;
      if (filters.petFriendly) {
        const icons = (a.amenities || []).map(am => am.icon || am);
        if (!icons.includes('paw-print')) return false;
      }
      return true;
    });
  }, [apartments, filters]);

  const hasSearchFilters = searchParams.get('location') || searchParams.get('checkIn') || searchParams.get('checkOut') || searchParams.get('guests');

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.searchWrap}>
        <SearchBar />
      </div>

      <div style={s.body}>
        {showFilters && (
          <aside style={s.sidebar}>
            <div style={s.sidebarHeader}>
              <span style={s.sidebarTitle}>{t('filters.filters')}</span>
              {hasAppliedFilters && (
                <button onClick={clearFilters} style={s.resetBtn}>{t('filters.clearAll')}</button>
              )}
            </div>

            <div style={s.filterSection}>
              <p style={s.filterLabel}>{t('filters.pricePerNight')}</p>
              <div style={s.priceRow}>
                <input
                  type="number" min="0" placeholder={t('common.min')}
                  value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                  style={s.priceInput}
                />
                <span style={{ color: '#ccc', fontSize: 14 }}>—</span>
                <input
                  type="number" min="0" placeholder={t('common.max')}
                  value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                  style={s.priceInput}
                />
              </div>
            </div>

            <div style={s.divider} />

           
            <div style={s.filterSection}>
              <p style={s.filterLabel}>{t('filters.bedrooms')}</p>
              <div style={s.bedroomRow}>
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setFilters(f => ({ ...f, minBedrooms: n }))}
                    style={{ ...s.bedroomBtn, ...(filters.minBedrooms === n ? s.bedroomBtnActive : {}) }}
                  >
                    {n === 0 ? t('filters.any') : n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.divider} />

            {/* Rating */}
            <div style={s.filterSection}>
              <p style={s.filterLabel}>{t('filters.minRating')}</p>
              <div style={s.bedroomRow}>
                {[0, 3, 3.5, 4, 4.5].map(n => (
                  <button
                    key={n}
                    onClick={() => setFilters(f => ({ ...f, minRating: n }))}
                    style={{ ...s.bedroomBtn, ...(filters.minRating === n ? s.bedroomBtnActive : {}) }}
                  >
                    {n === 0 ? t('filters.any') : `${n}★`}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.divider} />

            <div style={s.filterSection}>
              <label style={s.checkRow}>
                <input
                  type="checkbox"
                  checked={filters.petFriendly}
                  onChange={e => setFilters(f => ({ ...f, petFriendly: e.target.checked }))}
                  style={{ accentColor: '#0F4C5C', width: 16, height: 16 }}
                />
                <span style={s.checkLabel}>{t('filters.petFriendly')}</span>
              </label>
            </div>

            <div style={s.divider} />

            {/* Amenities */}
            <div style={s.filterSection}>
              <p style={s.filterLabel}>{t('filters.amenities')}</p>
              <div style={s.amenityList}>
                {AMENITY_FILTERS.map(({ key, Icon }) => (
                  <label key={key} style={s.amenityRow}>
                    <input
                      type="checkbox"
                      checked={urlAmenities.includes(key)}
                      onChange={() => toggleAmenity(key)}
                      style={{ accentColor: '#0F4C5C', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <Icon size={15} color="#0F4C5C" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <span style={s.amenityLabel}>{t(`amenities.${key}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={s.filterActions}>
              {hasAppliedFilters && (
                <button onClick={clearFilters} style={s.clearBtn}>
                  {t('filters.removeFilters')}
                </button>
              )}
            </div>
          </aside>
        )}

        <section style={s.results}>
          <div style={s.resultsHeader}>
            <div>
              <h2 style={s.sectionTitle}>
                {hasSearchFilters ? t('apartments.searchResults') : t('apartments.allApartments')}
              </h2>
              <p style={s.sectionSub}>
                {loading ? t('apartments.searching') : `${filtered.length} ${filtered.length !== 1 ? t('apartments.placesFoundPlural') : t('apartments.placesFound')}`}
                {hasAppliedFilters && !loading && <span style={s.filterBadge}> {t('filters.filtersActive')}</span>}
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
                  {t('filters.clearSearch')}
                </button>
              )}
              <button
                onClick={() => setShowFilters(v => !v)}
                style={s.toggleFiltersBtn}
              >
                <SlidersHorizontal size={15} style={{ marginRight: 6 }} />
                {showFilters ? t('filters.hideFilters') : t('filters.showFilters')}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={s.grid}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} style={s.skeleton} className="skeleton-shimmer" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.empty}>
              <p style={s.emptyText}>{t('apartments.noResults')}</p>
              <button onClick={clearFilters} style={s.emptyLink}>{t('apartments.clearFilters')}</button>
            </div>
          ) : (
            <div style={s.grid}>
              {filtered.map((a, i) => <ApartmentCard key={a.id} apartment={a} index={i} />)}
            </div>
          )}
        </section>
      </div>
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

  results: { flex: 1, minWidth: 0 },
  resultsHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 },
  sectionTitle: { fontSize: '24px', fontWeight: '700', color: '#0F4C5C', margin: '0 0 4px' },
  sectionSub: { fontSize: '14px', color: '#999', margin: 0 },
  filterBadge: { color: '#E8A87C', fontWeight: 600 },
  clearLink: { fontSize: '14px', fontWeight: '600', color: '#0F4C5C', textDecoration: 'none', borderBottom: '1px solid #E8A87C', paddingBottom: '1px' },
  toggleFiltersBtn: { display: 'flex', alignItems: 'center', padding: '8px 16px', border: '1px solid #ddd', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#333', fontFamily: "'Segoe UI', sans-serif" },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  skeleton: { borderRadius: '16px', height: '280px' },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyText: { color: '#888', fontSize: '16px', margin: '0 0 12px' },
  emptyLink: { color: '#0F4C5C', fontWeight: '600', fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif", textDecoration: 'underline' },
};