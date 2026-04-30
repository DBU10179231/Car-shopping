import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiClock, FiSearch, FiFilter } from 'react-icons/fi';

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('all');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/audit-logs');
            setLogs(res.data);
        } catch { toast.error('Failed to load audit logs'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            (log.adminId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            (log.details || '').toLowerCase().includes(search.toLowerCase());

        const matchesAction = actionFilter === 'all' || log.action === actionFilter;

        return matchesSearch && matchesAction;
    });

    const uniqueActions = [...new Set(logs.map(log => log.action))];

    return (
        <div className="card admin-panel">
            <div className="panel-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3>System Audit Logs</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>A chronological record of critical security and administrative actions.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Search logs..." className="form-control" style={{ paddingLeft: 36, width: 220 }} value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <FiFilter style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                            <select className="form-control" style={{ paddingLeft: 36, width: 170 }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                                <option value="all">All Actions</option>
                                {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date / Time</th>
                            <th>Administrator</th>
                            <th>Action Taken</th>
                            <th>Target</th>
                            <th>Details & Context</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>No audit logs found matching criteria.</td></tr>
                        ) : filteredLogs.map((log) => (
                            <tr key={log._id}>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FiClock />
                                        {new Date(log.createdAt).toLocaleString()}
                                    </div>
                                </td>
                                <td>
                                    <strong>{log.adminId?.name || 'Unknown Admin'}</strong>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.adminId?.email || '—'}</div>
                                </td>
                                <td>
                                    <span className="badge" style={{ background: 'rgba(42,157,143,0.1)', color: '#2a9d8f' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{log.targetType}:</span><br />
                                    <span style={{ fontFamily: 'monospace' }}>{log.targetId}</span>
                                </td>
                                <td style={{ fontSize: '0.85rem', maxWidth: 280 }}>
                                    {log.details || '—'}
                                </td>
                                <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                    {log.ipAddress || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
