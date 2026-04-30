import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFav } from '../context/FavContext';
import api from '../api/axios';
import {
    FiSearch, FiTrendingUp, FiHeart, FiPackage,
    FiMessageSquare, FiCalendar, FiCreditCard,
    FiSettings, FiShield, FiStar, FiTruck,
    FiGrid, FiChevronRight, FiCheckCircle, FiPlus
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { sanitizeImageUrl } from '../utils/imageUtils';
import './UserHub.css';

export default function UserHub() {
    const { user } = useAuth();
    const { favorites } = useFav();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/orders/mine');
                setOrders(res.data);
            } catch (err) {
                console.error('Failed to fetch hub stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

    const hubSections = [
        {
            title: "Market Access",
            items: [
                { id: 'search', title: "Discovery Desk", icon: <FiSearch />, desc: "Access the curated global automotive inventory", path: "/cars", badge: "Live" },
                { id: 'compare', title: "Intelligence Matrix", icon: <FiTrendingUp />, desc: "Side-by-side technical vehicle analysis", path: "/compare" },
                { id: 'favs', title: "Vehicle Wishlist", icon: <FiHeart />, desc: "Track your saved automotive assets", path: "/favorites", count: favorites.length },
                { id: 'review', title: "Experience Feedback", icon: <FiStar />, desc: "Provide intelligence on past acquisitions", path: "/dashboard", badge: "Feedback" }
            ]
        },
        {
            title: "Active Portfolio",
            items: [
                { id: 'orders', title: "My Garage", icon: <FiPackage />, desc: "Manage acquisitions and current order status", path: "/dashboard", count: orders.length },
                { id: 'payments', title: "Financial Records", icon: <FiCreditCard />, desc: "Invoices and transaction synchronization", path: "/dashboard" },
                { id: 'logistics', title: "Logistics Tracking", icon: <FiTruck />, desc: "Global fulfillment and transit monitoring", path: "/dashboard", badge: activeOrders.length > 0 ? "In Transit" : null }
            ]
        },
        {
            title: "Concierge & Support",
            items: [
                { id: 'negotiations', title: "Negotiation Hub", icon: <FiMessageSquare />, desc: "Direct secure line to authorized dealers", path: "/dashboard" },
                { id: 'testdrives', title: "Experience Slots", icon: <FiCalendar />, desc: "Manage scheduled drive appointments", path: "/dashboard" },
                { id: 'finance', title: "Funding Desk", icon: <FiGrid />, desc: "Acquire or verify acquisition financing", path: "/dashboard" }
            ]
        },
        {
            title: "Identity & Security",
            items: [
                { id: 'account', title: "Concierge Profile", icon: <FiSettings />, desc: "Manage your physical address and bio", path: "/profile" },
                { id: 'security', title: "Security Hub", icon: <FiShield />, desc: "Manage secure keys, sessions, and 2FA", path: "/profile" }
            ]
        }
    ];

    if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

    return (
        <div className="premium-hub-page fade-in">
            <div className="hub-gradient-bg" />
            <div className="container">
                {/* Header Section */}
                <header className="hub-header">
                    <div className="header-greeting">
                        <span className="welcome-tag">Mission Control Center</span>
                        <h1>Executive Console, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>.</h1>
                        <p>Orchestrate your automotive portfolio and monitor live market acquisitions from your unified terminal.</p>
                    </div>
                    <div className="header-profile" onClick={() => navigate('/profile')}>
                        <img src={sanitizeImageUrl(user?.profilePhoto, 'avatar')} alt="Profile" />
                        <div className="profile-info">
                            <strong>{user?.name}</strong>
                            <span>{user?.role?.toUpperCase()} ACCESS</span>
                        </div>
                    </div>
                </header>

                {/* KPI Overview */}
                <div className="hub-kpi-grid">
                    <div className="kpi-card glass-panel">
                        <div className="kpi-icon"><FiPackage /></div>
                        <div className="kpi-data">
                            <span className="label">ACTIVE PORTFOLIO</span>
                            <strong>{orders.length} <small>Assets</small></strong>
                        </div>
                    </div>
                    <div className="kpi-card glass-panel">
                        <div className="kpi-icon heart"><FiHeart /></div>
                        <div className="kpi-data">
                            <span className="label">SAVED ASSETS</span>
                            <strong>{favorites.length} <small>Watchlist</small></strong>
                        </div>
                    </div>
                    <div className="kpi-card glass-panel">
                        <div className="kpi-icon alert"><FiCheckCircle /></div>
                        <div className="kpi-data">
                            <span className="label">LIVE UPDATES</span>
                            <strong>{activeOrders.length} <small>Sprints</small></strong>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Grid */}
                <div className="hub-sections">
                    {hubSections.map((section, idx) => (
                        <div key={idx} className="hub-section">
                            <h3 className="section-title">{section.title}</h3>
                            <div className="hub-grid">
                                {section.items.map((item) => (
                                    <Link key={item.id} to={item.path} className="hub-card glass-panel">
                                        <div className="card-top">
                                            <div className={`card-icon ${item.id}`}>{item.icon}</div>
                                            {item.badge && <span className="card-badge">{item.badge}</span>}
                                            {item.count !== undefined && <span className="card-count">{item.count}</span>}
                                        </div>
                                        <div className="card-content">
                                            <h4>{item.title}</h4>
                                            <p>{item.desc}</p>
                                        </div>
                                        <div className="card-footer">
                                            <span>Initialize Module</span>
                                            <FiChevronRight />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions / New Request */}
                <div className="hub-cta glass-panel">
                    <div className="cta-info">
                        <h3>Expand your portfolio?</h3>
                        <p>Our intelligence network is ready to source your next high-performance asset.</p>
                    </div>
                    <Link to="/cars" className="btn btn-primary btn-lg">
                        <FiPlus /> Initialize Global Search
                    </Link>
                </div>
            </div>
        </div>
    );
}
