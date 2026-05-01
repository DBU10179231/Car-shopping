import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    FiBox, FiShoppingBag, FiArrowUpRight, FiSearch,
    FiPlusCircle, FiDollarSign, FiUsers, FiCpu, FiChevronRight,
    FiCheckCircle, FiClock, FiActivity
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip
} from 'recharts';
import { toast } from 'react-toastify';
import { sanitizeImageUrl } from '../../utils/imageUtils';
import './SellerDashboard.css';

export default function SellerDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/seller/metrics');
            setData(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to synchronize dashboard metrics');
            setLoading(false);
        }
    };

    if (loading) return <div className="spinner" style={{ marginTop: '20vh' }} />;
    if (!data) return <div className="error-state">Metric synchronization failed.</div>;

    return (
        <div className="fade-in seller-dashboard">
            {/* 1. Header (Control Layer) */}
            <header className="glass-panel suite-header" style={{ padding: '24px 32px', marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>Seller <span className="gradient-text">Portal</span></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Functional Overview • {data.isVerified ? 'Verified Dealer' : 'Identity Verification Pending'}</p>
                </div>
                <Link to="/seller/inventory" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                    <FiPlusCircle /> Add New Car
                </Link>
            </header>

            {/* 2. PRIORITY STRIP (What Needs Attention NOW) */}
            <div className="priority-strip glass-panel" style={{ marginBottom: 30 }}>
                {data.pendingOrders > 0 || data.pendingListings > 0 ? (
                    <div className="priority-items">
                        <div className="priority-item urgent">
                            <span className="dot" /> 🔥 New Buyer Requests ({data.pendingOrders})
                        </div>
                        {data.pendingListings > 0 && (
                            <div className="priority-item">
                                <span className="dot" /> ⏳ Pending Approvals ({data.pendingListings})
                            </div>
                        )}
                        <div className="priority-item">
                            <span className="dot" /> 📩 Messages ({data.newInquiries || 0})
                        </div>
                    </div>
                ) : (
                    <div className="priority-empty">
                        <FiCheckCircle color="#10b981" /> No active items — You're all caught up
                    </div>
                )}
            </div>

            {/* 3. CORE METRICS (Reordered Correctly) */}
            <div className="kpi-grid" style={{ marginBottom: 30 }}>
                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiShoppingBag /></div>
                    <div className="kpi-body">
                        <h3>Buyer Requests</h3>
                        <h2>{data.totalOrders} <small>Total</small></h2>
                        {data.totalOrders === 0 ? (
                            <p className="action-hint">→ Share your listing</p>
                        ) : (
                            <p>{data.pendingOrders} Pending Action</p>
                        )}
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiBox /></div>
                    <div className="kpi-body">
                        <h3>Inventory</h3>
                        <h2>{data.activeListings} <small>Listed</small></h2>
                        {data.activeListings === 0 ? (
                            <p className="action-hint">→ List your first car</p>
                        ) : (
                            <p>{data.soldCount || 0} Cars Sold</p>
                        )}
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiDollarSign /></div>
                    <div className="kpi-body">
                        <h3>Revenue</h3>
                        <h2>${data.totalRevenue.toLocaleString()}</h2>
                        <p>Realized Earnings</p>
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiCheckCircle /></div>
                    <div className="kpi-body">
                        <h3>Conversion</h3>
                        <h2>{data.activeListings > 0 ? Math.round((data.totalOrders / (data.activeListings * 10)) * 100) : 0}%</h2>
                        <p>Inquiry Efficiency</p>
                    </div>
                </div>
            </div>

            {/* 4. PRIMARY CONTENT (Recent Leads / Pipeline) */}
            <div className="dashboard-main-grid" style={{ marginBottom: 30, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                <div className="glass-panel side-card">
                    <div className="section-header">
                        <h3>Recent Leads</h3>
                        <Link to="/seller/orders" className="view-link">View Pipeline <FiChevronRight /></Link>
                    </div>
                    <div className="activity-list">
                        {data.recentOrders?.length > 0 ? (
                            data.recentOrders.map(order => (
                                <div key={order._id} className="activity-item">
                                    <img
                                        src={sanitizeImageUrl(order.user?.profilePhoto, 'avatar')}
                                        className="user-thumb"
                                        alt=""
                                    />
                                    <div className="item-info">
                                        <h4>{order.user?.name}</h4>
                                        <p>{order.car?.make} {order.car?.model} • {order.type === 'test_drive' ? 'Test Drive' : 'Inquiry'}</p>
                                        <div className="item-meta">
                                            <Link to={`/seller/messages?chat=${order.user?._id}`} className="nav-tag">Negotiate</Link>
                                            <span className="time-stamp">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-content-state">
                                <FiUsers size={32} style={{ opacity: 0.3, marginBottom: 15 }} />
                                <p>No leads yet. Add a car to start receiving requests.</p>
                                <Link to="/seller/inventory" className="btn btn-secondary btn-sm" style={{ marginTop: 15 }}>Add First Car</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. SECONDARY CONTENT (Conditional Analytics) */}
                <div className="glass-panel chart-card">
                    <div className="chart-header">
                        <h3>Conversion Analytics</h3>
                        <div className="chart-legend">
                            <div className="legend-item"><span className="dot" style={{ background: '#e63946' }} /> Leads</div>
                            <div className="legend-item"><span className="dot" style={{ background: '#2a9d8f' }} /> Sales</div>
                        </div>
                    </div>
                    {data.recentOrders?.length > 0 ? (
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
                                <AreaChart data={data.monthlyTrend}>
                                    <defs>
                                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e63946" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#e63946" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#161823', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="leads" stroke="#e63946" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                                    <Area type="monotone" dataKey="sales" stroke="#2a9d8f" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-content-state">
                            <FiActivity size={32} style={{ opacity: 0.3, marginBottom: 15 }} />
                            <p>Analytics will appear once traffic starts flowing.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 6. SMART ACTION PANEL (Advanced Layer) */}
            <div className="glass-panel smart-panel" style={{ padding: 30 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', marginBottom: 20 }}>
                    <FiCpu color="var(--primary)" /> Smart Suggestions
                </h3>
                <div className="suggestions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                    <div className="suggestion-item glass-panel" style={{ padding: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            <strong>Optimize Photos:</strong> Upload at least 5 HD photos to increase buyer engagement by up to 40%.
                        </p>
                    </div>
                    <div className="suggestion-item glass-panel" style={{ padding: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            <strong>Response Time:</strong> Sellers who respond within 2 hours are 3x more likely to close a sale.
                        </p>
                    </div>
                    <div className="suggestion-item glass-panel" style={{ padding: 20, border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                            <strong>Complete Specs:</strong> Adding technical details reduces inquiry friction by 25%.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
