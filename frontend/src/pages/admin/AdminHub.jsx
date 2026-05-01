import { useState, useEffect } from 'react';
import {
    FiUsers, FiBox, FiShoppingBag, FiCreditCard, FiStar,
    FiGrid, FiBarChart2, FiSettings, FiHelpCircle, FiShield,
    FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle,
    FiUser, FiCpu, FiPlus, FiDownload, FiActivity
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import './AdminLayout.css';

const CHART_COLORS = ['#3a0ca3', '#4361ee', '#4cc9f0', '#7209b7', '#f72585', '#ff9f1c'];

export default function AdminHub() {
    const navigate = useNavigate();
    const { switchViewMode, viewMode } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, chartsRes] = await Promise.all([
                    api.get('/admin/metrics'),
                    api.get('/admin/charts')
                ]);
                setMetrics(metricsRes.data);
                setCharts(chartsRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // KPIs ordered by specified hierarchy
    const kpis = [
        { id: 'listings', label: 'Active Listings', value: metrics?.activeListings, icon: <FiBox />, color: '#4361ee' },
        { id: 'orders', label: 'Total Orders', value: metrics?.totalOrders, icon: <FiShoppingBag />, color: '#3a0ca3' },
        { id: 'users', label: 'Total Users', value: metrics?.totalUsers, icon: <FiUsers />, color: '#4cc9f0' },
        { id: 'sellers', label: 'Verified Sellers', value: metrics?.verifiedSellers, icon: <FiUser />, color: '#7209b7' },
        { id: 'pending', label: 'Pending Approvals', value: metrics?.pendingListings, icon: <FiClock />, color: '#ff9f1c', highlight: true },
        { id: 'revenue', label: 'Real-time Revenue', value: `$${metrics?.totalRevenue?.toLocaleString() || 0}`, icon: <FiCreditCard />, color: '#2ecc71' },
    ];

    if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

    return (
        <div className="admin-hub tab-fade-in">
            <header className="hub-header">
                <div>
                    <h1>Mission Control</h1>
                    <p>Hierarchical system oversight & decision matrix.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div className="hub-status-badge">
                        <FiCheckCircle /> System Online
                    </div>
                </div>
            </header>

            {/* LAYER 1: PROTOCOL INTERVENTIONS */}
            <section className="hub-layer interventions-panel glass-panel">
                <div className="layer-header">
                    <span className="layer-tag">Control Desk</span>
                    <h3>Protocol Interventions</h3>
                </div>
                <div className="action-matrix">
                    <div className="matrix-group">
                        <div className="matrix-header">
                            <FiActivity /> <span>Critical Approvals</span>
                        </div>
                        <div className="matrix-actions">
                            <button className="matrix-btn primary-glow" onClick={() => navigate('/admin/approvals')}>
                                <FiCheckCircle /> <span>Approve Listings</span>
                                <em className="btn-badge">{metrics?.pendingListings || 0}</em>
                            </button>
                            <button className="matrix-btn primary-glow" onClick={() => navigate('/admin/sellers')}>
                                <FiStar /> <span>Verify Sellers</span>
                            </button>
                        </div>
                    </div>
                    <div className="matrix-group secondary">
                        <div className="matrix-header">
                            <FiSettings /> <span>System Operations</span>
                        </div>
                        <div className="matrix-actions">
                            <button className="matrix-btn" onClick={() => navigate('/admin/users')}>
                                <FiUsers /> <span>Manage Users</span>
                            </button>
                            <button className="matrix-btn" onClick={() => navigate('/admin/orders')}>
                                <FiShoppingBag /> <span>Track Orders</span>
                            </button>
                            <button className="matrix-btn outline" onClick={() => navigate('/admin/analytics')}>
                                <FiDownload /> <span>Export Logs</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* LAYER 2: SYSTEM HEALTH MATRIX */}
            <section className="hub-layer">
                <div className="layer-header">
                    <span className="layer-tag">Vital Signs</span>
                    <h3>System Health Matrix</h3>
                </div>
                <div className="kpi-grid-modern">
                    {kpis.map(kpi => (
                        <div key={kpi.id} className="kpi-card-modern glass-panel">
                            <div className="kpi-card-header">
                                <span className="kpi-label">{kpi.label}</span>
                                <div className="kpi-icon-wrap" style={{ color: kpi.color, background: `${kpi.color}15` }}>
                                    {kpi.icon}
                                </div>
                            </div>
                            <div className="kpi-card-body">
                                <h2 className={kpi.highlight ? 'text-warning' : ''}>{kpi.value ?? '...'}</h2>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* LAYER 3: INTELLIGENCE MATRIX (Charts) */}
            <section className="hub-layer intelligence-matrix">
                <div className="layer-header">
                    <span className="layer-tag">Analytics Hub</span>
                    <h3>System Velocity & Breakdown</h3>
                </div>
                
                <div className="intelligence-grid">
                    {/* Main Activity Chart */}
                    <div className="intel-card main-activity glass-panel">
                        <div className="card-title">
                            <h4>Market Activity</h4>
                            <p>Inventory vs Transaction volume</p>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={340}>
                                <AreaChart data={charts?.activity || []}>
                                    <defs>
                                        <linearGradient id="colorL" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorO" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3a0ca3" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3a0ca3" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: 'none', borderRadius: '12px' }} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Area type="monotone" dataKey="Listings" stroke="#4361ee" strokeWidth={2} fill="url(#colorL)" />
                                    <Area type="monotone" dataKey="Orders" stroke="#3a0ca3" strokeWidth={2} fill="url(#colorO)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="intel-sidebar">
                        {/* Secondary Chart */}
                        <div className="intel-card side-chart glass-panel">
                            <div className="card-title">
                                <h4>User Acquisition</h4>
                            </div>
                            <ResponsiveContainer width="100%" height={150}>
                                <AreaChart data={charts?.registrations || []}>
                                    <defs>
                                        <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7209b7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#7209b7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="Users" stroke="#7209b7" strokeWidth={2} fill="url(#colorR)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown Chart */}
                        <div className="intel-card side-chart glass-panel">
                            <div className="card-title">
                                <h4>Inventory Distribution</h4>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={charts?.categories || []}
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(charts?.categories || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: 'none' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            {/* LAYER 5: DOMAIN ACCESS */}
            <section className="hub-layer domain-layer">
                <div className="layer-header">
                    <span className="layer-tag">Layer 05</span>
                    <h3>Operational Perspective</h3>
                </div>
                <div className="access-grid">
                    <div className={`access-card ${viewMode === 'dealer' ? 'active' : ''}`} onClick={() => { switchViewMode('dealer'); navigate('/seller'); }}>
                        <div className="access-icon"><FiCpu /></div>
                        <div>
                            <strong>Simulate Dealer</strong>
                            <p>Manage inventory & leads</p>
                        </div>
                    </div>
                    <div className={`access-card ${viewMode === 'user' ? 'active' : ''}`} onClick={() => { switchViewMode('user'); navigate('/hub'); }}>
                        <div className="access-icon"><FiUser /></div>
                        <div>
                            <strong>Simulate Buyer</strong>
                            <p>Browse & track purchases</p>
                        </div>
                    </div>
                    <div className={`access-card ${viewMode === 'admin' ? 'active' : ''}`} onClick={() => switchViewMode('admin')}>
                        <div className="access-icon"><FiShield /></div>
                        <div>
                            <strong>Return to Command</strong>
                            <p>Full system oversight</p>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                .admin-hub { padding: 10px 0 60px; }
                .hub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .hub-header h1 { font-size: 2.2rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px; }
                .hub-header p { color: var(--text-muted); font-size: 1rem; }
                .hub-status-badge { background: #2ecc7115; color: #2ecc71; padding: 8px 16px; border-radius: 50px; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.85rem; border: 1px solid #2ecc7130; }

                .hub-layer { margin-bottom: 40px; }
                .layer-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-left: 5px; }
                .layer-tag { font-size: 0.65rem; font-weight: 900; color: var(--primary); background: var(--primary-glow); padding: 4px 10px; border-radius: 6px; letter-spacing: 1px; text-transform: uppercase; }
                .layer-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; opacity: 0.9; }

                /* Action Matrix */
                .interventions-panel { padding: 30px; margin-bottom: 30px; border: 1px solid rgba(var(--primary-rgb), 0.1); }
                .action-matrix { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; }
                .matrix-group { display: flex; flex-direction: column; gap: 20px; }
                .matrix-header { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
                .matrix-header span { opacity: 0.6; }
                .matrix-actions { display: flex; gap: 12px; flex-wrap: wrap; }
                .matrix-btn { 
                    display: flex; align-items: center; gap: 12px; padding: 14px 24px; border-radius: 12px;
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: var(--text);
                    font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; position: relative;
                }
                .matrix-btn:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); border-color: var(--primary); }
                .matrix-btn.primary-glow { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.05); }
                .matrix-btn.outline { border-style: dashed; background: transparent; }
                .btn-badge { position: absolute; top: -8px; right: -8px; background: var(--primary); color: white; font-size: 0.65rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; font-style: normal; }

                /* KPI Layer */
                .kpi-grid-modern { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; margin-bottom: 40px; }
                .kpi-card-modern { padding: 20px; border-radius: 16px; border: 1px solid var(--border); }
                .kpi-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .kpi-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .kpi-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
                .kpi-card-body h2 { font-size: 1.5rem; font-weight: 900; margin: 0; letter-spacing: -0.5px; }

                /* Intelligence Matrix (Charts) */
                .intelligence-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
                .intel-card { padding: 25px; border-radius: 20px; }
                .intel-card .card-title { margin-bottom: 25px; }
                .intel-card h4 { margin: 0; font-size: 1rem; font-weight: 800; }
                .intel-card p { margin: 4px 0 0; font-size: 0.8rem; color: var(--text-muted); }
                .intel-sidebar { display: flex; flex-direction: column; gap: 20px; }
                .side-chart { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
                
                /* Domain Access */
                .access-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                .access-card { 
                    padding: 24px; border-radius: 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border);
                    display: flex; align-items: center; gap: 20px; cursor: pointer; transition: all 0.3s;
                }
                .access-card:hover { background: rgba(255,255,255,0.05); transform: translateY(-5px); border-color: var(--primary); }
                .access-card.active { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.1); }
                .access-icon { width: 50px; height: 50px; border-radius: 14px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: var(--primary); }
                .access-card strong { display: block; font-size: 1rem; margin-bottom: 2px; }
                .access-card p { font-size: 0.8rem; color: var(--text-muted); margin: 0; }

                @media (max-width: 1600px) { .kpi-grid-modern { grid-template-columns: repeat(3, 1fr); } }
                @media (max-width: 1200px) { .charts-layout-row { grid-template-columns: 1fr; } .kpi-grid-modern { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 800px) { .access-grid { grid-template-columns: 1fr; } .action-buttons-row { flex-direction: column; } }
            `}</style>
        </div>
    );
}
