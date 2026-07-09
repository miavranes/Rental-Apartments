import { useState } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function Calendar({ value, onChange, minDate, maxDate, blockedDates = [], toggleMode = false }) {
  const today = new Date();
  const initial = value ? new Date(value + 'T00:00:00') : (minDate ? new Date(minDate + 'T00:00:00') : today);
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

  const pad = (n) => String(n).padStart(2, '0');
  const toStr = (d) => `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
  const isSelected = (d) => d && value === toStr(d);
  const isDisabled = (d) => {
    if (!d) return true;
    const str = toStr(d);
    if (toggleMode) return false; // in toggle mode, all dates are clickable
    if (minDate && str < minDate) return true;
    if (maxDate && str > maxDate) return true;
    if (blockedDates.includes(str) && str !== maxDate) return true;
    return false;
  };
  const isToday = (d) => d && toStr(d) === `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const isBlocked = (d) => d && blockedDates.includes(toStr(d)) && toStr(d) !== maxDate;

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
            key={d ? toStr(d) : `empty-${i}`}
            type="button"
            disabled={isDisabled(d)}
            onClick={() => d && !isDisabled(d) && onChange(toStr(d))}
            style={{
              ...cal.cell,
              ...(d === null ? cal.empty : {}),
              ...(isToday(d) ? cal.today : {}),
              ...(isSelected(d) ? cal.selected : {}),
              ...(isBlocked(d) ? cal.blocked : {}),
              ...(isDisabled(d) && !isBlocked(d) ? cal.disabled : {}),
            }}
            title={isBlocked(d) ? 'Not available' : undefined}
          >
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export const cal = {
  wrapper: { padding: '16px', width: '280px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  navBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#0F4C5C', padding: '4px 8px', borderRadius: '6px', lineHeight: 1 },
  monthLabel: { fontSize: '14px', fontWeight: '700', color: '#0F4C5C', letterSpacing: '0.3px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' },
  dayName: { textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#aaa', padding: '4px 0', textTransform: 'uppercase' },
  cell: { textAlign: 'center', fontSize: '13px', padding: '7px 0', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#222', fontFamily: "'Segoe UI', sans-serif", transition: 'background 0.15s' },
  empty: { cursor: 'default' },
  today: { color: '#0F4C5C', fontWeight: '700' },
  selected: { backgroundColor: '#0F4C5C', color: '#fff', fontWeight: '700' },
  blocked: { backgroundColor: '#fee2e2', color: '#f87171', textDecoration: 'line-through', cursor: 'not-allowed' },
  disabled: { color: '#ddd', cursor: 'default' },
};