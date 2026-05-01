import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
    FiGrid, FiUsers, FiBox, FiShoppingBag, FiSettings, FiChevronLeft, FiChevronRight,
    FiBarChart2, FiFileText, FiHelpCircle, FiActivity, FiSun, FiMoon,
    FiShield, FiTruck, FiSearch, FiLogOut, FiBell, FiPlus, FiStar, FiPackage, FiCreditCard,
    FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import './AdminLayout.css';


export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState('');
    const [counts, setCounts] = useState({ unreadSupport: 0, pendingListings: 0 });
    const { user, logout, viewMode, switchViewMode } = useAuth();
    const { dark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await api.get('/admin/metrics');
                setCounts({
                    unreadSupport: res.data.unreadSupport || 0,
                    pendingListings: res.data.pendingListings || 0
                });
            } catch (err) {
                console.error('Failed to sync notification counts', err);
            }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => { logout(); navigate('/'); };

    const sections = [
        {
            label: 'MAIN',
            items: [
                { to: '/admin', end: true, label: 'Dashboard' },
            ]
        },
        {
            label: 'OPERATIONS',
            items: [
                { to: '/admin/cars', label: 'Listings', permission: 'manage_listings' },
                { to: '/admin/orders', label: 'Orders', permission: 'manage_orders' },
            ]
        },
        {
            label: 'USERS',
            items: [
                { to: '/admin/users', label: 'Manage Users', permission: 'edit_users' },
                { to: '/admin/sellers', label: 'Sellers', permission: 'edit_users' },
            ]
        },
        {
            label: 'MODERATION',
            items: [
                { 
                    to: '/admin/approvals', 
                    label: 'Approvals', 
                    permission: 'manage_listings',
                    badge: counts.pendingListings
                },
                {
                    to: '/admin/support',
                    label: 'Customer Support',
                    badge: counts.unreadSupport
                },
            ]
        },
        {
            label: 'SYSTEM',
            items: [
                { to: '/admin/settings', label: 'Settings / System Ops' },
            ]
        },
        {
            label: 'ACCOUNT',
            items: [
                { to: '/admin/profile', label: 'My Identity' },
            ]
        }
    ];

    return (
        <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    {!collapsed && <><FiShield className="brand-icon" /><span>Admin<strong>Panel</strong></span></>}
                    <button className="collapse-btn" onClick={() => setCollapsed(c => !c)} title="Toggle Sidebar">
                        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                    </button>
                </div>

                <nav className="admin-nav">
                    {sections.map(section => {
                        const filteredItems = section.items.filter(item => {
                            if (!item.permission) return true;
                            if (user?.role === 'admin' || user?.role === 'super_admin') return true;
                            return user?.permissions?.includes(item.permission);
                        });

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={section.label} className="nav-section">
                                {!collapsed && <span className="nav-section-label">{section.label}</span>}
                                {filteredItems.map(item => (
                                    <NavLink key={item.to} to={item.to} end={item.end} title={collapsed ? item.label : ''}>
                                        <span className="nav-label">{item.label}</span>
                                        {item.badge > 0 && !collapsed && (
                                            <span className="nav-badge-minimal">{item.badge}</span>
                                        )}
                                        {item.badge > 0 && collapsed && (
                                            <span className="nav-badge-dot"></span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {!collapsed && (
                    <div className="sidebar-footer">
                        <div className="role-switcher-admin">
                            <button
                                className={`role-btn ${viewMode === 'user' ? 'active' : ''}`}
                                onClick={() => { switchViewMode('user'); navigate('/'); }}
                                title="Switch to User View"
                            >
                                User
                            </button>
                            <button
                                className={`role-btn ${viewMode === 'dealer' ? 'active' : ''}`}
                                onClick={() => { switchViewMode('dealer'); navigate('/seller'); }}
                                title="Switch to Seller View"
                            >
                                Seller
                            </button>
                            <button
                                className={`role-btn ${viewMode === 'admin' ? 'active' : ''}`}
                                onClick={() => switchViewMode('admin')}
                                title="Stay in Admin View"
                            >
                                Admin
                            </button>
                        </div>
                        <div className="sidebar-user">
                            <div className="sidebar-avatar">
                                {user?.profilePhoto
                                    ? <img src={user.profilePhoto} alt="" />
                                    : <span>{user?.name?.charAt(0).toUpperCase()}</span>
                                }
                            </div>
                            <div className="sidebar-user-info">
                                <strong>{user?.name}</strong>
                                <span>{viewMode.toUpperCase()} VIEW</span>
                            </div>
                            <button className="sidebar-logout" onClick={handleLogout} title="Logout">
                                <FiLogOut />
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main */}
            <div className="admin-main-wrapper">
                <main className="admin-main">
                    <div className="admin-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
