import { Link } from 'react-router-dom';

export default function ApartmentCard({ apartment }) {
  const { _id, title, location, pricePerNight, images, averageRating, reviewCount } = apartment;

  const imgSrc = images && images.length > 0
    ? `http://localhost:5000/uploads/${images[0]}`
    : null;

  return (
    <Link to={`/apartments/${_id}`} style={styles.card}>
      <div style={styles.imageWrapper}>
        {imgSrc ? (
          <img src={imgSrc} alt={title} style={styles.image} />
        ) : (
          <div style={styles.imagePlaceholder}>
            <span style={styles.placeholderIcon}>🏠</span>
          </div>
        )}
        {averageRating > 0 && (
          <div style={styles.badge}>
            ★ {Number(averageRating).toFixed(1)}
            {reviewCount > 0 && <span style={styles.reviewCount}> ({reviewCount})</span>}
          </div>
        )}
      </div>

      <div style={styles.body}>
        <p style={styles.location}>{location}</p>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.price}>
          <strong style={styles.priceAmount}>${pricePerNight}</strong>
          <span style={styles.perNight}> / night</span>
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
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    border: '1px solid #f0f0f0',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    paddingTop: '66%',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s',
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
    backgroundColor: '#f5f5f5',
  },
  placeholderIcon: {
    fontSize: '48px',
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(15,76,92,0.85)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    backdropFilter: 'blur(4px)',
  },
  reviewCount: {
    fontWeight: '400',
    opacity: 0.85,
  },
  body: {
    padding: '14px 16px 18px',
  },
  location: {
    margin: '0 0 4px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#E8A87C',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  title: {
    margin: '0 0 10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  price: {
    margin: 0,
    fontSize: '14px',
    color: '#888',
  },
  priceAmount: {
    fontSize: '17px',
    color: '#0F4C5C',
    fontWeight: '700',
  },
  perNight: {
    color: '#aaa',
  },
};
