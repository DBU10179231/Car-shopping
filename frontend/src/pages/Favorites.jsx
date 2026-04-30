import { useState } from 'react';
import { useFav } from '../context/FavContext';
import CarCard from '../components/CarCard';
import { FiHeart, FiLayers } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

export default function Favorites() {
    const { favorites, clearFavs } = useFav();
    const [selectedCars, setSelectedCars] = useState([]);
    const navigate = useNavigate();

    const handleClear = () => {
        if (window.confirm('Wipe your entire vehicle wishlist?')) {
            clearFavs();
        }
    };

    const toggleSelect = (car) => {
        setSelectedCars(prev => prev.some(c => c._id === car._id)
            ? prev.filter(c => c._id !== car._id)
            : [...prev, car].slice(0, 4) // restrict to 4 maximum
        );
    };

    const handleCompare = () => {
        if (selectedCars.length < 2) return;
        localStorage.setItem('compareQueue', JSON.stringify(selectedCars));
        navigate('/compare');
    };

    return (
        <div className="discovery-page" style={{ padding: '60px 0 100px', background: 'var(--bg-dark)' }}>
            <div className="container">
                <div className="discovery-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Vehicle Wishlist</h1>
                        <p style={{ color: 'var(--text-muted)' }}>{favorites.length} saved intelligence assets</p>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {favorites.length > 0 && (
                            <>
                                <button className="btn btn-secondary" onClick={handleClear} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>Wipe All</button>
                                <button
                                    className="btn btn-primary"
                                    disabled={selectedCars.length < 2}
                                    onClick={handleCompare}
                                >
                                    <FiLayers /> Compare Matrix {selectedCars.length > 0 ? `(${selectedCars.length}/4)` : ''}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="empty-state" style={{ padding: '100px 40px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '24px' }}>
                        <FiHeart size={64} style={{ color: 'var(--primary)', marginBottom: 24, opacity: 0.2 }} />
                        <h2 style={{ fontSize: '1.8rem', marginBottom: 12 }}>Wishlist Empty</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Your intelligence grid has no saved vehicles. Start exploring the marketplace.</p>
                        <Link to="/cars" className="btn btn-primary">Open Discovery Desk</Link>
                    </div>
                ) : (
                    <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 30 }}>
                        {favorites.map(car => (
                            <div key={car._id} className="fav-item-premium" style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                                    <div className="checkbox-standard" style={{ width: 28, height: 28, background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <input
                                            type="checkbox"
                                            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }}
                                            checked={selectedCars.some(c => c._id === car._id)}
                                            onChange={() => toggleSelect(car)}
                                        />
                                    </div>
                                </div>
                                <CarCard car={car} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
