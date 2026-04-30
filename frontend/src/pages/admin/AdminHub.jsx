import { useState, useEffect } from 'react';
import {
    FiUsers, FiBox, FiShoppingBag, FiCreditCard, FiStar,
    FiGrid, FiBarChart2, FiSettings, FiHelpCircle, FiShield,
    FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle,
    FiUser, FiShoppingBag as FiBuyerIcon, FiCpu
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

export default function AdminHub() {
    const navigate = useNavigate();
    const { switchViewMode, viewMode } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/admin/metrics');
                setMetrics(res.data);
            } catch (err) {
                console.error('Failed to fetch metrics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    const desks = [
        { id: 'users', title: 'User Central', icon: <FiUsers />, count: metrics?.totalUsers || '...', color: '#4cc9f0', path: '/admin/users', desc: 'Approve, block, or update accounts.' },
        { id: 'listings', title: 'Inventory Control', icon: <FiBox />, count: metrics?.activeListings || '...', color: '#4361ee', path: '/admin/cars', desc: 'Manage car listings & approvals.' },
        { id: 'sellers', title: 'Dealer Registry', icon: <FiUsers />, color: '#7209b7', path: '/admin/sellers', desc: 'Approve & verify car dealers.' },
        { id: 'orders', title: 'Transaction Matrix', icon: <FiShoppingBag />, count: metrics?.totalOrders || '...', color: '#3a0ca3', path: '/admin/orders', desc: 'Track purchases & handle disputes.' },
        { id: 'payments', title: 'Finance Vault', icon: <FiCreditCard />, count: `$${metrics?.totalRevenue?.toLocaleString() || '0'}`, color: '#f72585', path: '/admin/payments', desc: 'Monitor & verify success payments.' },
        { id: 'reviews', title: 'Moderation Suite', icon: <FiStar />, color: '#ff9f1c', path: '/admin/reviews', desc: 'Control ratings & customer reviews.' },
        { id: 'catalog', title: 'Catalog Architect', icon: <FiGrid />, color: '#2ec4b6', path: '/admin/categories', desc: 'Organize car brands & categories.' },
        { id: 'analytics', title: 'Intelligence Reports', icon: <FiBarChart2 />, color: '#3f37c9', path: '/admin/analytics', desc: 'Generate sales & user reports.' },
        { id: 'settings', title: 'System Operations', icon: <FiSettings />, color: '#560bad', path: '/admin/settings', desc: 'Manage security & platform settings.' },
        { id: 'support', title: 'Customer Support', icon: <FiHelpCircle />, color: '#f15bb5', path: '/admin/support', desc: 'Respond to complaints & resolve issues.' },
    ];

    return (
        <div className="admin-hub tab-fade-in">
            <header className="hub-header">
                <div>
                    <h1>Mission Control</h1>
                    <p>Orchestrate your automotive ecosystem from a single interface.</p>
                </div>
                <div className="hub-status-badge">
                    <FiCheckCircle /> System Online
                </div>
            </header>

            <div className="metrics-ticker">
                <div className="ticker-item">
                    <span className="ticker-label">Active Users</span>
                    <span className="ticker-value">{metrics?.totalUsers || 0}</span>
                </div>
                <div className="ticker-item">
                    <span className="ticker-label">Pending Listings</span>
                    <span className="ticker-value highlight">{metrics?.pendingListings || 0}</span>
                </div>
                <div className="ticker-item">
                    <span className="ticker-label">Total Revenue</span>
                    <span className="ticker-value success">${metrics?.totalRevenue?.toLocaleString() || 0}</span>
                </div>
            </div>

            <div className="desk-grid">
                {desks.map(desk => (
                    <div key={desk.id} className="desk-card card glass-panel" onClick={() => navigate(desk.path)}>
                        <div className="desk-header">
                            <div className="desk-icon" style={{ background: `${desk.color}20`, color: desk.color }}>
                                {desk.icon}
                            </div>
                            {desk.count && <div className="desk-stat">{desk.count}</div>}
                        </div>
                        <div className="desk-body">
                            <h3>{desk.title}</h3>
                            <p>{desk.desc}</p>
                        </div>
                        <div className="desk-footer">
                            <span>Open Desk</span>
                            <div className="desk-indicator" style={{ background: desk.color }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="hub-activity card glass-panel">
                <div className="activity-header">
                    <h3>Recent System Pulse</h3>
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/audit-logs')}>View Full Logs</button>
                </div>
                <div className="pulse-list">
                    <div className="pulse-item">
                        <FiTrendingUp className="pulse-icon success" />
                        <div className="pulse-info">
                            <strong>Platform Growth</strong>
                            <p>New user registrations are up 12% this week.</p>
                        </div>
                        <span className="pulse-time">2h ago</span>
                    </div>
                    <div className="pulse-item">
                        <FiClock className="pulse-icon warning" />
                        <div className="pulse-info">
                            <strong>Pending Approvals</strong>
                            <p>There are {metrics?.pendingListings || 0} car listings awaiting manual review.</p>
                        </div>
                        <span className="pulse-time">Now</span>
                    </div>
                    <div className="pulse-item">
                        <FiAlertCircle className="pulse-icon danger" />
                        <div className="pulse-info">
                            <strong>Security Audit</strong>
                            <p>3 manual session revocations performed by Super Admin.</p>
                        </div>
                        <span className="pulse-time">5h ago</span>
                    </div>
                </div>
            </section>

            <section className="operational-access card glass-panel">
                <div className="activity-header">
                    <h3>Operational Perspective</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Experience the platform through different stakeholder lenses.</p>
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
                        <div className="access-icon"><FiBuyerIcon /></div>
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
                .admin-hub { padding: 20px 0; }
                .hub-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
                .hub-header h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px; }
                .hub-header p { color: var(--text-muted); font-size: 1.1rem; }
                .hub-status-badge { background: #4cc9f020; color: #4cc9f0; padding: 10px 20px; border-radius: 50px; display: flex; alignItems: center; gap: 8px; font-weight: 700; font-size: 0.9rem; border: 1px solid #4cc9f040; }
                
                .metrics-ticker { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
                .ticker-item { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 20px; border-radius: 16px; display: flex; flex-direction: column; gap: 5px; }
                .ticker-label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 1px; }
                .ticker-value { font-size: 1.8rem; font-weight: 900; }
                .ticker-value.highlight { color: #ff9f1c; }
                .ticker-value.success { color: #2ecc71; }

                .desk-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-bottom: 40px; }
                .desk-card { padding: 25px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
                .desk-card:hover { transform: translateY(-8px); background: rgba(255,255,255,0.08); border-color: var(--primary); }
                .desk-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                .desk-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; items: center; justify-content: center; font-size: 1.5rem; }
                .desk-stat { font-size: 1.2rem; font-weight: 900; opacity: 0.8; }
                .desk-body h3 { margin: 0 0 8px; font-size: 1.1rem; font-weight: 700; }
                .desk-body p { color: var(--text-muted); font-size: 0.85rem; line-height: 1.4; margin: 0; }
                .desk-footer { margin-top: 25px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 15px; }
                .desk-footer span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); transition: color 0.3s; }
                .desk-card:hover .desk-footer span { color: var(--primary); }
                .desk-indicator { width: 20px; height: 3px; border-radius: 10px; opacity: 0.6; }

                .hub-activity { padding: 30px; }
                .activity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .pulse-list { display: flex; flex-direction: column; gap: 20px; }
                .pulse-item { display: flex; align-items: center; gap: 20px; padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.02); }
                .pulse-icon { font-size: 1.5rem; }
                .pulse-icon.success { color: #2ecc71; }
                .pulse-icon.warning { color: #ff9f1c; }
                .pulse-icon.danger { color: #e74c3c; }
                .pulse-info { flex: 1; }
                .pulse-info strong { display: block; font-size: 0.95rem; }
                .pulse-info p { margin: 2px 0 0; font-size: 0.85rem; color: var(--text-muted); }
                .pulse-time { font-size: 0.75rem; color: var(--text-muted); }

                .operational-access { padding: 30px; margin-top: 30px; }
                .access-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
                .access-card { 
                    padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border);
                    display: flex; align-items: center; gap: 15px; cursor: pointer; transition: all 0.2s;
                }
                .access-card:hover { background: rgba(255,255,255,0.05); border-color: var(--primary); }
                .access-card.active { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.1); }
                .access-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--primary); }
                .access-card strong { display: block; font-size: 0.95rem; }
                .access-card p { margin: 2px 0 0; font-size: 0.75rem; color: var(--text-muted); }

                @media (max-width: 1400px) { .desk-grid { grid-template-columns: repeat(4, 1fr); } }
                @media (max-width: 1100px) { .desk-grid { grid-template-columns: repeat(3, 1fr); } }
                @media (max-width: 800px) { .desk-grid { grid-template-columns: repeat(2, 1fr); } }
            `}</style>
        </div>
    );
}
