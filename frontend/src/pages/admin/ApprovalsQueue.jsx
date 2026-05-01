import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle, FiClock, FiBox, FiUserCheck, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function ApprovalsQueue() {
    const [activeTab, setActiveTab] = useState('listings');
    const [listings, setListings] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listingsRes, usersRes] = await Promise.all([
                api.get('/admin/cars?status=pending'),
                api.get('/admin/users?status=pending') // Assuming backend can filter pending verifications
            ]);
            setListings(listingsRes.data.cars || []);
            // For sellers, we might need to filter users who are not yet verified but requested it
            setSellers(usersRes.data.users?.filter(u => !u.isVerifiedSeller && u.role === 'dealer') || []);
        } catch (err) {
            toast.error('Failed to sync approval queue');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproveListing = async (id) => {
        try {
            await api.put(`/admin/cars/${id}/status`, { status: 'active' });
            toast.success('Listing approved for publication');
            setListings(prev => prev.filter(l => l._id !== id));
        } catch { toast.error('Approval synchronization failed'); }
    };

    const handleRejectListing = async (id) => {
        const reason = window.prompt('Provide rejection reason (optional):');
        if (reason === null) return; // cancelled
        try {
            await api.put(`/admin/cars/${id}/status`, { status: 'rejected', reason });
            toast.success('Listing rejected');
            setListings(prev => prev.filter(l => l._id !== id));
        } catch { toast.error('Rejection failed'); }
    };

    const handleVerifySeller = async (id) => {
        try {
            await api.put(`/admin/sellers/${id}/verify-docs`, { status: 'approved' });
            toast.success('Seller identity verified');
            setSellers(prev => prev.filter(s => s._id !== id));
        } catch { toast.error('Verification failed'); }
    };

    return (
        <div className="fade-in">
            <h1 className="page-title">Moderation Queue</h1>
            <p className="page-subtitle">Verify and authorize pending system entities.</p>

            <div style={{ display: 'flex', gap: 15, marginBottom: 25 }}>
                <button 
                    onClick={() => setActiveTab('listings')}
                    className={`btn ${activeTab === 'listings' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <FiBox /> Listings Pending ({listings.length})
                </button>
                <button 
                    onClick={() => setActiveTab('sellers')}
                    className={`btn ${activeTab === 'sellers' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <FiUserCheck /> Seller Requests ({sellers.length})
                </button>
            </div>

            <div className="card glass-panel" style={{ padding: 0 }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" /></div>
                ) : (
                    <div className="admin-table">
                        <table>
                            <thead>
                                {activeTab === 'listings' ? (
                                    <tr>
                                        <th>Entity Preview</th>
                                        <th>Seller Node</th>
                                        <th>Price Target</th>
                                        <th>Time Logged</th>
                                        <th>Intervention</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Seller Identity</th>
                                        <th>Email Node</th>
                                        <th>Shop Name</th>
                                        <th>Time Logged</th>
                                        <th>Intervention</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {activeTab === 'listings' && listings.length === 0 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Queue clear: No pending listings.</td></tr>
                                )}
                                {activeTab === 'sellers' && sellers.length === 0 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Queue clear: No pending sellers.</td></tr>
                                )}

                                {activeTab === 'listings' && listings.map(l => (
                                    <tr key={l._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 45, height: 45, borderRadius: 8, background: 'var(--bg-card2)', overflow: 'hidden' }}>
                                                    {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiBox style={{ margin: 12, opacity: 0.3 }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.make} {l.model}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.year} • {l.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{l.seller?.name || 'Private Seller'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${l.price.toLocaleString()}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="icon-btn" onClick={() => handleApproveListing(l._id)} style={{ color: '#2a9d8f' }} title="Approve"><FiCheckCircle /></button>
                                                <button className="icon-btn" onClick={() => handleRejectListing(l._id)} style={{ color: '#e63946' }} title="Reject"><FiXCircle /></button>
                                                <Link to={`/cars/${l._id}`} target="_blank" className="icon-btn" style={{ color: '#457b9d' }} title="View Details"><FiExternalLink /></Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {activeTab === 'sellers' && sellers.map(s => (
                                    <tr key={s._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div className="avatar-mini">{s.name.charAt(0)}</div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{s.email}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{s.shopName || 'N/A'}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="icon-btn" onClick={() => handleVerifySeller(s._id)} style={{ color: '#2a9d8f' }} title="Verify"><FiCheckCircle /></button>
                                                <button className="icon-btn" onClick={() => toast.info('Reject logic for sellers')} style={{ color: '#e63946' }} title="Reject"><FiXCircle /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
