import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import geocodingService from '../services/geocodingService';
import { formatLocation } from '../utils/locationUtils';

const emptyPlace = () => ({
  location: '',
  municipality: '',
  country: '',
  label: '',
});

export default function LocationAutocomplete({
  value,
  onChange,
  onCoords,
  placeholder,
  required = false,
  inputStyle = {},
}) {
  const { t } = useTranslation();
  const wrapRef = useRef(null);
  const [query, setQuery] = useState(value?.label || value?.location || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(value?.label || value?.location || '');
  }, [value?.label, value?.location]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await geocodingService.search(q);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const pickSuggestion = (place) => {
    setQuery(place.label);
    onChange?.(place);
    if (onCoords && place.lat && place.lng) {
      onCoords({ lat: place.lat, lng: place.lng });
    }
    setOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    const next = e.target.value;
    setQuery(next);
    onChange?.({
      ...emptyPlace(),
      location: next,
      label: next,
    });
    if (next.trim().length >= 2) setOpen(true);
  };

  const handleBlur = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      onChange?.(emptyPlace());
      return;
    }
    if (!value?.location || value.location !== trimmed) {
      onChange?.({
        ...emptyPlace(),
        location: trimmed,
        label: trimmed,
      });
    }
  };

  return (
    <div ref={wrapRef} style={s.wrap}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder || t('search.cityPlaceholder')}
        required={required}
        style={{ ...s.input, ...inputStyle }}
        autoComplete="off"
      />

      {open && (loading || suggestions.length > 0) && (
        <div style={s.dropdown}>
          {loading && suggestions.length === 0 && (
            <div style={s.hint}>{t('search.searchingPlaces')}</div>
          )}
          {suggestions.map((place, i) => (
            <button
              key={`${place.label}-${i}`}
              type="button"
              style={s.item}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickSuggestion(place)}
            >
              <MapPin size={15} color="#0F4C5C" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={s.itemText}>
                <span style={s.primary}>{place.location}</span>
                {(place.municipality || place.country) && (
                  <span style={s.secondary}>
                    {[place.municipality, place.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {value?.location && (value.municipality || value.country) && (
        <p style={s.selectedHint}>
          {t('search.selected')}: {formatLocation(value)}
        </p>
      )}
    </div>
  );
}

const s = {
  wrap: { position: 'relative' },
  input: {
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
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #e8e8e8',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(15,76,92,0.12)',
    zIndex: 300,
    maxHeight: '260px',
    overflowY: 'auto',
  },
  hint: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#888',
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 14px',
    border: 'none',
    borderBottom: '1px solid #f3f3f3',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Segoe UI', sans-serif",
  },
  itemText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  primary: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#222',
  },
  secondary: {
    fontSize: '12px',
    color: '#888',
  },
  selectedHint: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#666',
  },
};
