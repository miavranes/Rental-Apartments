import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function Calendar({ value, onChange, minDate }) {
  const today = new Date();
  const initial = value ? new Date(value) : (minDate ? new Date(minDate) : today);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toStr = (d) => {
    const dd = new Date(viewYear, viewMonth, d);
    return dd.toISOString().split('T')[0];
  };

  const isSelected = (d) => d && value === toStr(d);
  const isDisabled = (d) => {
    if (!d) return true;
    if (!minDate) return false;
    return toStr(d) < minDate;
  };
  const isToday = (d) => d && toStr(d) === today.toISOString().split('T')[0];

  return (
    <div style={cal.wrapper}>
      <div style={cal.header}>
        <button type="button" onClick={prevMonth} style={cal.navBtn}>‹</button>
        <span style={cal.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} style={cal.navBtn}>›</button>
      </div>
      <div style={cal.grid}>
        {DAYS.map(d => <div key={d} style={cal.dayName}>{d}</div>)}
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            disabled={isDisabled(d)}
            onClick={() => d && !isDisabled(d) && onChange(toStr(d))}
            style={{
              ...cal.cell,
              ...(d === null ? cal.empty : {}),
              ...(isToday(d) ? cal.today : {}),
              ...(isSelected(d) ? cal.selected : {}),
              ...(isDisabled(d) ? cal.disabled : {}),
            }}
          >
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

const cal = {
  wrapper: {
    padding: '16px',
    width: '280px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#0F4C5C',
    padding: '4px 8px',
    borderRadius: '6px',
    lineHeight: 1,
  },
  monthLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F4C5C',
    letterSpacing: '0.3px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  },
  dayName: {
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: '#aaa',
    padding: '4px 0',
    textTransform: 'uppercase',
  },
  cell: {
    textAlign: 'center',
    fontSize: '13px',
    padding: '7px 0',
    borderRadius: '8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#222',
    fontFamily: "'Segoe UI', sans-serif",
    transition: 'background 0.15s',
  },
  empty: {
    cursor: 'default',
  },
  today: {
    color: '#0F4C5C',
    fontWeight: '700',
  },
  selected: {
    backgroundColor: '#0F4C5C',
    color: '#fff',
    fontWeight: '700',
  },
  disabled: {
    color: '#ddd',
    cursor: 'default',
  },
};

// ─── Dropdown wrapper ────────────────────────────────────────────────────────
function Dropdown({ children, open, style }) {
  return open ? (
    <div style={{ ...drop.panel, ...style }}>
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

// ─── Main SearchBar ──────────────────────────────────────────────────────────
export default function SearchBar() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null); // 'location' | 'checkin' | 'checkout' | 'guests'
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const ref = useRef(null);

  // Close on outside click
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
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests > 1) params.set('guests', guests);
    navigate(`/apartments?${params.toString()}`);
  };

  const isActive = (name) => active === name;

  return (
    <form onSubmit={handleSearch} ref={ref} style={sb.form}>

      {/* Location */}
      <div style={{ ...sb.segment, ...(isActive('location') ? sb.segmentActive : {}) }}
        onClick={() => toggle('location')}>
        <span style={sb.label}>Location</span>
        <span style={{ ...sb.value, color: location ? '#111' : '#aaa' }}>
          {location || 'Where are you going?'}
        </span>
        <Dropdown open={isActive('location')} style={{ left: '0', transform: 'none', minWidth: '260px' }}>
          <div style={{ padding: '16px' }}>
            <p style={sb.dropLabel}>Search destination</p>
            <input
              autoFocus
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, region..."
              style={sb.textInput}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </Dropdown>
      </div>

      <div style={sb.divider} />

      {/* Check in */}
      <div style={{ ...sb.segment, ...(isActive('checkin') ? sb.segmentActive : {}) }}
        onClick={() => toggle('checkin')}>
        <span style={sb.label}>Check in</span>
        <span style={{ ...sb.value, color: checkIn ? '#111' : '#aaa' }}>
          {formatDate(checkIn) || 'Add date'}
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

      {/* Check out */}
      <div style={{ ...sb.segment, ...(isActive('checkout') ? sb.segmentActive : {}) }}
        onClick={() => toggle('checkout')}>
        <span style={sb.label}>Check out</span>
        <span style={{ ...sb.value, color: checkOut ? '#111' : '#aaa' }}>
          {formatDate(checkOut) || 'Add date'}
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

      {/* Guests */}
      <div style={{ ...sb.segment, ...(isActive('guests') ? sb.segmentActive : {}) }}
        onClick={() => toggle('guests')}>
        <span style={sb.label}>Guests</span>
        <span style={{ ...sb.value, color: '#111' }}>
          {guests} {guests === 1 ? 'guest' : 'guests'}
        </span>
        <Dropdown open={isActive('guests')} style={{ right: '0', left: 'auto', transform: 'none' }}>
          <div style={sb.guestPanel} onClick={e => e.stopPropagation()}>
            <span style={sb.guestLabel}>Number of guests</span>
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

      {/* Search button */}
      <button type="submit" style={sb.button}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Search
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
  // Location dropdown
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
  // Guests dropdown
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
