import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiMessageSquare, FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';

const MOCK_TICKETS = [
    { id: 1, user: 'John Doe', email: 'john@example.com', subject: 'Cannot upload car photos', category: 'Technical', status: 'open', date: '2026-03-03', priority: 'high' },
    { id: 2, user: 'Sarah J.', email: 'sarah@example.com', subject: 'Payment not processing', category: 'Billing', status: 'in-progress', date: '2026-03-02', priority: 'urgent' },
    { id: 3, user: 'Mike Lee', email: 'mike@example.com', subject: 'How to list my car?', category: 'General', status: 'resolved', date: '2026-03-01', priority: 'low' },
    { id: 4, user: 'Emily R.', email: 'emily@example.com', subject: 'Account verification issue', category: 'Account', status: 'open', date: '2026-03-04', priority: 'medium' },
    { id: 5, user: 'Tom C.', email: 'tom@example.com', subject: 'Test drive not showing', category: 'Technical', status: 'open', date: '2026-03-04', priority: 'medium' },
];

const PRIORITY_COLORS = {
    low: { bg: 'rgba(69,123,157,0.15)', color: '#457b9d' },
    medium: { bg: 'rgba(244,162,97,0.15)', color: '#f4a261' },
    high: { bg: 'rgba(230,57,70,0.15)', color: '#e63946' },
    urgent: { bg: 'rgba(181,23,158,0.15)', color: '#e040fb' },
};

const STATUS_COLORS = {
    open: { bg: 'rgba(233,196,106,0.15)', color: '#e9c46a' },
    'in-progress': { bg: 'rgba(42,157,143,0.15)', color: '#2a9d8f' },
    resolved: { bg: 'rgba(69,123,157,0.15)', color: '#457b9d' },
};

export default function AdminSupport() {
    const [tickets, setTickets] = useState(MOCK_TICKETS);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');

    const filtered = tickets.filter(t => {
        const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.user.toLowerCase().includes(search.toLowerCase());
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return matchSearch;
    });

    const updateStatus = (id, status) => {
        setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
        toast.success(`Ticket ${status}`);
    };

    const sendReply = () => {
        if (!reply.trim()) return;
        toast.success('Reply sent to user!');
        setReply('');
    };

    return (
        <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Support Tickets</h1>
            <p className="page-subtitle" style={{ marginBottom: 24 }}>Manage and respond to user support requests.</p>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
                {/* Ticket List */}
                <div className="card admin-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <FiSearch style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Search tickets..." className="form-control" style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <select className="form-control" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </div>
                    <div className="admin-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Subject</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(t)}>
                                        <td>
                                            <strong style={{ fontSize: '0.88rem' }}>{t.user}</strong>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.date}</div>
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>{t.subject}</td>
                                        <td>
                                            <span className="badge" style={{ background: PRIORITY_COLORS[t.priority]?.bg, color: PRIORITY_COLORS[t.priority]?.color }}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge" style={{ background: STATUS_COLORS[t.status]?.bg, color: STATUS_COLORS[t.status]?.color }}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                                                {t.status !== 'resolved' && <button className="icon-btn success" title="Mark Resolved" onClick={() => updateStatus(t.id, 'resolved')}><FiCheckCircle /></button>}
                                                {t.status === 'open' && <button className="icon-btn" title="Mark In Progress" onClick={() => updateStatus(t.id, 'in-progress')} style={{ color: '#2a9d8f' }}><FiMessageSquare /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ticket Detail */}
                {selected && (
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ marginBottom: 4 }}>{selected.subject}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>From: <strong>{selected.user}</strong> ({selected.email}) · {selected.date}</p>
                            </div>
                            <button className="icon-btn" onClick={() => setSelected(null)}><FiXCircle /></button>
                        </div>
                        <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            <strong style={{ display: 'block', marginBottom: 8 }}>Issue Description:</strong>
                            Lorem ipsum dolor sit amet, the user reports a problem with <em>{selected.subject.toLowerCase()}</em>. They have tried multiple times but the issue persists. Please respond and resolve as soon as possible.
                        </div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Your Reply</label>
                        <textarea className="form-control" rows={5} placeholder="Type your reply..." value={reply} onChange={e => setReply(e.target.value)} />
                        <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected.id, 'in-progress')}>Mark In Progress</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(selected.id, 'resolved')}>Mark Resolved</button>
                            <button className="btn btn-primary btn-sm" onClick={sendReply}><FiMessageSquare /> Send Reply</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
