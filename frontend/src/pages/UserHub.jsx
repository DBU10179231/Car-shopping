import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFav } from '../context/FavContext';
import api from '../api/axios';
import {
    FiSearch, FiTrendingUp, FiHeart, FiPackage,
    FiMessageSquare, FiCalendar, FiCreditCard,
    FiSettings, FiShield, FiStar, FiTruck,
    FiGrid, FiChevronRight, FiCheckCircle, FiPlus, FiHelpCircle, FiInfo,
    FiLogOut, FiClock, FiBox
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { sanitizeImageUrl } from '../utils/imageUtils';
import './UserHub.css';

export default function UserHub() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [orderRes] = await Promise.all([
                api.get('/orders/mine')
            ]);
            setOrders(orderRes.data);
        } catch (err) {
            console.error('Failed to fetch hub stats', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 20000);
        return () => clearInterval(interval);
    }, []);

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'delivered');
    const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getTimelineProgress = (status) => {
        const steps = ['pending', 'approved', 'paid', 'in_transit', 'delivered', 'completed'];
        const currentIdx = steps.indexOf(status);
        if (currentIdx === -1) return 0; // fallback
        if (status === 'completed' || status === 'delivered') return 4;
        if (status === 'in_transit') return 3;
        if (status === 'paid') return 2;
        if (status === 'approved') return 1;
        return 0; // pending
    };

    if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

    return (
        <div className="user-dashboard-wrapper fade-in">
            {/* LEFT SIDEBAR */}
            <aside className="user-sidebar">
                <div className="sidebar-profile-card glass-panel">
                    <img src={sanitizeImageUrl(user?.profilePhoto, 'avatar')} alt="Profile" />
                    <h2>{user?.name || 'Test User'}</h2>
                    <span className="user-role-badge">USER TERMINAL</span>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item active">
                        <FiPackage className="nav-icon" /> Portfolio Garage
                    </Link>
                    <Link to="/dashboard" className="nav-item">
                        <FiMessageSquare className="nav-icon" /> Negotiation Hub
                    </Link>
                    <Link to="/dashboard" className="nav-item">
                        <FiCalendar className="nav-icon" /> Test Drive Slots
                    </Link>
                    <Link to="/dashboard" className="nav-item">
                        <FiTruck className="nav-icon" /> Logistics Live
                    </Link>
                    <Link to="/dashboard" className="nav-item">
                        <FiCreditCard className="nav-icon" /> Funding Desk
                    </Link>
                    
                    <div className="nav-divider"></div>
                    
                    <Link to="/profile" className="nav-item">
                        <FiShield className="nav-icon" /> Identity Center
                    </Link>
                    <button className="nav-item danger" onClick={handleLogout}>
                        <FiLogOut className="nav-icon" /> Deactivate Session
                    </button>
                </nav>
            </aside>

            {/* RIGHT CONTENT AREA */}
            <main className="user-main-content">
                {/* Top Metrics */}
                <div className="metrics-grid">
                    <div className="metric-card glass-panel">
                        <div className="metric-icon-box assets"><FiBox /></div>
                        <div className="metric-info">
                            <span className="metric-label">TOTAL ASSETS</span>
                            <div className="metric-value">
                                <strong>{orders.length}</strong> <small>Vehicles</small>
                            </div>
                        </div>
                    </div>
                    <div className="metric-card glass-panel">
                        <div className="metric-icon-box delivered"><FiCheckCircle /></div>
                        <div className="metric-info">
                            <span className="metric-label">DELIVERED</span>
                            <div className="metric-value">
                                <strong>{deliveredOrders.length}</strong> <small>Ready</small>
                            </div>
                        </div>
                    </div>
                    <div className="metric-card glass-panel">
                        <div className="metric-icon-box transit"><FiClock /></div>
                        <div className="metric-info">
                            <span className="metric-label">IN TRANSIT</span>
                            <div className="metric-value">
                                <strong>{activeOrders.length}</strong> <small>Active</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Section */}
                <section className="portfolio-section glass-panel">
                    <div className="portfolio-header">
                        <h2>Vehicle Portfolio</h2>
                    </div>

                    <div className="portfolio-list">
                        {orders.length === 0 ? (
                            <div className="empty-portfolio">
                                <p>Your garage is currently empty. Visit the marketplace to start your portfolio.</p>
                                <Link to="/cars" className="btn btn-primary">Browse Vehicles</Link>
                            </div>
                        ) : (
                            orders.map(order => {
                                const progress = getTimelineProgress(order.status === 'pending' ? (order.paymentStatus === 'paid' ? 'paid' : 'pending') : order.status);
                                
                                return (
                                    <div key={order._id} className="vehicle-card glass-panel">
                                        <div className="vc-header">
                                            <div className="vc-info-group">
                                                <img 
                                                    src={sanitizeImageUrl(order.car?.images?.[0])} 
                                                    alt="Vehicle" 
                                                    className="vc-image" 
                                                    onError={(e) => e.target.src = '/assets/images/default-car.png'}
                                                />
                                                <div className="vc-details">
                                                    <h3>{order.car?.make} {order.car?.model} {order.car?.year}</h3>
                                                    <div className="vc-metadata">
                                                        <span><FiClock /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                                        <span className="meta-dot">•</span>
                                                        <span>ID: #{order._id.slice(-8).toUpperCase()}</span>
                                                        {order.tx_ref && (
                                                            <>
                                                                <span className="meta-dot">•</span>
                                                                <span className="tx-hash">TX: {order.tx_ref}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="vc-actions">
                                                <span className={`status-badge ${order.status}`}>{order.status.toUpperCase()}</span>
                                                <FiChevronRight className="vc-arrow" />
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="vc-timeline">
                                            {['Order Placed', 'Seller Approved', 'Payment Verified', 'In Transit', 'Delivered'].map((step, idx) => (
                                                <div key={idx} className={`timeline-step ${idx <= progress ? 'completed' : ''}`}>
                                                    <div className="step-icon">
                                                        <FiCheckCircle />
                                                    </div>
                                                    <span className="step-label">{step}</span>
                                                    {idx < 4 && <div className="step-line"></div>}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Status Message */}
                                        <div className="vc-status-box">
                                            <div className="status-box-icon"><FiClock /></div>
                                            <div className="status-box-content">
                                                <strong>Current Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</strong>
                                                <p>
                                                    {order.status === 'delivered' || order.status === 'completed' 
                                                        ? 'Delivery completed. Enjoy your new car!' 
                                                        : 'Processing your request and coordinating with logistics.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="vc-footer">
                                            <div className="vc-btn-group">
                                                <button className="vc-btn secondary">
                                                    <FiMessageSquare /> Message Seller & Admin
                                                </button>
                                                <button className="vc-btn secondary specs">
                                                    <FiInfo /> Technical Specs
                                                    <span className="btn-badge">1</span>
                                                </button>
                                                {/* Always show for now to ensure layout is correct */}
                                                <button className="vc-btn ghost">
                                                    <FiCheckCircle /> Official Receipt
                                                </button>
                                                <button className="vc-btn primary-glow">
                                                    Download Title
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
