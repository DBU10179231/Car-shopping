import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiHeart, FiUser, FiLogOut, FiMenu, FiX, FiShoppingBag, FiBell, FiSun, FiMoon, FiSearch, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useFav } from '../context/FavContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import './Navbar.css';

export default function Navbar() {
    const { user, logout, viewMode, switchViewMode } = useAuth();
    const { favorites } = useFav();
    const { dark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifsOpen, setNotifsOpen] = useState(false);
    const [heartPop, setHeartPop] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const notifsRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => n.unread).length;

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/auth/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        if (favorites.length > 0) {
            setHeartPop(true);
            const timer = setTimeout(() => setHeartPop(false), 300);
            return () => clearTimeout(timer);
        }
    }, [favorites.length]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/auth/notifications/${id}`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, unread: false } : n));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await Promise.all(notifications.filter(n => n.unread).map(n => api.put(`/auth/notifications/${n._id}`)));
            setNotifications(notifications.map(n => ({ ...n, unread: false })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifsRef.current && !notifsRef.current.contains(event.target)) {
                setNotifsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => { logout(); navigate('/'); };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                {/* 1. Left: Logo + Brand name */}
                <Link to="/" className="navbar-logo">
                    <FiShoppingBag />
                    <span>AutoMarket</span>
                </Link>

                {/* 2. Center: Navigation links */}
                <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
                    <NavLink to="/cars" onClick={() => setMenuOpen(false)}>Cars</NavLink>
                    <NavLink to="/compare" onClick={() => setMenuOpen(false)}>Compare</NavLink>
                    {user && <NavLink to="/hub" onClick={() => setMenuOpen(false)}>Hub</NavLink>}
                    {user && <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>My Garage</NavLink>}
                    {user && <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Account</NavLink>}
                </div>

                {/* 3. Right: Actions */}
                <div className="navbar-actions">
                    {/* Search bar */}
                    <div className="navbar-search">
                        <FiSearch />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    {/* + Add Listing */}
                    <Link to={user ? "/seller/inventory" : "/login"} className="btn-add-listing">
                        <FiPlus /> <span>Add Listing</span>
                    </Link>

                    {/* Notification icon (🔔) */}
                    {user && (
                        <div className="notifications-wrapper" ref={notifsRef}>
                            <button className="nav-icon-btn" title="Notifications" onClick={() => setNotifsOpen(!notifsOpen)}>
                                <FiBell />
                                {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
                            </button>
                            {notifsOpen && (
                                <div className="notifications-dropdown">
                                    <div className="notifications-header">
                                        <h4>Notifications</h4>
                                        {unreadCount > 0 && (
                                            <span className="mark-all-btn" onClick={markAllAsRead}>Mark all as read</span>
                                        )}
                                    </div>
                                    <div className="notifications-list">
                                        {notifications.length === 0 ? (
                                            <div className="notification-empty">No new notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n._id} className={`notification-item ${n.unread ? 'unread' : ''}`} onClick={() => markAsRead(n._id)}>
                                                    <div className="notification-icon">
                                                        {n.type === 'message' ? <FiUser /> : n.type === 'test_drive' ? <FiShoppingBag /> : <FiBell />}
                                                    </div>
                                                    <div className="notification-content">
                                                        <div className="notification-title">{n.title}</div>
                                                        <div className="notification-text">{n.text}</div>
                                                        <span className="notification-time">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="notifications-footer">
                                        <button onClick={() => { setNotifsOpen(false); navigate('/profile'); }}>View All Notifications</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Theme toggle (🌙 / ☀️) */}
                    <button className="nav-icon-btn theme-toggle" onClick={toggleTheme} title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                        {dark ? <FiSun /> : <FiMoon />}
                    </button>

                    {/* User profile/avatar (👤) */}
                    {user ? (
                        <div className="nav-user">
                            <Link to="/profile" className="nav-user-profile-link">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto} alt="Profile" className="nav-user-avatar" />
                                ) : (
                                    <div className="nav-user-avatar default-avatar">
                                        <FiUser />
                                    </div>
                                )}
                            </Link>
                            
                            {/* Role Switcher (Hidden in main layout, kept for admin convenience) */}
                            {user?.role === 'admin' && (
                                <div className="role-switcher header-role-switcher">
                                    <button className={`role-switcher-btn ${viewMode === 'admin' ? 'active' : ''}`} onClick={() => switchViewMode('admin')}>Admin</button>
                                </div>
                            )}

                            <button onClick={handleLogout} className="nav-icon-btn logout-btn" title="Logout">
                                <FiLogOut />
                            </button>
                        </div>
                    ) : (
                        <div className="nav-auth-links">
                            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                        </div>
                    )}

                    <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
                        {menuOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>
        </nav >
    );
}
