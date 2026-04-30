import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FiPackage, FiCheckCircle, FiTruck, FiHome, FiDollarSign, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { sanitizeImageUrl } from '../utils/imageUtils';

// Order progress steps definition
const ORDER_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: <FiPackage />, statuses: ['pending'] },
    { key: 'approved', label: 'Seller Approved', icon: <FiCheckCircle />, statuses: ['approved'] },
    { key: 'paid', label: 'Payment Verified', icon: <FiDollarSign />, statuses: [] }, // virtual: paymentStatus = 'paid'
    { key: 'in_transit', label: 'In Transit', icon: <FiTruck />, statuses: ['in_transit', 'shipped'] },
    { key: 'delivered', label: 'Delivered', icon: <FiHome />, statuses: ['delivered', 'completed'] },
];

function getActiveStep(order) {
    if (order.status === 'delivered' || order.status === 'completed') return 4;
    if (order.status === 'in_transit' || order.status === 'shipped') return 3;
    if (order.paymentStatus === 'paid') return 2;
    if (order.status === 'approved') return 1;
    return 0;
}

function OrderProgressTimeline({ order }) {
    const activeStep = getActiveStep(order);
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginTop: 20,
            padding: '16px 0 8px',
            overflowX: 'auto'
        }}>
            {ORDER_STEPS.map((step, idx) => {
                const isCompleted = idx < activeStep;
                const isActive = idx === activeStep;
                const isUpcoming = idx > activeStep;
                return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: idx < ORDER_STEPS.length - 1 ? 1 : 'none' }}>
                        {/* Step Node */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 72 }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                border: isCompleted ? 'none' : isActive ? '2px solid #457b9d' : '2px solid rgba(255,255,255,0.15)',
                                background: isCompleted ? '#457b9d' : isActive ? 'rgba(69,123,157,0.18)' : 'rgba(255,255,255,0.05)',
                                color: isCompleted ? '#fff' : isActive ? '#457b9d' : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.3s',
                                boxShadow: isActive ? '0 0 0 4px rgba(69,123,157,0.15)' : 'none'
                            }}>
                                {step.icon}
                            </div>
                            <span style={{
                                marginTop: 8,
                                fontSize: '0.68rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isCompleted ? '#457b9d' : isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                textAlign: 'center',
                                lineHeight: 1.2,
                                maxWidth: 72
                            }}>{step.label}</span>
                        </div>
                        {/* Connector line */}
                        {idx < ORDER_STEPS.length - 1 && (
                            <div style={{
                                flex: 1,
                                height: 2,
                                background: idx < activeStep
                                    ? 'linear-gradient(90deg,#457b9d,#2a9d8f)'
                                    : 'rgba(255,255,255,0.08)',
                                marginBottom: 22,
                                minWidth: 24,
                                borderRadius: 2,
                                transition: 'background 0.4s'
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const STATUS_MAP = {
    pending: { label: 'Booking Received', color: '#f4a261' },
    approved: { label: 'Seller Approved', color: '#2a9d8f' },
    rejected: { label: 'Rejected', color: '#e63946' },
    completed: { label: 'Completed', color: '#2a9d8f' },
    cancelled: { label: 'Cancelled', color: '#e63946' },
    in_transit: { label: 'In Transit 🚚', color: '#457b9d' },
    shipped: { label: 'Shipped 📦', color: '#457b9d' },
    delivered: { label: 'Delivered ✅', color: '#2a9d8f' },
};

export default function Orders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders/mine').then(r => { setOrders(r.data); setLoading(false); });
    }, []);

    if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;

    return (
        <div style={{ padding: '48px 0 80px' }}>
            <div className="container">
                <h1 className="page-title">My Orders</h1>
                <p className="page-subtitle">Track your car purchase from booking to delivery</p>

                {orders.length === 0 ? (
                    <div className="empty-state">
                        <FiPackage size={56} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
                        <h3>No orders yet</h3>
                        <p>Browse cars and submit an inquiry to get started.</p>
                        <Link to="/cars" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Browse Cars</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {orders.map(order => {
                            const s = STATUS_MAP[order.status] || STATUS_MAP.pending;
                            return (
                                <div key={order._id} className="card" style={{ padding: 24 }}>
                                    {/* Header Row */}
                                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                                        <img
                                            src={sanitizeImageUrl(order.car?.images?.[0], 'car')}
                                            alt=""
                                            style={{ width: 130, height: 88, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                                                <div>
                                                    <h3 style={{ margin: 0 }}>{order.car?.make} {order.car?.model} ({order.car?.year})</h3>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
                                                        Ref: <strong>#{order._id.slice(-6).toUpperCase()}</strong> &nbsp;•&nbsp;
                                                        {new Date(order.createdAt).toLocaleDateString()} &nbsp;•&nbsp;
                                                        Type: <strong>{order.type === 'test_drive' ? 'Test Drive' : 'Purchase'}</strong>
                                                    </p>
                                                </div>
                                                {/* Status Badge */}
                                                <span style={{
                                                    padding: '5px 16px',
                                                    borderRadius: 20,
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    background: s.color + '22',
                                                    color: s.color,
                                                    whiteSpace: 'nowrap'
                                                }}>{s.label}</span>
                                            </div>
                                            {/* Price row */}
                                            <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                                                <div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</div>
                                                    <div style={{ fontWeight: 800, color: '#2a9d8f', fontSize: '1.05rem' }}>${(order.totalPrice || order.car?.price)?.toLocaleString()}</div>
                                                </div>
                                                {order.paymentStatus && (
                                                    <div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment</div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: order.paymentStatus === 'paid' ? '#2a9d8f' : '#f4a261', textTransform: 'capitalize' }}>{order.paymentStatus}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Timeline */}
                                    {order.type !== 'test_drive' && (
                                        <OrderProgressTimeline order={order} />
                                    )}

                                    {order.message && (
                                        <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                                            "{order.message}"
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
