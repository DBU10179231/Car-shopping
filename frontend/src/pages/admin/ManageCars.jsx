import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle, FiEdit2, FiTrash2, FiImage, FiPlus, FiSearch, FiUpload, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function ManageCars() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState(searchParams.get('query') || '');
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [editingCar, setEditingCar] = useState(null);
    const [formData, setFormData] = useState({
        make: '', model: '', year: 2024, price: 0, mileage: 0,
        category: 'Sedan', fuelType: 'Gasoline', transmission: 'Automatic',
        location: 'Addis Ababa', color: 'White',
        engineSize: '', driveType: 'FWD', condition: 'Used',
        engine: '', registration: '', description: '', features: ''
    });
    const [images, setImages] = useState([]);

    const fetchCars = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/cars?search=${search}&status=${statusFilter}`);
            setCars(res.data.cars);
        } catch {
            toast.error('Failed to load cars');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCars();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter]);

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
                engine: car.engine || '', registration: car.registration || '',
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
                engine: '', registration: '', description: '', features: ''
            });
        }
        setImages([]);
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
                toast.success('Car updated');
            } else {
                await api.post('/cars', data);
                toast.success('Car added successfully');
            }
            setShowModal(false);
            fetchCars();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        }
    };

    const updateStatus = async (id, status, reason = '') => {
        try {
            if (status === 'rejected' && !reason) {
                setRejectingId(id);
                setRejectReason('');
                setShowRejectModal(true);
                return;
            }

            await api.put(`/admin/cars/${id}/status`, { status, rejectReason: reason });
            toast.success(`Car marked as ${status}`);
            setCars(prev => prev.map(c => c._id === id ? { ...c, status, rejectReason: reason } : c));
            setShowRejectModal(false);
        } catch {
            toast.error('Status update failed');
        }
    };

    const deleteCar = async (id) => {
        if (!window.confirm('Delete this listing permanently?')) return;
        try {
            await api.delete(`/cars/${id}`);
            setCars(prev => prev.filter(c => c._id !== id));
            toast.success('Car deleted');
        } catch { toast.error('Delete failed'); }
    };

    const filteredCars = cars; // Backend already filters

    return (
        <div className="card admin-panel">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3>Car Listings Management</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filteredCars.length} listings</p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <FiImage style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search make, model, VIN..."
                            className="form-control"
                            style={{ paddingLeft: 36, width: 220 }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="form-control" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="sold">Sold</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}><FiPlus /> Add Car</button>
                </div>
            </div>

            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Vehicle</th>
                            <th>Price</th>
                            <th>Seller</th>
                            <th>Status</th>
                            <th>Date Logged</th>
                            <th>Intervention</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}><div className="spinner"></div></td></tr>
                        ) : filteredCars.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>No cars found</td></tr>
                        ) : (
                            filteredCars.map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <img src={c.images?.[0]?.startsWith('http') ? c.images[0] : `${window.location.protocol}//${window.location.hostname}:5001${c.images?.[0] || '/assets/images/default-car.png'}`} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                            <div>
                                                <strong>{c.make} {c.model}</strong>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.year} • {c.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${c.price.toLocaleString()}</td>
                                    <td>
                                        {c.seller ? (
                                            <div>
                                                <strong>{c.seller.name}</strong>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.seller.email}</div>
                                            </div>
                                        ) : 'System Admin'}
                                    </td>
                                    <td>
                                        <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'pending' ? 'badge-gold' : ''}`}>
                                            {c.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {c.status === 'pending' && (
                                                <button className="icon-btn" style={{ color: '#2a9d8f' }} title="Approve" onClick={() => updateStatus(c._id, 'active')}><FiCheckCircle /></button>
                                            )}
                                            {c.status !== 'rejected' && (
                                                <button className="icon-btn" style={{ color: '#e63946' }} title="Reject" onClick={() => updateStatus(c._id, 'rejected')}><FiXCircle /></button>
                                            )}
                                            <button className="icon-btn edit" title="Edit" onClick={() => handleOpenModal(c)}><FiEdit2 /></button>
                                            <button className="icon-btn delete" title="Delete" onClick={() => deleteCar(c._id)}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Car Form Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 800 }}>
                        <div className="modal-header">
                            <h3>{editingCar ? 'Edit Car Listing' : 'Add New Car'}</h3>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><FiXCircle /></button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Make</label>
                                    <input type="text" className="form-control" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Model</label>
                                    <input type="text" className="form-control" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Year</label>
                                    <input type="number" className="form-control" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Price ($)</label>
                                    <input type="number" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Mileage (km)</label>
                                    <input type="number" className="form-control" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="SUV">SUV</option>
                                        <option value="Sedan">Sedan</option>
                                        <option value="Coupe">Coupe</option>
                                        <option value="Truck">Truck</option>
                                        <option value="Electric">Electric</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Fuel Type</label>
                                    <select className="form-control" value={formData.fuelType} onChange={e => setFormData({ ...formData, fuelType: e.target.value })}>
                                        <option value="Gasoline">Gasoline</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="Electric">Electric</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Transmission</label>
                                    <select className="form-control" value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })}>
                                        <option value="Automatic">Automatic</option>
                                        <option value="Manual">Manual</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input type="text" className="form-control" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <input type="text" className="form-control" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Engine Size (e.g. 2.5L)</label>
                                    <input type="text" className="form-control" value={formData.engineSize} onChange={e => setFormData({ ...formData, engineSize: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Drive Type</label>
                                    <select className="form-control" value={formData.driveType} onChange={e => setFormData({ ...formData, driveType: e.target.value })}>
                                        <option value="FWD">FWD</option>
                                        <option value="RWD">RWD</option>
                                        <option value="AWD">AWD</option>
                                        <option value="4WD">4WD</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Condition</label>
                                    <select className="form-control" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                                        <option value="Used">Used</option>
                                        <option value="New">New</option>
                                        <option value="Certified Pre-Owned">Certified Pre-Owned</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Features (comma separated)</label>
                                <input type="text" className="form-control" placeholder="e.g. Sunroof, Leather Seats, Bluetooth" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Description</label>
                                <textarea className="form-control" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Upload Images</label>
                                <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} />
                                <div className="image-previews" style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto' }}>
                                    {images.map((img, i) => (
                                        <div key={i} style={{ width: 80, height: 60, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                                            <img src={URL.createObjectURL(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingCar ? 'Update Car' : 'Add Vehicle'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>Reject Listing</h3>
                            <button className="icon-btn" onClick={() => setShowRejectModal(false)}><FiXCircle /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Please provide a reason for rejecting this vehicle listing. This will be visible to the seller.
                            </p>
                            <textarea
                                className="form-control"
                                rows={4}
                                placeholder="e.g., Photos are blurry or missing engine details..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setShowRejectModal(false)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" style={{ background: '#e63946', borderColor: '#e63946' }} onClick={() => updateStatus(rejectingId, 'rejected', rejectReason)} disabled={!rejectReason.trim()}>
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
