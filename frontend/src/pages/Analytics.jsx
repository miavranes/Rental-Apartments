import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';
import reservationService from '../services/reservationService';
import Navbar from '../components/Navbar';
import { TrendingUp, Percent, DollarSign, CalendarCheck, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const money = (n) => `€${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const monthLabel = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short' });
};

function BarChart({ data, labels, format, color = '#0F4C5C', height = 140 }) {
  const max = Math.max(1, ...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 4px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: height - 34 }}>
            {v > 0 && (
              <span style={{ fontSize: 9.5, color: '#999', marginBottom: 3, whiteSpace: 'nowrap' }}>
                {format ? format(v) : v}
              </span>
            )}
            <div
              title={format ? format(v) : v}
              style={{
                width: '100%',
                height: `${Math.max(2, (v / max) * (height - 34 - 14))}px`,
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
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'owner') { navigate('/'); return; }
    Promise.all([analyticsService.getOwner(), reservationService.getOwnerReservations()])
      .then(([analyticsData, reservationsData]) => {
        setData(analyticsData);
        setReservations(reservationsData);
      })
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

        <div style={s.cardsRow}>
          <div style={{ ...s.card, animationDelay: "0ms" }} className="analytics-card anim-fade-in-up">
            <div style={{ ...s.cardIcon, backgroundColor: '#eafaf1' }}><DollarSign size={18} color="#22c55e" /></div>
            <span style={s.cardLabel}>{t('analytics.totalEarnings')}</span>
            <span style={s.cardValue}>{money(summary.revenue)}</span>
            <span style={s.cardHint}>{t('analytics.earningsHint')}</span>
          </div>
          <div style={{ ...s.card, animationDelay: "60ms" }} className="analytics-card anim-fade-in-up">
            <div style={{ ...s.cardIcon, backgroundColor: '#f0f7f9' }}><Percent size={18} color="#0F4C5C" /></div>
            <span style={s.cardLabel}>{t('analytics.occupancyRate')}</span>
            <span style={s.cardValue}>{summary.occupancy_rate_30d}%</span>
            <span style={s.cardHint}>{t('analytics.occupancyHint30d')} {summary.listings} {listingsSuffix}</span>
          </div>
          <div style={{ ...s.card, animationDelay: "120ms" }} className="analytics-card anim-fade-in-up">
            <div style={{ ...s.cardIcon, backgroundColor: '#fff7ed' }}><TrendingUp size={18} color="#f97316" /></div>
            <span style={s.cardLabel}>{t('analytics.avgNightlyRate')}</span>
            <span style={s.cardValue}>{money(summary.avg_nightly_rate)}</span>
            <span style={s.cardHint}>{t('analytics.nightlyHint')}</span>
          </div>
          <div style={{ ...s.card, animationDelay: "180ms" }} className="analytics-card anim-fade-in-up">
            <div style={{ ...s.cardIcon, backgroundColor: '#fdf2f8' }}><CalendarCheck size={18} color="#ec4899" /></div>
            <span style={s.cardLabel}>{t('analytics.totalBookings')}</span>
            <span style={s.cardValue}>{summary.reservations}</span>
            <span style={s.cardHint}>
              {summary.confirmed} {t('reservations.confirmed')} · {summary.completed} {t('reservations.completed')} · {summary.pending} {t('reservations.pending')} · {summary.cancelled} {t('reservations.cancelled')}
            </span>
          </div>
        </div>

        <div style={s.chartsRow}>
          <div style={{ ...s.chartCard, animationDelay: "240ms" }} className="analytics-card anim-fade-in-up">
            <h3 style={s.chartTitle}>{t('analytics.revenueByMonth')}</h3>
            <p style={s.chartHint}>{t('analytics.revenueByMonthHint')}</p>
            <BarChart data={revenueData} labels={labels} format={money} color="#0F4C5C" />
          </div>
          <div style={{ ...s.chartCard, animationDelay: "300ms" }} className="analytics-card anim-fade-in-up">
            <h3 style={s.chartTitle}>{t('analytics.bookingsByMonth')}</h3>
            <p style={s.chartHint}>{t('analytics.bookingsByMonthHint')}</p>
            <BarChart data={reservationsData} labels={labels} format={(v) => `${v}`} color="#E8A87C" />
          </div>
          <div style={s.chartCard} className="analytics-card">
            <h3 style={s.chartTitle}>{t('analytics.occupancyByMonth')}</h3>
            <p style={s.chartHint}>{t('analytics.occupancyByMonthHint')}</p>
            <BarChart data={occupancyData} labels={labels} format={(v) => `${v}%`} color="#22c55e" />
          </div>
        </div>

        

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
                    <th style={s.th}>{t('analytics.colRating')}</th>
                    <th style={s.th}>{t('analytics.colEarnings')}</th>
                    <th style={s.th}>{t('analytics.colOccupancy')}</th>
                    <th style={s.th}>{t('analytics.colFavorites')}</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.id}>
                      <td style={s.tdTitle}>{l.title}</td>
                      <td style={s.td}>{l.reservations}</td>
                      <td style={s.td}>
                        {l.review_count > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Star size={13} color="#f5a623" fill="#f5a623" /> {l.avg_rating} ({l.review_count})
                          </span>
                        ) : '—'}
                      </td>
                      <td style={s.td}>{money(l.revenue)}</td>
                      <td style={s.td}>{l.occupancy_rate_30d}%</td>
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
  chartTitle: { fontSize: 14.5, fontWeight: 700, color: '#0F4C5C', margin: '0 0 4px' },
  chartHint: { fontSize: 12, color: '#999', margin: '0 0 14px', lineHeight: 1.4 },

  calHeaderRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  select: {
    fontSize: 13, fontWeight: 600, color: '#0F4C5C', padding: '8px 12px', borderRadius: 10,
    border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif", maxWidth: 220,
  },
  calNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  calNavBtn: { background: 'none', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', color: '#0F4C5C', padding: 4, display: 'flex' },
  calMonthLabel: { fontSize: 14, fontWeight: 700, color: '#0F4C5C', minWidth: 140, textAlign: 'center' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, maxWidth: 420, margin: '0 auto' },
  calDayName: { textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aaa', padding: '4px 0', textTransform: 'uppercase' },
  calCell: { textAlign: 'center', fontSize: 12.5, padding: '9px 0', borderRadius: 8, backgroundColor: '#fafafa' },
  calCellBooked: { backgroundColor: '#fee2e2', color: '#f87171', textDecoration: 'line-through', fontWeight: 700 },
  calLegend: { display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid #f0f0f0' },
  calNoData: { textAlign: 'center', color: '#aaa', fontSize: 12.5, marginTop: 10 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' },
  legendDot: { width: 10, height: 10, borderRadius: 3, display: 'inline-block' },

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