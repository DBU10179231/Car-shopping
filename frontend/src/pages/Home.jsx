import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import CarList from '../components/CarList';
import { sanitizeImageUrl } from '../utils/imageUtils';
import { FiArrowRight, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const CATEGORIES = [
    { name: 'SUV', icon: '🚙', desc: 'Powerful & Spacious' },
    { name: 'Sedan', icon: '🚗', desc: 'Sleek & Efficient' },
    { name: 'Coupe', icon: '🏎️', desc: 'Speed & Style' },
    { name: 'Truck', icon: '🛻', desc: 'Heavy Duty Power' },
    { name: 'Electric', icon: '⚡', desc: 'Eco-Friendly Tech' },
    { name: 'Luxury', icon: '💎', desc: 'Premium Experience' },
];

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/cars?limit=6').then(r => { setFeatured(r.data.cars); setLoading(false); });
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/cars?search=${search}`);
    };

    return (
        <div className="home">
            {/* Hero */}
            <section className="hero">
                <div className="hero-bg" />
                <div className="container hero-container">
                    <div className="hero-content-left">
                        <p className="hero-eyebrow">🚗 #1 Car Marketplace</p>
                        <h1 className="hero-title">
                            Find Your <span className="gradient-text">Perfect Car</span> At the Best Price
                        </h1>
                        <p className="hero-sub">Browse thousands of new & used cars from top brands. Fast, easy, and transparent.</p>
                        <form className="hero-search" onSubmit={handleSearch}>
                            <div className="hero-search-input">
                                <FiSearch />
                                <input
                                    type="text" placeholder="Search by make, model, or keyword..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Search Cars</button>
                        </form>
                        <div className="hero-stats">
                            <div className="stat-card"><span>1,200+</span><p>Cars Listed</p></div>
                            <div className="stat-card"><span>45+</span><p>Top Brands</p></div>
                            <div className="stat-card"><span>100%</span><p>Verified Sellers</p></div>
                        </div>
                    </div>
                    <div className="hero-content-right">
                        <img src="/hero_car_new.png" alt="Featured Car" className="hero-car-img" />
                        <div className="hero-glow-orb" />
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="section categories-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Browse by <span className="gradient-text">Category</span></h2>
                        <p>Find the right type of vehicle for your lifestyle</p>
                    </div>
                    <div className="categories-grid">
                        {CATEGORIES.map(cat => (
                            <Link to={`/cars?category=${cat.name}`} key={cat.name} className="category-card card">
                                <span className="category-icon">{cat.icon}</span>
                                <div className="category-info">
                                    <h3>{cat.name}</h3>
                                    <p>{cat.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Cars */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured <span className="gradient-text">Listings</span></h2>
                        <p>Hand-picked vehicles with the best value for money</p>
                    </div>
                    <CarList cars={featured} loading={loading} emptyMessage="No featured cars available right now." />
                    <div style={{ textAlign: 'center', marginTop: 40 }}>
                        <Link to="/cars" className="btn btn-outline">
                            View All Cars <FiArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="cta-banner">
                <div className="container cta-inner">
                    <h2>Ready to find your dream car?</h2>
                    <p>Join thousands of happy buyers and sellers on AutoMarket.</p>
                    <Link to="/register" className="btn btn-primary">Get Started Free</Link>
                </div>
            </section>
        </div>
    );
}
