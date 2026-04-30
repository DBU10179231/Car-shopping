import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSend, FiDollarSign, FiCheck, FiX, FiInfo, FiArrowLeft } from 'react-icons/fi';
import CheckoutButton from './CheckoutButton';
import './NegotiationChat.css';

export default function NegotiationChat({ orderId, carInfo, isSeller, isAdmin, onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const handleClose = () => {
        if (onClose) onClose();
        else navigate(-1);
    };

    const userRoleLabel = isAdmin ? 'Admin' : (isSeller ? 'Seller' : 'Buyer');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [proposedPrice, setProposedPrice] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const chatRef = useRef(null);

    const pollInterval = useRef(null);
    const [errorCount, setErrorCount] = useState(0);

    const fetchOrderAndMessages = async () => {
        if (!user || !user.token) {
            setLoading(false);
            if (pollInterval.current) clearInterval(pollInterval.current);
            return;
        }
        try {
            const [orderRes, msgRes] = await Promise.all([
                api.get(`/orders/${orderId}`),
                api.get(`/orders/${orderId}/messages`)
            ]);
            setOrder(orderRes.data);
            setMessages(msgRes.data);
            // Sync proposed price from order data
            setProposedPrice(orderRes.data.negotiatedPrice || orderRes.data.car.price);
            setErrorCount(0); // Reset on success
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                console.error('Stop polling: Unauthorized');
                if (pollInterval.current) clearInterval(pollInterval.current);
            }
            setErrorCount(prev => prev + 1);
            if (errorCount > 3) {
                if (pollInterval.current) clearInterval(pollInterval.current);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.token && orderId) {
            fetchOrderAndMessages();
            pollInterval.current = setInterval(fetchOrderAndMessages, 5000); // Poll every 5s
        }
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [orderId, user]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            const res = await api.post(`/orders/${orderId}/messages`, { content: newMessage });
            setMessages([...messages, { ...res.data, sender: user }]);
            setNewMessage('');
        } catch (err) {
            toast.error('Failed to send message');
        }
    };

    const handleProposePrice = async () => {
        if (!proposedPrice) return;
        try {
            const res = await api.put(`/orders/${orderId}/propose`, {
                price: Number(proposedPrice),
                message: `${userRoleLabel} proposed a new price: $${Number(proposedPrice).toLocaleString()}`
            });
            setOrder(res.data);
            toast.success('Price proposed');
            fetchOrderAndMessages();
        } catch (err) {
            toast.error('Failed to propose price');
        }
    };

    const handleAcceptPrice = async () => {
        if (!window.confirm('Accept this price and finalize the deal?')) return;
        try {
            const res = await api.put(`/orders/${orderId}/accept`);
            setOrder(res.data);
            toast.success('Price accepted!');
            fetchOrderAndMessages();
        } catch (err) {
            toast.error('Failed to accept price');
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

    return (
        <div className="negotiation-chat card">
            <div className="chat-header">
                <div className="car-brief">
                    <img src={order.car.images[0]} alt="" />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{order.car.make} {order.car.model}</h4>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Secure Link: Seller & Platform Support</p>
                    </div>
                </div>
                <div className="negotiation-status" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge badge-${order.negotiationStatus}`}>
                        {order.negotiationStatus.toUpperCase()}
                    </span>
                    <button
                        onClick={handleClose}
                        title="Exit & Close Chat"
                        style={{
                            background: 'rgba(230,57,70,0.12)',
                            border: '1px solid rgba(230,57,70,0.3)',
                            color: '#e63946',
                            borderRadius: '50%',
                            width: 34,
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(230,57,70,0.12)'}
                    >
                        <FiX />
                    </button>
                </div>
            </div>

            <div className="negotiation-panel">
                <div className="price-input">
                    <label>Negotiated Price</label>
                    <div className="input-with-icon">
                        <FiDollarSign />
                        <input
                            type="number"
                            disabled={order.negotiationStatus === 'accepted'}
                            value={proposedPrice}
                            onChange={(e) => setProposedPrice(e.target.value)}
                        />
                    </div>
                </div>
                <div className="panel-actions">
                    {order.negotiationStatus !== 'accepted' && (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={handleProposePrice}>Propose</button>
                            <button className="btn btn-primary btn-sm" onClick={handleAcceptPrice}>Accept</button>
                        </>
                    )}
                    {order.negotiationStatus === 'accepted' && (
                        <div className="accepted-info-container" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                            <div className="accepted-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span><FiCheck /> Final Price: ${order.totalPrice?.toLocaleString()}</span>
                                <span className={`badge badge-${order.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                                    {order.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT PENDING'}
                                </span>
                            </div>

                            {!isSeller && !isAdmin && order.paymentStatus !== 'paid' && (
                                <CheckoutButton
                                    car={order.car}
                                    orderId={order._id}
                                    totalPrice={order.totalPrice}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-messages" ref={chatRef}>
                {messages.map((msg, i) => {
                    const isOwn = msg.sender._id === user._id;
                    const isSystem = msg.content.includes('proposed a new price') || msg.content.includes('accepted');
                    
                    return (
                        <div key={i} className={`message ${isOwn ? 'own' : 'other'} ${isSystem ? 'system-msg' : ''}`}>
                            <div className="msg-content">
                                {!isOwn && !isSystem && <span className="sender-name">{msg.sender.name}</span>}
                                <p>{msg.content}</p>
                            </div>
                            {!isSystem && (
                                <div className="msg-footer">
                                    <span className="msg-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isOwn && <FiCheck style={{ fontSize: '0.7rem', opacity: 0.6 }} />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <form className="chat-input" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}><FiSend /></button>
            </form>
        </div>
    );
}
