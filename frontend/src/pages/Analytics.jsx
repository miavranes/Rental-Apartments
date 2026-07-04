import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';
import Navbar from '../components/Navbar';
import { TrendingUp, Percent, DollarSign, CalendarCheck, Star, Heart } from 'lucide-react';

const money = (n) => `€${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const monthLabel = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
};

// Simple, dependency-free bar chart. `data` is an array of numbers; `format`
// controls the tooltip/label text shown above each bar.
function BarChart({ data, labels, format, color = '#0F4C5C', height = 140 }) {
  const max = Math.max(1, ...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 4px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'flex-end', height: height - 34 }}>
            <div
              title={format ? format(v) : v}
              style={{
                width: '100%',
                height: `${Math.max(2, (v / max) * (height - 34))}px`,
                backgroundColor: color,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 10.5, color: '#999' }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'owner') { navigate('/'); return; }
    analyticsService.getOwner()
      .then(setData)
      .catch(() => setError(t('analytics.loadFailed')))
      .finally(() => setLoading(false));
  }, [user, navigate, t]);

  if (loading) {
    return (
      <div style={s.page}>
        <Navbar />
        <div style={s.loadingWrap}><div style={s.spinner} /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={s.page}>
        <Navbar />
        <div style={s.container}><p style={{ color: '#c0392b' }}>{error || t('analytics.loadFailed')}</p></div>
      </div>
    );
  }

  const { summary, listings, monthly } = data;

  const revenueData = monthly.map(m => Number(m.revenue));
  const reservationsData = monthly.map(m => m.reservations);
  const occupancyData = monthly.map(m => m.occupancy_rate);
  const labels = monthly.map(m => monthLabel(m.month));

  const listingsSuffix = summary.listings === 1 ? t('analytics.listingsSuffix') : t('analytics.listingsSuffixPlural');

  return (
    <div style={s.page}>
      <Navbar />
      <style>{`
        @media (max-width: 640px) {
          .analytics-container { padding: 24px 16px 48px !important; }
          .analytics-card { padding: 16px !important; }
        }
      `}</style>
      <div style={s.container} className="analytics-container">
        <h1 style={s.pageTitle}>{t('analytics.title')}</h1>
        <p style={s.pageSub}>{t('analytics.subtitle')}</p>

        {/* Summary cards */}
        <div style={s.cardsRow}>
          <div style={s.card} className="analytics-card">
            <div style={{ ...s.cardIcon, backgroundColor: '#eafaf1' }}><DollarSign size={18} color="#22c55e" /></div>
            <span style={s.cardLabel}>{t('analytics.totalEarnings')}</span>
            <span style={s.cardValue}>{money(summary.revenue)}</span>
            <span style={s.cardHint}>{t('analytics.earningsHint')}</span>
          </div>
          <div style={s.card} className="analytics-card">
            <div style={{ ...s.cardIcon, backgroundColor: '#f0f7f9' }}><Percent size={18} color="#0F4C5C" /></div>
            <span style={s.cardLabel}>{t('analytics.occupancyRate')}</span>
            <span style={s.cardValue}>{summary.occupancy_rate_30d}%</span>
            <span style={s.cardHint}>{t('analytics.occupancyHint30d')} {summary.listings} {listingsSuffix}</span>
          </div>
          <div style={s.card} className="analytics-card">
            <div style={{ ...s.cardIcon, backgroundColor: '#fff7ed' }}><TrendingUp size={18} color="#f97316" /></div>
            <span style={s.cardLabel}>{t('analytics.avgNightlyRate')}</span>
            <span style={s.cardValue}>{money(summary.avg_nightly_rate)}</span>
            <span style={s.cardHint}>{t('analytics.nightlyHint')}</span>
          </div>
          <div style={s.card} className="analytics-card">
            <div style={{ ...s.cardIcon, backgroundColor: '#fdf2f8' }}><CalendarCheck size={18} color="#ec4899" /></div>
            <span style={s.cardLabel}>{t('analytics.totalBookings')}</span>
            <span style={s.cardValue}>{summary.reservations}</span>
            <span style={s.cardHint}>
              {summary.confirmed} {t('reservations.confirmed')} · {summary.completed} {t('reservations.completed')} · {summary.pending} {t('reservations.pending')} · {summary.cancelled} {t('reservations.cancelled')}
            </span>
          </div>
        </div>

        {/* Booking trends */}
        <div style={s.chartsRow}>
          <div style={s.chartCard} className="analytics-card">
            <h3 style={s.chartTitle}>{t('analytics.revenueByMonth')}</h3>
            <BarChart data={revenueData} labels={labels} format={money} color="#0F4C5C" />
          </div>
          <div style={s.chartCard} className="analytics-card">
            <h3 style={s.chartTitle}>{t('analytics.bookingsByMonth')}</h3>
            <BarChart data={reservationsData} labels={labels} format={(v) => `${v}`} color="#E8A87C" />
          </div>
          <div style={s.chartCard} className="analytics-card">
            <h3 style={s.chartTitle}>{t('analytics.occupancyByMonth')}</h3>
            <BarChart data={occupancyData} labels={labels} format={(v) => `${v}%`} color="#22c55e" />
          </div>
        </div>

        {/* Per-listing performance */}
        <div style={s.tableCard} className="analytics-card">
          <h3 style={s.chartTitle}>{t('analytics.listingPerformance')}</h3>
          {listings.length === 0 ? (
            <p style={s.emptyText}>{t('analytics.noListings')}</p>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>{t('analytics.colListing')}</th>
                    <th style={s.th}>{t('analytics.colBookings')}</th>
                    <th style={s.th}>{t('analytics.colEarnings')}</th>
                    <th style={s.th}>{t('analytics.colOccupancy')}</th>
                    <th style={s.th}>{t('analytics.colRating')}</th>
                    <th style={s.th}>{t('analytics.colFavorites')}</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.id}>
                      <td style={s.tdTitle}>{l.title}</td>
                      <td style={s.td}>{l.reservations}</td>
                      <td style={s.td}>{money(l.revenue)}</td>
                      <td style={s.td}>{l.occupancy_rate_30d}%</td>
                      <td style={s.td}>
                        {l.review_count > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Star size={13} color="#f5a623" fill="#f5a623" /> {l.avg_rating} ({l.review_count})
                          </span>
                        ) : '—'}
                      </td>
                      <td style={s.td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Heart size={13} color="#E8A87C" /> {l.favorites}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 64px' },
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#0F4C5C', margin: '0 0 4px' },
  pageSub: { fontSize: 14, color: '#888', margin: '0 0 28px' },

  cardsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 },
  card: {
    display: 'flex', flexDirection: 'column', gap: 4, padding: 20,
    backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 14,
    boxShadow: '0 2px 10px rgba(15,76,92,0.05)',
  },
  cardIcon: { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 12.5, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' },
  cardValue: { fontSize: 24, fontWeight: 800, color: '#222' },
  cardHint: { fontSize: 11.5, color: '#aaa' },

  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 28 },
  chartCard: {
    backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 14,
    padding: '18px 20px', boxShadow: '0 2px 10px rgba(15,76,92,0.05)',
  },
  chartTitle: { fontSize: 14.5, fontWeight: 700, color: '#0F4C5C', margin: '0 0 14px' },

  tableCard: {
    backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 14,
    padding: '18px 20px', boxShadow: '0 2px 10px rgba(15,76,92,0.05)',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 12, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', padding: '8px 10px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
  td: { fontSize: 13.5, color: '#444', padding: '12px 10px', borderBottom: '1px solid #f4f4f4', whiteSpace: 'nowrap' },
  tdTitle: { fontSize: 13.5, color: '#222', fontWeight: 600, padding: '12px 10px', borderBottom: '1px solid #f4f4f4' },
  emptyText: { color: '#aaa', fontSize: 13 },

  loadingWrap: { display: 'flex', justifyContent: 'center', padding: 80 },
  spinner: { width: 32, height: 32, border: '3px solid #e0e0e0', borderTop: '3px solid #0F4C5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
