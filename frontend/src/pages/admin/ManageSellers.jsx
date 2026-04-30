import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle, FiSearch, FiStar, FiBox, FiActivity, FiDownload, FiUserCheck, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['user', 'admin', 'dealer', 'support', 'finance', 'content_manager', 'super_admin'];
const EMPTY_FORM = {
    name: '', email: '', phone: '', password: '', role: 'dealer',
    permissions: '', isVerifiedSeller: false,
    sellerType: 'private', sellerBio: '', shopName: '',
    address: { street: '', city: '', state: '', zip: '' }
};

export default function ManageSellers() {
    const { user: currentUser } = useAuth();
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modals
    const [rejectingSeller, setRejectingSeller] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [viewingMetrics, setViewingMetrics] = useState(null);
    const [metricsLoading, setMetricsLoading] = useState(false);

    // Edit Modal state
    const [modal, setModal] = useState(null); // null | 'add' | 'edit'
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/admin/users?search=').then(res => {
            setSellers(res.data.users.filter(u => u.role === 'dealer' || u.isVerifiedSeller || u.role === 'user'));
        }).catch(() => toast.error('Failed to load sellers'))
            .finally(() => setLoading(false));
    }, []);

    const handleVerifyDocs = async (id, status, reason = '') => {
        try {
            const res = await api.put(`/admin/sellers/${id}/verify-docs`, { status, reason });
            toast.success(res.data.message);
            setSellers(prev => prev.map(s => s._id === id ? { ...s, isVerifiedSeller: res.data.user.isVerifiedSeller } : s));
            setRejectingSeller(null);
            setRejectReason('');
        } catch { toast.error('Verification update failed'); }
    };

    const loadMetrics = async (seller) => {
        setViewingMetrics({ ...seller, stats: null });
        setMetricsLoading(true);
        try {
            const res = await api.get(`/admin/sellers/${seller._id}/metrics`);
            setViewingMetrics({ ...seller, stats: res.data });
        } catch {
            toast.error('Failed to load metrics');
            setViewingMetrics(null);
        } finally {
            setMetricsLoading(false);
        }
    };

    const filtered = sellers.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
        if (filterStatus === 'verified') return matchSearch && s.isVerifiedSeller;
        if (filterStatus === 'unverified') return matchSearch && !s.isVerifiedSeller;
        return matchSearch;
    });

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Verified', 'Bio'];
        const rows = filtered.map(s => [s.name, s.email, s.phone || '', s.role, s.isVerifiedSeller ? 'Yes' : 'No', (s.sellerBio || '').replace(/,/g, ';')]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sellers_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const promoteToDealer = async (id) => {
        try {
            await api.put(`/admin/users/${id}/role`, { role: 'dealer' });
            toast.success('User promoted to Dealer');
            setSellers(prev => prev.map(s => s._id === id ? { ...s, role: 'dealer' } : s));
        } catch { toast.error('Promotion failed'); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Delete this user permanently?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success('User deleted');
            setSellers(prev => prev.filter(s => s._id !== id));
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    };

    const openAddModal = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setModal('add');
    };

    const openEditModal = (s) => {
        setFormData({
            name: s.name,
            email: s.email,
            phone: s.phone || '',
            password: '',
            role: s.role,
            permissions: (s.permissions || []).join(', '),
            isVerifiedSeller: s.isVerifiedSeller || false,
            sellerType: s.sellerType || 'private',
            sellerBio: s.sellerBio || '',
            shopName: s.shopName || '',
            address: s.address || { street: '', city: '', state: '', zip: '' }
        });
        setEditingId(s._id);
        setModal('edit');
    };

    const closeModal = () => { setModal(null); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                permissions: formData.permissions ? formData.permissions.split(',').map(p => p.trim()).filter(p => p) : [],
                isVerifiedSeller: formData.isVerifiedSeller,
                sellerType: formData.sellerType,
                sellerBio: formData.sellerBio,
                shopName: formData.shopName,
                address: formData.address
            };

            if (modal === 'add') {
                payload.password = formData.password;
                const res = await api.post('/admin/users', payload);
                toast.success(res.data.message);
                setSellers(prev => [res.data.user, ...prev]);
            } else {
                const res = await api.put(`/admin/users/${editingId}`, payload);
                if (formData.password) {
                    await api.put(`/admin/users/${editingId}`, { ...payload, password: formData.password });
                }
                toast.success(res.data.message);
                setSellers(prev => prev.map(s => s._id === editingId ? { ...s, ...res.data.user } : s));
            }
            closeModal();
        } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
        finally { setSaving(false); }
    };

    return (
        <div className="card admin-panel">
            <div className="panel-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3>Seller / Dealership Management</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{filtered.length} sellers</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Search sellers..." className="form-control" style={{ paddingLeft: 36, width: 220 }} value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-control" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="all">All Sellers</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                        <button className="btn btn-secondary btn-sm" onClick={exportCSV}><FiDownload /> Export CSV</button>
                        <button className="btn btn-primary btn-sm" onClick={openAddModal}><FiPlus /> Add Seller</button>
                    </div>
                </div>
            </div>
            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Seller</th>
                            <th>Phone</th>
                            <th>Shop / Type</th>
                            <th>Verification</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
                        ) : filtered.map(s => (
                            <tr key={s._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {s.profilePhoto
                                            ? <img src={s.profilePhoto} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                                            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{s.name.charAt(0)}</div>
                                        }
                                        <div>
                                            <strong style={{ fontSize: '0.9rem' }}>{s.name}</strong>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.phone || '—'}</td>
                                <td style={{ fontSize: '0.82rem' }}>
                                    <div>{s.shopName || 'No Shop Name'}</div>
                                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{s.sellerType}</span>
                                </td>
                                <td>
                                    {s.isVerifiedSeller
                                        ? <span className="badge badge-green">✔ Verified</span>
                                        : <span className="badge" style={{ background: 'rgba(244,162,97,0.15)', color: '#f4a261' }}>Pending</span>
                                    }
                                </td>
                                <td><span className="badge">{s.role}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {(currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.permissions?.includes('edit_users')) && !s.isVerifiedSeller && (
                                            <>
                                                <button className="icon-btn" title="Approve Documents" onClick={() => handleVerifyDocs(s._id, 'approved')} style={{ color: '#2a9d8f' }}>
                                                    <FiCheckCircle />
                                                </button>
                                                <button className="icon-btn" title="Reject Documents" onClick={() => setRejectingSeller(s)} style={{ color: '#e63946' }}>
                                                    <FiXCircle />
                                                </button>
                                            </>
                                        )}
                                        {currentUser.role === 'super_admin' && (
                                            <button className="icon-btn" title="Edit Seller" onClick={() => openEditModal(s)} style={{ color: '#457b9d' }}>
                                                <FiEdit2 />
                                            </button>
                                        )}
                                        <button className="icon-btn" title="View Listings" onClick={() => toast.info('Navigate to listings filtered by seller')} style={{ color: '#457b9d' }}>
                                            <FiBox />
                                        </button>
                                        <button className="icon-btn" title="View Performance Metrics" onClick={() => loadMetrics(s)} style={{ color: '#e9c46a' }}>
                                            <FiActivity />
                                        </button>
                                        {currentUser.role === 'super_admin' && (
                                            <button className="icon-btn delete" title="Delete" onClick={() => handleDeleteUser(s._id)} style={{ color: '#e63946' }}>
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Reject/Revoke Verification Modal */}
            {rejectingSeller && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>{rejectingSeller.isVerifiedSeller ? 'Revoke Verification' : 'Reject Documents'}</h3>
                            <button className="icon-btn" onClick={() => setRejectingSeller(null)}><FiXCircle /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 15, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Please provide a reason for rejecting the documents or revoking verification for <strong>{rejectingSeller.name}</strong>. This will be emailed to the seller.
                            </p>
                            <textarea
                                className="form-control"
                                rows={4}
                                placeholder="e.g., Business license uploaded is expired..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setRejectingSeller(null)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" style={{ background: '#e63946', borderColor: '#e63946' }} onClick={() => handleVerifyDocs(rejectingSeller._id, 'rejected', rejectReason)} disabled={!rejectReason.trim()}>
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Metrics Modal */}
            {viewingMetrics && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3>Seller Performance: {viewingMetrics.name}</h3>
                            <button className="icon-btn" onClick={() => setViewingMetrics(null)}><FiXCircle /></button>
                        </div>
                        <div className="modal-body">
                            {metricsLoading || !viewingMetrics.stats ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="metric-box" style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>{viewingMetrics.stats.totalListings}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Listings</div>
                                    </div>
                                    <div className="metric-box" style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2a9d8f' }}>{viewingMetrics.stats.activeListings}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Listings</div>
                                    </div>
                                    <div className="metric-box" style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e9c46a' }}>{viewingMetrics.stats.soldCars}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehicles Sold</div>
                                    </div>
                                    <div className="metric-box" style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e63946', paddingTop: 3 }}>${viewingMetrics.stats.totalRevenue.toLocaleString()}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Revenue</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Seller Modal */}
            {modal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 650, width: '90%' }}>
                        <div className="modal-header">
                            <h3>{modal === 'add' ? 'Add New Seller Account' : 'Edit Seller Details'}</h3>
                            <button className="icon-btn" onClick={closeModal}><FiXCircle /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="tabs-mini" style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
                                <div style={{ padding: '8px 16px', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 600 }}>Basic Info</div>
                                <div style={{ padding: '8px 16px', color: 'var(--text-muted)', cursor: 'not-allowed' }}>Business Details (All in one view)</div>
                            </div>

                            <div className="grid grid-2" style={{ gap: 16 }}>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+251 ..." />
                                </div>
                                <div className="form-group">
                                    <label>{modal === 'add' ? 'Password *' : 'New Password (Optional)'}</label>
                                    <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={modal === 'add'} />
                                </div>
                                <div className="form-group">
                                    <label>Shop/Dealership Name</label>
                                    <input className="form-control" value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} placeholder="e.g. Addis Motors" />
                                </div>
                                <div className="form-group">
                                    <label>Seller Type</label>
                                    <select className="form-control" value={formData.sellerType} onChange={e => setFormData({ ...formData, sellerType: e.target.value })}>
                                        <option value="private">Private Seller</option>
                                        <option value="dealership">Dealership</option>
                                        <option value="broker">Broker</option>
                                        <option value="importer_exporter">Importer / Exporter</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 10 }}>
                                <label>Seller Bio / Description</label>
                                <textarea className="form-control" rows={2} value={formData.sellerBio} onChange={e => setFormData({ ...formData, sellerBio: e.target.value })} placeholder="Write a brief professional bio..." />
                            </div>

                            <div style={{ background: 'var(--bg-body)', padding: 15, borderRadius: 12, marginTop: 10 }}>
                                <h4 style={{ fontSize: '0.85rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FiBox /> Address Details</h4>
                                <div className="grid grid-2" style={{ gap: 12 }}>
                                    <input className="form-control" placeholder="Street Address" value={formData.address.street} onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} />
                                    <input className="form-control" placeholder="City" value={formData.address.city} onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} />
                                    <input className="form-control" placeholder="State/Region" value={formData.address.state} onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} />
                                    <input className="form-control" placeholder="Zip Code" value={formData.address.zip} onChange={e => setFormData({ ...formData, address: { ...formData.address, zip: e.target.value } })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                                <div style={{ display: 'flex', gap: 15 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={formData.isVerifiedSeller} onChange={e => setFormData({ ...formData, isVerifiedSeller: e.target.checked })} /> Verified
                                    </label>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <select className="form-control form-control-sm" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                        {saving ? 'Saving...' : modal === 'add' ? 'Create Seller' : 'Update Seller'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
