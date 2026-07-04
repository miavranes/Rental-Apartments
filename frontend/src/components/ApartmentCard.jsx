import { Link } from 'react-router-dom';
import { Home, Star, Heart } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLocation } from '../utils/locationUtils';
import favoriteService from '../services/favoriteService';

import { UPLOADS_URL } from '../config';
const BASE = UPLOADS_URL;

export default function ApartmentCard({ apartment }) {
  const { t } = useTranslation();
  const {
    id,
    title,
    price_per_night,
    images,
    avg_rating,
    review_count
  } = apartment;

  const [favorite, setFavorite] = useState(false);
  const [imgError, setImgError] = useState(false);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (favorite) {
        await favoriteService.remove(id);
        setFavorite(false);
      } else {
        await favoriteService.add(id);
        setFavorite(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

const imgSrc =
  images && images.length > 0
    ? `${BASE}${images[0].image_url}`
    : null;
  return (
    <Link to={`/apartments/${id}`} style={styles.card}>
      <div style={styles.imageWrapper}>

        <button
          onClick={toggleFavorite}
          style={styles.heartBtn}
          type="button"
        >
          <Heart
            size={18}
            fill={favorite ? "#ef4444" : "transparent"}
            color={favorite ? "#ef4444" : "#fff"}
          />
        </button>

        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={title}
            style={styles.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={styles.imagePlaceholder}>
            <Home size={48} color="#ccc" />
          </div>
        )}

        {avg_rating > 0 && (
          <div style={styles.badge}>
            <Star size={11} fill="#fff" color="#fff" style={{ marginRight: 3 }} />
            {Number(avg_rating).toFixed(1)}
            {review_count > 0 && (
              <span style={styles.reviewCount}> ({review_count})</span>
            )}
          </div>
        )}
      </div>

      <div style={styles.body}>
        <p style={styles.location}>{formatLocation(apartment)}</p>
        <h3 style={styles.title}>{title}</h3>

        <p style={styles.price}>
          <strong style={styles.priceAmount}>${price_per_night}</strong>
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
    paddingTop: '66%',
    overflow: 'hidden',
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
    zIndex: 50,
    cursor: 'pointer',
  },

  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  imagePlaceholder: {
    position: 'absolute',
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