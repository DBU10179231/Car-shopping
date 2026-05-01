import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiMessageSquare, FiCheckCircle, FiXCircle, FiSearch, FiClock, FiUser, FiInfo, FiPaperclip } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './AdminSupport.css';

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
    closed: { bg: 'rgba(230,57,70,0.15)', color: '#e63946' },
};

export default function AdminSupport() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [sending, setSending] = useState(false);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets');
            setTickets(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to sync support queue');
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const filtered = tickets.filter(t => {
        const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || 
                           t.user.name.toLowerCase().includes(search.toLowerCase());
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return matchSearch;
    });

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/tickets/${id}/status`, { status });
            setTickets(prev => prev.map(t => t._id === id ? { ...t, status } : t));
            if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
            toast.success(`Ticket marked as ${status}`);
        } catch (err) {
            toast.error('Status synchronization failed');
        }
    };

    const openTicket = async (ticket) => {
        setSelected(ticket);
        try {
            // Fetching single ticket marks messages as read on backend
            const res = await api.get(`/tickets/${ticket._id}`);
            setSelected(res.data);
            // Update the unread count in the main list immediately
            setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, unreadMessages: 0 } : t));
        } catch (err) {
            console.error('Failed to mark ticket as read', err);
        }
    };

    const handleSendReply = async () => {
        if (!reply.trim() && attachments.length === 0) return;
        setSending(true);

        const data = new FormData();
        data.append('content', reply);
        attachments.forEach(file => data.append('attachments', file));

        try {
            const res = await api.post(`/tickets/${selected._id}/reply`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSelected(res.data);
            setReply('');
            setAttachments([]);
            toast.success('Reply dispatched to user');
            fetchTickets(); // Refresh list to update status
        } catch (err) {
            toast.error('Failed to transmit reply');
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
    };

    if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

    return (
        <div className="admin-support-suite fade-in">
            <h1 className="page-title">Concierge Support Hub</h1>
            <p className="page-subtitle">Manage incoming inquiries and synchronize support dispatches.</p>

            <div className="support-layout" style={{ display: 'grid', gridTemplateColumns: selected ? '1.2fr 1fr' : '1fr', gap: 24 }}>
                {/* Ticket List */}
                <div className="card glass-panel ticket-list-panel">
                    <div className="panel-header" style={{ padding: '20px 25px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: 15 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search dispatches..." 
                                className="form-control-minimal" 
                                style={{ paddingLeft: 40 }} 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                            />
                        </div>
                        <select className="form-control-minimal" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    <div className="admin-table-minimal">
                        <table>
                            <thead>
                                <tr>
                                    <th>User Node</th>
                                    <th>Subject Trace</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t._id} className={`ticket-row ${selected?._id === t._id ? 'active' : ''}`} onClick={() => openTicket(t)}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="avatar-mini">{t.user.name.charAt(0)}</div>
                                                <div style={{ position: 'relative' }}>
                                                    <strong style={{ fontSize: '0.85rem' }}>{t.user.name}</strong>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                                                    {t.unreadMessages > 0 && (
                                                        <span className="unread-badge" style={{ top: -5, right: -25 }}>
                                                            {t.unreadMessages}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.subject}</td>
                                        <td>
                                            <span className="badge-minimal" style={{ background: PRIORITY_COLORS[t.priority]?.bg, color: PRIORITY_COLORS[t.priority]?.color }}>
                                                {t.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge-minimal" style={{ background: STATUS_COLORS[t.status]?.bg, color: STATUS_COLORS[t.status]?.color }}>
                                                {t.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ticket Detail & Chat */}
                {selected && (
                    <div className="card glass-panel ticket-detail-panel" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: '80vh' }}>
                        <div className="detail-header" style={{ padding: '20px 25px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selected.subject}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Trace: #{selected._id.slice(-6).toUpperCase()} • Node: {selected.user.name}
                                </p>
                            </div>
                            <button className="close-btn" onClick={() => setSelected(null)}><FiXCircle /></button>
                        </div>

                        <div className="chat-container" style={{ flex: 1, overflowY: 'auto', padding: 25, display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {selected.messages.map((msg, i) => {
                                const isAdmin = msg.sender.role === 'admin' || msg.sender.role === 'super_admin' || (typeof msg.sender === 'string' && msg.sender === user._id);
                                return (
                                    <div key={i} className={`chat-msg ${isAdmin ? 'admin' : 'user'}`}>
                                        <div className="msg-bubble-minimal">
                                            <p style={{ margin: 0, fontSize: '0.88rem' }}>{msg.content}</p>
                                            {msg.attachments?.length > 0 && (
                                                <div className="msg-files" style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                                                    {msg.attachments.map((url, j) => (
                                                        <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="file-link-minimal">
                                                            Attachment {j+1}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="msg-time-minimal">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="detail-footer" style={{ padding: '20px 25px', borderTop: '1px solid var(--glass-border)' }}>
                            {attachments.length > 0 && (
                                <div className="file-previews" style={{ marginBottom: 10 }}>
                                    {attachments.map((f, i) => (
                                        <span key={i} className="file-chip-minimal">{f.name}</span>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <textarea 
                                    className="form-control-minimal" 
                                    rows={2} 
                                    placeholder="Type your response..." 
                                    value={reply} 
                                    onChange={e => setReply(e.target.value)} 
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <input type="file" id="admin-file" hidden multiple onChange={handleFileChange} />
                                    <label htmlFor="admin-file" className="icon-btn-minimal" style={{ cursor: 'pointer' }} title="Attach Files">
                                        <FiPaperclip />
                                    </label>
                                    <button className="send-btn-minimal" onClick={handleSendReply} disabled={sending || (!reply.trim() && attachments.length === 0)}>
                                        {sending ? <FiClock /> : <FiMessageSquare />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 15 }}>
                                <button className="btn-status resolved" onClick={() => updateStatus(selected._id, 'resolved')}>Mark Resolved</button>
                                <button className="btn-status closed" onClick={() => updateStatus(selected._id, 'closed')}>Close Ticket</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
