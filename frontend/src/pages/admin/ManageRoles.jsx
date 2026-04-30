import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const AVAILABLE_PERMISSIONS = [
    { id: 'create_users', label: 'Create Users', desc: 'Can manually add new users/admins' },
    { id: 'edit_users', label: 'Edit Users', desc: 'Can modify profiles, status, and seller verify' },
    { id: 'delete_users', label: 'Delete Users', desc: 'Can permanently remove accounts' },
    { id: 'assign_roles', label: 'Assign Roles', desc: 'Can change user roles (e.g., from User to Seller)' },
    { id: 'manage_roles', label: 'Manage Roles', desc: 'Can create and modify custom roles/permissions' },
    { id: 'manage_listings', label: 'Manage Listings', desc: 'Can approve and moderate car listings' },
    { id: 'manage_orders', label: 'Manage Orders', desc: 'Can update order and test drive statuses' },
    { id: 'delete_orders', label: 'Delete Orders', desc: 'Can remove order records permanently' },
    { id: 'send_broadcast', label: 'Send Broadcast', desc: 'Can send platform-wide notifications' },
    { id: 'view_analytics', label: 'View Analytics', desc: 'Can view business performance and reports' },
    { id: 'manage_finance', label: 'Manage Finance', desc: 'Can handle loan applications and financial tools' },
    { id: 'view_audit_logs', label: 'View Audit Logs', desc: 'Can browse the system-wide action audit trail' },
];

export default function ManageRoles() {
    const { user: currentUser } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/roles');
            setRoles(res.data);
        } catch { toast.error('Failed to load roles'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRoles(); }, []);

    const handleSaveRole = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.warning('Role name is required');

        try {
            if (editingRole) {
                const res = await api.put(`/admin/roles/${editingRole._id}`, formData);
                toast.success(res.data.message);
                setRoles(prev => prev.map(r => r._id === editingRole._id ? res.data.role : r));
            } else {
                const res = await api.post('/admin/roles', formData);
                toast.success(res.data.message);
                setRoles([res.data.role, ...roles]);
            }
            closeModal();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save role'); }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm('Delete this role forever? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/roles/${id}`);
            toast.success('Role deleted');
            setRoles(prev => prev.filter(r => r._id !== id));
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    };

    const openModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({ name: role.name, description: role.description || '', permissions: role.permissions || [] });
        } else {
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [] });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const togglePermission = (permId) => {
        setFormData(prev => {
            const hasPerm = prev.permissions.includes(permId);
            return {
                ...prev,
                permissions: hasPerm ? prev.permissions.filter(p => p !== permId) : [...prev.permissions, permId]
            };
        });
    };

    return (
        <div className="card admin-panel">
            <div className="panel-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3>Roles & Permissions</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Define custom roles and assign specific access privileges.</p>
                    </div>
                    {currentUser.role === 'super_admin' && (
                        <button className="btn btn-primary" onClick={() => openModal()}><FiPlus /> Create Role</button>
                    )}
                </div>
            </div>

            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Role Name</th>
                            <th>Description</th>
                            <th>Permissions Count</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
                        ) : roles.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40 }}>No custom roles created securely yet.</td></tr>
                        ) : roles.map(role => (
                            <tr key={role._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(42,157,143,0.1)', color: '#2a9d8f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FiShield />
                                        </div>
                                        <strong style={{ fontSize: '0.95rem' }}>{role.name}</strong>
                                        {role.isSystemDefault && <span className="badge" style={{ fontSize: '0.65rem' }}>System</span>}
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {role.description || '—'}
                                </td>
                                <td>
                                    <span className="badge badge-green">{role.permissions?.length || 0} Enabled</span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {currentUser.role === 'super_admin' && (
                                            <button className="icon-btn" onClick={() => openModal(role)} title="Edit Role" style={{ color: '#457b9d' }} disabled={role.isSystemDefault}>
                                                <FiEdit2 />
                                            </button>
                                        )}
                                        {currentUser.role === 'super_admin' && (
                                            <button className="icon-btn delete" onClick={() => handleDeleteRole(role._id)} title="Delete Role" disabled={role.isSystemDefault} style={{ opacity: role.isSystemDefault ? 0.35 : 1 }}>
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

            {/* Role Editor Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 650 }}>
                        <div className="modal-header">
                            <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
                            <button className="icon-btn" onClick={closeModal}><FiXCircle /></button>
                        </div>
                        <form onSubmit={handleSaveRole} className="modal-body">
                            <div className="form-group">
                                <label>Role Name <span style={{ color: '#e63946' }}>*</span></label>
                                <input className="form-control" placeholder="e.g. Sales Manager" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input className="form-control" placeholder="Briefly describe what this role does" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <h4 style={{ marginTop: 20, marginBottom: 10, fontSize: '0.95rem' }}>Access Permissions</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
                                {AVAILABLE_PERMISSIONS.map(perm => (
                                    <div
                                        key={perm.id}
                                        style={{
                                            padding: 12,
                                            background: formData.permissions.includes(perm.id) ? 'rgba(42,157,143,0.08)' : 'var(--bg-body)',
                                            border: `1px solid ${formData.permissions.includes(perm.id) ? '#2a9d8f' : 'var(--border)'}`,
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => togglePermission(perm.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            <input type="checkbox" checked={formData.permissions.includes(perm.id)} readOnly style={{ accentColor: '#2a9d8f' }} />
                                            <strong style={{ fontSize: '0.85rem' }}>{perm.label}</strong>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 24 }}>{perm.desc}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
