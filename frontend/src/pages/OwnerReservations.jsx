import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import Navbar from '../components/Navbar';
import { Calendar, Users, Phone, Mail, Check, X, CreditCard, Banknote, MessageCircle } from 'lucide-react';
import chatService from '../services/chatService';

export default function OwnerReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [messaging, setMessaging] = useState(null);

  const STATUS_COLORS = {
    pending:   { bg: '#fff8e1', color: '#f59e0b', label: t('reservations.pending') },
    confirmed: { bg: '#f0fff4', color: '#22c55e', label: t('reservations.confirmed') },
    cancelled: { bg: '#fff0f0', color: '#ef4444', label: t('reservations.cancelled') },
    completed: { bg: '#f0f7f9', color: '#0F4C5C', label: t('reservations.completed') },
  };

  const FILTER_LABELS = {
    all: t('ownerReservations.all'),
    pending: t('reservations.pending'),
    confirmed: t('reservations.confirmed'),
    cancelled: t('reservations.cancelled'),
    completed: t('reservations.completed'),
  };

  useEffect(() => {
    if (!user || user.role !== 'owner') { navigate('/'); return; }
    reservationService.getOwnerReservations()
      .then(setReservations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleConfirm = async (id) => {
    setProcessing(id + '_confirm');
    try {
      await reservationService.confirm(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed' } : r));
    } catch (err) {
      alert(err.response?.data?.error || t('ownerReservations.confirmFailed'));
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(t('reservations.cancelConfirm'))) return;
    setProcessing(id + '_cancel');
    try {
      await reservationService.cancel(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      alert(err.response?.data?.error || t('reservations.cancelFailed'));
    } finally {
      setProcessing(null);
    }
  };

  const handleMessageGuest = async (r) => {
    setMessaging(r.id);
    try {
      const conversation = await chatService.startConversation({
        apartment_id: r.apartment_id,
        tourist_id: r.user_id,
      });
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      alert(err.response?.data?.error || t('ownerReservations.chatFailed'));
    } finally {
      setMessaging(null);
    }
  };

  const formatDate = (str) => new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const nights = (r) => Math.ceil((new Date(r.check_out) - new Date(r.check_in)) / 86400000);

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  const counts = reservations.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  if (loading) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.loading}><div style={s.spinner} /></div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar />

      <div style={s.container}>
        <div style={s.header} className="owner-res-header">
          <div>
            <h1 style={s.pageTitle}>{t('ownerReservations.title')}</h1>
            <p style={s.pageSub}>{t('ownerReservations.subtitle')}</p>
          </div>
          <Link to="/owner" style={s.listingsLink}>{t('ownerReservations.myListings')}</Link>
        </div>

        <div style={s.statsRow} className="owner-res-stats">
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} style={s.statCard}>
              <span style={{ ...s.statNum, color: val.color }}>{counts[key] || 0}</span>
              <span style={s.statLabel}>{val.label}</span>
            </div>
          ))}
        </div>

        <div style={s.tabs} className="owner-res-tabs">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...s.tab, ...(filter === f ? s.tabActive : {}) }}>
              {FILTER_LABELS[f]}
              {f !== 'all' && counts[f] ? <span style={s.tabBadge}>{counts[f]}</span> : null}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>
            <Calendar size={48} color="#ddd" strokeWidth={1} style={{ marginBottom: 12 }} />
            <p style={s.emptyText}>{t('ownerReservations.noReservations')}</p>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map((r, i) => {
              const st = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
              const n = nights(r);

              return (
                <div key={r.id} style={{ ...s.card, animationDelay: `${Math.min(i, 8) * 60}ms` }} className="anim-fade-in-up card-hover">
                  <div style={s.cardMain}>
                    <div style={s.cardLeft}>
                      <Link to={`/apartments/${r.apartment_id}`} style={s.aptName}>{r.title}</Link>
                      <span style={s.aptLocation}>{r.location}</span>
                    </div>
                    <span style={{ ...s.badge, backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                  </div>

                  <div style={s.cardGrid} className="owner-res-card-grid">
                    <div style={s.infoBlock}>
                      <span style={s.infoLabel}>{t('ownerReservations.dates')}</span>
                      <span style={s.infoVal}>
                        <Calendar size={13} style={{ marginRight: 4 }} />
                        {formatDate(r.check_in)} → {formatDate(r.check_out)} · {n} {n !== 1 ? t('booking.nights') : t('booking.night')}
                      </span>
                    </div>
                    <div style={s.infoBlock}>
                      <span style={s.infoLabel}>{t('ownerReservations.guestsLabel')}</span>
                      <span style={s.infoVal}><Users size={13} style={{ marginRight: 4 }} />{r.guests}</span>
                    </div>
                    <div style={s.infoBlock}>
                      <span style={s.infoLabel}>{t('ownerReservations.payment')}</span>
                      <span style={s.infoVal}>
                        {r.payment_method === 'online' ? <CreditCard size={13} style={{ marginRight: 4 }} /> : <Banknote size={13} style={{ marginRight: 4 }} />}
                        {r.payment_method === 'online' ? t('ownerReservations.online') : t('ownerReservations.onArrival')}
                      </span>
                      {r.payment_method === 'online' && (
                        <span style={{
                          ...s.payBadge,
                          color: r.payment_status === 'paid' ? '#22c55e' : r.payment_status === 'failed' ? '#ef4444' : '#f59e0b',
                          backgroundColor: r.payment_status === 'paid' ? '#f0fff4' : r.payment_status === 'failed' ? '#fff0f0' : '#fff8e1',
                        }}>
                          {r.payment_status === 'paid' ? t('ownerReservations.paid') : r.payment_status === 'failed' ? t('ownerReservations.paymentFailed') : t('ownerReservations.unpaid')}
                        </span>
                      )}
                    </div>
                    <div style={s.infoBlock}>
                      <span style={s.infoLabel}>{t('ownerReservations.total')}</span>
                      <span style={{ ...s.infoVal, fontWeight: 700, color: '#0F4C5C' }}>€{Number(r.total_price).toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={s.guestRow}>
                    <div style={s.guestInfo}>
                      <span style={s.guestName}>{r.guest_name}</span>
                      <a href={`mailto:${r.guest_email}`} style={s.guestContact}><Mail size={13} /> {r.guest_email}</a>
                      {r.guest_phone && <a href={`tel:${r.guest_phone}`} style={s.guestContact}><Phone size={13} /> {r.guest_phone}</a>}
                    </div>
                    {(r.status === 'confirmed' || r.status === 'completed') && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => handleMessageGuest(r)} disabled={messaging === r.id} style={s.messageBtn} className="btn-press">
                          <MessageCircle size={14} style={{ marginRight: 4 }} />
                          {messaging === r.id ? t('ownerReservations.opening') : t('ownerReservations.messageGuest')}
                        </button>
                        {r.status === 'confirmed' && (
                          <button onClick={() => handleCancel(r.id)} disabled={!!processing} style={s.declineBtn} className="btn-press">
                            <X size={14} style={{ marginRight: 4 }} />{t('ownerReservations.cancelBtn')}
                          </button>
                        )}
                      </div>
                    )}
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleConfirm(r.id)}
                            disabled={!!processing || (r.payment_method === 'online' && r.payment_status !== 'paid')}
                            style={{
                              ...s.confirmBtn,
                              ...((r.payment_method === 'online' && r.payment_status !== 'paid') ? s.btnDisabled : {}),
                            }}
                            className="btn-press"
                          >
                            <Check size={14} style={{ marginRight: 4 }} />
                            {processing === r.id + '_confirm' ? t('ownerReservations.confirming') : t('ownerReservations.confirm')}
                          </button>
                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={!!processing}
                            style={s.declineBtn}
                            className="btn-press"
                          >
                            <X size={14} style={{ marginRight: 4 }} />
                            {processing === r.id + '_cancel' ? t('ownerReservations.declining') : t('ownerReservations.decline')}
                          </button>
                        </div>
                        {r.payment_method === 'online' && r.payment_status !== 'paid' && (
                          <span style={s.awaitingNote}>{t('ownerReservations.awaitingPayment')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .owner-res-header { flex-direction: column; align-items: flex-start !important; gap: 10px; }
          .owner-res-stats { flex-wrap: wrap; }
          .owner-res-stats > div { flex: 1 1 40%; }
          .owner-res-tabs { overflow-x: auto; white-space: nowrap; }
          .owner-res-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .card-hover:hover { box-shadow: 0 10px 24px rgba(15,76,92,0.12); }
      `}</style>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },
  container: { maxWidth: 960, margin: '0 auto', padding: '40px 24px 64px' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#0F4C5C', margin: '0 0 4px', letterSpacing: '-0.5px' },
  pageSub: { fontSize: 14, color: '#999', margin: 0 },
  listingsLink: { fontSize: 14, fontWeight: 600, color: '#0F4C5C', textDecoration: 'none', borderBottom: '1px solid #E8A87C' },
  loading: { display: 'flex', justifyContent: 'center', padding: 80 },
  spinner: { width: 36, height: 36, border: '3px solid #e0e0e0', borderTop: '3px solid #0F4C5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  statsRow: { display: 'flex', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 12, padding: '14px 16px', textAlign: 'center' },
  statNum: { display: 'block', fontSize: 24, fontWeight: 800 },
  statLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #ebebeb', paddingBottom: 0 },
  tab: { padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#888', fontWeight: 500, borderBottom: '2px solid transparent', fontFamily: "'Segoe UI', sans-serif", display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  tabActive: { color: '#0F4C5C', fontWeight: 700, borderBottomColor: '#0F4C5C' },
  tabBadge: { backgroundColor: '#0F4C5C', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px' },
  empty: { textAlign: 'center', padding: '60px 0' },
  emptyText: { color: '#aaa', fontSize: 15 },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(15,76,92,0.04)', display: 'flex', flexDirection: 'column', gap: 14 },
  cardMain: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  aptName: { fontSize: 16, fontWeight: 700, color: '#0F4C5C', textDecoration: 'none' },
  aptLocation: { fontSize: 13, color: '#888' },
  badge: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, flexShrink: 0 },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, backgroundColor: '#fafafa', borderRadius: 10, padding: 14 },
  infoBlock: { display: 'flex', flexDirection: 'column', gap: 3 },
  infoLabel: { fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoVal: { fontSize: 14, color: '#333', display: 'flex', alignItems: 'center' },
  guestRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  guestInfo: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
  guestName: { fontSize: 14, fontWeight: 600, color: '#222' },
  guestContact: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#0F4C5C', textDecoration: 'none' },
  payBadge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginTop: 4, alignSelf: 'flex-start' },
  awaitingNote: { fontSize: 12, color: '#f59e0b', maxWidth: 260, textAlign: 'right' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  confirmBtn: { display: 'flex', alignItems: 'center', padding: '8px 16px', backgroundColor: '#f0fff4', color: '#22c55e', border: '1px solid #b7ebc8', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  declineBtn: { display: 'flex', alignItems: 'center', padding: '8px 16px', backgroundColor: '#fff0f0', color: '#ef4444', border: '1px solid #ffd0d0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  messageBtn: { display: 'flex', alignItems: 'center', padding: '8px 16px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
};