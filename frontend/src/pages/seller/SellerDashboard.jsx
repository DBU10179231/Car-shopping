import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    FiBox, FiShoppingBag, FiArrowUpRight, FiSearch,
    FiPlusCircle, FiDollarSign, FiUsers, FiCpu, FiChevronRight,
    FiCheckCircle, FiClock
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell
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

    const distributionData = [
        { name: 'Active', value: data.activeListings || 0, color: '#e63946' },
        { name: 'Pending', value: data.pendingListings || 0, color: '#f4a261' },
        { name: 'Sold', value: (data.totalOrders - data.pendingOrders) || 0, color: '#2a9d8f' }
    ].filter(d => d.value > 0);

    return (
        <div className="fade-in seller-dashboard">
            {/* Header: Portal Overview */}
            <header className="glass-panel suite-header" style={{ padding: '32px 40px', marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div className="suite-brand-icon"><FiBox /></div>
                        <div>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0 }}>Seller <span className="gradient-text">Portal</span></h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: 4 }}>Functional Overview • {data.isVerified ? 'Verified Dealer' : 'Identity Verification Pending'}</p>
                        </div>
                    </div>
                    <Link to="/seller/inventory" className="btn btn-primary" style={{ height: 'fit-content' }}>
                        <FiPlusCircle /> Add New Car
                    </Link>
                </div>
            </header>

            {/* Sales & Inventory Matrix */}
            <div className="kpi-grid">
                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiDollarSign /></div>
                    <div className="kpi-body">
                        <h3>Total Sales Revenue</h3>
                        <h2>${data.totalRevenue.toLocaleString()}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="growth-pill"><FiCheckCircle /> Performance</span>
                            <p>Realized Earnings</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiShoppingBag /></div>
                    <div className="kpi-body">
                        <h3>Buyer Requests</h3>
                        <h2>{data.totalOrders} <small>Total</small></h2>
                        <p>{data.pendingOrders} Pending Action</p>
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiBox /></div>
                    <div className="kpi-body">
                        <h3>Inventory Status</h3>
                        <h2>{data.activeListings} <small>Listed</small></h2>
                        <p>{data.soldCount || 0} Cars Sold to date</p>
                    </div>
                </div>

                <div className="glass-panel kpi-card">
                    <div className="kpi-icon"><FiClock /></div>
                    <div className="kpi-body">
                        <h3>Operational Items</h3>
                        <h2>{data.pendingOrders + data.pendingListings} <small>Pending</small></h2>
                        <p>Requests & Review Assets</p>
                    </div>
                </div>
            </div>

            {/* Analytics & Activity Matrix */}
            <div className="dashboard-main-grid">
                {/* Revenue & Growth Plot */}
                <div className="glass-panel chart-card">
                    <div className="chart-header">
                        <h3>Conversion Analytics</h3>
                        <div className="chart-legend">
                            <div className="legend-item"><span className="dot" style={{ background: '#e63946' }} /> Leads</div>
                            <div className="legend-item"><span className="dot" style={{ background: '#2a9d8f' }} /> Sales</div>
                        </div>
                    </div>
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
                </div>

                {/* Pulse: Recent High-Intensity Leads */}
                <div className="glass-panel side-card">
                    <div className="section-header">
                        <h3>Pulse: Recent Leads</h3>
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
                                        <p>{order.car?.make} {order.car?.model} • {order.type === 'test_drive' ? 'Test Drive' : 'Direct Inquiry'}</p>
                                        <div className="item-meta">
                                            <Link to={`/seller/messages?chat=${order.user?._id}`} className="nav-tag">Negotiate</Link>
                                            <span className="time-stamp">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                                <FiSearch size={32} style={{ marginBottom: 12 }} />
                                <p style={{ fontSize: '0.85rem' }}>No active inquiries found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Asset Performance Distribution */}
            <div className="glass-panel insights-strip">
                <div className="insights-text">
                    <h3>Asset Performance Inventory</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Distribution of assets across the sales lifecycle.</p>
                </div>
                <div className="insights-stats">
                    <div className="stat-group">
                        <strong>{data.activeListings}</strong>
                        <span>Market Ready</span>
                    </div>
                    <div className="stat-group">
                        <strong>{data.totalOrders - data.pendingOrders}</strong>
                        <span>Assets Liquidated</span>
                    </div>
                    <div style={{ width: 100, height: 100 }}>
                        <ResponsiveContainer width="100%" height={100} minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={45}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

