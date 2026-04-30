import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiDollarSign, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';

export default function ManageFinance() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        try {
            const res = await api.get('/finance/admin/all');
            setApplications(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load finance applications');
            setLoading(false);
            // Mock data
            setApplications([
                { _id: '1', user: { name: 'Michael Lee' }, car: { make: 'Mercedes', model: 'C-Class' }, provider: 'Bank ABC', status: 'submitted', createdAt: '2026-03-01' },
                { _id: '2', user: { name: 'Emily Rose' }, car: { make: 'Tesla', model: 'Model 3' }, provider: 'FinCorp', status: 'approved', createdAt: '2026-02-28' }
            ]);
        }
    };

    useEffect(() => { fetchApplications(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/finance/${id}/status`, { status, comment: 'Admin manual update' });
            toast.success('Finance status updated');
            fetchApplications();
        } catch (err) { toast.error('Update failed'); }
    };

    const syncStatus = async (id) => {
        toast.info('Syncing with partner API...');
        try {
            await api.post(`/finance/${id}/sync`);
            toast.success('Sync complete');
            fetchApplications();
        } catch (err) { toast.error('Sync failed'); }
    };

    return (
        <div className="card admin-panel">
            <div className="panel-header">
                <h3>Financing Applications</h3>
                <p>Review and manage customer loan requests.</p>
            </div>
            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Provider</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => (
                            <tr key={app._id}>
                                <td>{app.user?.name}</td>
                                <td>{app.car?.make} {app.car?.model}</td>
                                <td>{app.provider}</td>
                                <td>
                                    <span className={`badge badge-${app.status === 'approved' ? 'green' : app.status === 'rejected' ? 'red' : 'gold'}`}>
                                        {app.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="icon-btn success" title="Approve" onClick={() => updateStatus(app._id, 'approved')}><FiCheckCircle /></button>
                                        <button className="icon-btn delete" title="Reject" onClick={() => updateStatus(app._id, 'rejected')}><FiXCircle /></button>
                                        <button className="icon-btn" title="Sync with Partner" onClick={() => syncStatus(app._id)} style={{ color: 'var(--primary)' }}><FiRefreshCw /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
