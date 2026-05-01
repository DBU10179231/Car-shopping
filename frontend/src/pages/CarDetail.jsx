import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useFav } from '../context/FavContext';
import StarRating from '../components/StarRating';
import CheckoutButton from '../components/CheckoutButton';
import { toast } from 'react-toastify';
import { FiHeart, FiMapPin, FiZap, FiCalendar, FiClock, FiDroplet, FiCpu, FiActivity, FiBox, FiX, FiChevronLeft, FiChevronRight, FiCheckCircle, FiShare2, FiFacebook, FiTwitter, FiLink, FiDollarSign, FiShield, FiCreditCard, FiSmartphone } from 'react-icons/fi';
import CarCard from '../components/CarCard';
import { sanitizeImageUrl } from '../utils/imageUtils';
import './CarDetail.css';

export default function CarDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const { toggleFav, isFav, removeFromFavs } = useFav();
    const navigate = useNavigate();
    const [car, setCar] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [activeImg, setActiveImg] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [inquiry, setInquiry] = useState({ type: 'buy', message: '', phone: '', bookingDate: '', bookingTime: '' });
    const [review, setReview] = useState({ rating: 5, comment: '' });
    const [similarCars, setSimilarCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'test_drive') {
            setInquiry(p => ({ ...p, type: 'test_drive' }));
        }

        api.get(`/cars/${id}`)
            .then(r => {
                const fetchedCar = r.data;
                setCar(fetchedCar);
                setLoading(false);

                // Add to recently viewed
                const rvRaw = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                const rv = Array.isArray(rvRaw) ? rvRaw.filter(c => c && c._id) : [];
                const updatedRv = [fetchedCar, ...rv.filter(c => c._id !== fetchedCar._id)].slice(0, 10);
                localStorage.setItem('recentlyViewed', JSON.stringify(updatedRv));

                // Fetch Similar Cars
                if (fetchedCar.category) {
                    api.get(`/cars?category=${fetchedCar.category}&limit=5`).then(res => {
                        setSimilarCars(res.data.cars.filter(c => c._id !== fetchedCar._id).slice(0, 4));
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching car:', err);
                setLoading(false);

                // Check for auto-redirect from backend (legacy ID cleanup)
                if (err.response?.data?.redirect) {
                    toast.info(err.response.data.message || 'Connecting to available listings...');
                    navigate(err.response.data.redirect, { replace: true });
                    return;
                }

                const status = err.response?.status;
                if (status === 404) {
                    setError('This vehicle listing is no longer available.');
                    // Clean up localStorage if it was a stale reference
                    const rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                    localStorage.setItem('recentlyViewed', JSON.stringify(rv.filter(c => c._id !== id)));
                    
                    // Also clear from favorites if it exists there
                    removeFromFavs(id);
                } else if (status === 403) {
                    setError('This listing is not currently available to the public.');
                } else {
                    setError('Failed to load vehicle details. Please try again.');
                }
            });

        api.get(`/reviews/${id}`).then(r => setReviews(r.data)).catch(() => { });
    }, [id]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    const applyQuickOption = (opt) => {
        setInquiry(p => ({ ...p, message: opt }));
    };

    const quickOptions = inquiry.type === 'buy' 
        ? ["Offer a lower price", "Ask for last price", "Request discount"]
        : ["Interested in this vehicle", "Weekend appointment", "Morning test drive"];

    const submitInquiry = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        try {
            await api.post('/orders', { car: id, ...inquiry });
            if (inquiry.type === 'buy') {
                toast.success('Negotiation initiated! Redirecting to chat...');
                setTimeout(() => navigate('/buyer/dashboard'), 1500);
            } else {
                toast.success('Inquiry submitted successfully!');
            }
        } catch { toast.error('Failed to submit inquiry'); }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        try {
            const res = await api.post(`/reviews/${id}`, review);
            setReviews(prev => [res.data, ...prev]);
            toast.success('Review added!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to add review'); }
    };

    if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;

    if (error) return (
        <div className="container" style={{ marginTop: 100, textAlign: 'center' }}>
            <div className="card glass-card" style={{ padding: 60, maxWidth: 600, margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FiX style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: 20 }} />
                <h2>Oops! Listing Unavailable</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 30, fontSize: '1.1rem' }}>
                    {error}<br/>
                    <small>The database may have been refreshed or the car was moved.</small>
                </p>
                <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Refresh Home Page</button>
                    <button className="btn btn-secondary" onClick={() => navigate('/cars')}>Browse All Cars</button>
                </div>
            </div>
        </div>
    );

    if (!car) return null;

    return (
        <div className="detail-page">
            <div className="container">
                <div className="detail-grid">
                    {/* Gallery */}
                    <div className="detail-gallery">
                        <div className="gallery-main">
                            {car.images?.[activeImg] ? (
                                <img
                                    src={sanitizeImageUrl(car.images[activeImg], 'car')}
                                    alt={`${car.make} ${car.model}`}
                                    onClick={() => setShowModal(true)}
                                    style={{ cursor: 'zoom-in' }}
                                />
                            ) : (
                                <div className="car-detail-no-img" onClick={() => setShowModal(true)}>
                                    <span>{car.make} {car.model}</span>
                                </div>
                            )}
                            <button className={`fav-overlay ${isFav(car._id) ? 'active' : ''}`} onClick={() => toggleFav(car)}>
                                <FiHeart /> {isFav(car._id) ? 'Saved' : 'Save'}
                            </button>
                            {/* Phase 12: Sold Badge */}
                            {car.status === 'sold' && (
                                <div className="sold-badge-overlay">
                                    <span>SOLD</span>
                                </div>
                            )}
                        </div>
                        {car.images?.length > 1 && (
                            <div className="gallery-thumbs">
                                {car.images.map((img, i) => (
                                    <img key={i} src={sanitizeImageUrl(img, 'car')} alt="" className={i === activeImg ? 'active' : ''} onClick={() => setActiveImg(i)} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="detail-info">
                        <div className="detail-header">
                            <span className="badge">{car.category}</span>
                            <span className="badge badge-gold">{car.fuelType}</span>
                        </div>
                        <h1>{car.make} {car.model} <span className="detail-year">{car.year}</span></h1>
                        <div className="detail-price">{car.price.toLocaleString()} ETB</div>

                        <div className="social-share">
                            <button className="social-btn" onClick={handleCopyLink}><FiLink /> Copy Link</button>
                            <button className="social-btn" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=Check out this ${car.year} ${car.make} ${car.model}!`, '_blank')}><FiTwitter /> Tweet</button>
                            <button className="social-btn" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}><FiFacebook /> Share</button>
                        </div>

                        <div className="detail-rating">
                            <StarRating rating={car.rating} />
                            <span>{car.rating} ({car.numReviews} reviews)</span>
                        </div>

                        <div className="command-center-specs">
                            <div className="command-spec">
                                <div className="spec-icon"><FiClock /></div>
                                <div className="spec-val">
                                    <label>Mileage</label>
                                    <strong>{car.mileage.toLocaleString()} mi</strong>
                                </div>
                            </div>
                            <div className="command-spec">
                                <div className="spec-icon"><FiZap /></div>
                                <div className="spec-val">
                                    <label>Transmission</label>
                                    <strong>{car.transmission}</strong>
                                </div>
                            </div>
                            <div className="command-spec">
                                <div className="spec-icon"><FiDroplet /></div>
                                <div className="spec-val">
                                    <label>Fuel Type</label>
                                    <strong>{car.fuelType}</strong>
                                </div>
                            </div>
                            <div className="command-spec">
                                <div className="spec-icon"><FiBox /></div>
                                <div className="spec-val">
                                    <label>Condition</label>
                                    <strong>{car.condition || 'Used'}</strong>
                                </div>
                            </div>
                            <div className="command-spec">
                                <div className="spec-icon"><FiCpu /></div>
                                <div className="spec-val">
                                    <label>Engine</label>
                                    <strong>{car.engineSize || 'N/A'}</strong>
                                </div>
                            </div>
                            <div className="command-spec">
                                <div className="spec-icon"><FiActivity /></div>
                                <div className="spec-val">
                                    <label>Drive Type</label>
                                    <strong>{car.driveType || 'FWD'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Phase 12: Sold Banner */}
                        {car.status === 'sold' && (
                            <div className="vehicle-sold-banner">
                                <FiCheckCircle /> This vehicle has been successfully sold
                            </div>
                        )}

                        {car.features?.length > 0 && (
                            <div className="detail-features">
                                <h4>Features</h4>
                                <div className="features-list">
                                    {car.features.map(f => <span key={f} className="feature-tag">{f}</span>)}
                                </div>
                            </div>
                        )}

                        <p className="detail-desc">{car.description}</p>

                        {/* Seller Card */}
                        {car.seller && (
                            <div className="seller-card">
                                {car.seller.avatar || car.seller.profilePhoto ? (
                                    <img src={sanitizeImageUrl(car.seller.avatar || car.seller.profilePhoto, 'avatar')} alt={car.seller.name} className="seller-avatar" />
                                ) : (
                                    <div className="seller-avatar">{(car.seller.name || 'S')[0].toUpperCase()}</div>
                                )}
                                <div className="seller-details">
                                    <h4>
                                        {car.seller.name}
                                        {car.seller.isVerifiedSeller && <FiCheckCircle color="var(--primary)" title="Verified Seller" />}
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
                                        {car.seller.role === 'dealer' ? 'Dealership' : 'Private Seller'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Horizontal Actions Panel (Negotiation, Instant Buy, Loan) */}
                {/* Vehicle Action Center */}
                <div className={`vehicle-action-center ${car.status === 'sold' ? 'disabled-actions' : ''}`}>
                    <div className="action-desk-header">
                        <h2><FiZap /> Vehicle Action Center</h2>
                        <p>{car.status === 'sold' ? 'Inventory locked for sold vehicles' : 'Instant solutions for your automotive journey'}</p>
                    </div>

                    <div className="action-grid" style={{ opacity: car.status === 'sold' ? 0.5 : 1, pointerEvents: car.status === 'sold' ? 'none' : 'auto', gridTemplateColumns: '1fr 1fr' }}>
                        {/* 1. Negotiation Hub (Negotiate/Book) */}
                        <div className="action-card glass-card">
                            <div className="card-header-premium">
                                <h3>Negotiation Hub</h3>
                                <p>What would you like to negotiate or ask?</p>
                            </div>
                            <form className="command-form" onSubmit={submitInquiry}>
                                <div className="form-toggle">
                                    <button type="button" className={inquiry.type === 'buy' ? 'active' : ''} onClick={() => setInquiry(p => ({ ...p, type: 'buy', message: '' }))}>Negotiate</button>
                                    <button type="button" className={inquiry.type === 'test_drive' ? 'active' : ''} onClick={() => setInquiry(p => ({ ...p, type: 'test_drive', message: '' }))}>Test Drive</button>
                                </div>

                                <div className="quick-options-container">
                                    <label className="section-label">Quick Selection</label>
                                    <div className="quick-options-grid">
                                        {quickOptions.map(opt => (
                                            <button 
                                                key={opt} 
                                                type="button" 
                                                className={`quick-option-chip ${inquiry.message === opt ? 'active' : ''}`}
                                                onClick={() => applyQuickOption(opt)}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: 15 }}>
                                    <div>
                                        <label className="section-label">Contact Number</label>
                                        <input className="command-input" type="tel" placeholder="e.g. +251..." required disabled={car.status === 'sold'} value={inquiry.phone} onChange={e => setInquiry(p => ({ ...p, phone: e.target.value }))} />
                                    </div>

                                    {inquiry.type === 'test_drive' && (
                                        <div className="date-time-grid">
                                            <div>
                                                <label className="section-label">Preferred Date</label>
                                                <input className="command-input" type="date" required disabled={car.status === 'sold'} value={inquiry.bookingDate} onChange={e => setInquiry(p => ({ ...p, bookingDate: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="section-label">Preferred Time</label>
                                                <input className="command-input" type="time" required disabled={car.status === 'sold'} value={inquiry.bookingTime} onChange={e => setInquiry(p => ({ ...p, bookingTime: e.target.value }))} />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="section-label">Message (Optional)</label>
                                        <textarea className="command-textarea" placeholder="Add additional notes..." disabled={car.status === 'sold'} value={inquiry.message} onChange={e => setInquiry(p => ({ ...p, message: e.target.value }))} />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary btn-full" disabled={car.status === 'sold'}>
                                    {car.status === 'sold' ? 'Locked' : 'Send Request'}
                                </button>
                            </form>
                        </div>

                        {/* 2. Instant Procurement (Checkout) */}
                        <div className="action-card glass-card active-card">
                            <div className="card-header-premium">
                                <h3>Instant Purchase</h3>
                                <p>{car.status === 'sold' ? 'Sold Out' : 'Secure this vehicle with Chapa'}</p>
                            </div>
                            <div className="procure-body">
                                <div className="price-intelligence">
                                    <label>Vehicle Price</label>
                                    <div className="val">{car.price.toLocaleString()} ETB</div>
                                </div>
                                {car.status === 'sold' ? (
                                    <div className="sold-lock-btn">
                                        <FiX /> Vehicle Unavailable
                                    </div>
                                ) : (
                                    <CheckoutButton car={car} onPaymentSuccess={() => navigate('/buyer/dashboard')} />
                                )}
                                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 15, opacity: 0.6 }}>
                                    <FiShield title="Secure" />
                                    <FiCreditCard title="Card" />
                                    <FiSmartphone title="Mobile Pay" />
                                </div>
                                <p className="secure-p"><FiCheckCircle /> Verified Encrypted Transaction</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <div className="reviews-section">
                    <h2>Customer Reviews</h2>
                    <form className="review-form" onSubmit={submitReview}>
                        <h4>Write a Review</h4>
                        <div className="rating-select">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button type="button" key={n} className={`star-btn ${review.rating >= n ? 'active' : ''}`}
                                    onClick={() => setReview(r => ({ ...r, rating: n }))}>★</button>
                            ))}
                        </div>
                        <textarea className="form-control" rows={3} placeholder="Share your experience..." value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))} />
                        <button type="submit" className="btn btn-secondary">Submit Review</button>
                    </form>
                    <div className="reviews-list">
                        {reviews.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first!</p> :
                            reviews.map(r => (
                                <div key={r._id} className="review-card">
                                    <div className="review-header">
                                        <strong>{r.user?.name}</strong>
                                        <StarRating rating={r.rating} />
                                        <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p>{r.comment}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Similar Cars */}
                {similarCars.length > 0 && (
                    <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 25 }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: 15 }}>Similar Vehicles</h2>
                        <div className="cars-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 15 }}>
                            {similarCars.map(c => (
                                <CarCard key={c._id} car={c} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* FULLSCREEN IMAGE MODAL */}
            {showModal && (
                <div className="image-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>

                        {car.images?.length > 1 && (
                            <button className="modal-nav prev" onClick={() => setActiveImg(prev => prev === 0 ? car.images.length - 1 : prev - 1)}>
                                <FiChevronLeft />
                            </button>
                        )}

                        <img src={sanitizeImageUrl(car.images[activeImg], 'car')} alt={`${car.make} ${car.model}`} />

                        {car.images?.length > 1 && (
                            <button className="modal-nav next" onClick={() => setActiveImg(prev => prev === car.images.length - 1 ? 0 : prev + 1)}>
                                <FiChevronRight />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
