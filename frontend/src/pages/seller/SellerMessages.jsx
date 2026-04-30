import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
    FiMessageSquare, FiUser, FiClock, FiDollarSign,
    FiChevronRight, FiMaximize2, FiCpu
} from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NegotiationChat from '../../components/NegotiationChat';
import { sanitizeImageUrl } from '../../utils/imageUtils';

export default function SellerMessages() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Auto-select order if query params exist
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const chatId = params.get('chat');
        if (chatId && orders.length > 0) {
            const order = orders.find(o => o.user._id === chatId);
            if (order) setSelectedOrder(order._id);
        }
    }, [location.search, orders]);

    const fetchSellerOrders = async () => {
        try {
            const res = await api.get('/orders/seller');
            setOrders(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to sync communications');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellerOrders();
        const interval = setInterval(fetchSellerOrders, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="spinner" style={{ margin: '60px auto' }} />;

    return (
        <div className="fade-in dispatch-suite" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
            {/* Communication Header */}
            <div className="suite-header card glass-panel" style={{ padding: '20px 40px', marginBottom: 25, border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, mb: 0 }}>Buyer <span className="gradient-text">Communication</span></h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Answer questions and provide car details (Point 7).</p>
                    </div>
                    <div className="dispatch-metrics">
                        <div className="d-metric">
                            <span className="label">Active Chats</span>
                            <span className="value">{orders.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dispatch-layout card glass-panel" style={{ flex: 1, display: 'grid', gridTemplateColumns: '360px 1fr', padding: 0, overflow: 'hidden' }}>
                {/* Conversations Sidebar */}
                <div className="channels-sidebar" style={{ borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>
                    <div className="sidebar-header" style={{ padding: '20px 25px', borderBottom: '1px solid var(--glass-border)' }}>
                        <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800 }}>Client Inquiries</h4>
                    </div>
                    <div className="channels-list" style={{ flex: 1, overflowY: 'auto' }}>
                        {orders.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <FiMessageSquare size={30} style={{ opacity: 0.2, marginBottom: 15 }} />
                                <p style={{ fontSize: '0.85rem' }}>No active inquiries.</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div
                                    key={order._id}
                                    onClick={() => setSelectedOrder(order._id)}
                                    className={`channel-card ${selectedOrder === order._id ? 'active' : ''}`}
                                >
                                    <div className="channel-top">
                                        <div className="client-meta">
                                            <div className="avatar-mini">{order.user.name.charAt(0)}</div>
                                            <strong>{order.user.name}</strong>
                                        </div>
                                        <span className="timestamp"><FiClock size={10} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="car-tag">
                                        {order.car.make} {order.car.model}
                                    </div>
                                    <div className="channel-bottom">
                                        <span className={`negotiation-status ${order.negotiationStatus || 'none'}`}>
                                            {order.negotiationStatus || 'New Inquiry'}
                                        </span>
                                        <span className="price-label">
                                            ${(order.negotiatedPrice || order.car.price).toLocaleString()}
                                        </span>
                                    </div>
                                    {selectedOrder === order._id && <div className="active-indicator"></div>}
                                    {order.unreadMessages > 0 && (
                                        <span className="unread-badge" style={{ top: 10, right: 10 }}>
                                            {order.unreadMessages}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="comms-area" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                    {selectedOrder ? (
                        <>
                            {/* Vehicle Context Header (Point 7) */}
                            {orders.find(o => o._id === selectedOrder) && (
                                <div className="vehicle-context-header" style={{ padding: '15px 25px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <img
                                        src={sanitizeImageUrl(orders.find(o => o._id === selectedOrder).car.images?.[0], 'car')}
                                        alt=""
                                        style={{ width: 60, height: 40, borderRadius: 8, objectFit: 'cover' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{orders.find(o => o._id === selectedOrder).car.make} {orders.find(o => o._id === selectedOrder).car.model}</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Price: <strong>${orders.find(o => o._id === selectedOrder).car.price.toLocaleString()}</strong> •
                                            Intent: {orders.find(o => o._id === selectedOrder).type === 'test_drive' ? 'Test Drive' : 'Purchase'}
                                        </p>
                                    </div>
                                    <div className="status-badge" style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'var(--primary)', fontWeight: 800 }}>
                                        INQUIRY ACTIVE
                                    </div>
                                </div>
                            )}
                            <NegotiationChat
                                orderId={selectedOrder}
                                isSeller={true}
                                onClose={() => setSelectedOrder(null)}
                            />
                        </>
                    ) : (
                        <div className="empty-chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', marginTop: '15vh' }}>
                            <div className="empty-icon-ring">
                                <FiMessageSquare size={40} />
                            </div>
                            <h3>Buyer Communication</h3>
                            <p style={{ color: 'var(--text-muted)', maxWidth: 300, textAlign: 'center', fontSize: '0.9rem' }}>
                                Select a buyer inquiry from the left panel to begin answering questions.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .dispatch-suite { color: var(--text); }
                .glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border) !important;
                }
                
                .dispatch-metrics { display: flex; gap: 30px; }
                .d-metric { display: flex; flex-direction: column; align-items: flex-end; }
                .d-metric .label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
                .d-metric .value { font-size: 1.4rem; font-weight: 900; color: var(--primary); line-height: 1; }
                
                .channel-card {
                    padding: 20px 25px; cursor: pointer; border-bottom: 1px solid var(--glass-border);
                    position: relative; transition: all 0.2s; border-left: 0px solid var(--primary);
                }
                .channel-card:hover { background: rgba(255,255,255,0.03); }
                .channel-card.active { background: rgba(255,255,255,0.05); }
                .channel-card.active .active-indicator {
                    position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--primary);
                    box-shadow: 2px 0 10px rgba(230, 57, 70, 0.4);
                }
                
                .channel-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .client-meta { display: flex; align-items: center; gap: 10px; }
                .avatar-mini { width: 24px; height: 24px; border-radius: 6px; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; }
                .client-meta strong { font-size: 0.95rem; font-weight: 800; }
                .timestamp { font-size: 0.65rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
                
                .car-tag { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; }
                
                .channel-bottom { display: flex; justify-content: space-between; align-items: center; }
                .negotiation-status { 
                    font-size: 0.6rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;
                    padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05);
                }
                .negotiation-status.pending { color: #ff9f1c; }
                .negotiation-status.accepted { color: #2a9d8f; }
                .price-label { font-size: 0.9rem; font-weight: 900; color: var(--text); }
                
                .empty-icon-ring {
                    width: 100px; height: 100px; border-radius: 50%; border: 1px dashed var(--glass-border);
                    display: flex; align-items: center; justify-content: center; color: var(--primary);
                    margin-bottom: 25px; animation: rotate 20s linear infinite;
                }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .empty-chat h3 { font-size: 1.5rem; font-weight: 900; margin-bottom: 10px; }
            `}</style>
        </div>
    );
}
