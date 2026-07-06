import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Calendar from './Calendar';
import LocationAutocomplete from './LocationAutocomplete';
import { formatLocation } from '../utils/locationUtils';

function Dropdown({ children, open, style }) {
  return open ? (
    <div style={{ ...drop.panel, ...style }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  ) : null;
}

const drop = {
  panel: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 12px 48px rgba(15,76,92,0.18)',
    zIndex: 200,
    minWidth: '200px',
    overflow: 'hidden',
    border: '1px solid rgba(15,76,92,0.08)',
  },
};

export default function SearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [active, setActive] = useState(null); // 'location' | 'checkin' | 'checkout' | 'guests'
  const [place, setPlace] = useState({ location: '', municipality: '', country: '', label: '' });
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setActive(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (name) => setActive(a => a === name ? null : name);

  const formatDate = (str) => {
    if (!str) return null;
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActive(null);
    const params = new URLSearchParams();
    if (place.location) params.set('location', place.location);
    if (place.country) params.set('country', place.country);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests > 1) params.set('guests', guests);
    const existingAmenities = searchParams.get('amenities');
    if (existingAmenities) params.set('amenities', existingAmenities);
    navigate(`/apartments?${params.toString()}`);
  };

  const isActive = (name) => active === name;

  return (
    <form onSubmit={handleSearch} ref={ref} style={sb.form}>

      <div style={{ ...sb.segment, ...(isActive('location') ? sb.segmentActive : {}) }}
        onClick={() => toggle('location')}>
        <span style={sb.label}>{t('search.location')}</span>
        <span style={{ ...sb.value, color: place.location ? '#111' : '#aaa' }}>
          {formatLocation(place) || t('search.locationPlaceholder')}
        </span>
        <Dropdown open={isActive('location')} style={{ left: '0', transform: 'none', minWidth: '300px' }}>
          <div style={{ padding: '16px' }} onClick={e => e.stopPropagation()}>
            <p style={sb.dropLabel}>{t('search.searchDestination')}</p>
            <LocationAutocomplete
              value={place}
              onChange={setPlace}
              placeholder={t('search.cityPlaceholder')}
            />
          </div>
        </Dropdown>
      </div>

      <div style={sb.divider} />
      <div style={{ ...sb.segment, ...(isActive('checkin') ? sb.segmentActive : {}) }}
        onClick={() => toggle('checkin')}>
        <span style={sb.label}>{t('search.checkIn')}</span>
        <span style={{ ...sb.value, color: checkIn ? '#111' : '#aaa' }}>
          {formatDate(checkIn) || t('search.addDate')}
        </span>
        <Dropdown open={isActive('checkin')}>
          <Calendar
            value={checkIn}
            minDate={new Date().toISOString().split('T')[0]}
            onChange={(d) => { setCheckIn(d); if (checkOut && d >= checkOut) setCheckOut(''); setActive('checkout'); }}
          />
        </Dropdown>
      </div>

      <div style={sb.divider} />

      <div style={{ ...sb.segment, ...(isActive('checkout') ? sb.segmentActive : {}) }}
        onClick={() => toggle('checkout')}>
        <span style={sb.label}>{t('search.checkOut')}</span>
        <span style={{ ...sb.value, color: checkOut ? '#111' : '#aaa' }}>
          {formatDate(checkOut) || t('search.addDate')}
        </span>
        <Dropdown open={isActive('checkout')}>
          <Calendar
            value={checkOut}
            minDate={checkIn || new Date().toISOString().split('T')[0]}
            onChange={(d) => { setCheckOut(d); setActive('guests'); }}
          />
        </Dropdown>
      </div>

      <div style={sb.divider} />

      <div style={{ ...sb.segment, ...(isActive('guests') ? sb.segmentActive : {}) }}
        onClick={() => toggle('guests')}>
        <span style={sb.label}>{t('search.guests')}</span>
        <span style={{ ...sb.value, color: '#111' }}>
          {guests} {guests === 1 ? t('search.guest') : t('search.guestsPlural')}
        </span>
        <Dropdown open={isActive('guests')} style={{ right: '0', left: 'auto', transform: 'none' }}>
          <div style={sb.guestPanel} onClick={e => e.stopPropagation()}>
            <span style={sb.guestLabel}>{t('search.numberOfGuests')}</span>
            <div style={sb.guestControls}>
              <button type="button" style={{ ...sb.guestBtn, opacity: guests <= 1 ? 0.3 : 1 }}
                onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
              <span style={sb.guestCount}>{guests}</span>
              <button type="button" style={sb.guestBtn}
                onClick={() => setGuests(g => Math.min(20, g + 1))}>+</button>
            </div>
          </div>
        </Dropdown>
      </div>

    
      <button type="submit" style={sb.button}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {t('search.searchBtn')}
      </button>
    </form>
  );
}

const sb = {
  form: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '60px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    padding: '6px 6px 6px 8px',
    maxWidth: '860px',
    margin: '0 auto',
    position: 'relative',
  },
  segment: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '50px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.15s',
    minWidth: '120px',
  },
  segmentActive: {
    backgroundColor: '#f0f6f7',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#0F4C5C',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '3px',
  },
  value: {
    display: 'block',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  divider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#e0e0e0',
    flexShrink: 0,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0F4C5C',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
    marginLeft: '4px',
    fontFamily: "'Segoe UI', sans-serif",
    letterSpacing: '0.2px',
  },
  dropLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#0F4C5C',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    margin: '0 0 10px',
  },
  textInput: {
    width: '100%',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', sans-serif",
    color: '#222',
    transition: 'border-color 0.2s',
  },
  guestPanel: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    minWidth: '220px',
  },
  guestLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#222',
  },
  guestControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  guestBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #ccc',
    background: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0F4C5C',
    fontWeight: '600',
    lineHeight: 1,
    padding: 0,
  },
  guestCount: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111',
    minWidth: '20px',
    textAlign: 'center',
  },
};