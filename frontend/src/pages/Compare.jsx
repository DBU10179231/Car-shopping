import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiPlus, FiX } from 'react-icons/fi';
import StarRating from '../components/StarRating';
import './Compare.css';

export default function Compare() {
    const [selected, setSelected] = useState([null, null, null, null]);
    const [searches, setSearches] = useState(['', '', '', '']);
    const [results, setResults] = useState([[], [], [], []]);

    useEffect(() => {
        const queue = JSON.parse(localStorage.getItem('compareQueue') || '[]');
        if (queue.length > 0) {
            const initialSelected = [null, null, null, null];
            queue.slice(0, 4).forEach((car, i) => initialSelected[i] = car);
            setSelected(initialSelected);
            localStorage.removeItem('compareQueue');
        }
    }, []);

    const search = async (query, slot) => {
        if (!query) return;
        const res = await api.get(`/cars?search=${query}&limit=5`);
        setResults(prev => { const n = [...prev]; n[slot] = res.data.cars; return n; });
    };

    useEffect(() => { const t = setTimeout(() => search(searches[0], 0), 400); return () => clearTimeout(t); }, [searches[0]]);
    useEffect(() => { const t = setTimeout(() => search(searches[1], 1), 400); return () => clearTimeout(t); }, [searches[1]]);
    useEffect(() => { const t = setTimeout(() => search(searches[2], 2), 400); return () => clearTimeout(t); }, [searches[2]]);
    useEffect(() => { const t = setTimeout(() => search(searches[3], 3), 400); return () => clearTimeout(t); }, [searches[3]]);

    const setSearch = (query, slot) => {
        setSearches(prev => { const n = [...prev]; n[slot] = query; return n; });
    };

    const selectCar = (car, slot) => {
        const s = [...selected]; s[slot] = car; setSelected(s);
        setSearch('', slot);
        setResults(prev => { const n = [...prev]; n[slot] = []; return n; });
    };

    const SPECS = [
        { label: 'Price', key: 'price', format: v => `$${v?.toLocaleString()}` },
        { label: 'Year', key: 'year' },
        { label: 'Mileage', key: 'mileage', format: v => `${v?.toLocaleString()} mi` },
        { label: 'Fuel Type', key: 'fuelType' },
        { label: 'Transmission', key: 'transmission' },
        { label: 'Category', key: 'category' },
        { label: 'Color', key: 'color' },
        { label: 'Rating', key: 'rating' },
    ];

    return (
        <div style={{ padding: '48px 0 80px' }}>
            <div className="container">
                <h1 className="page-title">Compare Cars</h1>
                <p className="page-subtitle">Select up to 4 cars to compare side by side</p>

                <div className="compare-grid">
                    {[0, 1, 2, 3].map(slot => (
                        <div key={slot} className="compare-slot">
                            {selected[slot] ? (
                                <div className="compare-car card">
                                    <button className="compare-remove" onClick={() => { const s = [...selected]; s[slot] = null; setSelected(s); }}><FiX /></button>
                                    <img src={selected[slot].images?.[0]?.startsWith('http') ? selected[slot].images[0] : `http://127.0.0.1:5008${selected[slot].images?.[0]}`} alt="" />
                                    <div className="compare-car-title">
                                        <h3>{selected[slot].make} {selected[slot].model}</h3>
                                        <span>${selected[slot].price?.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="compare-picker card">
                                    <FiPlus size={32} />
                                    <p>Select car</p>
                                    <input className="form-control" placeholder="Search make..."
                                        value={searches[slot]}
                                        onChange={e => setSearch(e.target.value, slot)} />
                                    {results[slot].length > 0 && (
                                        <div className="compare-results">
                                            {results[slot].map(c => (
                                                <div key={c._id} className="compare-result-item" onClick={() => selectCar(c, slot)}>
                                                    <img src={c.images?.[0]?.startsWith('http') ? c.images[0] : `http://localhost:5001${c.images?.[0]}`} alt="" />
                                                    <div className="result-info">
                                                        <div className="result-name">{c.make} {c.model}</div>
                                                        <div className="result-price">${c.price?.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {selected.filter(Boolean).length >= 2 && (
                    <div className="compare-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Spec</th>
                                    {selected.map((car, i) => (
                                        <th key={i}>{car ? `${car.make} ${car.model}` : '-'}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {SPECS.map(spec => {
                                    const validValues = selected.map(car => car ? car[spec.key] : null).filter(v => v !== null && v !== undefined);
                                    const isDifferent = validValues.length > 1 && new Set(validValues).size > 1;

                                    return (
                                        <tr key={spec.key} className={isDifferent ? 'highlight-row' : ''}>
                                            <td className="spec-label">{spec.label} {isDifferent && <span className="diff-badge" title="Difference found">●</span>}</td>
                                            {selected.map((car, i) => (
                                                <td key={i}>
                                                    {!car ? '-' : spec.key === 'rating' ? <StarRating rating={car[spec.key]} /> : spec.format ? spec.format(car[spec.key]) : car[spec.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
