import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiSearch, FiShieldOff, FiShield, FiTrash2, FiCheckCircle, FiXCircle, FiPlus, FiDownload, FiLogOut, FiEdit2, FiEye, FiEyeOff, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { sanitizeImageUrl } from '../../utils/imageUtils';

const ROLES = ['user', 'admin', 'dealer', 'support', 'finance', 'content_manager', 'super_admin'];
const STATUSES = ['all', 'active', 'banned'];

const EMPTY_FORM = {
    name: '', email: '', phone: '', password: '', role: 'user',
    permissions: '', isVerifiedSeller: false
};

export default function ManageUsers() {
    const { user: currentUser, switchViewMode } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('query') || '');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    // Modal state (shared for add + edit)
    const [modal, setModal] = useState(null); // null | 'add' | 'edit'
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?search=${search}`);
            setUsers(res.data.users);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchUsers, 500);
        return () => clearTimeout(t);
    }, [search]);

    const toggleBan = async (id) => {
        try {
            const res = await api.put(`/admin/users/${id}/ban`);
            toast.success(res.data.message);
            setUsers(prev => prev.map(u => u._id === id ? { ...u, status: res.data.user.status } : u));
        } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    };

    const toggleVerify = async (id) => {
        const user = users.find(u => u._id === id);
        const newStatus = user?.isVerifiedSeller ? 'rejected' : 'approved';
        try {
            const res = await api.put(`/admin/sellers/${id}/verify-docs`, { status: newStatus, reason: '' });
            toast.success(res.data.message || `Seller ${newStatus}`);
            setUsers(prev => prev.map(u => u._id === id ? { ...u, isVerifiedSeller: !u.isVerifiedSeller } : u));
        } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Delete this user permanently?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success('User deleted');
            setUsers(prev => prev.filter(u => u._id !== id));
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    };

    const handleRevokeSessions = async (id) => {
        if (!window.confirm('Forcefully log this user out of all active sessions?')) return;
        try {
            const res = await api.put(`/admin/users/${id}/revoke-sessions`);
            toast.success(res.data.message);
        } catch (err) { toast.error(err.response?.data?.message || 'Session revocation failed'); }
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'];
        const rows = filteredUsers.map(u => [u.name, u.email, u.phone || '', u.role, u.status, new Date(u.createdAt).toLocaleDateString()]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'users_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const openAddModal = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setModal('add');
    };

    const openEditModal = (u) => {
        setFormData({
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            password: '',
            role: u.role,
            isVerifiedSeller: u.isVerifiedSeller || false,
            permissions: (u.permissions || []).join(', ')
        });
        setEditingId(u._id);
        setModal('edit');
    };

    const closeModal = () => { setModal(null); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData };
            payload.permissions = formData.permissions ? formData.permissions.split(',').map(p => p.trim()).filter(p => p) : [];

            if (modal === 'add') {
                const res = await api.post('/admin/users', payload);
                toast.success(res.data.message);
                setUsers(prev => [res.data.user, ...prev]);
            } else {
                if (!payload.password) delete payload.password;
                const res = await api.put(`/admin/users/${editingId}`, payload);
                toast.success(res.data.message);
                setUsers(prev => prev.map(u => u._id === editingId ? { ...u, ...res.data.user } : u));
            }
            closeModal();
        } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
        finally { setSaving(false); }
    };

    const handleViewAsUser = (u) => {
        switchViewMode('user');
        navigate('/hub');
        toast.info(`Simulating platform as ${u.name}`);
    };

    const handleViewAsSeller = (u) => {
        switchViewMode('dealer');
        navigate('/seller');
        toast.info(`Simulating platform as ${u.name} (Dealer Mode)`);
    };

    const filteredUsers = users.filter(u => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="card admin-panel">
            <div className="panel-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3>User & Staff Management</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{filteredUsers.length} users found</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Search accounts..." className="form-control" style={{ paddingLeft: 36, width: 210 }} value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-control" style={{ width: 130 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                            <option value="all">All Roles</option>
                            {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                        <button className="btn btn-secondary btn-sm" onClick={exportCSV}><FiDownload /> Export CSV</button>
                        <button className="btn btn-primary btn-sm" onClick={openAddModal}><FiPlus /> Add User</button>
                    </div>
                </div>
            </div>

            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>User Profile</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Password (Hash)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>No users found</td></tr>
                        ) : filteredUsers.map(u => (
                            <tr key={u._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {u.avatar || u.profilePhoto
                                            ? <img src={sanitizeImageUrl(u.avatar || u.profilePhoto, 'avatar')} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                                            : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{u.name.charAt(0).toUpperCase()}</div>
                                        }
                                        <div>
                                            <strong style={{ fontSize: '0.9rem' }}>{u.name} {u._id === currentUser._id && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(You)</span>}</strong>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                                <td>
                                    <span className={`badge ${u.role === 'super_admin' ? 'badge-gold' : u.role === 'admin' ? 'badge-primary' : 'badge-light'}`}>
                                        {u.role === 'dealer' ? 'Seller' : u.role.replace('_', ' ')}
                                    </span>
                                    {u.isVerifiedSeller && <span className="badge badge-green" style={{ display: 'block', width: 'fit-content', marginTop: 4, fontSize: '0.64rem' }}>✔ VERIFIED SELLER</span>}
                                </td>
                                <td style={{ fontSize: '0.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {u.status === 'banned'
                                        ? <span className="badge" style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946' }}>BANNED</span>
                                        : <span className="badge badge-green">ACTIVE</span>
                                    }
                                </td>
                                <td>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        fontFamily: 'monospace',
                                        maxWidth: 120,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }} title={u.password}>
                                        {u.password || '—'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {/* Admins can edit users/dealers, Super Admins can edit anyone except themselves (role-wise) */}
                                        {(currentUser.role === 'super_admin' || (u.role !== 'admin' && u.role !== 'super_admin')) && (
                                            <button className="icon-btn" title="Update Profile / Change Password" onClick={() => openEditModal(u)} style={{ color: 'var(--primary)' }}>
                                                <FiEdit2 />
                                            </button>
                                        )}

                                        {(currentUser.role === 'super_admin' || (u.role !== 'admin' && u.role !== 'super_admin')) && (
                                            <button
                                                className="icon-btn"
                                                title={u.role === 'dealer' ? 'Simulate Dealer Hub' : 'Simulate Buyer Hub'}
                                                onClick={() => u.role === 'dealer' ? handleViewAsSeller(u) : handleViewAsUser(u)}
                                                style={{ color: '#eb5e28' }}
                                            >
                                                <FiEye />
                                            </button>
                                        )}

                                        {(currentUser.role === 'super_admin' || (u.role !== 'admin' && u.role !== 'super_admin')) && (
                                            <Link to={`/admin/orders?search=${u.email}`} className="icon-btn" title="View Transaction History" style={{ color: '#2a9d8f' }}>
                                                <FiShoppingBag />
                                            </Link>
                                        )}

                                        {(currentUser.role === 'super_admin' || (u.role !== 'admin' && u.role !== 'super_admin')) && (
                                            <button className="icon-btn" title={u.status === 'banned' ? 'Unban User' : 'Ban User'} onClick={() => toggleBan(u._id)} disabled={u._id === currentUser._id} style={{ opacity: u._id === currentUser._id ? 0.35 : 1, color: u.status === 'banned' ? '#2a9d8f' : '#e63946' }}>
                                                {u.status === 'banned' ? <FiShield /> : <FiShieldOff />}
                                            </button>
                                        )}

                                        {(currentUser.role === 'super_admin' || (u.role !== 'admin' && u.role !== 'super_admin')) && (
                                            <button className="icon-btn" title="Forced Logout" onClick={() => handleRevokeSessions(u._id)} disabled={u._id === currentUser._id} style={{ opacity: u._id === currentUser._id ? 0.3 : 1, color: '#fba94c' }}>
                                                <FiLogOut />
                                            </button>
                                        )}

                                        {(currentUser.role === 'super_admin' || (u.role !== 'admin' && u.role !== 'super_admin')) && (
                                            <button className="icon-btn delete" title="Permanently Delete" onClick={() => handleDeleteUser(u._id)} disabled={u._id === currentUser._id} style={{ opacity: u._id === currentUser._id ? 0.35 : 1 }}>
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

            {/* Polished Edit User Modal */}
            {modal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 550, width: '90%' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 15 }}>
                            <h3>{modal === 'add' ? 'Create New User Account' : 'Edit User Profile'}</h3>
                            <button className="icon-btn" onClick={closeModal}><FiXCircle /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body" style={{ marginTop: 20 }}>
                            <div className="grid grid-2" style={{ gap: 16 }}>
                                <div className="form-group">
                                    <label>Display Name *</label>
                                    <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Email Address *</label>
                                    <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+251 ..." />
                                </div>
                                <div className="form-group">
                                    <label>{modal === 'add' ? 'Account Password *' : 'Update Password (Optional)'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required={modal === 'add'}
                                            placeholder={modal === 'add' ? "Secure password" : "••••••••"}
                                            style={{ paddingRight: 40 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex'
                                            }}
                                            title={showPassword ? "Hide Password" : "Show Password"}
                                        >
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>System Role</label>
                                    <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} disabled={editingId === currentUser._id}>
                                        {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-end', height: 42 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input type="checkbox" checked={formData.isVerifiedSeller} onChange={e => setFormData({ ...formData, isVerifiedSeller: e.target.checked })} /> Verified Seller
                                    </label>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 15 }}>
                                <label>Custom Permissions (Comma Separated)</label>
                                <textarea className="form-control" rows={2} value={formData.permissions} onChange={e => setFormData({ ...formData, permissions: e.target.value })} placeholder="e.g. view_analytics, manage_reports" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 25, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                    {saving ? 'Processing...' : modal === 'add' ? 'Create User' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
