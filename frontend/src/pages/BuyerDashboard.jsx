import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFav } from '../context/FavContext';
import api from '../api/axios';
import {
    FiUser, FiHeart, FiPackage, FiCamera, FiSearch, FiMessageCircle,
    FiCalendar, FiFileText, FiStar, FiClock, FiTruck, FiMapPin,
    FiRefreshCw, FiCheckCircle, FiShield, FiMessageSquare, FiSettings, FiLogOut, FiGrid,
    FiActivity, FiChevronRight, FiCreditCard, FiDownload, FiInfo, FiCheck, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import NegotiationChat from '../components/NegotiationChat';
import OrderTimeline from '../components/OrderTimeline';
import { sanitizeImageUrl } from '../utils/imageUtils';
import './BuyerDashboard.css';

export default function BuyerDashboard() {
    const { user, logout } = useAuth();
    const { favorites } = useFav();
    const [orders, setOrders] = useState([]);
    const [financeApps, setFinanceApps] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [receiptLoading, setReceiptLoading] = useState(null);
    const [activeOrderTab, setActiveOrderTab] = useState('messages');
    const navigate = useNavigate();

    const handleToggleExpand = (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
            setActiveOrderTab('messages');
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, financeRes, logisticsRes] = await Promise.all([
                api.get('/orders/mine'),
                api.get('/finance/my-applications'),
                api.get('/logistics/my-logistics')
            ]);
            setOrders(ordersRes.data);
            setFinanceApps(financeRes.data);
            setLogistics(logisticsRes.data);
            setLoading(false);

            if (ordersRes.data.length > 0 && !expandedOrder) {
                setExpandedOrder(ordersRes.data[0]._id);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleViewReceipt = async (e, order) => {
        e.stopPropagation();
        const ref = order.transactionId || order.tx_ref;
        if (!ref) {
            toast.error('Transaction reference missing.');
            return;
        }
        setReceiptLoading(order._id);
        try {
            const { data } = await api.get(`/payments/receipt/${ref}`);
            if (data.receiptUrl) {
                window.open(data.receiptUrl, '_blank');
            } else {
                toast.error('Receipt URL not available yet.');
            }
        } catch (err) {
            console.error('Receipt Error:', err);
            toast.error('Failed to fetch official receipt.');
        } finally {
            setReceiptLoading(null);
        }
    };

    const handleSyncFinance = async (appId) => {
        setSyncing(appId);
        try {
            await api.post(`/finance/${appId}/sync`);
            toast.success('Syncing with partner API...');
            setTimeout(fetchData, 1500);
        } catch (err) {
            toast.error('Sync failed');
        } finally {
            setSyncing(null);
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

    const testDrives = orders.filter(o => o.orderType === 'test_drive');
    const purchases = orders.filter(o => o.orderType !== 'test_drive');

    return (
        <div className="premium-buyer-dashboard fade-in">
            <div className="container">
                <div className="dashboard-grid">
                    {/* Sticky Sidebar */}
                    <aside className="sidebar-sticky">
                        <div className="glass-panel">
                            <div className="sidebar-identity">
                                <div className="avatar-uploader">
                                    <img src={sanitizeImageUrl(user?.profilePhoto, 'avatar')} alt="Profile" />
                                </div>
                                <h3>{user?.name}</h3>
                                <span>{user?.role?.toUpperCase()} TERMINAL</span>
                            </div>

                            <nav className="dashboard-nav">
                                <button className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                                    <FiPackage /> Portfolio Garage
                                </button>
                                <button className={`nav-link ${activeTab === 'negotiations' ? 'active' : ''}`} onClick={() => setActiveTab('negotiations')}>
                                    <FiMessageSquare /> Negotiation Hub
                                </button>
                                <button className={`nav-link ${activeTab === 'testdrives' ? 'active' : ''}`} onClick={() => setActiveTab('testdrives')}>
                                    <FiCalendar /> Test Drive Slots
                                </button>
                                <button className={`nav-link ${activeTab === 'financing' ? 'active' : ''}`} onClick={() => setActiveTab('financing')}>
                                    <FiCreditCard /> Funding Desk
                                </button>
                                <button className={`nav-link ${activeTab === 'logistics' ? 'active' : ''}`} onClick={() => setActiveTab('logistics')}>
                                    <FiTruck /> Logistics Live
                                </button>

                                <div className="nav-divider" />

                                <Link to="/profile" className="nav-link">
                                    <FiUser /> Identity Center
                                </Link>
                                <button onClick={() => { logout(); navigate('/'); }} className="nav-link logout-btn">
                                    <FiLogOut /> Deactivate Session
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="dashboard-main-content">
                        {activeTab === 'orders' && (
                            <div className="tab-fade-in">
                                <div className="kpi-row">
                                    <div className="kpi-card glass-panel">
                                        <div className="kpi-icon"><FiPackage /></div>
                                        <div className="kpi-info">
                                            <h4>Total Assets</h4>
                                            <div className="kpi-val">{purchases.length} <small>Vehicles</small></div>
                                        </div>
                                    </div>
                                    <div className="kpi-card glass-panel">
                                        <div className="kpi-icon status-green"><FiCheckCircle /></div>
                                        <div className="kpi-info">
                                            <h4>Delivered</h4>
                                            <div className="kpi-val">{purchases.filter(o => o.status === 'completed').length} <small>Ready</small></div>
                                        </div>
                                    </div>
                                    <div className="kpi-card glass-panel">
                                        <div className="kpi-icon status-gold"><FiClock /></div>
                                        <div className="kpi-info">
                                            <h4>In Transit</h4>
                                            <div className="kpi-val">{purchases.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} <small>Active</small></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="order-list-panel glass-panel">
                                    <header style={{ padding: '30px 40px', borderBottom: '1px solid var(--border)' }}>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 900 }}>Vehicle Portfolio</h2>
                                    </header>

                                    {purchases.length > 0 ? (
                                        <div className="order-items">
                                            {purchases.map(order => (
                                                <div key={order._id} className="order-item-complex">
                                                    <div className={`order-summary ${expandedOrder === order._id ? 'expanded' : ''}`} onClick={() => handleToggleExpand(order._id)}>
                                                        <div className="car-preview">
                                                            <img src={sanitizeImageUrl(order?.car?.images?.[0], 'car')} alt="" />
                                                            <span className="overlay-badge">{order.orderType?.toUpperCase()}</span>
                                                        </div>
                                                        <div className="order-main-info">
                                                            <h3>{order?.car?.make} {order?.car?.model} <span className="year-pill">{order?.car?.year}</span></h3>
                                                            <div className="meta-info">
                                                                <FiClock /> <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                                <span className="dot" />
                                                                <span>ID: #{order._id.slice(-8).toUpperCase()}</span>
                                                                {order.tx_ref && (
                                                                    <>
                                                                        <span className="dot" />
                                                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>TX: {order.tx_ref}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="order-financials">
                                                            <div className="price-tag">${order.totalAmount?.toLocaleString()}</div>
                                                            <span className={`status-pill ${order.status}`}>{order.status}</span>
                                                        </div>
                                                        <FiChevronRight className={`arrow-icon ${expandedOrder === order._id ? 'rotated' : ''}`} style={{ marginLeft: 20 }} />
                                                    </div>

                                                    {expandedOrder === order._id && (
                                                        <div className="order-details-expanded">
                                                            {/* 1. Car Summary Card (Header) */}
                                                            <div className="asset-summary-card">
                                                                <div className="asset-main">
                                                                    <div className="asset-image">
                                                                        <img src={sanitizeImageUrl(order?.car?.images?.[0], 'car')} alt="" />
                                                                    </div>
                                                                    <div className="asset-details">
                                                                        <h4>{order?.car?.make} {order?.car?.model} <span className="year">{order?.car?.year}</span></h4>
                                                                        <div className="transaction-id">ID: #{order._id.toUpperCase()}</div>
                                                                        {order.tx_ref && <div className="tx-hash">TX Hash: {order.tx_ref}</div>}
                                                                        <div className="order-date">Initiated: {new Date(order.createdAt).toLocaleDateString()}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="asset-status-card">
                                                                    <div className="value-label">Asset Valuation</div>
                                                                    <div className="value-amount">${order.totalAmount?.toLocaleString()}</div>
                                                                    <div className={`status-badge-premium ${order.status}`}>{order.status.toUpperCase()}</div>
                                                                </div>
                                                            </div>

                                                            {/* 2 & 3. Progress Tracker & Status Box */}
                                                            <div className="tracker-section">
                                                                <OrderTimeline order={order} />
                                                            </div>

                                                            {/* 4. Tabs (Collaboration Layer) */}
                                                            <div className="collaboration-layer">
                                                                <div className="detail-tabs">
                                                                    <button
                                                                        className={`tab-btn ${activeOrderTab === 'messages' ? 'active' : ''}`}
                                                                        onClick={() => setActiveOrderTab('messages')}
                                                                    >
                                                                        <FiMessageCircle /> Message Seller & Admin
                                                                        {order.unreadMessages > 0 && <span className="unread-dot-tab">{order.unreadMessages}</span>}
                                                                    </button>
                                                                    <button
                                                                        className={`tab-btn ${activeOrderTab === 'specs' ? 'active' : ''}`}
                                                                        onClick={() => setActiveOrderTab('specs')}
                                                                    >
                                                                        <FiInfo /> Technical Specs
                                                                    </button>
                                                                </div>

                                                                <div className="tab-viewport glass-panel" style={{ position: 'relative', display: activeOrderTab ? 'block' : 'none' }}>
                                                                    {activeOrderTab === 'messages' ? (
                                                                        <div className="embedded-chat">
                                                                            <button className="close-expanded-btn" onClick={(e) => { e.stopPropagation(); setActiveOrderTab(null); }} title="Close Chat">
                                                                                <FiX />
                                                                            </button>
                                                                            <NegotiationChat orderId={order._id} isSeller={false} />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="specs-display-grid">
                                                                            <button className="close-expanded-btn" onClick={(e) => { e.stopPropagation(); setActiveOrderTab(null); }} title="Close Specs">
                                                                                <FiX />
                                                                            </button>
                                                                            <div className="spec-card">
                                                                                <span className="label">Engine / Power</span>
                                                                                <span className="value">{order.car?.engine || 'V6 Twin Turbo'}</span>
                                                                            </div>
                                                                            <div className="spec-card">
                                                                                <span className="label">Transmission</span>
                                                                                <span className="value">{order.car?.transmission || 'Automatic'}</span>
                                                                            </div>
                                                                            <div className="spec-card">
                                                                                <span className="label">Drivetrain</span>
                                                                                <span className="value">{order.car?.drivetrain || 'AWD'}</span>
                                                                            </div>
                                                                            <div className="spec-card">
                                                                                <span className="label">Mileage</span>
                                                                                <span className="value">{order.car?.mileage?.toLocaleString() || '12,400'} KM</span>
                                                                            </div>
                                                                            <div className="spec-card">
                                                                                <span className="label">Fuel Type</span>
                                                                                <span className="value">{order.car?.fuelType || 'Premium'}</span>
                                                                            </div>
                                                                            <div className="spec-card">
                                                                                <span className="label">Condition</span>
                                                                                <span className="value">{order.car?.condition || 'Excellent'}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 5. Action Buttons (Execution Layer) */}
                                                            <div className="execution-layer">
                                                                <div className="action-row">
                                                                    {order.paymentStatus === 'paid' && order.tx_ref && (
                                                                        <button
                                                                            className="btn btn-outline"
                                                                            onClick={(e) => handleViewReceipt(e, order)}
                                                                            disabled={receiptLoading === order._id}
                                                                        >
                                                                            {receiptLoading === order._id ? (
                                                                                <span className="loader-sm" />
                                                                            ) : (
                                                                                <FiFileText />
                                                                            )}
                                                                            Official Receipt
                                                                        </button>
                                                                    )}
                                                                    {(order.status === 'completed' || order.status === 'delivered') && (
                                                                        <button className="btn btn-primary">
                                                                            <FiDownload /> Download Title
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state-dashboard">
                                            <FiPackage size={60} />
                                            <h3>Garage is Empty</h3>
                                            <p>Your automotive journey begins at the Discovery Desk.</p>
                                            <Link to="/cars" className="btn btn-primary" style={{ marginTop: 25 }}>Initialize Global Search</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'negotiations' && (
                            <div className="tab-fade-in glass-panel" style={{ height: '750px', display: 'grid', gridTemplateColumns: '320px 1fr', padding: 0, overflow: 'hidden' }}>
                                {/* Conversations Sidebar */}
                                <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Signal Dispatch</h4>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto' }}>
                                        {orders.filter(o => o.negotiationStatus).length === 0 ? (
                                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                                <FiMessageSquare size={30} style={{ opacity: 0.2, marginBottom: 15 }} />
                                                <p style={{ fontSize: '0.85rem' }}>No active signals.</p>
                                            </div>
                                        ) : (
                                            orders.filter(o => o.negotiationStatus).map(order => (
                                                <div
                                                    key={order._id}
                                                    onClick={() => setSelectedOrder(order._id)}
                                                    style={{
                                                        padding: '15px 20px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid var(--border)',
                                                        background: selectedOrder === order._id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                                        transition: '0.2s',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                        <strong style={{ fontSize: '0.9rem' }}>{order.car?.make} {order.car?.model}</strong>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Status: {order.negotiationStatus}</span>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>${(order.negotiatedPrice || order.car?.price).toLocaleString()}</span>
                                                    </div>
                                                    {selectedOrder === order._id && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--primary)' }}></div>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Chat Area */}
                                <div style={{ background: 'rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative' }}>
                                    {selectedOrder && (
                                        <button className="close-expanded-btn" style={{ width: 36, height: 36, fontSize: '1rem' }} onClick={() => setSelectedOrder(null)}>
                                            <FiX />
                                        </button>
                                    )}
                                    {selectedOrder ? (
                                        <NegotiationChat
                                            orderId={selectedOrder}
                                            isSeller={false}
                                            onClose={() => setSelectedOrder(null)}
                                        />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                            <FiMessageCircle size={50} style={{ marginBottom: 20 }} />
                                            <h3>Select a Transmission</h3>
                                            <p style={{ fontSize: '0.9rem' }}>Choose an order to begin secure communication.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'testdrives' && (
                            <div className="tab-fade-in">
                                <div className="card glass-panel">
                                    <header style={{ padding: '30px 40px', borderBottom: '1px solid var(--border)' }}>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 900 }}>Experience Slots</h2>
                                    </header>

                                    {testDrives.length > 0 ? (
                                        <div className="order-items">
                                            {testDrives.map(order => (
                                                <div key={order._id} className="order-item-complex">
                                                    <div className="order-summary">
                                                        <div className="car-preview">
                                                            <img src={sanitizeImageUrl(order?.car?.images?.[0], 'car')} alt="" />
                                                            <span className="overlay-badge">DRIVE</span>
                                                        </div>
                                                        <div className="order-main-info">
                                                            <h3>{order?.car?.make} {order?.car?.model}</h3>
                                                            <div className="meta-info">
                                                                <FiCalendar /> <span>Scheduled: {new Date(order.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="order-financials">
                                                            <span className={`status-pill ${order.status}`}>{order.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state-dashboard">
                                            <FiCalendar size={60} />
                                            <h3>No Test Drive Slots</h3>
                                            <p>Experience precision hardware firsthand by booking an appointment.</p>
                                            <Link to="/cars" className="btn btn-primary" style={{ marginTop: 25 }}>Book Experiences</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'financing' && (
                            <div className="tab-fade-in">
                                <div className="card glass-panel" style={{ minHeight: 600 }}>
                                    <header style={{ padding: '30px 40px', borderBottom: '1px solid var(--border)' }}>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 900 }}>Funding Portfolio</h2>
                                    </header>

                                    <div style={{ padding: '0 40px 40px' }}>
                                        {financeApps.length > 0 ? (
                                            <div className="finance-list" style={{ marginTop: 30 }}>
                                                {financeApps.map(app => (
                                                    <div key={app._id} className="card glass-panel" style={{ padding: 25, marginBottom: 20, border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ display: 'flex', gap: 20 }}>
                                                                <img src={sanitizeImageUrl(app.car?.images?.[0], 'car')} alt="" style={{ width: 110, height: 80, borderRadius: 16, objectFit: 'cover' }} />
                                                                <div>
                                                                    <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>{app.car?.make} {app.car?.model}</h4>
                                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>Funding Partner: <strong>{app.provider}</strong></p>
                                                                    <span className={`status-pill ${app.status === 'approved' ? 'completed' : 'pending'}`}>{app.status.replace('_', ' ')}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>${app.car?.price?.toLocaleString()}</div>
                                                                <button
                                                                    className="btn btn-sm btn-secondary"
                                                                    style={{ marginTop: 15 }}
                                                                    disabled={syncing === app._id}
                                                                    onClick={() => handleSyncFinance(app._id)}
                                                                >
                                                                    {syncing === app._id ? <FiRefreshCw className="spin" /> : <FiRefreshCw />} Sync Intel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state-dashboard">
                                                <FiCreditCard size={60} />
                                                <h3>No Funding Applications</h3>
                                                <p>Acquire your next asset with our verified financing units.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logistics' && (
                            <div className="tab-fade-in">
                                <div className="card glass-panel" style={{ minHeight: 600 }}>
                                    <header style={{ padding: '30px 40px', borderBottom: '1px solid var(--border)' }}>
                                        <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 900 }}>Logistics Tracking</h2>
                                    </header>

                                    <div style={{ padding: '0 40px 40px' }}>
                                        {logistics.length > 0 ? (
                                            <div className="logistics-list" style={{ marginTop: 30 }}>
                                                {logistics.map(item => (
                                                    <div key={item._id} className="card glass-panel" style={{ padding: 25, marginBottom: 20, border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', gap: 20 }}>
                                                            <div className="kpi-icon"><FiTruck /></div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Batch #{item._id.slice(-6).toUpperCase()}</h4>
                                                                    <span className="status-pill completed">{item.status}</span>
                                                                </div>
                                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>Vehicle: <strong>{item.order?.car?.make} {item.order?.car?.model}</strong></p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', fontWeight: 600 }}>
                                                                    <FiActivity className="icon-pulse" /> <span>Live Status: {item.currentLocation || 'In Transit'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state-dashboard">
                                                <FiTruck size={60} />
                                                <h3>No Active Deliveries</h3>
                                                <p>Your vehicle moves with precision. Track mission-critical fulfillment here.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div >
        </div >
    );
}
