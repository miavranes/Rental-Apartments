import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apartmentService from '../services/apartmentService';
import reservationService from '../services/reservationService';
import { useAuth } from '../context/AuthContext';

const BASE = 'http://localhost:5000/uploads/';

// ─── Helpers ────────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }) {
  const full = Math.round(rating);
  return (
    <span style={{ fontSize: size, letterSpacing: '1px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: i <= full ? '#E8A87C' : '#ddd' }}>★</span>
      ))}
    </span>
  );
}

function Avatar({ name, image, size = 40 }) {
  if (image) return <img src={BASE + image} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#0F4C5C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: '700', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Image Gallery ───────────────────────────────────────────────────────────
function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div style={g.placeholder}>
        <span style={{ fontSize: 64 }}>🏠</span>
      </div>
    );
  }

  const src = (img) => BASE + img.image_url;

  return (
    <>
      <div style={g.wrapper}>
        {/* Main image */}
        <div style={g.main} onClick={() => setLightbox(true)}>
          <img src={src(images[active])} alt="apartment" style={g.mainImg} />
          <div style={g.mainOverlay}>
            <span style={g.viewAll}>View all photos</span>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={g.thumbs}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setActive(i)}
                style={{ ...g.thumb, ...(i === active ? g.thumbActive : {}) }}>
                <img src={src(img)} alt="" style={g.thumbImg} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div style={g.lightboxBg} onClick={() => setLightbox(false)}>
          <button style={g.lbClose} onClick={() => setLightbox(false)}>✕</button>
          <button style={{ ...g.lbNav, left: 24 }}
            onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + images.length) % images.length); }}>‹</button>
          <img src={src(images[active])} alt="" style={g.lbImg} onClick={e => e.stopPropagation()} />
          <button style={{ ...g.lbNav, right: 24 }}
            onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % images.length); }}>›</button>
          <p style={g.lbCounter}>{active + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}

const g = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 8 },
  placeholder: { height: 420, backgroundColor: '#f0f0f0', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  main: { position: 'relative', borderRadius: 20, overflow: 'hidden', height: 420, cursor: 'pointer', backgroundColor: '#eee' },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  mainOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 16 },
  viewAll: { backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20, backdropFilter: 'blur(4px)' },
  thumbs: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 },
  thumb: { flexShrink: 0, width: 80, height: 60, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.15s' },
  thumbActive: { borderColor: '#0F4C5C' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  lightboxBg: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lbImg: { maxWidth: '88vw', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain' },
  lbClose: { position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 1001 },
  lbNav: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontSize: 36, cursor: 'pointer', borderRadius: 8, padding: '8px 16px', zIndex: 1001 },
  lbCounter: { position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 },
};

// ─── Booking Panel ───────────────────────────────────────────────────────────
function BookingPanel({ apartment }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;
  const total = nights * apartment.price_per_night;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setError(''); setLoading(true);
    try {
      await reservationService.create({
        apartment_id: apartment.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={bp.card}>
        <div style={bp.successIcon}>✓</div>
        <h3 style={{ ...bp.price, textAlign: 'center', marginBottom: 8 }}>Booking confirmed!</h3>
        <p style={{ color: '#888', fontSize: 14, textAlign: 'center', margin: '0 0 20px' }}>
          Your reservation is pending approval from the host.
        </p>
        <Link to="/" style={{ ...bp.btn, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div style={bp.card}>
      <div style={bp.priceRow}>
        <span style={bp.price}>${apartment.price_per_night}</span>
        <span style={bp.perNight}> / night</span>
      </div>
      {apartment.avg_rating > 0 && (
        <div style={bp.ratingRow}>
          <Stars rating={apartment.avg_rating} />
          <span style={bp.ratingText}>{Number(apartment.avg_rating).toFixed(1)} · {apartment.review_count} reviews</span>
        </div>
      )}

      <form onSubmit={handleBook} style={bp.form}>
        <div style={bp.dateRow}>
          <div style={bp.dateField}>
            <label style={bp.label}>CHECK IN</label>
            <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]}
              onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
              required style={bp.dateInput} />
          </div>
          <div style={bp.dateDivider} />
          <div style={bp.dateField}>
            <label style={bp.label}>CHECK OUT</label>
            <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split('T')[0]}
              onChange={e => setCheckOut(e.target.value)}
              required style={bp.dateInput} />
          </div>
        </div>

        <div style={bp.guestField}>
          <label style={bp.label}>GUESTS</label>
          <div style={bp.guestRow}>
            <button type="button" style={{ ...bp.guestBtn, opacity: guests <= 1 ? 0.3 : 1 }}
              onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
            <span style={bp.guestCount}>{guests} {guests === 1 ? 'guest' : 'guests'}</span>
            <button type="button" style={{ ...bp.guestBtn, opacity: guests >= apartment.max_guests ? 0.3 : 1 }}
              onClick={() => setGuests(g => Math.min(apartment.max_guests, g + 1))}>+</button>
          </div>
        </div>

        {error && <p style={bp.error}>{error}</p>}

        <button type="submit" disabled={loading} style={bp.btn}>
          {loading ? 'Booking...' : user ? 'Reserve' : 'Log in to book'}
        </button>

        {nights > 0 && (
          <div style={bp.breakdown}>
            <div style={bp.breakRow}>
              <span>${apartment.price_per_night} × {nights} night{nights > 1 ? 's' : ''}</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div style={bp.breakDivider} />
            <div style={{ ...bp.breakRow, fontWeight: 700, color: '#0F4C5C' }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

const bp = {
  card: { backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e8e8e8', padding: 28, boxShadow: '0 4px 24px rgba(15,76,92,0.10)', position: 'sticky', top: 100 },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  price: { fontSize: 26, fontWeight: 800, color: '#0F4C5C' },
  perNight: { fontSize: 15, color: '#888' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  ratingText: { fontSize: 13, color: '#666' },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  dateRow: { display: 'flex', border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  dateField: { flex: 1, padding: '10px 14px' },
  dateDivider: { width: 1, backgroundColor: '#ddd' },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#0F4C5C', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 },
  dateInput: { border: 'none', outline: 'none', fontSize: 14, color: '#222', width: '100%', fontFamily: "'Segoe UI', sans-serif", backgroundColor: 'transparent' },
  guestField: { border: '1px solid #ddd', borderRadius: 12, padding: '10px 14px', marginBottom: 16 },
  guestRow: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 },
  guestBtn: { width: 28, height: 28, borderRadius: '50%', border: '1px solid #ccc', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C', fontWeight: 700, padding: 0 },
  guestCount: { fontSize: 14, fontWeight: 600, color: '#222', flex: 1 },
  error: { fontSize: 13, color: '#c0392b', backgroundColor: '#fff5f0', border: '1px solid #f5c6a0', borderRadius: 8, padding: '8px 12px', margin: '0 0 12px' },
  btn: { width: '100%', padding: '14px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.2px', fontFamily: "'Segoe UI', sans-serif" },
  breakdown: { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  breakRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#555' },
  breakDivider: { height: 1, backgroundColor: '#ebebeb' },
  successIcon: { width: 56, height: 56, borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#0F4C5C', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 700 },
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ApartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [apt, setApt] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apartmentService.getOne(id),
      apartmentService.getReviews(id),
    ])
      .then(([aptData, reviewData]) => {
        setApt(aptData);
        setReviews(reviewData);
      })
      .catch(() => setError('Apartment not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={s.loadingPage}>
      <div style={s.spinner} />
    </div>
  );

  if (error || !apt) return (
    <div style={s.loadingPage}>
      <p style={{ color: '#888' }}>{error || 'Not found.'}</p>
      <button onClick={() => navigate(-1)} style={s.backBtn}>← Go back</button>
    </div>
  );

  const amenityIcons = { wifi: '📶', parking: '🅿️', pool: '🏊', kitchen: '🍳', ac: '❄️', tv: '📺', washer: '🫧', gym: '🏋️' };

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <Link to="/" style={s.brand}>Rentura</Link>
        <div style={s.navLinks}>
          {user ? (
            <>
              <span style={s.navGreeting}>Hi, {user.name?.split(' ')[0]}</span>
              <Link to="/" style={s.navLink}>Home</Link>
            </>
          ) : (
            <>
              <Link to="/login" style={s.navLink}>Log in</Link>
              <Link to="/register" style={s.navButtonLink}>Sign up</Link>
            </>
          )}
        </div>
      </nav>

      <div style={s.container}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={s.backBtn}>← Back</button>

        {/* Title row */}
        <div style={s.titleRow}>
          <div>
            <h1 style={s.title}>{apt.title}</h1>
            <div style={s.meta}>
              {apt.avg_rating > 0 && (
                <span style={s.metaItem}>
                  <Stars rating={apt.avg_rating} />
                  <strong style={{ marginLeft: 4 }}>{Number(apt.avg_rating).toFixed(1)}</strong>
                  <span style={{ color: '#888' }}> · {apt.review_count} reviews</span>
                </span>
              )}
              <span style={s.metaDot}>·</span>
              <span style={s.metaItem}>📍 {apt.location}</span>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <Gallery images={apt.images} />

        {/* Body: info + booking */}
        <div style={s.body}>
          {/* Left column */}
          <div style={s.left}>
            {/* Quick stats */}
            <div style={s.statsRow}>
              {[
                { icon: '🛏', label: `${apt.bedrooms} bedroom${apt.bedrooms !== 1 ? 's' : ''}` },
                { icon: '🛌', label: `${apt.beds} bed${apt.beds !== 1 ? 's' : ''}` },
                { icon: '👥', label: `Up to ${apt.max_guests} guests` },
              ].map((item, i) => (
                <div key={i} style={s.statCard}>
                  <span style={s.statIcon}>{item.icon}</span>
                  <span style={s.statLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={s.divider} />

            {/* Description */}
            <section>
              <h2 style={s.sectionTitle}>About this place</h2>
              <p style={s.description}>{apt.description || 'No description provided.'}</p>
            </section>

            {/* Address */}
            {apt.address && (
              <>
                <div style={s.divider} />
                <section>
                  <h2 style={s.sectionTitle}>Address</h2>
                  <p style={s.description}>📍 {apt.address}</p>
                </section>
              </>
            )}

            {/* Amenities */}
            {apt.amenities && apt.amenities.length > 0 && (
              <>
                <div style={s.divider} />
                <section>
                  <h2 style={s.sectionTitle}>Amenities</h2>
                  <div style={s.amenitiesGrid}>
                    {apt.amenities.map(a => (
                      <div key={a.id} style={s.amenityItem}>
                        <span style={s.amenityIcon}>{amenityIcons[a.icon] || a.icon || '✓'}</span>
                        <span style={s.amenityName}>{a.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            <div style={s.divider} />

            {/* Reviews */}
            <section>
              <div style={s.reviewsHeader}>
                <h2 style={s.sectionTitle}>
                  {reviews.length > 0
                    ? `★ ${Number(apt.avg_rating).toFixed(1)} · ${reviews.length} review${reviews.length !== 1 ? 's' : ''}`
                    : 'No reviews yet'}
                </h2>
              </div>

              {reviews.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: 14 }}>Be the first to leave a review after your stay.</p>
              ) : (
                <div style={s.reviewsGrid}>
                  {reviews.map(r => (
                    <div key={r.id} style={s.reviewCard}>
                      <div style={s.reviewTop}>
                        <Avatar name={r.guest_name} image={r.profile_image} />
                        <div>
                          <p style={s.reviewName}>{r.guest_name}</p>
                          <p style={s.reviewDate}>{formatDate(r.created_at)}</p>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                          <Stars rating={r.rating} />
                        </div>
                      </div>
                      <p style={s.reviewComment}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column — booking */}
          <div style={s.right}>
            <BookingPanel apartment={apt} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={s.footerText}>© {new Date().getFullYear()} Rentura. All rights reserved.</span>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },

  // Nav
  nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', backgroundColor: '#fff', borderBottom: '1px solid #ebebeb', boxShadow: '0 1px 8px rgba(15,76,92,0.06)' },
  brand: { fontSize: 22, fontWeight: 800, color: '#0F4C5C', textDecoration: 'none', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 20 },
  navGreeting: { color: '#666', fontSize: 14 },
  navLink: { color: '#333', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  navButtonLink: { background: '#0F4C5C', color: '#fff', textDecoration: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 14, fontWeight: 600 },

  // Layout
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' },
  backBtn: { background: 'none', border: 'none', color: '#0F4C5C', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '0 0 20px', fontFamily: "'Segoe UI', sans-serif" },

  // Title
  titleRow: { marginBottom: 20 },
  title: { fontSize: 30, fontWeight: 800, color: '#0F4C5C', margin: '0 0 10px', letterSpacing: '-0.5px' },
  meta: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', fontSize: 14, color: '#444' },
  metaDot: { color: '#ccc' },

  // Body
  body: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, marginTop: 36, alignItems: 'start' },
  left: { minWidth: 0 },
  right: {},

  // Stats
  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 },
  statCard: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 12, padding: '10px 16px' },
  statIcon: { fontSize: 18 },
  statLabel: { fontSize: 14, color: '#444', fontWeight: 500 },

  divider: { height: 1, backgroundColor: '#ebebeb', margin: '28px 0' },

  // Description
  sectionTitle: { fontSize: 20, fontWeight: 700, color: '#0F4C5C', margin: '0 0 14px' },
  description: { fontSize: 15, color: '#555', lineHeight: 1.75, margin: 0 },

  // Amenities
  amenitiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  amenityItem: { display: 'flex', alignItems: 'center', gap: 10 },
  amenityIcon: { fontSize: 20 },
  amenityName: { fontSize: 14, color: '#444' },

  // Reviews
  reviewsHeader: { marginBottom: 20 },
  reviewsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  reviewCard: { backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: 20 },
  reviewTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewName: { margin: 0, fontSize: 14, fontWeight: 700, color: '#222' },
  reviewDate: { margin: 0, fontSize: 12, color: '#aaa' },
  reviewComment: { margin: 0, fontSize: 14, color: '#555', lineHeight: 1.65 },

  // Loading
  loadingPage: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Segoe UI', sans-serif" },
  spinner: { width: 36, height: 36, border: '3px solid #e0e0e0', borderTop: '3px solid #0F4C5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  // Footer
  footer: { borderTop: '1px solid #ebebeb', padding: 28, textAlign: 'center', backgroundColor: '#fff' },
  footerText: { fontSize: 13, color: '#bbb' },
};
