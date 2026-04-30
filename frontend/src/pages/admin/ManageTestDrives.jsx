import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { sanitizeImageUrl } from '../../utils/imageUtils';

const STATUS_COLORS = {
    pending: { bg: 'rgba(233,196,106,0.15)', color: '#e9c46a' },
    approved: { bg: 'rgba(42,157,143,0.15)', color: '#2a9d8f' },
    completed: { bg: 'rgba(69,123,157,0.15)', color: '#457b9d' },
    declined: { bg: 'rgba(230,57,70,0.15)', color: '#e63946' },
};

export default function ManageTestDrives() {
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Modal state for editing
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDrive, setSelectedDrive] = useState(null);
    const [editFormData, setEditFormData] = useState({ bookingDate: '', bookingTime: '', status: '' });
    const [saving, setSaving] = useState(false);

    const fetchTestDrives = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/orders?type=test_drive');
            const data = Array.isArray(res.data) ? res.data : (res.data.orders || []);
            setDrives(data);
        } catch (err) {
            toast.error('Failed to load test drives');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestDrives();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/admin/orders/${id}/status`, { status });
            setDrives(prev => prev.map(d => d._id === id ? { ...d, status } : d));
            toast.success(`Test drive ${status}`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this test drive request?')) return;
        try {
            await api.delete(`/admin/orders/${id}`);
            setDrives(prev => prev.filter(d => d._id !== id));
            toast.success('Test drive request deleted');
        } catch (err) {
            toast.error('Failed to delete request');
        }
    };

    const openEditModal = (drive) => {
        setSelectedDrive(drive);
        setEditFormData({
            bookingDate: drive.bookingDate || '',
            bookingTime: drive.bookingTime || '',
            status: drive.status
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put(`/admin/orders/${selectedDrive._id}/status`, editFormData);
            setDrives(prev => prev.map(d => d._id === selectedDrive._id ? { ...d, ...res.data.order } : d));
            toast.success('Test drive updated');
            setShowEditModal(false);
        } catch (err) {
            toast.error('Failed to update test drive');
        } finally {
            setSaving(false);
        }
    };

    const safeDrives = Array.isArray(drives) ? drives : [];
    const filtered = Array.isArray(safeDrives)
        ? (filter === 'all' ? safeDrives : safeDrives.filter(d => d.status === filter))
        : [];

    return (
        <div className="card admin-panel">
            <div className="panel-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3>Test Drive Requests</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{filtered.length} requests</p>
                    </div>
                    <select className="form-control" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="declined">Declined</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Vehicle</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No requests found</td></tr>
                            ) : filtered.map(d => (
                                <tr key={d._id}>
                                    <td>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <img
                                                src={sanitizeImageUrl(d.user?.profilePhoto, 'avatar')}
                                                alt=""
                                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                            <div>
                                                <strong style={{ fontSize: '0.9rem' }}>{d.user?.name || 'Unknown'}</strong>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.user?.email || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{d.car?.make} {d.car?.model}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#2a9d8f', fontWeight: 700 }}>${d.car?.price?.toLocaleString() || '0'}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                                            <FiCalendar style={{ color: 'var(--text-muted)' }} />
                                            {d.bookingDate || 'TBD'} at {d.bookingTime || 'TBD'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: STATUS_COLORS[d.status]?.bg, color: STATUS_COLORS[d.status]?.color }}>
                                            {(d.status || 'pending').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="icon-btn" title="Edit Request" onClick={() => openEditModal(d)} style={{ color: 'var(--primary)' }}><FiEdit2 /></button>

                                            {d.status === 'pending' && (
                                                <button className="icon-btn success" title="Approve" onClick={() => updateStatus(d._id, 'approved')}><FiCheckCircle /></button>
                                            )}

                                            <button className="icon-btn delete" title="Delete Permanent" onClick={() => handleDelete(d._id)}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>Edit Test Drive Schedule</h3>
                            <button className="icon-btn" onClick={() => setShowEditModal(false)}><FiXCircle /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Booking Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={editFormData.bookingDate}
                                    onChange={e => setEditFormData({ ...editFormData, bookingDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: 15 }}>
                                <label>Booking Time</label>
                                <input
                                    type="time"
                                    className="form-control"
                                    value={editFormData.bookingTime}
                                    onChange={e => setEditFormData({ ...editFormData, bookingTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: 15 }}>
                                <label>Status</label>
                                <select
                                    className="form-control"
                                    value={editFormData.status}
                                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="completed">Completed</option>
                                    <option value="declined">Declined</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 25 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
