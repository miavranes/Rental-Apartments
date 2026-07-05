import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import reservationService from '../services/reservationService';
import reviewService from '../services/reviewService';
import Navbar from '../components/Navbar';
import { MapPin, Calendar, Users, Star, X, CreditCard, Banknote, MessageCircle } from 'lucide-react';
import chatService from '../services/chatService';

import { UPLOADS_URL } from '../config';
const BASE = UPLOADS_URL;

function ReviewModal({ reservation, onClose, onSubmit, t }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await onSubmit({ reservation_id: reservation.id, apartment_id: reservation.apartment_id, rating, comment });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || t('review.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitle}>{t('review.leaveReview')}</h3>
          <button onClick={onClose} style={s.closeBtn}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 20px' }}>{reservation.title}</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>{t('review.rating', 'Rating')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Star size={28} fill={n <= rating ? '#E8A87C' : 'none'} color={n <= rating ? '#E8A87C' : '#ddd'} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>{t('review.comment', 'Comment')}</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('review.commentPlaceholder', 'Share your experience...')}
              required
              style={{ ...s.input, height: 100, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#0F4C5C'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <button type="submit" disabled={loading} style={s.submitBtn}>
            {loading ? t('review.submitting', 'Submitting...') : t('review.submit', 'Submit review')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MyReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewed, setReviewed] = useState(new Set());
  const [cancelling, setCancelling] = useState(null);
  const [messaging, setMessaging] = useState(null);

  const STATUS_COLORS = {
    pending:   { bg: '#fff8e1', color: '#f59e0b', label: t('reservations.pending') },
    confirmed: { bg: '#f0fff4', color: '#22c55e', label: t('reservations.confirmed') },
    cancelled: { bg: '#fff0f0', color: '#ef4444', label: t('reservations.cancelled') },
    completed: { bg: '#f0f7f9', color: '#0F4C5C', label: t('reservations.completed') },
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    reservationService.getMyReservations()
      .then(setReservations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleCancel = async (id) => {
    if (!window.confirm(t('reservations.cancelConfirm'))) return;
    setCancelling(id);
    try {
      await reservationService.cancel(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      alert(err.response?.data?.error || t('reservations.cancelFailed'));
    } finally {
      setCancelling(null);
    }
  };

  const handleReview = async (payload) => {
    await reviewService.create(payload);
    setReviewed(prev => new Set([...prev, payload.reservation_id]));
  };

  const handleMessageHost = async (r) => {
    setMessaging(r.id);
    try {
      const conversation = await chatService.startConversation({ apartment_id: r.apartment_id });
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      alert(err.response?.data?.error || t('reservations.chatFailed'));
    } finally {
      setMessaging(null);
    }
  };

  const formatDate = (str) => new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const nights = (r) => Math.ceil((new Date(r.check_out) - new Date(r.check_in)) / 86400000);

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
        <h1 style={s.pageTitle}>{t('reservations.myBookings')}</h1>
        <p style={s.pageSub}>
          {reservations.length} {reservations.length !== 1 ? t('reservations.bookingsTotalPlural') : t('reservations.bookingsTotal')}
        </p>

        {reservations.length === 0 ? (
          <div style={s.empty}>
            <Calendar size={56} color="#ddd" strokeWidth={1} style={{ marginBottom: 16 }} />
            <h3 style={s.emptyTitle}>{t('reservations.noBookings')}</h3>
            <p style={s.emptySub}>{t('reservations.noBookingsSub')}</p>
            <Link to="/apartments" style={s.browseBtn}>{t('reservations.browseApartments')}</Link>
          </div>
        ) : (
          <div style={s.list}>
            {reservations.map((r, i) => {
              const st = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
              const n = nights(r);
              const canCancel = r.status === 'pending' || r.status === 'confirmed';
              const canReview = r.status === 'completed' && !reviewed.has(r.id);
              const canMessage = r.status === 'confirmed' || r.status === 'completed';

              return (
                <div key={r.id} style={{ ...s.card, animationDelay: `${Math.min(i, 8) * 60}ms` }} className="my-res-card anim-fade-in-up card-hover">
                  <div style={s.cardImg} className="my-res-card-img">
                    {r.primary_image
                      ? <img src={BASE + r.primary_image} alt={r.title} style={s.img} />
                      : <div style={s.imgPlaceholder} />}
                  </div>
                  <div style={s.cardBody}>
                    <div style={s.cardTop}>
                      <div>
                        <Link to={`/apartments/${r.apartment_id}`} style={s.aptTitle}>{r.title}</Link>
                        <p style={s.aptLocation}><MapPin size={13} style={{ marginRight: 4 }} />{r.location}</p>
                      </div>
                      <span style={{ ...s.badge, backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                    </div>

                    <div style={s.metaRow}>
                      <span style={s.meta}><Calendar size={13} /> {formatDate(r.check_in)} → {formatDate(r.check_out)}</span>
                      <span style={s.meta}><Users size={13} /> {r.guests} {r.guests !== 1 ? t('booking.guests').toLowerCase() : t('booking.guest')}</span>
                      <span style={s.meta}>
                        {r.payment_method === 'online' ? <CreditCard size={13} /> : <Banknote size={13} />}
                        {' '}{r.payment_method === 'online' ? t('reservations.online') : t('reservations.onArrival')}
                      </span>
                    </div>

                    <div style={s.cardBottom} className="my-res-card-bottom">
                      <div>
                        <span style={s.price}>${Number(r.total_price).toFixed(2)}</span>
                        <span style={s.priceNights}> · {n} {n !== 1 ? t('booking.nights', 'nights') : t('booking.night', 'night')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {canMessage && (
                          <button onClick={() => handleMessageHost(r)} disabled={messaging === r.id} style={s.messageBtn} className="btn-press">
                            <MessageCircle size={14} style={{ marginRight: 4 }} />
                            {messaging === r.id ? t('reservations.opening') : t('reservations.messageHost')}
                          </button>
                        )}
                        {canReview && (
                          <button onClick={() => setReviewTarget(r)} style={s.reviewBtn} className="btn-press">
                            <Star size={14} style={{ marginRight: 4 }} />{t('reservations.leaveReview')}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={cancelling === r.id}
                            style={s.cancelBtn}
                            className="btn-press"
                          >
                            {cancelling === r.id ? t('reservations.cancelling') : t('reservations.cancel')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          reservation={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReview}
          t={t}
        />
      )}

      <style>{`
        @media (max-width: 640px) {
          .my-res-card { flex-direction: column; }
          .my-res-card-img { width: 100% !important; height: 180px; }
          .my-res-card-bottom { flex-direction: column; align-items: flex-start !important; gap: 12px; }
        }
        .my-res-card.card-hover:hover { box-shadow: 0 10px 24px rgba(15,76,92,0.12); }
      `}</style>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#FAFAF9' },
  container: { maxWidth: 860, margin: '0 auto', padding: '40px 24px 64px' },
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#0F4C5C', margin: '0 0 4px', letterSpacing: '-0.5px' },
  pageSub: { fontSize: 14, color: '#999', margin: '0 0 32px' },
  loading: { display: 'flex', justifyContent: 'center', padding: 80 },
  spinner: { width: 36, height: 36, border: '3px solid #e0e0e0', borderTop: '3px solid #0F4C5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#0F4C5C', margin: '0 0 8px' },
  emptySub: { color: '#aaa', fontSize: 14, margin: '0 0 24px' },
  browseBtn: { display: 'inline-block', backgroundColor: '#0F4C5C', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, border: '1px solid #ebebeb', boxShadow: '0 2px 12px rgba(15,76,92,0.06)', display: 'flex', overflow: 'hidden' },
  cardImg: { width: 160, flexShrink: 0 },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
  cardBody: { flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  aptTitle: { fontSize: 16, fontWeight: 700, color: '#0F4C5C', textDecoration: 'none', display: 'block', marginBottom: 4 },
  aptLocation: { fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', margin: 0 },
  badge: { fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0 },
  metaRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  meta: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#666' },
  cardBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, flexWrap: 'wrap', gap: 12 },
  price: { fontSize: 18, fontWeight: 800, color: '#0F4C5C' },
  priceNights: { fontSize: 13, color: '#888' },
  reviewBtn: { display: 'flex', alignItems: 'center', padding: '8px 14px', backgroundColor: '#f0f7f9', color: '#0F4C5C', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  messageBtn: { display: 'flex', alignItems: 'center', padding: '8px 14px', backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  cancelBtn: { padding: '8px 14px', backgroundColor: '#fff0f0', color: '#ef4444', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
  // Modal
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#0F4C5C', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 },
  errorBox: { backgroundColor: '#fff0f0', border: '1px solid #ffd0d0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', color: '#222', fontFamily: "'Segoe UI', sans-serif" },
  submitBtn: { width: '100%', padding: 14, backgroundColor: '#0F4C5C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Segoe UI', sans-serif" },
};
