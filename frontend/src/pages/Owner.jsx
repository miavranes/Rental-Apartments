import { useEffect, useState } from 'react';
import { Wifi, Car, Snowflake, Waves, UtensilsCrossed, WashingMachine, Tv, PawPrint, Flame, Building, Home, BedDouble, Users, Plus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apartmentService from '../services/apartmentService';
import PinMap from '../components/PinMap';

const BASE = 'http://localhost:5000/uploads/';

const AMENITIES_LIST = [
  { key: 'wifi',            label: 'WiFi',          Icon: Wifi },
  { key: 'car',             label: 'Parking',       Icon: Car },
  { key: 'snowflake',       label: 'Air Conditioner',  Icon: Snowflake },
  { key: 'waves',           label: 'Pool',         Icon: Waves },
  { key: 'utensils',        label: 'Kitchen',       Icon: UtensilsCrossed },
  { key: 'washing-machine', label: 'Washing machine',    Icon: WashingMachine },
  { key: 'tv',              label: 'TV',            Icon: Tv },
  { key: 'paw-print',       label: 'Pet friendly',   Icon: PawPrint },
  { key: 'flame',           label: 'Grill',       Icon: Flame },
  { key: 'building',        label: 'Balcony',        Icon: Building },
];

export default function Owner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const emptyForm = { title: '', location: '', address: '', description: '', price_per_night: '', bedrooms: 1, beds: 1, max_guests: 1 };
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [pin, setPin] = useState(null); // { lat, lng }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== 'owner') { navigate('/'); return; }
    fetchApartments();
  }, [user?.role, navigate]);

  const fetchApartments = () => {
    setLoading(true);
    apartmentService.getMine()
      .then(setApartments)
      .catch(() => setApartments([]))
      .finally(() => setLoading(false));
  };

  const openNew = () => {
    setEditTarget(null); setForm(emptyForm); setImages([]); setPreviews([]); setAmenities([]); setPin(null); setError(''); setShowForm(true);
  };
  const openEdit = (apt) => {
    setEditTarget(apt);
    setForm({ title: apt.title || '', location: apt.location || '', address: apt.address || '', description: apt.description || '', price_per_night: apt.price_per_night || '', bedrooms: apt.bedrooms || 1, beds: apt.beds || 1, max_guests: apt.max_guests || 1 });
    setImages([]); setPreviews([]);
    setAmenities(apt.amenities?.map(a => a.icon || a.key) || []);
    setPin(apt.lat && apt.lng ? { lat: parseFloat(apt.lat), lng: parseFloat(apt.lng) } : null);
    setError(''); setShowForm(true);
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const toggleAmenity = (key) => {
    setAmenities(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      fd.append('amenities', JSON.stringify(amenities));
      if (pin) { fd.append('lat', pin.lat); fd.append('lng', pin.lng); }

      if (editTarget) await apartmentService.update(editTarget.id, fd);
      else await apartmentService.create(fd);

      setSuccess(editTarget ? 'Listing updated!' : 'Listing created!');
      setShowForm(false);
      fetchApartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apartmentService.delete(deleteId);
      setDeleteId(null);
      setSuccess('Listing deleted.');
      fetchApartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete.');
      setDeleteId(null);
    }
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link to="/" style={s.brand}>Rentura</Link>
        <div style={s.navLinks}>
          <Link to="/profile" style={s.navLink}>Profile</Link>
          <button onClick={logout} style={s.navLogout}>Sign out</button>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>My listings</h1>
            <p style={s.pageSub}>Manage your properties on Rentura</p>
          </div>
          <button onClick={openNew} style={s.addBtn}><Plus size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />New listing</button>
        </div>

        {success && <div style={s.successBanner}>{success}</div>}
        {error && !showForm && <div style={s.errorBanner}>{error}</div>}

        {loading ? (
          <div style={s.grid}>{[1,2,3].map(i => <div key={i} style={s.skeleton} />)}</div>
        ) : apartments.length === 0 ? (
          <div style={s.empty}>
            <Home size={64} color="#ddd" strokeWidth={1} style={{ marginBottom: 16 }} />
            <h3 style={s.emptyTitle}>No listings yet</h3>
            <p style={s.emptySub}>Add your first property to start receiving bookings.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {apartments.map(apt => (
              <div key={apt.id} style={s.card}>
                <div style={s.cardImg}>
                  {apt.images?.length > 0
                    ? <img src={BASE + apt.images[0].image_url} alt={apt.title} style={s.cardImgEl} />
                    : <div style={s.cardImgPlaceholder}><Home size={40} color="#ccc" strokeWidth={1.5} /></div>}
                </div>
                <div style={s.cardBody}>
                  <p style={s.cardLocation}>{apt.location}</p>
                  <h3 style={s.cardTitle}>{apt.title}</h3>
                  <p style={s.cardPrice}><strong style={{ color: '#0F4C5C' }}>${apt.price_per_night}</strong> / night</p>
                  <div style={s.cardMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BedDouble size={14} color="#aaa" /> {apt.bedrooms} bed{apt.bedrooms !== 1 ? 's' : ''}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} color="#aaa" /> {apt.max_guests} guests</span>
                  </div>
                </div>
                <div style={s.cardActions}>
                  <Link to={`/apartments/${apt.id}`} style={s.viewBtn}>View</Link>
                  <button onClick={() => openEdit(apt)} style={s.editBtn}>Edit</button>
                  <button onClick={() => setDeleteId(apt.id)} style={s.deleteBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{editTarget ? 'Edit listing' : 'New listing'}</h2>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}><X size={20} /></button>
            </div>

            {error && <div style={s.errorBanner}>{error}</div>}

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.row}>
                <div style={{ ...s.field, flex: 2 }}>
                  <label style={s.label}>Title</label>
                  <input style={s.input} required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Cozy apartment in the city center"
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Price / night ($)</label>
                  <input style={s.input} type="number" required min="1" value={form.price_per_night}
                    onChange={e => setForm({ ...form, price_per_night: e.target.value })}
                    placeholder="80"
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
              </div>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Location</label>
                  <input style={s.input} required value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Budva, Montenegro"
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>Address</label>
                  <input style={s.input} value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Mediteranska 12"
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Pin location on map</label>
                <PinMap pin={pin} onPin={setPin} />
              </div>

              <div style={s.field}>
                <label style={s.label}>Description</label>
                <textarea style={{ ...s.input, height: 90, resize: 'vertical' }} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your place..."
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'} />
              </div>

              <div style={s.row}>
                {[{ key: 'bedrooms', label: 'Bedrooms' }, { key: 'beds', label: 'Beds' }, { key: 'max_guests', label: 'Max guests' }].map(({ key, label }) => (
                  <div key={key} style={{ ...s.field, flex: 1 }}>
                    <label style={s.label}>{label}</label>
                    <div style={s.counter}>
                      <button type="button" style={s.counterBtn} onClick={() => setForm(f => ({ ...f, [key]: Math.max(1, f[key] - 1) }))}>−</button>
                      <span style={s.counterVal}>{form[key]}</span>
                      <button type="button" style={s.counterBtn} onClick={() => setForm(f => ({ ...f, [key]: f[key] + 1 }))}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={s.field}>
                <label style={s.label}>Amenities</label>
                <div style={s.amenitiesGrid}>
                  {AMENITIES_LIST.map(({ key, label, Icon }) => (
                    <div key={key} onClick={() => toggleAmenity(key)}
                        style={{ ...s.amenityChip, ...(amenities.includes(key) ? s.amenityChipActive : {}) }}>
                        <Icon size={16} strokeWidth={1.8} />
                        <span>{label}</span>
                    </div>
                    ))}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Photos</label>
                <label style={s.uploadBtn}>
                    Choose photos
                  <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
                </label>
                {previews.length > 0 && (
                  <div style={s.previewRow}>
                    {previews.map((src, i) => (
                      <img key={i} src={src} alt="" style={s.previewImg} />
                    ))}
                  </div>
                )}
                {images.length > 0 && <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>{images.length} photo(s) selected</p>}
              </div>

              <button type="submit" disabled={saving} style={s.submitBtn}
                onMouseEnter={e => e.target.style.backgroundColor = '#0a3a47'}
                onMouseLeave={e => e.target.style.backgroundColor = '#0F4C5C'}>
                {saving ? 'Saving...' : editTarget ? 'Save changes' : 'Create listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 400 }}>
            <h2 style={s.modalTitle}>Delete listing?</h2>
            <p style={{ color: '#888', fontSize: 15, margin: '12px 0 24px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)} style={{ ...s.editBtn, flex: 1, padding: 13 }}>Cancel</button>
              <button onClick={handleDelete} style={{ ...s.deleteBtn, flex: 1, padding: 13 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <footer style={s.footer}>
        <span style={{ fontSize: 13, color: '#bbb' }}>© {new Date().getFullYear()} Rentura. All rights reserved.</span>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },
  nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', backgroundColor: '#fff', borderBottom: '1px solid #ebebeb', boxShadow: '0 1px 8px rgba(15,76,92,0.06)' },
  brand: { fontSize: 22, fontWeight: 800, color: '#0F4C5C', textDecoration: 'none', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 20 },
  navLink: { color: '#333', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  navLogout: { background: 'none', border: '1px solid #ddd', borderRadius: 20, padding: '8px 18px', fontSize: 14, cursor: 'pointer', color: '#333', fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px 64px' },
  pageHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: '#0F4C5C', margin: '0 0 4px', letterSpacing: '-0.5px' },
  pageSub: { fontSize: 14, color: '#999', margin: 0 },
  addBtn: { display: 'flex', alignItems: 'center', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  successBanner: { backgroundColor: '#f0fff4', border: '1px solid #b7ebc8', color: '#2d7a47', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 },
  errorBanner: { backgroundColor: '#fff0f0', border: '1px solid #ffd0d0', color: '#c0392b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 },
  skeleton: { height: 280, borderRadius: 16, backgroundColor: '#e8e8e8' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #ebebeb', boxShadow: '0 2px 12px rgba(15,76,92,0.06)' },
  cardImg: { height: 180, backgroundColor: '#f0f0f0', overflow: 'hidden' },
  cardImgEl: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: '14px 16px 10px' },
  cardLocation: { margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#E8A87C', textTransform: 'uppercase', letterSpacing: '0.8px' },
  cardTitle: { margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1a1a1a' },
  cardPrice: { margin: '0 0 8px', fontSize: 14, color: '#888' },
  cardMeta: { display: 'flex', gap: 16, fontSize: 13, color: '#888' },
  cardActions: { display: 'flex', gap: 8, padding: '10px 16px 14px' },
  viewBtn: { flex: 1, textAlign: 'center', padding: '8px', backgroundColor: '#f0f7f9', color: '#0F4C5C', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' },
  editBtn: { flex: 1, padding: '8px', backgroundColor: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  deleteBtn: { flex: 1, padding: '8px', backgroundColor: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: '#0F4C5C', margin: '0 0 8px' },
  emptySub: { fontSize: 15, color: '#aaa', margin: 0 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: 800, color: '#0F4C5C', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 0 },
  row: { display: 'flex', gap: 16 },
  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#222', fontFamily: "'Segoe UI', sans-serif" },
  counter: { display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #ddd', borderRadius: 10, padding: '10px 16px' },
  counterBtn: { width: 28, height: 28, borderRadius: '50%', border: '1px solid #ccc', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C', fontWeight: 700, padding: 0, fontFamily: "'Segoe UI', sans-serif" },
  counterVal: { fontSize: 16, fontWeight: 600, color: '#222', flex: 1, textAlign: 'center' },
  amenitiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  amenityChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#555', userSelect: 'none', transition: 'all 0.15s' },
  amenityChipActive: { border: '1.5px solid #0F4C5C', backgroundColor: '#f0f7f9', color: '#0F4C5C', fontWeight: 600 },
  uploadBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: '#f0f7f9', color: '#0F4C5C', border: '1.5px dashed #0F4C5C', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  previewRow: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  previewImg: { width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #ddd' },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: "'Segoe UI', sans-serif" },
  footer: { borderTop: '1px solid #ebebeb', padding: 28, textAlign: 'center', backgroundColor: '#fff' },
};