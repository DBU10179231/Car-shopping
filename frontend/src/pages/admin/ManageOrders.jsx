import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiTrash2, FiCheckCircle, FiXCircle, FiClock, FiSearch, FiMessageSquare, FiChevronDown, FiChevronUp, FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { sanitizeImageUrl } from '../../utils/imageUtils';
import NegotiationChat from '../../components/NegotiationChat';

export default function ManageOrders() {
    const { user: currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedChat, setExpandedChat] = useState(null); // orderId or null

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/admin/orders');
            setOrders(res.data.orders);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load orders');
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/admin/orders/${id}/status`, { status });
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
            toast.success(`Order marked as ${status}`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.delete(`/admin/orders/${id}`);
            setOrders(prev => prev.filter(o => o._id !== id));
            toast.success('Order deleted');
        } catch (err) {
            toast.error('Failed to delete order');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="badge badge-green">Completed</span>;
            case 'approved': return <span className="badge badge-blue">Approved</span>;
            case 'rejected': return <span className="badge badge-red">Rejected</span>;
            case 'cancelled': return <span className="badge badge-red">Cancelled</span>;
            case 'in_transit': return <span className="badge" style={{ background: 'rgba(69,123,157,0.2)', color: '#457b9d' }}>🚚 In Transit</span>;
            case 'shipped': return <span className="badge" style={{ background: 'rgba(69,123,157,0.2)', color: '#457b9d' }}>📦 Shipped</span>;
            case 'delivered': return <span className="badge" style={{ background: 'rgba(42,157,143,0.2)', color: '#2a9d8f' }}>✅ Delivered</span>;
            default: return <span className="badge badge-gold">Pending</span>;
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchSearch = !search ||
            o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            o.car?.make?.toLowerCase().includes(search.toLowerCase()) ||
            o.car?.model?.toLowerCase().includes(search.toLowerCase()) ||
            o._id.slice(-6).toUpperCase().includes(search.toUpperCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const toggleChat = (orderId) => {
        setExpandedChat(prev => prev === orderId ? null : orderId);
    };

    return (
        <div className="fade-in">
            <div className="panel-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">Orders &amp; Inquiries</h1>
                    <p className="page-subtitle">Track and manage customer purchase requests</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)', fontSize: '0.9rem' }} />
                        <input type="text" placeholder="Search orders..." className="form-control" style={{ paddingLeft: 32, width: 200 }} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="form-control" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="in_transit">In Transit</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                    </select>
                </div>
            </div>

            {loading ? <div className="spinner" style={{ margin: '60px auto', display: 'block' }} /> : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="admin-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ref ID</th>
                                    <th>Buyer Detail</th>
                                    <th>Asset &amp; Valuation</th>
                                    <th>Status</th>
                                    <th>Communication</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No orders found.</td></tr>
                                ) : filteredOrders.map(o => (
                                    <React.Fragment key={o._id}>
                                        <tr>
                                            <td style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>#{o._id.slice(-6).toUpperCase()}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                    <img
                                                        src={sanitizeImageUrl(o.user?.profilePhoto, 'avatar')}
                                                        alt=""
                                                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                                                    />
                                                    <div>
                                                        <Link
                                                            to={`/admin/users?query=${o.user?.email}`}
                                                            style={{ fontWeight: 700, fontSize: '0.95rem', color: 'inherit', textDecoration: 'none', borderBottom: '1px solid transparent' }}
                                                            onMouseEnter={e => e.currentTarget.style.borderBottom = '1px solid var(--primary)'}
                                                            onMouseLeave={e => e.currentTarget.style.borderBottom = '1px solid transparent'}
                                                        >
                                                            {o.user?.name || 'Guest User'}
                                                        </Link>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.user?.email}</div>
                                                        {o.user?.phone && <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{o.user.phone}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ marginBottom: 4 }}>
                                                    <Link
                                                        to={`/admin/cars?query=${o.car?.model}`}
                                                        style={{ fontWeight: 700, fontSize: '0.9rem', color: 'inherit', textDecoration: 'none', borderBottom: '1px solid transparent' }}
                                                        onMouseEnter={e => e.currentTarget.style.borderBottom = '1px solid var(--primary)'}
                                                        onMouseLeave={e => e.currentTarget.style.borderBottom = '1px solid transparent'}
                                                    >
                                                        {o.car?.make} {o.car?.model}
                                                    </Link>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>({o.car?.year})</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>Final Price</span>
                                                        <span style={{ color: '#2a9d8f', fontWeight: 800, fontSize: '1rem' }}>${(o.totalPrice || o.car?.price)?.toLocaleString()}</span>
                                                    </div>
                                                    {(o.negotiatedPrice && o.negotiatedPrice !== o.car?.price) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 10 }}>
                                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Negotiated</span>
                                                            <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem' }}>${o.negotiatedPrice.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {getStatusBadge(o.status)}
                                                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: 'fit-content' }}>
                                                        {o.type?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {/* View Chat button */}
                                                <button
                                                    onClick={() => toggleChat(o._id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '6px 12px',
                                                        border: `1px solid ${expandedChat === o._id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                                                        borderRadius: 8,
                                                        background: expandedChat === o._id ? 'rgba(var(--primary-rgb),0.15)' : 'rgba(255,255,255,0.04)',
                                                        color: expandedChat === o._id ? 'var(--primary)' : 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        transition: 'all 0.2s',
                                                        whiteSpace: 'nowrap',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <FiMessageSquare size={14} />
                                                    View Chat
                                                    {expandedChat === o._id ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                                                    {o.unreadMessages > 0 && (
                                                        <span className="unread-badge">
                                                            {o.unreadMessages}
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                                                    {/* Sequential status progression buttons */}
                                                    {o.status === 'pending' && (
                                                        <button className="btn btn-sm" style={{ background: '#2a9d8f', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => updateStatus(o._id, 'approved')}>
                                                            Approve <FiArrowRight size={12} />
                                                        </button>
                                                    )}
                                                    {o.status === 'approved' && (
                                                        <button className="btn btn-sm" style={{ background: '#457b9d', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => updateStatus(o._id, 'in_transit')}>
                                                            Mark In Transit <FiArrowRight size={12} />
                                                        </button>
                                                    )}
                                                    {o.status === 'in_transit' && (
                                                        <button className="btn btn-sm" style={{ background: '#457b9d', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => updateStatus(o._id, 'shipped')}>
                                                            Mark Shipped <FiArrowRight size={12} />
                                                        </button>
                                                    )}
                                                    {o.status === 'shipped' && (
                                                        <button className="btn btn-sm" style={{ background: '#2a9d8f', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => updateStatus(o._id, 'delivered')}>
                                                            Delivered <FiCheckCircle size={12} />
                                                        </button>
                                                    )}
                                                    {/* Full status select */}
                                                    <select
                                                        className="form-control"
                                                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem', height: 32 }}
                                                        value={o.status}
                                                        onChange={(e) => updateStatus(o._id, e.target.value)}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="rejected">Rejected</option>
                                                        <option value="cancelled">Cancelled</option>
                                                        <option value="in_transit">In Transit</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="delivered">Delivered</option>
                                                    </select>
                                                    {/* DELETE — All Admins */}
                                                    <button className="icon-btn delete" title="Delete Order" onClick={() => handleDelete(o._id)}>
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Inline Chat Panel Row */}
                                        {expandedChat === o._id && (
                                            <tr key={`chat-${o._id}`}>
                                                <td colSpan="6" style={{ padding: 0, background: 'rgba(0,0,0,0.25)', borderTop: '1px solid var(--border-color)' }}>
                                                    <div style={{ padding: '20px 24px', borderLeft: '3px solid var(--primary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                                            <FiMessageSquare style={{ color: 'var(--primary)' }} />
                                                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                                                Negotiation Chat — {o.user?.name} × {o.car?.make} {o.car?.model}
                                                            </span>
                                                            <span style={{
                                                                marginLeft: 'auto',
                                                                fontSize: '0.7rem',
                                                                padding: '2px 10px',
                                                                background: 'rgba(230, 57, 70, 0.15)',
                                                                color: 'var(--primary)',
                                                                borderRadius: 20,
                                                                fontWeight: 700,
                                                                letterSpacing: 0.5,
                                                                textTransform: 'uppercase'
                                                            }}>Admin Command Center</span>
                                                        </div>
                                                        <NegotiationChat
                                                            orderId={o._id}
                                                            isAdmin={true}
                                                            onClose={() => setExpandedChat(null)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
