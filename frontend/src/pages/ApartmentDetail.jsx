import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import apartmentService from '../services/apartmentService';
import reservationService from '../services/reservationService';
import { useAuth } from '../context/AuthContext';
import Calendar from '../components/Calendar';
import MapView from '../components/MapView';
import Navbar from '../components/Navbar';
import {
  Home, MapPin, BedDouble, Bed, Users,
  Wifi, Car, Snowflake, Waves, UtensilsCrossed, WashingMachine, Tv, PawPrint, Flame, Building,
  Sparkles, Dumbbell, ConciergeBell, Sailboat, Mountain, Coffee, Sunrise, Sun, MoonStar,
  Star, ChevronLeft, Check, X, ChevronDown
} from 'lucide-react';

const BASE = 'http://localhost:5000/uploads/';

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

function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') setActive(a => (a + 1) % images.length);
      if (e.key === 'ArrowLeft')  setActive(a => (a - 1 + images.length) % images.length);
      if (e.key === 'Escape')     setLightbox(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox, images.length]);

  if (!images || images.length === 0) {
    return (
      <div style={g.placeholder}>
        <Home size={64} color="#ccc" strokeWidth={1} />
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

      {lightbox && (
        <div style={g.lightboxBg} onClick={() => setLightbox(false)}>
          <button style={g.lbClose} onClick={() => setLightbox(false)}><X size={24} /></button>
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

function BookingPanel({ apartment, blockedDates = [] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill from search bar if available
  const [checkIn, setCheckIn]   = useState(searchParams.get('checkIn')  || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests]     = useState(Number(searchParams.get('guests')) || 1);

  const fromSearch = !!(searchParams.get('checkIn') && searchParams.get('checkOut'));
  const [editDates, setEditDates] = useState(!fromSearch); // show calendar only if no search params

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [openCal, setOpenCal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('on_arrival'); // 'online' | 'on_arrival'
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpenCal(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatDate = (str) => {
    if (!str) return null;
    return new Date(str + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
        payment_method: paymentMethod,
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
        <div style={bp.successIcon}><Check size={28} strokeWidth={2.5} color="#0F4C5C" /></div>
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
    <div style={bp.card} ref={panelRef}>
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

        {/* ── Dates pre-filled from search ── */}
        {!editDates ? (
          <div style={bp.filledDates}>
            <div style={bp.filledRow}>
              <div style={bp.filledField}>
                <span style={bp.label}>CHECK IN</span>
                <span style={bp.filledValue}>{formatDate(checkIn)}</span>
              </div>
              <div style={bp.filledDivider} />
              <div style={bp.filledField}>
                <span style={bp.label}>CHECK OUT</span>
                <span style={bp.filledValue}>{formatDate(checkOut)}</span>
              </div>
            </div>
            <button type="button" onClick={() => setEditDates(true)} style={bp.changeDatesBtn}>
              Change dates
            </button>
          </div>
        ) : (
          /* ── Calendar picker ── */
          <div style={bp.dateRow}>
            <div style={{ ...bp.dateField, position: 'relative' }}
              onClick={() => setOpenCal(o => o === 'checkin' ? null : 'checkin')}>
              <label style={bp.label}>CHECK IN</label>
              <div style={bp.dateValue}>
                {formatDate(checkIn) || <span style={{ color: '#aaa' }}>Add date</span>}
                <ChevronDown size={14} color="#aaa" style={{ marginLeft: 'auto' }} />
              </div>
              {openCal === 'checkin' && (
                <div style={bp.calDrop} onClick={e => e.stopPropagation()}>
                  <Calendar
                    value={checkIn}
                    minDate={new Date().toISOString().split('T')[0]}
                    blockedDates={blockedDates}
                    onChange={(d) => {
                      setCheckIn(d);
                      if (checkOut && d >= checkOut) setCheckOut('');
                      setOpenCal('checkout');
                    }}
                  />
                </div>
              )}
            </div>
            <div style={bp.dateDivider} />
            <div style={{ ...bp.dateField, position: 'relative' }}
              onClick={() => setOpenCal(o => o === 'checkout' ? null : 'checkout')}>
              <label style={bp.label}>CHECK OUT</label>
              <div style={bp.dateValue}>
                {formatDate(checkOut) || <span style={{ color: '#aaa' }}>Add date</span>}
                <ChevronDown size={14} color="#aaa" style={{ marginLeft: 'auto' }} />
              </div>
              {openCal === 'checkout' && (
                <div style={{ ...bp.calDrop, right: 0, left: 'auto' }} onClick={e => e.stopPropagation()}>
                  <Calendar
                    value={checkOut}
                    minDate={checkIn || new Date().toISOString().split('T')[0]}
                    blockedDates={blockedDates}
                    onChange={(d) => { setCheckOut(d); setOpenCal(null); }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Payment method */}
        <div style={bp.payRow}>
          <button
            type="button"
            onClick={() => setPaymentMethod('on_arrival')}
            style={{ ...bp.payOption, ...(paymentMethod === 'on_arrival' ? bp.payOptionActive : {}) }}
          >
            <span style={bp.payIcon}>💵</span>
            <div>
              <p style={bp.payLabel}>Pay on arrival</p>
              <p style={bp.paySub}>Cash or card at the property</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('online')}
            style={{ ...bp.payOption, ...(paymentMethod === 'online' ? bp.payOptionActive : {}) }}
          >
            <span style={bp.payIcon}>💳</span>
            <div>
              <p style={bp.payLabel}>Pay online</p>
              <p style={bp.paySub}>Secure card payment via Stripe</p>
            </div>
          </button>
        </div>

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
  dateRow: { display: 'flex', border: '1px solid #ddd', borderRadius: 12, overflow: 'visible', marginBottom: 8 },
  dateField: { flex: 1, padding: '10px 14px', cursor: 'pointer' },
  dateValue: { display: 'flex', alignItems: 'center', fontSize: 14, color: '#222', marginTop: 2 },
  dateDivider: { width: 1, backgroundColor: '#ddd', flexShrink: 0 },
  calDrop: { position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 300, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(15,76,92,0.18)', border: '1px solid rgba(15,76,92,0.08)' },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#0F4C5C', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 },
  // Pre-filled dates (from search)
  filledDates: { border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  filledRow: { display: 'flex' },
  filledField: { flex: 1, padding: '10px 14px' },
  filledDivider: { width: 1, backgroundColor: '#ddd', flexShrink: 0 },
  filledValue: { display: 'block', fontSize: 14, fontWeight: 600, color: '#111', marginTop: 2 },
  changeDatesBtn: { width: '100%', padding: '8px', background: 'none', border: 'none', borderTop: '1px solid #eee', fontSize: 13, color: '#0F4C5C', fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
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
  payRow: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  payOption: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, cursor: 'pointer', background: '#fff', textAlign: 'left', fontFamily: "'Segoe UI', sans-serif", transition: 'border-color 0.15s' },
  payOptionActive: { borderColor: '#0F4C5C', backgroundColor: '#f0f7f9' },
  payIcon: { fontSize: 20, flexShrink: 0 },
  payLabel: { fontSize: 14, fontWeight: 600, color: '#222', margin: 0 },
  paySub: { fontSize: 12, color: '#888', margin: 0 },
};

export default function ApartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [apt, setApt] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apartmentService.getOne(id),
      apartmentService.getReviews(id),
      apartmentService.getBlockedDates(id),
    ])
      .then(([aptData, reviewData, blocked]) => {
        setApt(aptData);
        setReviews(reviewData);
        setBlockedDates(blocked);
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

  const amenityIcons = {
    wifi: Wifi, car: Car, snowflake: Snowflake, waves: Waves,
    utensils: UtensilsCrossed, 'washing-machine': WashingMachine,
    tv: Tv, 'paw-print': PawPrint, flame: Flame, building: Building,
    spa: Sparkles, gym: Dumbbell, 'room-service': ConciergeBell,
    'sea-view': Sailboat, 'mountain-view': Mountain, kettle: Coffee,
    breakfast: Sunrise, lunch: Sun, dinner: MoonStar,
  };

  const amenityLabels = {
    wifi: 'WiFi', car: 'Parking', snowflake: 'Air Conditioning',
    waves: 'Pool', utensils: 'Kitchen', 'washing-machine': 'Washing Machine',
    tv: 'TV', 'paw-print': 'Pet Friendly', flame: 'Grill', building: 'Balcony',
    spa: 'Spa', gym: 'Gym', 'room-service': 'Room Service',
    'sea-view': 'Sea View', 'mountain-view': 'Mountain View', kettle: 'Kettle',
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner',
  };

  // Merge breakfast/lunch/dinner into "All Meals" if all three present
  const displayAmenities = (() => {
    const icons = apt.amenities?.map(a => a.icon) || [];
    const hasAll = ['breakfast', 'lunch', 'dinner'].every(k => icons.includes(k));
    if (hasAll) {
      const filtered = apt.amenities.filter(a => !['breakfast', 'lunch', 'dinner'].includes(a.icon));
      return [...filtered, { id: 'all-meals', icon: 'all-meals', name: 'All Meals' }];
    }
    return apt.amenities || [];
  })();

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.container}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={s.backBtn}><ChevronLeft size={16} style={{ marginRight: 2 }} />Back</button>

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
              <span style={s.metaItem}><MapPin size={14} style={{ marginRight: 4 }} />{apt.location}</span>
            </div>
          </div>
        </div>

        <Gallery images={apt.images} />

        <div style={s.body}>
          {/* Left column */}
          <div style={s.left}>
            <div style={s.statsRow}>
              {[
                { Icon: BedDouble, label: `${apt.bedrooms} bedroom${apt.bedrooms !== 1 ? 's' : ''}` },
                { Icon: Bed,       label: `${apt.beds} bed${apt.beds !== 1 ? 's' : ''}` },
                { Icon: Users,     label: `Up to ${apt.max_guests} guests` },
              ].map((item, i) => (
                <div key={i} style={s.statCard}>
                  <item.Icon size={18} color="#0F4C5C" strokeWidth={1.8} />
                  <span style={s.statLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={s.divider} />

            <section>
              <h2 style={s.sectionTitle}>About this place</h2>
              <p style={s.description}>{apt.description || 'No description provided.'}</p>
            </section>

            {apt.address && (
              <>
                <div style={s.divider} />
                <section>
                  <h2 style={s.sectionTitle}>Address</h2>
                  <p style={{ ...s.description, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                    <MapPin size={15} color="#0F4C5C" />{apt.address}
                  </p>
                  <MapView address={apt.address} title={apt.title} lat={apt.lat} lng={apt.lng} />
                </section>
              </>
            )}

            {apt.amenities && apt.amenities.length > 0 && (
              <>
                <div style={s.divider} />
                <section>
                  <h2 style={s.sectionTitle}>Amenities</h2>
                  <div style={s.amenitiesGrid}>
                    {displayAmenities.map(a => {
                      const IconComp = a.icon === 'all-meals' ? UtensilsCrossed : (amenityIcons[a.icon] || Check);
                      const label = a.icon === 'all-meals' ? 'All Meals' : (amenityLabels[a.icon] || a.name);
                      return (
                        <div key={a.id} style={s.amenityItem}>
                          <IconComp size={18} color="#0F4C5C" strokeWidth={1.8} />
                          <span style={s.amenityName}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            <div style={s.divider} />

            <section>
              <div style={s.reviewsHeader}>
                <h2 style={s.sectionTitle}>
                  {reviews.length > 0
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={18} fill="#E8A87C" color="#E8A87C" />{Number(apt.avg_rating).toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
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

          <div style={s.right}>
            {user?.id === apt.owner_id ? (
              <div style={bp.card}>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <Home size={32} color="#0F4C5C" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#0F4C5C', margin: '0 0 6px' }}>This is your listing</p>
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>You can't book your own apartment.</p>
                </div>
              </div>
            ) : (
              <BookingPanel apartment={apt} blockedDates={blockedDates} />
            )}
          </div>
        </div>
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
  brand: { fontSize: 22, fontWeight: 800, color: '#0F4C5C', textDecoration: 'none', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 20 },
  navGreeting: { color: '#666', fontSize: 14 },
  navLink: { color: '#333', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  navButtonLink: { background: '#0F4C5C', color: '#fff', textDecoration: 'none', borderRadius: 20, padding: '8px 20px', fontSize: 14, fontWeight: 600 },


  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' },
  backBtn: { background: 'none', border: 'none', color: '#0F4C5C', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '0 0 20px', fontFamily: "'Segoe UI', sans-serif" },

  
  titleRow: { marginBottom: 20 },
  title: { fontSize: 30, fontWeight: 800, color: '#0F4C5C', margin: '0 0 10px', letterSpacing: '-0.5px' },
  meta: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', fontSize: 14, color: '#444' },
  metaDot: { color: '#ccc' },

  
  body: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, marginTop: 36, alignItems: 'start' },
  left: { minWidth: 0 },
  right: {},

  
  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 },
  statCard: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 12, padding: '10px 16px' },
  statIcon: { fontSize: 18 },
  statLabel: { fontSize: 14, color: '#444', fontWeight: 500 },

  divider: { height: 1, backgroundColor: '#ebebeb', margin: '28px 0' },

  
  sectionTitle: { fontSize: 20, fontWeight: 700, color: '#0F4C5C', margin: '0 0 14px' },
  description: { fontSize: 15, color: '#555', lineHeight: 1.75, margin: 0 },

  
  amenitiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  amenityItem: { display: 'flex', alignItems: 'center', gap: 10 },
  amenityIcon: { fontSize: 20 },
  amenityName: { fontSize: 14, color: '#444' },

  
  reviewsHeader: { marginBottom: 20 },
  reviewsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  reviewCard: { backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: 20 },
  reviewTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewName: { margin: 0, fontSize: 14, fontWeight: 700, color: '#222' },
  reviewDate: { margin: 0, fontSize: 12, color: '#aaa' },
  reviewComment: { margin: 0, fontSize: 14, color: '#555', lineHeight: 1.65 },

 
  loadingPage: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Segoe UI', sans-serif" },
  spinner: { width: 36, height: 36, border: '3px solid #e0e0e0', borderTop: '3px solid #0F4C5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  
  footer: { borderTop: '1px solid #ebebeb', padding: 28, textAlign: 'center', backgroundColor: '#fff' },
  footerText: { fontSize: 13, color: '#bbb' },
};
