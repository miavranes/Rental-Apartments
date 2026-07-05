import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'sr', label: 'SR', name: 'Srpski' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'fr', label: 'FR', name: 'Francais' },
];

export default function LanguageSwitcher({ variant = 'default', style }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const wrapStyle = variant === 'floating' ? { ...s.wrap, ...s.floating, ...style } : { ...s.wrap, ...style };

  return (
    <div ref={ref} style={wrapStyle}>
      <button type="button" onClick={() => setOpen(v => !v)} style={s.trigger}>
        <Globe size={14} color="#555" />
        <span style={s.label}>{currentLang.label}</span>
        <ChevronDown size={12} color="#888" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={s.dropdown}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              style={{
                ...s.option,
                ...(i18n.language === lang.code ? s.optionActive : {}),
              }}
            >
              <span style={s.code}>{lang.label}</span>
              <span style={s.name}>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { position: 'relative', fontFamily: "'Segoe UI', sans-serif" },
  floating: { position: 'absolute', top: 24, right: 24, zIndex: 20 },
  trigger: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 10px', borderRadius: 8,
    background: '#fff', border: '1px solid #e0e0e0',
    cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif",
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  label: { fontSize: 13, fontWeight: 600, color: '#333' },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
    backgroundColor: '#fff', border: '1px solid #ebebeb',
    borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    overflow: 'hidden', minWidth: 140, zIndex: 200,
  },
  option: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left', fontFamily: "'Segoe UI', sans-serif",
    transition: 'background 0.1s',
  },
  optionActive: { backgroundColor: '#f0f7f9' },
  code: { fontSize: 12, fontWeight: 700, color: '#0F4C5C', minWidth: 24 },
  name: { fontSize: 13, color: '#444' },
};