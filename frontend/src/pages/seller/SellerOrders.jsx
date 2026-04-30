import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
    FiShoppingBag, FiClock, FiMessageSquare, FiTrendingUp,
    FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiMoreVertical,
    FiChevronRight, FiUser, FiTruck, FiDollarSign
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { sanitizeImageUrl } from '../../utils/imageUtils';

export default function SellerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [schedulingId, setSchedulingId] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');

    const fetchOrders = async () => {
        try {
            const res = await api.get('/seller/orders');
            setOrders(res.data.orders);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to sync incoming leads');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (id, status, details = {}) => {
        try {
            await api.put(`/seller/orders/${id}/status`, { status, ...details });
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status, ...details } : o));
            toast.success(`Interaction status updated to ${status}`);
            setSchedulingId(null);
        } catch (err) {
            toast.error('Failed to update interaction status');
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchSearch = !search ||
            o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
            o.car?.make?.toLowerCase().includes(search.toLowerCase()) ||
            o.car?.model?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="fade-in orders-suite" style={{ paddingBottom: 60 }}>
            {/* Control Center Header */}
            <div className="suite-control card glass-panel" style={{ padding: '30px 40px', marginBottom: 40, border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, mb: 5 }}>Buyer <span className="gradient-text">Requests</span></h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage purchase requests and orders (Points 6, 8).</p>
                    </div>
                    <div style={{ display: 'flex', gap: 15 }}>
                        <div className="search-bar-modern">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Search by name or car..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select className="suite-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">All Requests</option>
                            <option value="pending">Awaiting Action</option>
                            <option value="approved">Accepted (Active)</option>
                            <option value="completed">Sold (Completed)</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? <div className="spinner" style={{ margin: '60px auto' }} /> : (
                <div className="leads-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
                    {filteredOrders.length === 0 ? (
                        <div className="card glass-panel empty-leads" style={{ gridColumn: '1 / -1', padding: 80, textAlign: 'center' }}>
                            <FiShoppingBag size={50} style={{ opacity: 0.2, marginBottom: 20 }} />
                            <h3>No Active Leads</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Market conditions are evolving. Optimize your listings to attract more buyers.</p>
                        </div>
                    ) : filteredOrders.map(order => (
                        <div key={order._id} className="lead-card glass-panel fade-in">
                            <div className="lead-header">
                                <div className="customer-info">
                                    <div className="customer-avatar">
                                        <img src={sanitizeImageUrl(order.user?.profilePhoto, 'avatar')} alt="" />
                                    </div>
                                    <div>
                                        <h4>{order.user?.name}</h4>
                                        <p>{order.user?.email}</p>
                                    </div>
                                </div>
                                <span className={`status-tag ${order.status}`}>{order.status.toUpperCase()}</span>
                            </div>

                            <div className="lead-content">
                                <div className="asset-link">
                                    <img src={sanitizeImageUrl(order.car?.images?.[0], 'car')} alt="" />
                                    <div className="asset-details">
                                        <strong>{order.car?.make} {order.car?.model}</strong>
                                        <span>${order.car?.price?.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="lead-metrics">
                                    <div className="metric">
                                        <div className="icon"><FiTrendingUp /></div>
                                        <div>
                                            <span className="label">Intent Type</span>
                                            <span className="value">{order.type === 'buy' ? 'Direct Purchase' : 'Test Drive Request'}</span>
                                        </div>
                                    </div>
                                    <div className="metric">
                                        <div className="icon"><FiClock /></div>
                                        <div>
                                            <span className="label">Received</span>
                                            <span className="value">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lead-footer">
                                <Link to={`/seller/messages?chat=${order.user?._id}&car=${order.car?._id}`} className="btn-negotiate">
                                    <FiMessageSquare /> Initiate Negotiation
                                </Link>
                                <div className="action-menu">
                                    {order.type === 'test_drive' && order.status !== 'completed' && (
                                        <button
                                            className="btn-status schedule"
                                            onClick={() => setSchedulingId(order._id)}
                                            title="Schedule Test Drive"
                                            style={{ background: schedulingId === order._id ? 'var(--primary)' : 'none', color: schedulingId === order._id ? 'white' : 'inherit' }}
                                        >
                                            <FiClock />
                                        </button>
                                    )}
                                    <button className="btn-status approve" onClick={() => updateStatus(order._id, 'approved')} title="Mark as Engaged"><FiCheckCircle /></button>
                                    <button className="btn-status reject" onClick={() => updateStatus(order._id, 'rejected')} title="Close Lead"><FiXCircle /></button>
                                </div>
                            </div>

                            {schedulingId === order._id && (
                                <div className="schedule-box fade-in" style={{ marginTop: 20, padding: 20, background: 'rgba(230, 57, 70, 0.05)', borderRadius: 16, border: '1px dashed var(--primary)' }}>
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem' }}>Schedule Appointment</h5>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input
                                            type="datetime-local"
                                            className="suite-select"
                                            style={{ flex: 1, fontSize: '0.8rem' }}
                                            value={scheduleDate}
                                            onChange={e => setScheduleDate(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => updateStatus(order._id, 'approved', { scheduledDate: scheduleDate })}
                                        >
                                            Schedule
                                        </button>
                                        <button className="btn btn-icon" onClick={() => setSchedulingId(null)}><FiXCircle /></button>
                                    </div>
                                    {order.scheduledDate && (
                                        <p style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                                            Currently set for: {new Date(order.scheduledDate).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .orders-suite { color: var(--text); }
                .glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border) !important;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.2) !important;
                }
                
                .search-bar-modern {
                    display: flex; align-items: center; gap: 12px;
                    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
                    padding: 0 20px; border-radius: 12px; width: 300px;
                }
                .search-bar-modern input {
                    background: none; border: none; padding: 12px 0; color: white; width: 100%; outline: none; font-size: 0.9rem;
                }
                .suite-select {
                    background: rgba(255,255,255,0.05); border: 1px solid var(--border);
                    padding: 0 20px; border-radius: 12px; color: white; outline: none;
                }
                
                .lead-card { 
                    padding: 25px; border-radius: 24px; position: relative; 
                    transition: all 0.3s;
                }
                .lead-card:hover { transform: translateY(-5px); border-color: var(--primary) !important; }
                
                .lead-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                .customer-info { display: flex; gap: 15px; align-items: center; }
                .customer-avatar img, .avatar-placeholder { width: 50px; height: 50px; border-radius: 15px; object-fit: cover; }
                .avatar-placeholder { background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 1.2rem; }
                .customer-info h4 { margin: 0; font-size: 1.1rem; font-weight: 800; }
                .customer-info p { margin: 0; font-size: 0.8rem; color: var(--text-muted); }
                
                .status-tag { padding: 4px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 900; letter-spacing: 1px; }
                .status-tag.pending { background: rgba(255, 159, 28, 0.1); color: #ff9f1c; }
                .status-tag.approved { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
                .status-tag.completed { background: rgba(42, 157, 143, 0.1); color: #2a9d8f; }
                .status-tag.rejected { background: rgba(255,255,255,0.05); color: var(--text-muted); }
                
                .asset-link { 
                    display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.02);
                    border-radius: 18px; margin-bottom: 20px; border: 1px solid transparent; transition: all 0.2s;
                    text-decoration: none; color: inherit;
                }
                .asset-link img { width: 80px; height: 55px; border-radius: 10px; object-fit: cover; }
                .asset-details { display: flex; flex-direction: column; justify-content: center; }
                .asset-details strong { font-size: 0.95rem; }
                .asset-details span { font-size: 0.85rem; color: #2a9d8f; font-weight: 700; }
                
                .lead-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
                .metric { display: flex; gap: 12px; align-items: center; }
                .metric .icon { width: 34px; height: 34px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .metric .label { display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
                .metric .value { display: block; font-size: 0.85rem; font-weight: 700; }
                
                .lead-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid var(--border); }
                .btn-negotiate { 
                    display: flex; align-items: center; gap: 8px; color: var(--primary); 
                    font-weight: 800; text-decoration: none; font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .btn-negotiate:hover { gap: 12px; }
                
                .action-menu { display: flex; gap: 10px; }
                .btn-status { 
                    width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border);
                    background: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s; font-size: 1rem;
                }
                .btn-status.approve:hover { background: #2a9d8f; border-color: #2a9d8f; color: white; }
                .btn-status.reject:hover { background: #e63946; border-color: #e63946; color: white; }
                .btn-status.schedule:hover { background: var(--primary); border-color: var(--primary); color: white; }
            `}</style>
        </div>
    );
}
