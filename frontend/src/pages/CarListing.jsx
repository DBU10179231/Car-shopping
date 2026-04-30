import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import CarList from '../components/CarList';
import { FiSearch, FiFilter, FiX, FiGrid, FiList } from 'react-icons/fi';
import './CarListing.css';

const CATEGORIES = ['', 'SUV', 'Sedan', 'Coupe', 'Truck', 'Hatchback', 'Van', 'Convertible', 'Electric'];
const FUEL_TYPES = ['', 'Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['', 'Automatic', 'Manual'];

export default function CarListing() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [cars, setCars] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [makes, setMakes] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        make: '', fuelType: '', transmission: '',
        condition: '', sellerType: '',
        location: '', sort: 'newest',
        minPrice: '', maxPrice: '', minYear: '', maxYear: '',
        page: 1,
    });

    useEffect(() => {
        const rv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (rv.length > 0) {
            setRecentlyViewed(rv);
        }
    }, [loading]); // Refresh if loading changes, though primarily on mount

    const clearRecentlyViewed = () => {
        localStorage.removeItem('recentlyViewed');
        setRecentlyViewed([]);
        toast.info('Viewing history cleared');
    };

    const fetchCars = useCallback(async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries(Object.entries(filters || {}).filter(([, v]) => v !== ''));
            const res = await api.get('/cars', { params });
            setCars(res.data.cars);
            setTotal(res.data.total);
            setPages(res.data.pages);

            // Phase 12 Fix: If we have recently viewed, cross-reference with API if possible or just rely on detail page cleanup
        } catch (err) {
            console.error('Fetch Cars Error:', err);
            setCars([]);
            setTotal(0);
        } finally { setLoading(false); }
    }, [filters]);

    useEffect(() => {
        const category = searchParams.get('category') || '';
        const search = searchParams.get('search') || '';
        if (category !== filters.category || search !== filters.search) {
            setFilters(f => ({ ...f, category, search, page: 1 }));
        }
    }, [searchParams]);

    useEffect(() => { fetchCars(); }, [fetchCars]);
    useEffect(() => {
        api.get('/cars/makes').then(r => setMakes(r.data));
    }, []);

    const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
    const clearFilters = () => setFilters({ search: '', category: '', make: '', fuelType: '', transmission: '', condition: '', sellerType: '', location: '', sort: 'newest', minPrice: '', maxPrice: '', minYear: '', maxYear: '', page: 1 });

    return (
        <div className="listing-page">
            <div className="container">
                <div className="discovery-header">
                    <div className="discovery-titles">
                        <h1>Discovery Desk</h1>
                        <p>{total} premium vehicles found</p>
                    </div>

                    <div className="discovery-actions">
                        <div className="search-bar-premium">
                            <FiSearch />
                            <input
                                type="text" placeholder="Search make, model, category..."
                                value={filters.search}
                                onChange={e => setFilter('search', e.target.value)}
                            />
                        </div>

                        <div className="discovery-controls">
                            <select className="sort-select" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Low-High</option>
                                <option value="price_desc">Price: High-Low</option>
                            </select>

                            <div className="view-switcher">
                                <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><FiGrid /></button>
                                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><FiList /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="discovery-layout">
                    {/* Intelligence Sidebar */}
                    <aside className="intelligence-panel">
                        <div className="panel-header">
                            <h3><FiFilter /> Filters</h3>
                            <button className="clear-all" onClick={clearFilters}>Reset</button>
                        </div>

                        <div className="filter-group">
                            <label>Category</label>
                            <select value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                                <option value="">All Categories</option>
                                {CATEGORIES.filter(Boolean).map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Make</label>
                            <select value={filters.make} onChange={e => setFilter('make', e.target.value)}>
                                <option value="">All Makes</option>
                                {makes.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Price Range</label>
                            <div className="range-inputs">
                                <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} />
                                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Fuel Type</label>
                            <select value={filters.fuelType} onChange={e => setFilter('fuelType', e.target.value)}>
                                <option value="">All Fuel</option>
                                {FUEL_TYPES.filter(Boolean).map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Transmission</label>
                            <select value={filters.transmission} onChange={e => setFilter('transmission', e.target.value)}>
                                <option value="">All Transmission</option>
                                {TRANSMISSIONS.filter(Boolean).map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Location</label>
                            <input type="text" placeholder="e.g. Addis" value={filters.location} onChange={e => setFilter('location', e.target.value)} />
                        </div>
                    </aside>

                    <main className="results-panel">
                        {/* Filter Chips */}
                        {(filters.category || filters.make || filters.search) && (
                            <div className="filter-chips">
                                {filters.search && <span className="chip">{filters.search} <FiX onClick={() => setFilter('search', '')} /></span>}
                                {filters.category && <span className="chip">{filters.category} <FiX onClick={() => setFilter('category', '')} /></span>}
                                {filters.make && <span className="chip">{filters.make} <FiX onClick={() => setFilter('make', '')} /></span>}
                            </div>
                        )}


                        <CarList
                            cars={cars}
                            loading={loading}
                            viewMode={viewMode}
                            emptyMessage="No matching vehicles found"
                        />
                        {pages > 1 && (
                            <div className="pagination-premium">
                                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                                    <button key={p} className={filters.page === p ? 'active' : ''}
                                        onClick={() => setFilters(f => ({ ...f, page: p }))}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </main>
                </div>

                {/* Recently Viewed Section */}
                {!loading && recentlyViewed.length > 0 && (
                    <div style={{ marginTop: 80, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Recently Viewed</h2>
                            <button className="btn btn-sm btn-outline" onClick={clearRecentlyViewed}>Clear History</button>
                        </div>
                        <CarList cars={recentlyViewed.slice(0, 4)} loading={false} />
                    </div>
                )}
            </div>
        </div>
    );
}
