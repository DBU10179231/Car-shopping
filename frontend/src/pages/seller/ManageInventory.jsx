import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
    FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiImage,
    FiMapPin, FiActivity, FiTag, FiSearch, FiChevronRight,
    FiChevronLeft, FiLayers, FiAlertCircle
} from 'react-icons/fi';

export default function ManageInventory() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCar, setEditingCar] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        make: '', model: '', year: 2024, price: 0, mileage: 0,
        category: 'Sedan', fuelType: 'Gasoline', transmission: 'Automatic',
        location: 'Addis Ababa', color: 'White',
        engineSize: '', driveType: 'FWD', condition: 'Used',
        description: '', features: ''
    });
    const [images, setImages] = useState([]);
    const [step, setStep] = useState(1);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/seller/inventory');
            setCars(res.data.cars);
        } catch {
            toast.error('Failed to sync inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, []);

    const handleOpenModal = (car = null) => {
        if (car) {
            setEditingCar(car);
            setFormData({
                make: car.make, model: car.model, year: car.year, price: car.price,
                mileage: car.mileage || 0, category: car.category,
                fuelType: car.fuelType || 'Gasoline', transmission: car.transmission || 'Automatic',
                location: car.location || 'Addis Ababa',
                color: car.color || 'White',
                engineSize: car.engineSize || '',
                driveType: car.driveType || 'FWD',
                condition: car.condition || 'Used',
                description: car.description || '',
                features: Array.isArray(car.features) ? car.features.join(', ') : car.features || ''
            });
        } else {
            setEditingCar(null);
            setFormData({
                make: '', model: '', year: 2024, price: 0, mileage: 0,
                category: 'Sedan', fuelType: 'Gasoline', transmission: 'Automatic',
                location: 'Addis Ababa', color: 'White',
                engineSize: '', driveType: 'FWD', condition: 'Used',
                description: '', features: ''
            });
        }
        setImages([]);
        setStep(1);
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData || {}).forEach(key => data.append(key, formData[key]));
        images.forEach(img => data.append('images', img));

        try {
            if (editingCar) {
                await api.put(`/cars/${editingCar._id}`, data);
                toast.success('Listing synchronized');
            } else {
                await api.post('/cars', data);
                toast.success('Inventory deployed (Awaiting Verification)');
            }
            setShowModal(false);
            fetchInventory();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transaction failed');
        }
    };

    const deleteCar = async (id) => {
        if (!window.confirm('Are you sure you want to decommission this listing?')) return;
        try {
            await api.delete(`/cars/${id}`);
            setCars(prev => prev.filter(c => c._id !== id));
            toast.success('Listing removed from market');
        } catch { toast.error('Decommissioning failed'); }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/cars/${id}`, { status: newStatus });
            setCars(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
            toast.success(`Asset marked as ${newStatus.toUpperCase()}`);
        } catch {
            toast.error('Status synchronization failed');
        }
    };

    const filteredCars = cars.filter(c =>
        c.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.model.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fade-in inventory-suite" style={{ paddingBottom: 60 }}>
            {/* Control Header */}
            <div className="suite-control card glass-panel" style={{ padding: '30px 40px', marginBottom: 40, border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, mb: 5 }}>Manage <span className="gradient-text">Inventory</span></h1>
                        <p style={{ color: 'var(--text-muted)' }}>Add, Update, and Track your vehicle pipeline (Points 3, 4, 5, 10).</p>
                    </div>
                    <div style={{ display: 'flex', gap: 15 }}>
                        <div className="search-bar-modern">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Filter fleet..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 12 }} onClick={() => handleOpenModal()}>
                            <FiPlus /> New Asset
                        </button>
                    </div>
                </div>
            </div>

            {/* Inventory Grid/Table */}
            {loading ? <div className="spinner" style={{ margin: '60px auto' }} /> : (
                <div className="inventory-container card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Asset Details</th>
                                    <th>Specifications</th>
                                    <th>Valuation</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCars.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state">
                                            <FiLayers size={48} />
                                            <h3>No Assets Found</h3>
                                            <p>Deploy your first listing to start generating leads.</p>
                                        </td>
                                    </tr>
                                ) : filteredCars.map(c => (
                                    <tr key={c._id} className="asset-row">
                                        <td>
                                            <div className="asset-info">
                                                <div className="asset-media">
                                                    <img
                                                        src={c.images?.[0]?.startsWith('http') ? c.images[0] : `${window.location.protocol}//${window.location.hostname}:5001${c.images?.[0] || '/assets/images/default-car.png'}`}
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="asset-meta">
                                                    <div className="title">{c.make} {c.model}</div>
                                                    <div className="subtitle">{c.year} • {c.color}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="spec-badge-group">
                                                <span className="spec-item"><FiActivity size={12} /> {c.mileage?.toLocaleString()} km</span>
                                                <span className="spec-item"><FiTag size={12} /> {c.condition}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="asset-valuation">
                                                <span className="price">${c.price.toLocaleString()}</span>
                                                <span className="label">Retail Value</span>
                                            </div>
                                        </td>
                                        <td>
                                            <select
                                                className={`status-select-minimal ${c.status}`}
                                                value={c.status}
                                                onChange={(e) => handleStatusChange(c._id, e.target.value)}
                                            >
                                                <option value="active">ACTIVE (AVAILABLE)</option>
                                                <option value="reserved">RESERVED</option>
                                                <option value="sold">SOLD</option>
                                                {c.status === 'pending' && <option value="pending">PENDING REVIEW</option>}
                                                {c.status === 'rejected' && <option value="rejected">REJECTED</option>}
                                            </select>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-stack">
                                                <button className="btn-action-suite edit" onClick={() => handleOpenModal(c)}><FiEdit2 /></button>
                                                <button className="btn-action-suite delete" onClick={() => deleteCar(c._id)}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Premium Multi-step Modal */}
            {showModal && (
                <div className="modal-overlay-suite fade-in">
                    <div className="modal-suite-content glass-panel">
                        <div className="modal-suite-header">
                            <div>
                                <h2>{editingCar ? 'Update Asset' : 'Deploy New Asset'}</h2>
                                <p>Step {step} of 3: {step === 1 ? 'Core Details' : step === 2 ? 'Technical Specs' : 'Aesthetics & Media'}</p>
                            </div>
                            <button className="close-suite" onClick={() => setShowModal(false)}><FiX /></button>
                        </div>

                        <div className="suite-progress">
                            <div className={`bar ${step >= 1 ? 'active' : ''}`}></div>
                            <div className={`bar ${step >= 2 ? 'active' : ''}`}></div>
                            <div className={`bar ${step >= 3 ? 'active' : ''}`}></div>
                        </div>

                        <form onSubmit={handleFormSubmit} className="modal-suite-body">
                            {step === 1 && (
                                <div className="grid-form">
                                    <div className="input-field">
                                        <label>Manufacturer (Make)</label>
                                        <input type="text" placeholder="e.g. Toyota" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} required />
                                    </div>
                                    <div className="input-field">
                                        <label>Model Name</label>
                                        <input type="text" placeholder="e.g. Camry" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required />
                                    </div>
                                    <div className="input-field">
                                        <label>Release Year</label>
                                        <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} required />
                                    </div>
                                    <div className="input-field">
                                        <label>Market Listing Price ($)</label>
                                        <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                    </div>
                                    <div className="input-field">
                                        <label>Category</label>
                                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="Sedan">Sedan</option>
                                            <option value="SUV">SUV</option>
                                            <option value="Truck">Truck</option>
                                            <option value="Coupe">Coupe</option>
                                            <option value="Luxury">Luxury</option>
                                        </select>
                                    </div>
                                    <div className="input-field">
                                        <label>Physical Location</label>
                                        <div className="with-icon">
                                            <FiMapPin />
                                            <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grid-form">
                                    <div className="input-field">
                                        <label>Current Mileage (km)</label>
                                        <input type="number" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} required />
                                    </div>
                                    <div className="input-field">
                                        <label>Vehicle Condition</label>
                                        <select value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                                            <option value="Used">Used</option>
                                            <option value="New">New</option>
                                            <option value="CPO">Certified Pre-Owned</option>
                                        </select>
                                    </div>
                                    <div className="input-field">
                                        <label>Fuel Propulsion</label>
                                        <select value={formData.fuelType} onChange={e => setFormData({ ...formData, fuelType: e.target.value })}>
                                            <option value="Gasoline">Gasoline</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Electric">Electric</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div className="input-field">
                                        <label>Transmission</label>
                                        <select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })}>
                                            <option value="Automatic">Automatic</option>
                                            <option value="Manual">Manual</option>
                                        </select>
                                    </div>
                                    <div className="input-field" style={{ gridColumn: 'span 2' }}>
                                        <label>Premium Features (Comma separated)</label>
                                        <textarea rows="2" placeholder="Sunroof, Bose Audio, Autopilot..." value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })}></textarea>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="media-section">
                                    <div className="input-field">
                                        <label>Marketing Description</label>
                                        <textarea rows="4" placeholder="Highlight the vehicle's unique value props..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>
                                    <div className="upload-zone" onClick={() => document.getElementById('car-images').click()}>
                                        {images.length > 0 ? (
                                            <div className="preview-indicator">
                                                <FiImage />
                                                <span>{images.length} Assets Staged for Upload</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="upload-icon"><FiPlus /></div>
                                                <p>Drop hi-res JPG/PNG files here or <span>Browse Gallery</span></p>
                                            </>
                                        )}
                                        <input id="car-images" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => setImages(Array.from(e.target.files))} />
                                    </div>
                                </div>
                            )}

                            <div className="modal-suite-footer">
                                {step > 1 ? (
                                    <button type="button" className="btn btn-secondary-suite" onClick={() => setStep(step - 1)}>
                                        <FiChevronLeft /> Back
                                    </button>
                                ) : <div />}

                                <div style={{ display: 'flex', gap: 15 }}>
                                    {step < 3 ? (
                                        <button type="button" className="btn btn-primary-suite" onClick={() => setStep(step + 1)}>
                                            Continue <FiChevronRight />
                                        </button>
                                    ) : (
                                        <button type="submit" className="btn btn-primary-suite">
                                            {editingCar ? 'Commit Update' : 'Finalize Listing'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .inventory-suite { color: var(--text); }
                .glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border) !important;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.2) !important;
                }
                
                .search-bar-modern {
                    display: flex; align-items: center; gap: 12px;
                    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
                    padding: 0 20px; border-radius: 12px; width: 300px;
                }
                .search-bar-modern input {
                    background: none; border: none; padding: 12px 0; color: white; width: 100%; outline: none; font-size: 0.9rem;
                }
                .search-bar-modern svg { color: var(--text-muted); }
                
                .modern-table { width: 100%; border-collapse: collapse; }
                .modern-table th { text-align: left; padding: 25px 30px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); border-bottom: 2px solid var(--border); }
                .modern-table td { padding: 20px 30px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
                
                .asset-row { transition: all 0.3s; }
                .asset-row:hover { background: rgba(255,255,255,0.02); }
                
                .asset-info { display: flex; align-items: center; gap: 20px; }
                .asset-media img { width: 90px; height: 60px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border); }
                .asset-meta .title { font-weight: 800; font-size: 1.1rem; margin-bottom: 4px; }
                .asset-meta .subtitle { color: var(--text-muted); font-size: 0.85rem; }
                
                .spec-badge-group { display: flex; gap: 8px; flex-wrap: wrap; }
                .spec-item { 
                    padding: 5px 12px; border-radius: 20px; background: rgba(255,255,255,0.05);
                    font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;
                }
                
                .asset-valuation { display: flex; flex-direction: column; }
                .asset-valuation .price { font-weight: 900; font-size: 1.2rem; color: #2a9d8f; }
                .asset-valuation .label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
                
                .status-select-minimal {
                    padding: 8px 12px; border-radius: 12px; font-size: 0.7rem; font-weight: 800;
                    border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: white;
                    cursor: pointer; transition: all 0.2s; outline: none;
                }
                .status-select-minimal.active { color: #2a9d8f; border-color: rgba(42, 157, 143, 0.3); }
                .status-select-minimal.reserved { color: #f4a261; border-color: rgba(244, 162, 97, 0.3); }
                .status-select-minimal.sold { color: #e63946; border-color: rgba(230, 57, 70, 0.3); }
                .status-select-minimal.pending { color: #ff9f1c; }
                .status-select-minimal option { background: #0b0d14; color: white; }
                
                .action-stack { display: flex; gap: 10px; justify-content: flex-end; }
                .btn-action-suite { 
                    width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--border);
                    background: rgba(255,255,255,0.02); color: var(--text-muted);
                    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
                    cursor: pointer;
                }
                .btn-action-suite:hover { transform: translateY(-2px); border-color: var(--primary); color: var(--primary); }
                .btn-action-suite.delete:hover { border-color: #e63946; color: #e63946; }
                
                .empty-state { text-align: center; padding: 100px 30px !important; opacity: 0.5; }
                .empty-state h3 { margin-top: 20px; font-size: 1.4rem; }
                
                /* Modal Suite Styles */
                .modal-overlay-suite { 
                    position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
                    z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
                }
                .modal-suite-content { width: 100%; max-width: 800px; padding: 40px; border-radius: 30px; position: relative; }
                .modal-suite-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
                .modal-suite-header h2 { font-size: 1.8rem; font-weight: 900; margin: 0; }
                .modal-suite-header p { color: var(--text-muted); font-size: 0.9rem; margin-top: 5px; }
                .close-suite { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
                
                .suite-progress { display: flex; gap: 10px; margin-bottom: 40px; }
                .suite-progress .bar { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; }
                .suite-progress .bar.active { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
                
                .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
                .input-field { display: flex; flex-direction: column; gap: 10px; }
                .input-field label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .input-field input, .input-field select, .input-field textarea {
                    padding: 14px 18px; border-radius: 12px; background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border); color: white; outline: none; transition: border-color 0.2s;
                }
                .input-field input:focus { border-color: var(--primary); }
                .with-icon { position: relative; }
                .with-icon svg { position: absolute; left: 18px; top: 18px; color: var(--text-muted); }
                .with-icon input { padding-left: 45px; }
                
                .upload-zone { 
                    border: 2px dashed var(--border); padding: 50px 30px; border-radius: 20px;
                    text-align: center; cursor: pointer; background: rgba(255,255,255,0.02);
                    transition: all 0.3s;
                }
                .upload-zone:hover { background: rgba(255,255,255,0.05); border-color: var(--primary); }
                .upload-icon { width: 50px; height: 50px; background: var(--primary); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 1.5rem; }
                .upload-zone p span { color: var(--primary); font-weight: 700; }
                .preview-indicator { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #2a9d8f; font-weight: 700; }
                .preview-indicator svg { font-size: 2rem; }
                
                .modal-suite-footer { display: flex; justify-content: space-between; margin-top: 50px; }
                .btn-primary-suite { 
                    padding: 14px 30px; border-radius: 14px; background: var(--primary); color: white;
                    border: none; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer;
                    box-shadow: 0 10px 20px rgba(230, 57, 70, 0.3);
                }
                .btn-secondary-suite { 
                    padding: 14px 20px; border-radius: 14px; background: rgba(255,255,255,0.05); color: white;
                    border: 1px solid var(--border); font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer;
                }
                
                @media (max-width: 768px) {
                    .grid-form { grid-template-columns: 1fr; }
                    .search-bar-modern { width: 100%; }
                }
            `}</style>
        </div>
    );
}
