import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import NegotiationChat from '../components/NegotiationChat';
import OrderTimeline from '../components/OrderTimeline';
import { sanitizeImageUrl } from '../utils/imageUtils';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('cars'); // 'cars' | 'orders'

    if (user?.role !== 'admin') return <Navigate to="/" replace />;

    return (
        <div className="admin-page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 className="page-title">Admin Dashboard</h1>
                        <p className="page-subtitle">Manage your inventory and incoming orders</p>
                    </div>
                    <div className="admin-tabs">
                        <button className={`btn ${tab === 'cars' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('cars')}>Manage Cars</button>
                        <button className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('orders')}>Manage Orders</button>
                    </div>
                </div>

                {tab === 'cars' && <ManageCars />}
                {tab === 'orders' && <ManageOrders />}
            </div>
        </div>
    );
}

// -----------------------------------------------------
// Manage Cars Panel
// -----------------------------------------------------
function ManageCars() {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingCar, setEditingCar] = useState(null);

    const fetchCars = async () => {
        setLoading(true);
        try {
            const res = await api.get('/cars?limit=100');
            setCars(res.data.cars);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchCars(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this car?')) return;
        try {
            await api.delete(`/cars/${id}`);
            setCars(prev => prev.filter(c => c._id !== id));
            toast.success('Car deleted successfully');
        } catch { toast.error('Failed to delete car'); }
    };

    const openForm = (car = null) => {
        setEditingCar(car);
        setModalOpen(true);
    };

    return (
        <div className="admin-panel card">
            <div className="panel-header">
                <h3>Car Inventory ({cars.length})</h3>
                <button className="btn btn-primary btn-sm" onClick={() => openForm()}><FiPlus /> Add New Car</button>
            </div>
            {loading ? <div className="spinner" /> : (
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Car</th>
                                <th>Price</th>
                                <th>Year</th>
                                <th>Category</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cars.map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <img src={c.images?.[0] || '/assets/images/default-car.png'} alt="" className="admin-thumb" />
                                            <strong>{c.make} {c.model}</strong>
                                        </div>
                                    </td>
                                    <td>${c.price.toLocaleString()}</td>
                                    <td>{c.year}</td>
                                    <td><span className="badge">{c.category}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="icon-btn edit" onClick={() => openForm(c)}><FiEdit2 /></button>
                                            <button className="icon-btn delete" onClick={() => handleDelete(c._id)}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <CarFormModal
                    car={editingCar}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => { setModalOpen(false); fetchCars(); }}
                />
            )}
        </div>
    );
}

// -----------------------------------------------------
// Car Form Modal (Create / Edit)
// -----------------------------------------------------
function CarFormModal({ car, onClose, onSuccess }) {
    const [form, setForm] = useState({
        make: car?.make || '', model: car?.model || '', year: car?.year || '', price: car?.price || '',
        mileage: car?.mileage || '', fuelType: car?.fuelType || 'Petrol', transmission: car?.transmission || 'Automatic',
        category: car?.category || 'Sedan', description: car?.description || '', imageUrl: car?.images?.[0] || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = { ...form, images: [form.imageUrl] };
        try {
            if (car) await api.put(`/cars/${car._id}`, payload);
            else await api.post('/cars', payload);
            toast.success(car ? 'Car updated!' : 'Car created!');
            onSuccess();
        } catch {
            toast.error('Failed to save car');
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card">
                <div className="modal-header">
                    <h3>{car ? 'Edit Car' : 'Add New Car'}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group"><label>Make</label><input required className="form-control" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} /></div>
                        <div className="form-group"><label>Model</label><input required className="form-control" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div>
                        <div className="form-group"><label>Year</label><input required type="number" className="form-control" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
                        <div className="form-group"><label>Price ($)</label><input required type="number" className="form-control" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                        <div className="form-group"><label>Mileage</label><input required type="number" className="form-control" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} /></div>
                        <div className="form-group"><label>Category</label><select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}><option>Sedan</option><option>SUV</option><option>Truck</option><option>Coupe</option><option>Hatchback</option><option>Van</option><option>Convertible</option></select></div>
                        <div className="form-group"><label>Fuel Type</label><select className="form-control" value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}><option>Petrol</option><option>Diesel</option><option>Electric</option><option>Hybrid</option></select></div>
                        <div className="form-group"><label>Transmission</label><select className="form-control" value={form.transmission} onChange={e => setForm(f => ({ ...f, transmission: e.target.value }))}><option>Automatic</option><option>Manual</option></select></div>
                    </div>
                    <div className="form-group"><label>Image URL</label><input required className="form-control" placeholder="https://..." value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} /></div>
                    <div className="form-group"><label>Description</label><textarea required className="form-control" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Car'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// -----------------------------------------------------
// Manage Orders Panel
// -----------------------------------------------------
function ManageOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders').then(r => { setOrders(r.data); setLoading(false); }).catch(() => { });
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/orders/${id}`, { status });
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
            toast.success('Status updated');
        } catch { toast.error('Failed to update status'); }
    };

    return (
        <div className="admin-panel card">
            <div className="panel-header">
                <h3>Customer Inquiries & Orders ({orders.length})</h3>
            </div>
            {loading ? <div className="spinner" /> : (
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Ref</th>
                                <th>Buyer Detail</th>
                                <th>Asset & Financials</th>
                                <th>Status</th>
                                <th>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o._id}>
                                    <td style={{ fontSize: '0.8rem', opacity: 0.6 }}>#{o._id.slice(-6).toUpperCase()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <img
                                                src={sanitizeImageUrl(o.user?.profilePhoto, 'avatar')}
                                                alt=""
                                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{o.user?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.user?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{o.car?.make} {o.car?.model}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <span style={{ color: '#2a9d8f', fontWeight: 800, fontSize: '0.95rem' }}>${(o.totalPrice || o.car?.price)?.toLocaleString()}</span>
                                            <span className="badge badge-gold" style={{ fontSize: '0.6rem' }}>{o.type?.toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <select className="form-control" style={{ padding: '4px 8px', fontSize: '0.8rem', border: 'none', background: 'rgba(255,255,255,0.05)' }} value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            "{o.message || 'No memo'}"
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
