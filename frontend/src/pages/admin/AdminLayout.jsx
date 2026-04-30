import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
    FiGrid, FiUsers, FiBox, FiShoppingBag, FiSettings, FiChevronLeft, FiChevronRight,
    FiBarChart2, FiFileText, FiHelpCircle, FiActivity, FiSun, FiMoon,
    FiShield, FiTruck, FiSearch, FiLogOut, FiBell, FiPlus, FiStar, FiPackage, FiCreditCard
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './AdminLayout.css';

const navSections = [
    {
        label: 'Intelligence',
        items: [
            { to: '/admin', end: true, icon: <FiGrid />, label: 'Mission Control' },
            { to: '/admin/analytics', icon: <FiBarChart2 />, label: 'Intelligence Reports', permission: 'view_analytics' },
        ]
    },
    {
        label: 'Core Entities',
        items: [
            { to: '/admin/users', icon: <FiUsers />, label: 'User Central', permission: 'edit_users' },
            { to: '/admin/sellers', icon: <FiUsers />, label: 'Dealer Registry', permission: 'edit_users' },
            { to: '/admin/cars', icon: <FiBox />, label: 'Inventory Control', permission: 'manage_listings' },
            { to: '/admin/categories', icon: <FiGrid />, label: 'Catalog Architect', permission: 'manage_catalog' },
        ]
    },
    {
        label: 'Commerce',
        items: [
            { to: '/admin/orders', icon: <FiShoppingBag />, label: 'Transaction Matrix', permission: 'manage_orders' },
            { to: '/admin/payments', icon: <FiCreditCard />, label: 'Finance Vault', permission: 'manage_finance' },
        ]
    },
    {
        label: 'Moderation',
        items: [
            { to: '/admin/reviews', icon: <FiStar />, label: 'Moderation Suite', permission: 'manage_reviews' },
            { to: '/admin/support', icon: <FiHelpCircle />, label: 'Customer Support' },
        ]
    },
    {
        label: 'System',
        items: [
            { to: '/admin/settings', icon: <FiSettings />, label: 'System Operations' },
            { to: '/admin/audit-logs', icon: <FiFileText />, label: 'Security Desk', permission: 'view_audit_logs' },
            { to: '/admin/system', icon: <FiActivity />, label: 'Health Status', permission: 'manage_roles' },
            { to: '/admin/profile', icon: <FiShield />, label: 'My Identity' },
        ]
    }
];

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [search, setSearch] = useState('');
    const { user, logout, viewMode, switchViewMode } = useAuth();
    const { dark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/'); };

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
                    {navSections.map(section => {
                        const filteredItems = section.items.filter(item => {
                            if (!item.permission) return true;
                            // Super admin has all
                            if (user?.role === 'admin') return true;
                            return user?.permissions?.includes(item.permission);
                        });

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={section.label} className="nav-section">
                                {!collapsed && <span className="nav-section-label">{section.label}</span>}
                                {filteredItems.map(item => (
                                    <NavLink key={item.to} to={item.to} end={item.end} title={collapsed ? item.label : ''}>
                                        <span className="nav-icon">{item.icon}</span>
                                        {!collapsed && <span className="nav-label">{item.label}</span>}
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
                {/* Top Header */}
                <header className="admin-topbar">
                    <div className="topbar-search">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search users, listings, orders..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="topbar-actions">
                        {/* Quick Actions */}
                        <Link to="/admin/cars" className="topbar-quick-btn" title="Add New Car Listing">
                            <FiPlus /> <span>Add Listing</span>
                        </Link>
                        <button className="topbar-icon-btn" title="Notifications"><FiBell /></button>
                        <button className="topbar-icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            {dark ? <FiSun /> : <FiMoon />}
                        </button>
                        <button className="topbar-icon-btn danger" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                    </div>
                </header>

                <main className="admin-main">
                    <div className="admin-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
