import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { sanitizeImageUrl } from '../../utils/imageUtils';
import {
    FiUsers, FiBox, FiShoppingBag, FiDollarSign, FiCheckCircle, FiClock,
    FiTruck, FiBarChart2, FiPlusCircle, FiStar, FiAlertCircle, FiShield,
    FiDownload, FiTrash2, FiLogOut, FiUserX, FiEdit
} from 'react-icons/fi';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#457b9d', '#1d3557'];

// Map audit action strings to icon + colors
const ACTION_META = {
    BAN_USER: { icon: <FiUserX />, color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
    UNBAN_USER: { icon: <FiCheckCircle />, color: '#2a9d8f', bg: 'rgba(42,157,143,0.1)' },
    DELETE_USER: { icon: <FiTrash2 />, color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
    REVOKE_SESSIONS: { icon: <FiLogOut />, color: '#f4a261', bg: 'rgba(244,162,97,0.1)' },
    CHANGE_ROLE: { icon: <FiShield />, color: '#457b9d', bg: 'rgba(69,123,157,0.1)' },
    APPROVE_SELLER: { icon: <FiStar />, color: '#e9c46a', bg: 'rgba(233,196,106,0.1)' },
    REJECT_SELLER: { icon: <FiAlertCircle />, color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
    UPDATE_ORDER: { icon: <FiShoppingBag />, color: '#457b9d', bg: 'rgba(69,123,157,0.1)' },
    DELETE_ORDER: { icon: <FiTrash2 />, color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
    CREATE_ROLE: { icon: <FiShield />, color: '#2a9d8f', bg: 'rgba(42,157,143,0.1)' },
    UPDATE_ROLE: { icon: <FiEdit />, color: '#f4a261', bg: 'rgba(244,162,97,0.1)' },
    DELETE_ROLE: { icon: <FiTrash2 />, color: '#e63946', bg: 'rgba(230,57,70,0.1)' },
    EXPORT_REPORT: { icon: <FiDownload />, color: '#2a9d8f', bg: 'rgba(42,157,143,0.1)' },
    DEFAULT: { icon: <FiCheckCircle />, color: '#888', bg: 'rgba(136,136,136,0.1)' },
};

const timeAgo = (date) => {
    const secs = Math.floor((Date.now() - new Date(date)) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
};

export default function DashboardHome() {
    const [metrics, setMetrics] = useState(null);
    const [charts, setCharts] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [pendingSellers, setPendingSellers] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resMetrics, resCharts, resLogs, resSellers, resOrders] = await Promise.all([
                    api.get('/admin/metrics'),
                    api.get('/admin/charts'),
                    api.get('/admin/audit-logs').catch(() => ({ data: [] })),
                    api.get('/admin/users?role=dealer&isVerifiedSeller=false').catch(() => ({ data: [] })),
                    api.get('/admin/orders').catch(() => ({ data: [] })),
                ]);
                setMetrics(resMetrics.data);
                setCharts(resCharts.data);
                setAuditLogs(resLogs.data.slice(0, 8));
                setRecentOrders((resOrders.data.orders || resOrders.data || []).slice(0, 5));
                // Count pending seller verifications from pre-filtered user list
                const sellers = Array.isArray(resSellers.data) ? resSellers.data : resSellers.data?.users || [];
                setPendingSellers(sellers.length);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="spinner" style={{ marginTop: '20vh' }} />;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: 4 }}>Dashboard Overview</h1>
                    <p className="page-subtitle" style={{ margin: 0 }}>Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(42,157,143,0.1)', color: '#2a9d8f', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a9d8f', animation: 'pulse 2s infinite' }} />
                        System: Healthy
                    </div>
                    <Link to="/admin/cars" className="btn btn-primary btn-sm"><FiPlusCircle /> Add Listing</Link>
                    <Link to="/admin/analytics" className="btn btn-secondary btn-sm"><FiBarChart2 /> Full Report</Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <Link to="/admin/cars" className="quick-action-card"><FiCheckCircle /> Approve Pending</Link>
                <Link to="/admin/users" className="quick-action-card"><FiUsers /> Manage Users</Link>
                <Link to="/admin/sellers" className="quick-action-card"><FiStar /> Verify Sellers</Link>
                <Link to="/admin/orders" className="quick-action-card"><FiShoppingBag /> View Orders</Link>
                <Link to="/admin/analytics" className="quick-action-card"><FiDownload /> Export Report</Link>
            </div>

            {/* Metrics Row */}
            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))' }}>
                <Link to="/admin/users" className="metric-card">
                    <div className="metric-icon" style={{ background: 'rgba(230,57,70,0.1)', color: 'var(--primary)' }}><FiUsers /></div>
                    <div className="metric-info">
                        <h4>Total Users</h4>
                        <h2>{metrics?.totalUsers || 0}</h2>
                        <span style={{ fontSize: '0.75rem', color: '#2a9d8f' }}>{metrics?.userGrowth} Growth</span>
                    </div>
                </Link>
                <Link to="/admin/sellers" className="metric-card">
                    <div className="metric-icon" style={{ background: 'rgba(42,157,143,0.1)', color: '#2a9d8f' }}><FiCheckCircle /></div>
                    <div className="metric-info">
                        <h4>Verified Sellers</h4>
                        <h2>{metrics?.verifiedSellers || 0}</h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved sellers</span>
                    </div>
                </Link>
                {pendingSellers > 0 && (
                    <Link to="/admin/sellers" className="metric-card" style={{ borderColor: '#e9c46a' }}>
                        <div className="metric-icon" style={{ background: 'rgba(233,196,106,0.1)', color: '#e9c46a' }}><FiAlertCircle /></div>
                        <div className="metric-info">
                            <h4>Pending Sellers</h4>
                            <h2>{pendingSellers}</h2>
                            <span style={{ fontSize: '0.75rem', color: '#e9c46a' }}>Awaiting verification</span>
                        </div>
                    </Link>
                )}
                <Link to="/admin/cars" className="metric-card">
                    <div className="metric-icon" style={{ background: 'rgba(244,162,97,0.1)', color: '#f4a261' }}><FiBox /></div>
                    <div className="metric-info">
                        <h4>Active Listings</h4>
                        <h2>{metrics?.activeListings || 0}</h2>
                        <span style={{ fontSize: '0.75rem', color: '#2a9d8f' }}>{metrics?.listingGrowth} New</span>
                    </div>
                </Link>
                <Link to="/admin/cars?status=pending" className="metric-card">
                    <div className="metric-icon" style={{ background: 'rgba(233,196,106,0.1)', color: '#e9c46a' }}><FiClock /></div>
                    <div className="metric-info">
                        <h4>Pending Approvals</h4>
                        <h2>{metrics?.pendingListings || 0}</h2>
                        <span style={{ fontSize: '0.75rem', color: '#e9c46a' }}>Awaiting review</span>
                    </div>
                </Link>
                <Link to="/admin/orders" className="metric-card">
                    <div className="metric-icon" style={{ background: 'rgba(69,123,157,0.1)', color: '#457b9d' }}><FiShoppingBag /></div>
                    <div className="metric-info">
                        <h4>Total Orders</h4>
                        <h2>{metrics?.totalOrders || 0}</h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All time</span>
                    </div>
                </Link>
                <div className="metric-card">
                    <div className="metric-icon" style={{ background: 'rgba(42,157,143,0.1)', color: '#2a9d8f' }}><FiDollarSign /></div>
                    <div className="metric-info">
                        <h4>Real-time Revenue</h4>
                        <h2>${(metrics?.totalRevenue || 0).toLocaleString()}</h2>
                        <span style={{ fontSize: '0.75rem', color: '#2a9d8f' }}>Cumulative Paid Orders</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
                {/* Line Chart: Registrations */}
                <div className="chart-card">
                    <h3>User Registrations Over Time</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={charts?.registrations || []}>
                                <defs>
                                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e63946" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#e63946" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                                <YAxis stroke="#888" fontSize={11} />
                                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }} />
                                <Area type="monotone" dataKey="Users" stroke="#e63946" strokeWidth={2.5} fill="url(#regGrad)" dot={{ r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories Pie */}
                <div className="chart-card">
                    <h3>Listings by Category</h3>
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie data={charts?.categories || []} innerRadius={60} outerRadius={95} paddingAngle={5} dataKey="value">
                                    {(charts?.categories || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 8 }} />
                                <Legend verticalAlign="bottom" height={36} iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 28 }}>
                {/* Recent Orders Table */}
                <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0 }}>Recent Orders</h3>
                        <Link to="/admin/orders" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Manage all →</Link>
                    </div>
                    <div className="admin-table">
                        <table style={{ minWidth: 'unset', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Vehicle</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: 25, color: 'var(--text-muted)' }}>No recent orders.</td></tr>
                                ) : recentOrders.map(order => (
                                    <tr key={order._id}>
                                        <td style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <img
                                                src={sanitizeImageUrl(order.user?.profilePhoto, 'avatar')}
                                                alt=""
                                                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{order.user?.name || 'Guest'}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            <div style={{ fontWeight: 600 }}>{order.car?.make} {order.car?.model}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>{order.type?.toUpperCase()}</div>
                                        </td>
                                        <td style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2a9d8f' }}>
                                            ${(order.totalPrice || order.car?.price)?.toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`badge ${order.status === 'completed' || order.status === 'approved' ? 'badge-green' : order.status === 'pending' ? 'badge-gold' : 'badge-red'}`} style={{ fontSize: '0.62rem', padding: '2px 8px' }}>
                                                {order.status?.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Live Recent Activity (from AuditLog) */}
                <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0 }}>Recent Activity</h3>
                        <Link to="/admin/audit-logs" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>View all →</Link>
                    </div>
                    <div className="activity-feed">
                        {auditLogs.length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No recent admin actions recorded yet.
                            </div>
                        ) : auditLogs.map((log, i) => {
                            const meta = ACTION_META[log.action] || ACTION_META.DEFAULT;
                            return (
                                <div className="activity-item" key={log._id || i}>
                                    <div className="activity-icon" style={{ background: meta.bg, color: meta.color }}>
                                        {meta.icon}
                                    </div>
                                    <div className="activity-body">
                                        <strong>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                                                {log.adminId?.name || 'Admin'}:{' '}
                                            </span>
                                            {typeof log.details === 'string' ? log.details.slice(0, 60) : (log.details?.message || log.action)}
                                        </strong>
                                        <span>{timeAgo(log.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
