import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiMapPin, FiZap, FiCheckCircle, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useFav } from '../context/FavContext';
import { sanitizeImageUrl } from '../utils/imageUtils';
import './CarCard.css';

export default function CarCard({ car, viewMode = 'grid' }) {
    const { toggleFav, isFav } = useFav();
    const fav = isFav(car._id);
    const navigate = useNavigate();

    return (
        <Link to={`/cars/${car._id}`} className={`car-card-premium ${viewMode === 'list' ? 'list-view' : ''}`} style={{ textDecoration: 'none' }}>
            <div className="card-image-container">
                {car.images?.[0] ? (
                    <img src={sanitizeImageUrl(car.images[0], 'car')} alt={`${car.make} ${car.model}`} className="main-image" />
                ) : (
                    <div className="no-image-placeholder">
                        <span>{car.make} {car.model}</span>
                    </div>
                )}

                <div className="card-badges">
                    <span className="badge-glass">{car.category}</span>
                    {(!car.available || car.status !== 'active') && (
                        <span className="badge-sold">Sold Out</span>
                    )}
                </div>

                <button
                    className={`favorite-action ${fav ? 'active heart-pop' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(car);
                    }}
                >
                    <FiHeart fill={fav ? 'var(--accent)' : 'none'} />
                </button>
            </div>

            <div className="card-content-premium">
                <div className="card-top-info">
                    <div className="title-section">
                        <h3>{car.make} {car.model}</h3>
                        <p className="subtitle">{car.year} • {car.condition || 'Used'}</p>
                    </div>
                </div>

                <div className="card-metrics">
                    <div className="metric">
                        <FiMapPin />
                        <span>{car.mileage?.toLocaleString()} mi</span>
                    </div>
                    <div className="metric">
                        <FiZap />
                        <span>{car.fuelType}</span>
                    </div>
                    <div className="metric">
                        <FiCheckCircle />
                        <span>{car.transmission?.charAt(0)}</span>
                    </div>
                </div>

                <div className="card-footer-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="price-label" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Price</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                            <span className="currency" style={{ color: 'var(--primary)' }}>$</span>
                            <span className="amount">{car.price?.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/cars/${car._id}?action=test_drive`);
                            }}
                            title="Book Test Drive"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                            <FiCalendar size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/cars/${car._id}?action=buy`);
                            }}
                            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                            onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
                        >
                            <FiDollarSign size={14} /> Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
