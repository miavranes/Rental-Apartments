import { useEffect, useState } from 'react';
import { Wifi, Car, Snowflake, Waves, UtensilsCrossed, WashingMachine, Tv, PawPrint, Flame, Building, Home, BedDouble, Users, Plus, X, Sparkles, Dumbbell, ConciergeBell, Sailboat, Mountain, Coffee, Sunrise, Sun, MoonStar, CalendarDays, Banknote, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import apartmentService from '../services/apartmentService';
import geocodingService from '../services/geocodingService';
import PinMap from '../components/PinMap';
import Calendar from '../components/Calendar';
import LocationAutocomplete from '../components/LocationAutocomplete';
import Navbar from '../components/Navbar';
import { formatLocation } from '../utils/locationUtils';

import { UPLOADS_URL } from '../config';
const BASE = UPLOADS_URL;

const AMENITIES_LIST = [
  { key: 'wifi',            label: 'WiFi',            Icon: Wifi },
  { key: 'car',             label: 'Parking',         Icon: Car },
  { key: 'snowflake',       label: 'Air Conditioning', Icon: Snowflake },
  { key: 'waves',           label: 'Pool',            Icon: Waves },
  { key: 'utensils',        label: 'Kitchen',         Icon: UtensilsCrossed },
  { key: 'washing-machine', label: 'Washing Machine', Icon: WashingMachine },
  { key: 'tv',              label: 'TV',              Icon: Tv },
  { key: 'paw-print',       label: 'Pet Friendly',    Icon: PawPrint },
  { key: 'flame',           label: 'Grill',           Icon: Flame },
  { key: 'building',        label: 'Balcony',         Icon: Building },
  { key: 'spa',             label: 'Spa',             Icon: Sparkles },
  { key: 'gym',             label: 'Gym',             Icon: Dumbbell },
  { key: 'room-service',    label: 'Room Service',    Icon: ConciergeBell },
  { key: 'sea-view',        label: 'Sea View',        Icon: Sailboat },
  { key: 'mountain-view',   label: 'Mountain View',   Icon: Mountain },
  { key: 'kettle',          label: 'Kettle',          Icon: Coffee },
  { key: 'breakfast',       label: 'Breakfast',       Icon: Sunrise },
  { key: 'lunch',           label: 'Lunch',           Icon: Sun },
  { key: 'dinner',          label: 'Dinner',          Icon: MoonStar },
];

export default function Owner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const emptyForm = { title: '', location: '', municipality: '', country: '', address: '', description: '', price_per_night: '', bedrooms: 1, beds: 1, max_guests: 1, check_in_time: '14:00', check_out_time: '11:00', payment_method: 'on_arrival' };
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // images already saved in DB
  const [amenities, setAmenities] = useState([]);
  const [pin, setPin] = useState(null); // { lat, lng }
  const [manualPin, setManualPin] = useState(false); // true once user has explicitly placed/cleared the pin themselves
  const [saving, setSaving] = useState(false);
  const [availApt, setAvailApt] = useState(null); // apartment for availability modal
  const [blockedDates, setBlockedDates] = useState([]); // blocked dates for availApt
  const [availLoading, setAvailLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'owner') { navigate('/'); return; }
    fetchApartments();
  }, [user?.role, navigate]);

  useEffect(() => {
    if (manualPin || !showForm) return;
    if (form.address.trim().length < 5) return;
    const query = [form.address, form.location, form.municipality, form.country].filter(Boolean).join(', ');

    const timer = setTimeout(async () => {
      try {
        const results = await geocodingService.search(query);
        if (results && results.length > 0 && results[0].lat && results[0].lng) {
          setPin({ lat: results[0].lat, lng: results[0].lng });
        }
      } catch {
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [form.address, form.location, form.municipality, form.country, manualPin, showForm]);

  const fetchApartments = () => {
    setLoading(true);
    apartmentService.getMine()
      .then(setApartments)
      .catch(() => setApartments([]))
      .finally(() => setLoading(false));
  };

  const openNew = () => {
    setEditTarget(null); setForm(emptyForm); setImages([]); setPreviews([]); setExistingImages([]); setAmenities([]); setPin(null); setManualPin(false); setError(''); setShowForm(true);
  };
  const openEdit = (apt) => {
    setEditTarget(apt);
    setForm({ title: apt.title || '', location: apt.location || '', municipality: apt.municipality || '', country: apt.country || '', address: apt.address || '', description: apt.description || '', price_per_night: apt.price_per_night || '', bedrooms: apt.bedrooms || 1, beds: apt.beds || 1, max_guests: apt.max_guests || 1, check_in_time: (apt.check_in_time || '14:00:00').slice(0, 5), check_out_time: (apt.check_out_time || '11:00:00').slice(0, 5), payment_method: apt.payment_method || 'on_arrival' });
    setImages([]); setPreviews([]);
    setExistingImages(apt.images || []);
    setAmenities(apt.amenities?.map(a => a.icon || a.key) || []);
    setPin(apt.lat && apt.lng ? { lat: parseFloat(apt.lat), lng: parseFloat(apt.lng) } : null);
    setManualPin(!!(apt.lat && apt.lng)); // an already-saved pin is treated as confirmed, so editing the address won't jump it
    setError(''); setShowForm(true);
  };

  const handleDeleteExistingImage = async (imageId) => {
    try {
      await apartmentService.deleteImage(editTarget.id, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch {
      setError('Failed to delete image.');
    }
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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

      setSuccess(editTarget ? t('owner.updated') : t('owner.created'));
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
      setSuccess(t('owner.deleted'));
      fetchApartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError(t('common.error'));
      setDeleteId(null);
    }
  };

  const openAvailability = async (apt) => {
    setAvailApt(apt);
    setAvailLoading(true);
    try {
      const dates = await apartmentService.getBlockedDates(apt.id);
      setBlockedDates(dates);
    } catch {
      setBlockedDates([]);
    } finally {
      setAvailLoading(false);
    }
  };

  const handleCalendarToggle = async (dateStr) => {
    if (!availApt) return;
    const isBlocked = blockedDates.includes(dateStr);
    try {
      if (isBlocked) {
        await apartmentService.unblockDates(availApt.id, [dateStr]);
        setBlockedDates(prev => prev.filter(d => d !== dateStr));
      } else {
        await apartmentService.blockDates(availApt.id, [dateStr]);
        setBlockedDates(prev => [...prev, dateStr]);
      }
    } catch {
      setError('Failed to update availability.');
    }
  };

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.container}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>{t('owner.myListings')}</h1>
            <p style={s.pageSub}>{t('owner.manageSub')}</p>
          </div>
          <button onClick={openNew} style={s.addBtn} className="btn-press"><Plus size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />{t('owner.newListing')}</button>
        </div>

        {success && <div style={s.successBanner}>{success}</div>}
        {error && !showForm && <div style={s.errorBanner}>{error}</div>}

        {loading ? (
          <div style={s.grid}>{[1,2,3].map(i => <div key={i} style={s.skeleton} />)}</div>
        ) : apartments.length === 0 ? (
          <div style={s.empty}>
            <Home size={64} color="#ddd" strokeWidth={1} style={{ marginBottom: 16 }} />
            <h3 style={s.emptyTitle}>{t('owner.noListings')}</h3>
            <p style={s.emptySub}>{t('owner.noListingsSub')}</p>
          </div>
        ) : (
          <div style={s.grid}>
            {apartments.map((apt, i) => (
              <div key={apt.id} style={{ ...s.card, animationDelay: `${Math.min(i, 8) * 60}ms` }} className="anim-fade-in-up card-hover">
                <div style={s.cardImg}>
                  {apt.images?.length > 0
                    ? <img src={BASE + apt.images[0].image_url} alt={apt.title} style={s.cardImgEl} />
                    : <div style={s.cardImgPlaceholder}><Home size={40} color="#ccc" strokeWidth={1.5} /></div>}
                </div>
                <div style={s.cardBody}>
                  <p style={s.cardLocation}>{formatLocation(apt)}</p>
                  <h3 style={s.cardTitle}>{apt.title}</h3>
                  <p style={s.cardPrice}><strong style={{ color: '#0F4C5C' }}>${apt.price_per_night}</strong> / night</p>
                  <div style={s.cardMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BedDouble size={14} color="#aaa" /> {apt.bedrooms} bed{apt.bedrooms !== 1 ? 's' : ''}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} color="#aaa" /> {apt.max_guests} guests</span>
                  </div>
                </div>
                <div style={s.cardActions}>
                  <Link to={`/apartments/${apt.id}`} style={s.viewBtn}>{t('owner.view')}</Link>
                  <button onClick={() => openEdit(apt)} style={s.editBtn}>{t('owner.edit')}</button>
                  <button onClick={() => openAvailability(apt)} style={s.availBtn} title={t('owner.availability')}><CalendarDays size={14} /></button>
                  <button onClick={() => setDeleteId(apt.id)} style={s.deleteBtn}>{t('owner.delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay} className="anim-overlay-in" onClick={() => setShowForm(false)}>
          <div style={s.modal} className="anim-modal-in" onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{editTarget ? t('owner.editListing') : t('owner.createListing')}</h2>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}><X size={20} /></button>
            </div>

            {error && <div style={s.errorBanner}>{error}</div>}

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.row}>
                <div style={{ ...s.field, flex: 2 }}>
                  <label style={s.label}>{t('owner.title')}</label>
                  <input style={s.input} required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder={t('owner.titlePlaceholder')}
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>{t('owner.priceNight')}</label>
                  <input style={s.input} type="number" required min="1" value={form.price_per_night}
                    onChange={e => setForm({ ...form, price_per_night: e.target.value })}
                    placeholder="80"
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
              </div>

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>{t('owner.location')}</label>
                  <LocationAutocomplete
                    required
                    value={{
                      location: form.location,
                      municipality: form.municipality,
                      country: form.country,
                      label: formatLocation(form),
                    }}
                    onChange={(place) => {
                      setManualPin(false);
                      setForm({
                        ...form,
                        location: place.location,
                        municipality: place.municipality || '',
                        country: place.country || '',
                      });
                    }}
                    onCoords={(coords) => { setManualPin(false); setPin(coords); }}
                    placeholder={t('owner.locationPlaceholder')}
                    inputStyle={s.input}
                  />
                </div>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>{t('owner.address')}</label>
                  <input style={s.input} value={form.address}
                    onChange={e => { setManualPin(false); setForm({ ...form, address: e.target.value }); }}
                    placeholder={t('owner.addressPlaceholder')}
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>{t('owner.pinLocation')}</label>
                <PinMap pin={pin} onPin={(coords) => { setManualPin(true); setPin(coords); }} />
                {pin && (
                  <p style={s.pinHint}>
                    {manualPin ? t('owner.manualPinned') : t('owner.autoPinned')}
                  </p>
                )}
              </div>

              <div style={s.field}>
                <label style={s.label}>{t('owner.description')}</label>
                <textarea style={{ ...s.input, height: 90, resize: 'vertical' }} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={t('owner.descriptionPlaceholder')}
                  onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                  onBlur={e => e.target.style.borderColor = '#ddd'} />
              </div>

              <div style={s.row}>
                {[{ key: 'bedrooms', label: t('owner.bedrooms') }, { key: 'beds', label: t('owner.beds') }, { key: 'max_guests', label: t('owner.maxGuests') }].map(({ key, label }) => (
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

              <div style={s.row}>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>{t('owner.checkInTime')}</label>
                  <input style={s.input} type="time" required value={form.check_in_time}
                    onChange={e => setForm({ ...form, check_in_time: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
                <div style={{ ...s.field, flex: 1 }}>
                  <label style={s.label}>{t('owner.checkOutTime')}</label>
                  <input style={s.input} type="time" required value={form.check_out_time}
                    onChange={e => setForm({ ...form, check_out_time: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#0F4C5C'}
                    onBlur={e => e.target.style.borderColor = '#ddd'} />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>{t('owner.paymentMethodLabel')}</label>
                <div style={s.payMethodRow}>
                  <div onClick={() => setForm(f => ({ ...f, payment_method: 'on_arrival' }))}
                    style={{ ...s.payMethodOption, ...(form.payment_method === 'on_arrival' ? s.payMethodOptionActive : {}) }}>
                    <Banknote size={18} color={form.payment_method === 'on_arrival' ? '#0F4C5C' : '#aaa'} />
                    <div>
                      <p style={s.payMethodLabel}>{t('owner.paymentOnArrival')}</p>
                      <p style={s.payMethodSub}>{t('owner.paymentOnArrivalSub')}</p>
                    </div>
                  </div>
                  <div onClick={() => setForm(f => ({ ...f, payment_method: 'online' }))}
                    style={{ ...s.payMethodOption, ...(form.payment_method === 'online' ? s.payMethodOptionActive : {}) }}>
                    <CreditCard size={18} color={form.payment_method === 'online' ? '#0F4C5C' : '#aaa'} />
                    <div>
                      <p style={s.payMethodLabel}>{t('owner.paymentOnline')}</p>
                      <p style={s.payMethodSub}>{t('owner.paymentOnlineSub')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>{t('owner.amenitiesLabel')}</label>
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
                <label style={s.label}>{t('owner.photos')}</label>

                {editTarget && existingImages.length > 0 && (
                  <div style={s.existingImgRow}>
                    {existingImages.map(img => (
                      <div key={img.id} style={s.existingImgWrap}>
                        <img src={BASE + img.image_url} alt="" style={s.existingImg} />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img.id)}
                          style={s.deleteImgBtn}
                          title="Remove image"
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label style={{ ...s.uploadBtn, marginTop: editTarget && existingImages.length > 0 ? 10 : 0 }}>
                  {editTarget ? t('owner.addMorePhotos') : t('owner.choosePhotos')}
                  <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
                </label>
                {previews.length > 0 && (
                  <div style={s.previewRow}>
                    {previews.map((src, i) => (
                      <div key={i} style={s.previewImgWrap}>
                        <img src={src} alt="" style={s.previewImg} />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          style={s.deleteImgBtn}
                          title="Remove image"
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {images.length > 0 && (
                  <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                    {images.length} {images.length === 1 ? t('owner.photoSelected') : t('owner.photosSelected')}
                  </p>
                )}
              </div>

              <button type="submit" disabled={saving} style={s.submitBtn} className="btn-press"
                onMouseEnter={e => e.target.style.backgroundColor = '#0a3a47'}
                onMouseLeave={e => e.target.style.backgroundColor = '#0F4C5C'}>
                {saving ? t('owner.saving') : editTarget ? t('owner.saveChanges') : t('owner.newListing')}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={s.overlay} className="anim-overlay-in">
          <div style={{ ...s.modal, maxWidth: 400 }} className="anim-modal-in">
            <h2 style={s.modalTitle}>{t('owner.deleteListing')}</h2>
            <p style={{ color: '#888', fontSize: 15, margin: '12px 0 24px' }}>{t('owner.deleteConfirm')}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)} style={{ ...s.editBtn, flex: 1, padding: 13 }}>{t('owner.cancel')}</button>
              <button onClick={handleDelete} style={{ ...s.deleteBtn, flex: 1, padding: 13 }}>{t('owner.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {availApt && (
        <div style={s.overlay} className="anim-overlay-in" onClick={() => setAvailApt(null)}>
          <div style={{ ...s.modal, maxWidth: 380 }} className="anim-modal-in" onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{t('owner.availability')}</h2>
              <button onClick={() => setAvailApt(null)} style={s.closeBtn}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
              {t('owner.availabilityHint')}
            </p>
            {availLoading ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>{t('owner.loading')}</div>
            ) : (
              <Calendar
                value={null}
                blockedDates={blockedDates}
                onChange={handleCalendarToggle}
                toggleMode
              />
            )}
          </div>
        </div>
      )}
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
  availBtn: { padding: '8px 10px', backgroundColor: '#f0f7f9', color: '#0F4C5C', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" },
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
  pinHint: { fontSize: 12, color: '#888', margin: '6px 0 0' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#222', fontFamily: "'Segoe UI', sans-serif" },
  counter: { display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #ddd', borderRadius: 10, padding: '10px 16px' },
  counterBtn: { width: 28, height: 28, borderRadius: '50%', border: '1px solid #ccc', background: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C', fontWeight: 700, padding: 0, fontFamily: "'Segoe UI', sans-serif" },
  counterVal: { fontSize: 16, fontWeight: 600, color: '#222', flex: 1, textAlign: 'center' },
  amenitiesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  amenityChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#555', userSelect: 'none', transition: 'all 0.15s' },
  amenityChipActive: { border: '1.5px solid #0F4C5C', backgroundColor: '#f0f7f9', color: '#0F4C5C', fontWeight: 600 },
  payMethodRow: { display: 'flex', gap: 10 },
  payMethodOption: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10, cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s' },
  payMethodOptionActive: { border: '1.5px solid #0F4C5C', backgroundColor: '#f0f7f9' },
  payMethodLabel: { margin: 0, fontSize: 13, fontWeight: 600, color: '#333' },
  payMethodSub: { margin: 0, fontSize: 11.5, color: '#888' },
  uploadBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: '#f0f7f9', color: '#0F4C5C', border: '1.5px dashed #0F4C5C', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  previewRow: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' },
  previewImgWrap: { position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd', flexShrink: 0 },
  existingImgRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 4 },
  existingImgWrap: { position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', border: '1px solid #ddd' },
  existingImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  deleteImgBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 0 },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: "'Segoe UI', sans-serif" },
};