import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    FiGrid, FiBox, FiShoppingBag, FiSettings,
    FiMessageSquare, FiUser, FiCalendar, FiLogOut, FiCpu
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import '../admin/AdminLayout.css';

export default function SellerLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="admin-layout" style={{ background: '#0b0d14' }}>
            <aside className="admin-sidebar" style={{
                background: 'rgba(22, 24, 35, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.03)',
                boxShadow: '10px 0 30px rgba(0,0,0,0.2)'
            }}>
                <div className="admin-brand" style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 5 }}>
                        <div style={{ padding: 8, background: 'var(--primary)', borderRadius: 10, display: 'flex', boxShadow: '0 0 15px var(--primary-glow)' }}>
                            <FiCpu color="white" size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: -0.5, margin: 0 }}>DEALER<span style={{ color: 'var(--text-muted)', fontWeight: 300 }}>OS</span></h2>
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>Command Center</p>
                </div>

                <nav className="admin-nav" style={{ padding: '0 15px' }}>
                    <NavLink to="/seller" end className={({ isActive }) => isActive ? 'active' : ''}>
                        <FiGrid /> Dashboard
                    </NavLink>
                    <NavLink to="/seller/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
                        <FiBox /> Inventory
                    </NavLink>
                    <NavLink to="/seller/orders" className={({ isActive }) => isActive ? 'active' : ''}>
                        <FiShoppingBag /> Leads & Orders
                    </NavLink>
                    <NavLink to="/seller/test-drives" className={({ isActive }) => isActive ? 'active' : ''}>
                        <FiCalendar /> Schedule
                    </NavLink>
                    <NavLink to="/seller/messages" className={({ isActive }) => isActive ? 'active' : ''}>
                        <FiMessageSquare /> Messages
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                        <FiSettings /> Settings
                    </NavLink>
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={handleLogout} className="logout-button-minimal" style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)', padding: '14px', borderRadius: 14, width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.3s'
                    }}>
                        <FiLogOut /> Exit Module
                    </button>
                </div>
            </aside>

            <main className="admin-main" style={{ background: 'transparent' }}>
                <div className="admin-content" style={{ padding: '40px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
