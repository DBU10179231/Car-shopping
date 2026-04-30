import { useState, useEffect } from 'react';
import { FiCreditCard, FiZap, FiTruck, FiSmartphone, FiRepeat } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChapaPaymentModal from './ChapaPaymentModal';

// Chapa is the unified gateway handling Card, Telebirr, CBE Birr, and Bank Transfer natively.
const BOOKING_FEE = 10000; // Fixed booking fee for reservations
const TAX_RATE = 0.15;

export default function CheckoutButton({ car, onPaymentSuccess, orderId, totalPrice }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showLogistics, setShowLogistics] = useState(false);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [logistics, setLogistics] = useState({
        quote: 0,
        address: '',
        city: '',
        scheduledDate: '',
        scheduledTime: 'Morning (9AM - 12PM)'
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    // Fetch shipping quote when delivery is toggled and city is entered
    useEffect(() => {
        if (showLogistics && logistics.city.length > 3) {
            const timer = setTimeout(fetchQuote, 1000);
            return () => clearTimeout(timer);
        }
    }, [showLogistics, logistics.city]);

    const fetchQuote = async () => {
        setQuoteLoading(true);
        try {
            const res = await api.post('/logistics/quote', {
                carId: car._id,
                deliveryZip: logistics.city
            });
            setLogistics(prev => ({ ...prev, quote: res.data.quote }));
            toast.success(`Shipping quote: ${res.data.quote.toLocaleString()} ETB`);
        } catch {
            toast.error('Failed to calculate shipping quote');
        } finally {
            setQuoteLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (showLogistics && (!logistics.address || !logistics.city || !logistics.scheduledDate)) {
            toast.error('Please fill in all delivery details');
            return;
        }
        if (!user || !user.token) {
            toast.warning('Session expired. Please login to continue.');
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }

        setLoading(true);
        toast.info('Initializing secure checkout...');

        try {
            const payload = {
                carId: car._id,
                orderId: orderId || null,
                amount: BOOKING_FEE,
                paymentMethod: 'chapa',
                isBookingFee: true // Flag for backend
            };

            if (showLogistics) {
                payload.logisticsData = {
                    quote: logistics.quote,
                    pickupDetails: {
                        address: 'Seller Showroom',
                        scheduledDate: logistics.scheduledDate,
                        scheduledTime: logistics.scheduledTime
                    },
                    deliveryDetails: {
                        address: `${logistics.address}, ${logistics.city}`
                    }
                };
            }

            const { data } = await api.post('/payments/checkout', payload);
            
            // Instead of immediate redirect, open our advanced modal
            setModalData(data);
            setIsModalOpen(true);
            
            toast.success('Secure Payment Gateway Ready');
        } catch (err) {
            console.error('Checkout Error:', err);
            const msg = err.response?.data?.message || err.message || 'Payment initialization failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (order) => {
        setIsModalOpen(false);
        if (onPaymentSuccess) {
            onPaymentSuccess(order);
        } else {
            navigate('/payment/verify?tx_ref=' + order.tx_ref);
        }
    };

    const baseAmount = BOOKING_FEE;
    const taxAmount = Math.round(baseAmount * TAX_RATE);
    const totalWithTax = baseAmount + taxAmount;
    const grandTotal = totalWithTax + (showLogistics ? logistics.quote : 0);

    return (
        <div style={{
            padding: 24,
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)',
            margin: '0',
            fontFamily: 'inherit',
            color: '#0f172a'
        }}>
            {/* Doorstep Delivery Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FiTruck size={22} color="#10b981" />
                    <div>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>Doorstep Delivery</span>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Add shipping to your order</p>
                    </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showLogistics}
                        onChange={e => setShowLogistics(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: showLogistics ? '#2a9d8f' : '#cbd5e1',
                        borderRadius: 34, transition: '.3s'
                    }}>
                        <span style={{
                            position: 'absolute', height: 18, width: 18,
                            left: showLogistics ? 22 : 4, bottom: 3,
                            backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
                        }} />
                    </span>
                </label>
            </div>

            {/* Logistics Fields */}
            {showLogistics && (
                <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input
                            className="form-control"
                            placeholder="Delivery City"
                            value={logistics.city}
                            onChange={e => setLogistics({ ...logistics, city: e.target.value })}
                        />
                        <input
                            className="form-control"
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={logistics.scheduledDate}
                            onChange={e => setLogistics({ ...logistics, scheduledDate: e.target.value })}
                        />
                    </div>
                    <input
                        className="form-control"
                        placeholder="Street Address"
                        value={logistics.address}
                        onChange={e => setLogistics({ ...logistics, address: e.target.value })}
                    />
                    <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiTruck size={16} color="#2a9d8f" /> Shipping Quote:
                        </span>
                        <strong style={{ color: '#2a9d8f', fontSize: '1rem' }}>
                            {quoteLoading ? 'Calculating...' : `${(logistics.quote || 0).toLocaleString()} ETB`}
                        </strong>
                    </div>
                </div>
            )}

            {/* Price Breakdown */}
            <div style={{ marginBottom: 20, padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                    <span style={{ fontWeight: 600 }}>Reservation Deposit</span>
                    <span style={{ fontWeight: 600 }}>{baseAmount.toLocaleString()} ETB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                    <span>Sales Tax (15%)</span>
                    <span>{taxAmount.toLocaleString()} ETB</span>
                </div>
                {showLogistics && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#64748b' }}>
                        <span>Shipping & Logistics</span>
                        <span>{logistics.quote.toLocaleString()} ETB</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>Total to Pay Now</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                        {grandTotal.toLocaleString()} ETB
                    </span>
                </div>
                <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                    The remaining balance will be settled directly with the seller upon vehicle inspection and transfer.
                </p>
            </div>


            {/* Checkout Button */}
            <button
                style={{
                    width: '100%',
                    padding: '15px 20px',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    background: 'linear-gradient(135deg, #2a9d8f 0%, #264653 100%)',
                    color: '#fff',
                    border: 'none',
                    boxShadow: `0 8px 20px rgba(42, 157, 143, 0.3)`,
                    fontWeight: 700,
                    borderRadius: 12,
                    cursor: loading || (showLogistics && quoteLoading) ? 'not-allowed' : 'pointer',
                    opacity: loading || (showLogistics && quoteLoading) ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                }}
                onClick={handleCheckout}
                disabled={loading || (showLogistics && quoteLoading)}
            >
                {loading ? (
                    <span style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.4)', borderTop: '3px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                    <>
                        <FiZap size={18} />
                        Pay Securely with Chapa
                    </>
                )}

            </button>

            <style>{`
                @keyframes spin { 
                    from { transform: rotate(0deg); } 
                    to { transform: rotate(360deg); } 
                }
            `}</style>

            {isModalOpen && modalData && (
                <ChapaPaymentModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    paymentData={modalData}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
