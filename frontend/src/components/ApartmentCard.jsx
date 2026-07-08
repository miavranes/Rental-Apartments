import { Link } from 'react-router-dom';
import { Home, Star, Heart } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocation } from '../utils/locationUtils';
import { useFavorites } from '../context/FavoritesContext';
import { UPLOADS_URL } from '../config';

export default function ApartmentCard({ apartment, index = 0 }) {
  const { t } = useTranslation();
  const {
    id,
    title,
    price_per_night,
    images,
    avg_rating,
    review_count,
  } = apartment;

  const { isFavorite, toggleFavorite: toggleFavoriteGlobal } = useFavorites();
  const favorite = isFavorite(id);
  const [imgStatus, setImgStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [heartPop, setHeartPop] = useState(false);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartPop(true);
    try {
      await toggleFavoriteGlobal(id);
    } catch (err) {
      console.error(err);
    }
  };

  const imgSrc = images && images.length > 0 ? `${UPLOADS_URL}${images[0].image_url}` : null;

  const handleImgError = (e) => {
    // Debug helper: open the browser console (F12) to see exactly which
    // URL failed and why, instead of just guessing.
    console.error('[ApartmentCard] Image failed to load:', imgSrc, e);
    setImgStatus('error');
  };

  return (
    <Link
      to={`/apartments/${id}`}
      style={{ ...styles.card, animationDelay: `${Math.min(index, 10) * 45}ms` }}
      className="card-hover anim-fade-in-up"
    >
      <div style={styles.imageWrapper}>
        <button
          onClick={toggleFavorite}
          onAnimationEnd={() => setHeartPop(false)}
          style={styles.heartBtn}
          className="btn-press"
          type="button"
        >
          <Heart
            size={18}
            fill={favorite ? '#ef4444' : 'transparent'}
            color={favorite ? '#ef4444' : '#fff'}
            className={heartPop ? 'anim-heart-pop' : ''}
          />
        </button>

        {imgSrc && (
          <img
            key={imgSrc}
            src={imgSrc}
            alt={title}
            loading="eager"
            className="card-hover-img"
            style={{
              ...styles.image,
              display: imgStatus === 'error' ? 'none' : 'block',
            }}
            onLoad={() => setImgStatus('ok')}
            onError={handleImgError}
          />
        )}

        {(!imgSrc || imgStatus === 'error') && (
          <div style={styles.imagePlaceholder}>
            <Home size={48} color="#ccc" />
          </div>
        )}

        {avg_rating > 0 && (
          <div style={styles.badge}>
            <Star size={11} fill="#fff" color="#fff" style={{ marginRight: 3 }} />
            {Number(avg_rating).toFixed(1)}
            {review_count > 0 && <span style={styles.reviewCount}> ({review_count})</span>}
          </div>
        )}
      </div>

      <div style={styles.body}>
        <p style={styles.location}>{formatLocation(apartment)}</p>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.price}>
          <strong style={styles.priceAmount}>€{price_per_night}</strong>
          <span style={styles.perNight}> {t('apartments.perNight')}</span>
        </p>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'block',
    textDecoration: 'none',
    color: 'inherit',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    boxShadow: '0 2px 16px rgba(15,76,92,0.08)',
    cursor: 'pointer',
    border: '1px solid #f0f0f0',
  },

  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 2',
    overflow: 'hidden',
    backgroundColor: '#f3f3f3',
  },

  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    cursor: 'pointer',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f3f3',
  },

  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15,76,92,0.85)',
    color: '#fff',
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
  },

  reviewCount: {
    opacity: 0.8,
    marginLeft: 3,
  },

  body: {
    padding: 14,
  },

  location: {
    fontSize: 11,
    fontWeight: 700,
    color: '#E8A87C',
    textTransform: 'uppercase',
  },

  title: {
    fontSize: 15,
    margin: '6px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  price: {
    fontSize: 14,
    color: '#888',
  },

  priceAmount: {
    fontSize: 17,
    color: '#0F4C5C',
  },

  perNight: {
    color: '#aaa',
  },
};