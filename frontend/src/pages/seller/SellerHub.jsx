import { useState, useEffect } from 'react';
import {
    FiBox, FiShoppingBag, FiMessageSquare, FiTrendingUp,
    FiPlusCircle, FiDollarSign, FiUsers, FiCpu, FiChevronRight,
    FiCheckCircle, FiClock, FiActivity, FiUser, FiSettings,
    FiTruck, FiInfo, FiLogOut
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip
} from 'recharts';

export default function SellerHub() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/seller/metrics');
                setMetrics(res.data);
            } catch (err) {
                toast.error('Failed to sync dealer metrics');
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        toast.success('Securely logged out from Command Center');
    };

    if (loading) return <div className="spinner" style={{ marginTop: '20vh' }} />;

    const desks = [
        {
            id: 'inventory',
            title: 'Manage Inventory',
            subtitle: 'Points 3, 4, 5, 10',
            icon: <FiBox />,
            path: '/seller/inventory',
            color: '#e63946',
            stats: `${metrics?.activeListings || 0} Cars Listed`,
            description: 'Add new cars, edit existing listings, or remove sold vehicles. Update car status (Available/Reserved/Sold).'
        },
        {
            id: 'leads',
            title: 'Buyer Requests & Orders',
            subtitle: 'Points 6, 8',
            icon: <FiShoppingBag />,
            path: '/seller/orders',
            color: '#2a9d8f',
            stats: `${metrics?.totalOrders || 0} Requests`,
            description: 'Check purchase requests from buyers. Accept or reject incoming orders.'
        },
        {
            id: 'messages',
            title: 'Buyer Communication',
            subtitle: 'Point 7',
            icon: <FiMessageSquare />,
            path: '/seller/messages',
            color: '#4361ee',
            stats: `${metrics?.newInquiries || 0} Unread`,
            description: 'Answer buyer questions and provide specific car details to close the sale.'
        },
        {
            id: 'test-drives',
            title: 'Schedule Test Drives',
            subtitle: 'Point 9',
            icon: <FiClock />,
            path: '/seller/test-drives',
            color: '#f4a261',
            stats: 'Live View',
            description: 'Arrange and manage test drive appointments with potential buyers.'
        },
        {
            id: 'analytics',
            title: 'Sales Performance',
            subtitle: 'Point 11',
            icon: <FiTrendingUp />,
            path: '/seller/dashboard',
            color: '#7209b7',
            stats: `$${metrics?.totalRevenue?.toLocaleString() || 0}`,
            description: 'Monitor your sales performance and check total cars sold.'
        }
    ];

    return (
        <div className="seller-hub fade-in">
            {/* Header: Portal Overview */}
            <div className="hub-header card glass-panel">
                <div className="header-content">
                    <div className="brand-suite">
                        <div className="hub-icon"><FiBox /></div>
                        <div>
                            <h1>Seller <span className="gradient-text">Portal</span></h1>
                            <p>Functional Dashboard • {new Date().toLocaleDateString()} • {metrics?.isVerified ? 'Verified Dealer' : 'Identity Verification Pending'}</p>
                        </div>
                    </div>
                    <div className="hub-actions">
                        <Link to="/seller/inventory" className="btn btn-primary">
                            <FiPlusCircle /> Add New Car
                        </Link>
                        <button className="btn-icon-hub" title="Logout" onClick={handleLogout}>
                            <FiLogOut />
                        </button>
                    </div>
                </div>

                {/* KPI Ribbon */}
                <div className="kpi-ribbon">
                    <div className="kpi-item">
                        <FiDollarSign className="kpi-icon-small" />
                        <div className="kpi-text">
                            <span className="label">Revenue</span>
                            <span className="value">${metrics?.totalRevenue?.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="kpi-divider" />
                    <div className="kpi-item">
                        <FiUsers className="kpi-icon-small" />
                        <div className="kpi-text">
                            <span className="label">Pipeline</span>
                            <span className="value">{metrics?.totalOrders} Leads</span>
                        </div>
                    </div>
                    <div className="kpi-divider" />
                    <div className="kpi-item">
                        <FiCheckCircle className="kpi-icon-small" style={{ color: '#2a9d8f' }} />
                        <div className="kpi-text">
                            <span className="label">Inventory</span>
                            <span className="value">{metrics?.activeListings} Units</span>
                        </div>
                    </div>
                    <div className="kpi-divider" />
                    <div className="kpi-item">
                        <FiClock className="kpi-icon-small" style={{ color: '#f4a261' }} />
                        <div className="kpi-text">
                            <span className="label">Pending</span>
                            <span className="value">{metrics?.pendingOrders + metrics?.pendingListings} Items</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Desks */}
            <div className="desks-grid">
                {desks.map(desk => (
                    <Link to={desk.path} key={desk.id} className="desk-card glass-panel">
                        <div className="desk-icon" style={{ background: `${desk.color}22`, color: desk.color }}>
                            {desk.icon}
                        </div>
                        <div className="desk-body">
                            <div className="desk-meta">
                                <span className="desk-subtitle">{desk.subtitle}</span>
                                <h3 className="desk-title">{desk.title}</h3>
                            </div>
                            <p className="desk-desc">{desk.description}</p>
                            <div className="desk-footer">
                                <span className="desk-stats" style={{ color: desk.color }}>{desk.stats}</span>
                                <FiChevronRight />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Performance Overview (Integrated Analytics) */}
            <div className="hub-analytics-grid">
                <div className="glass-panel performance-card">
                    <div className="card-header">
                        <h3>Conversion Trend</h3>
                        <Link to="/seller/dashboard" className="view-details">Full Analytics <FiChevronRight /></Link>
                    </div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics?.monthlyTrend || []}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: 8 }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#2a9d8f" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel help-center-card">
                    <h3>Dealer Resources</h3>
                    <div className="resource-list">
                        <div className="resource-item">
                            <FiInfo className="res-icon" />
                            <div>
                                <strong>Optimization Guide</strong>
                                <p>How to improve listing visibility</p>
                            </div>
                        </div>
                        <div className="resource-item">
                            <FiTruck className="res-icon" />
                            <div>
                                <strong>Logistics Network</strong>
                                <p>Connect with delivery partners</p>
                            </div>
                        </div>
                        <div className="resource-item">
                            <FiSettings className="res-icon" />
                            <div>
                                <strong>Platform Updates</strong>
                                <p>New features for Q1 2024</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .seller-hub { padding-bottom: 50px; }
                .glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    border-radius: 24px;
                    transition: all 0.3s ease;
                }
                
                .hub-header { padding: 40px; margin-bottom: 30px; }
                .header-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .brand-suite { display: flex; align-items: center; gap: 20px; }
                .hub-icon { width: 60px; height: 60px; background: var(--primary); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white; box-shadow: 0 10px 20px rgba(230, 57, 70, 0.3); }
                .brand-suite h1 { margin: 0; font-size: 2.2rem; font-weight: 900; }
                .brand-suite p { margin: 5px 0 0; color: var(--text-muted); font-size: 0.9rem; }
                .hub-actions { display: flex; gap: 15px; }
                .btn-icon-hub { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: all 0.2s; }
                .btn-icon-hub:hover { color: #e63946; border-color: #e63946; background: rgba(230, 57, 70, 0.1); }
                
                .kpi-ribbon { display: flex; gap: 40px; align-items: center; }
                .kpi-item { display: flex; align-items: center; gap: 15px; }
                .kpi-icon-small { font-size: 1.2rem; color: var(--primary); }
                .kpi-text { display: flex; flex-direction: column; }
                .kpi-text .label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; opacity: 0.7; }
                .kpi-text .value { font-size: 1.1rem; font-weight: 800; }
                .kpi-divider { width: 1px; height: 30px; background: var(--border); }
                
                .desks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .desk-card { padding: 30px; text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 20px; }
                .desk-card:hover { transform: translateY(-8px); border-color: var(--primary); }
                .desk-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
                .desk-subtitle { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; opacity: 0.6; }
                .desk-title { margin: 2px 0 0; font-size: 1.3rem; font-weight: 900; }
                .desk-desc { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
                .desk-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px; border-top: 1px solid var(--border); }
                .desk-stats { font-weight: 800; font-size: 0.9rem; }
                
                .hub-analytics-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
                .performance-card, .help-center-card { padding: 30px; }
                .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .view-details { text-decoration: none; color: var(--primary); font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 5px; }
                
                .help-center-card h3 { margin-top: 0; margin-bottom: 25px; }
                .resource-list { display: grid; gap: 15px; }
                .resource-item { display: flex; gap: 15px; align-items: center; padding: 15px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid transparent; transition: all 0.2s; cursor: pointer; }
                .resource-item:hover { background: rgba(255,255,255,0.05); border-color: var(--border); }
                .res-icon { font-size: 1.2rem; color: var(--primary); opacity: 0.7; }
                .resource-item strong { display: block; font-size: 0.9rem; }
                .resource-item p { margin: 2px 0 0; font-size: 0.75rem; color: var(--text-muted); }
                
                @media (max-width: 992px) {
                    .hub-analytics-grid { grid-template-columns: 1fr; }
                    .kpi-ribbon { flex-wrap: wrap; gap: 20px; }
                }
            `}</style>
        </div>
    );
}
