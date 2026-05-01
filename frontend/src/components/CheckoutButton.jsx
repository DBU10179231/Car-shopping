import { useState, useEffect } from 'react';
import { 
    FiCreditCard, FiZap, FiTruck, FiSmartphone, FiRepeat, FiGlobe, 
    FiArrowRight, FiCheckCircle, FiXCircle, FiLock, FiX, FiCheck, FiArrowLeft, FiShield
} from 'react-icons/fi';
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
    
    // Advanced Flow State
    const [checkoutStep, setCheckoutStep] = useState('summary'); // summary, payment, confirm, success
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [phone, setPhone] = useState('');
    const [orderRef, setOrderRef] = useState(null);

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

    const handleInitPayment = async () => {
        setLoading(true);
        try {
            const payload = {
                carId: car._id,
                orderId: orderId || null,
                amount: BOOKING_FEE,
                paymentMethod: paymentMethod, // chapa, telebirr, etc.
                isBookingFee: true
            };
            if (showLogistics) {
                payload.logisticsData = {
                    quote: logistics.quote,
                    pickupDetails: { address: 'Seller Showroom', scheduledDate: logistics.scheduledDate, scheduledTime: logistics.scheduledTime },
                    deliveryDetails: { address: `${logistics.address}, ${logistics.city}` }
                };
            }
            const { data } = await api.post('/payments/checkout', payload);
            setModalData(data);
            setCheckoutStep('confirm');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Initialization failed');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAndPay = () => {
        setIsModalOpen(true);
    };

    const handleFinalSuccess = (order) => {
        setOrderRef(order);
        setCheckoutStep('success');
    };

    if (checkoutStep === 'success') {
        return (
            <div className="checkout-success-view glass-card" style={{ padding: 40, textAlign: 'center', background: '#fff' }}>
                <div style={{ width: 80, height: 80, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#fff', fontSize: '2.5rem' }}>
                    <FiCheckCircle />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>Reservation Confirmed!</h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: 30 }}>The vehicle has been locked for you. Our inspection team will contact you within 24 hours.</p>
                
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, textAlign: 'left', marginBottom: 30 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontWeight: 600 }}>Order ID</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>#{orderRef?.tx_ref?.slice(-6).toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>Next Step</span>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>Physical Inspection</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                    <button className="btn btn-primary btn-block" onClick={() => navigate('/buyer/dashboard')}>View My Order</button>
                    <button className="btn btn-secondary btn-block" onClick={() => navigate('/support')}>Contact Support</button>
                </div>
            </div>
        );
    }

    const baseAmount = BOOKING_FEE;
    const taxAmount = Math.round(baseAmount * TAX_RATE);
    const totalWithTax = baseAmount + taxAmount;
    const grandTotal = totalWithTax + (showLogistics ? logistics.quote : 0);

    return (
        <div style={{
            padding: 30,
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            color: '#0f172a'
        }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
                {['summary', 'payment', 'confirm'].map((s, i) => (
                    <div key={s} style={{ 
                        height: 4, flex: 1, 
                        background: (['summary', 'payment', 'confirm'].indexOf(checkoutStep) >= i) ? '#2a9d8f' : '#e2e8f0',
                        borderRadius: 2
                    }} />
                ))}
            </div>

            {checkoutStep === 'summary' && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <FiTruck size={24} color="#2a9d8f" />
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Delivery Preference</h3>
                    </div>

                    {/* Logistics Toggle & Fields */}
                    <div style={{ marginBottom: 30 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setShowLogistics(!showLogistics)}>
                            <span style={{ fontWeight: 700 }}>Enable Doorstep Delivery</span>
                            <div style={{ width: 44, height: 24, background: showLogistics ? '#2a9d8f' : '#cbd5e1', borderRadius: 34, position: 'relative', transition: '.3s' }}>
                                <div style={{ position: 'absolute', height: 18, width: 18, left: showLogistics ? 22 : 4, top: 3, background: '#fff', borderRadius: '50%', transition: '.3s' }} />
                            </div>
                        </div>

                        {showLogistics && (
                            <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
                                <input className="form-control" placeholder="City" value={logistics.city} onChange={e => setLogistics({...logistics, city: e.target.value})} />
                                <input className="form-control" placeholder="Address" value={logistics.address} onChange={e => setLogistics({...logistics, address: e.target.value})} />
                                <input className="form-control" type="date" value={logistics.scheduledDate} onChange={e => setLogistics({...logistics, scheduledDate: e.target.value})} />
                                {logistics.quote > 0 && (
                                    <div style={{ padding: 12, background: 'rgba(42, 157, 143, 0.1)', color: '#2a9d8f', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem' }}>
                                        Estimated Shipping: {logistics.quote.toLocaleString()} ETB
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button className="btn btn-primary btn-block" style={{ padding: 16, fontSize: '1rem' }} onClick={() => setCheckoutStep('payment')}>
                        Proceed to Payment Method <FiArrowRight />
                    </button>
                </>
            )}

            {checkoutStep === 'payment' && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <FiCreditCard size={24} color="#2a9d8f" />
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Payment Method</h3>
                    </div>

                    <div style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
                        {[
                            { id: 'card', name: 'Credit / Debit Card', icon: <FiCreditCard />, sub: 'Visa, Mastercard' },
                            { id: 'telebirr', name: 'Telebirr', icon: <FiSmartphone />, sub: 'Instant mobile payment' },
                            { id: 'bank', name: 'Bank Transfer / CBE', icon: <FiRepeat />, sub: 'Offline bank transfer' }
                        ].map(m => (
                            <div key={m.id} 
                                onClick={() => setPaymentMethod(m.id)}
                                style={{ 
                                    padding: 20, borderRadius: 12, border: '2px solid', 
                                    borderColor: paymentMethod === m.id ? '#2a9d8f' : '#e2e8f0',
                                    background: paymentMethod === m.id ? 'rgba(42,157,143,0.05)' : '#fff',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: '.2s'
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', color: paymentMethod === m.id ? '#2a9d8f' : '#64748b' }}>{m.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.sub}</div>
                                </div>
                                {paymentMethod === m.id && <FiCheckCircle style={{ marginLeft: 'auto', color: '#2a9d8f' }} />}
                            </div>
                        ))}
                    </div>

                    {paymentMethod === 'telebirr' && (
                        <div style={{ marginBottom: 30 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Telebirr Phone Number</label>
                            <input 
                                className="form-control" 
                                placeholder="09XXXXXXXX" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)}
                                style={{ fontSize: '1.1rem', padding: 14 }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: 30, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px dotted #cbd5e1', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748b', fontSize: '0.85rem' }}>
                            <FiShield /> Secured by Chapa Gateway
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCheckoutStep('summary')}>Back</button>
                        <button className="btn btn-primary" style={{ flex: 2, padding: 16 }} onClick={handleInitPayment} disabled={loading}>
                            {loading ? 'Initializing...' : `Pay ${grandTotal.toLocaleString()} ETB`}
                        </button>
                    </div>
                </>
            )}

            {checkoutStep === 'confirm' && (
                <div className="confirmation-modal-lite">
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Confirm Payment</h3>
                    <p style={{ color: '#64748b', marginBottom: 24 }}>Please review your reservation details.</p>
                    
                    <div style={{ background: '#f1f5f9', padding: 20, borderRadius: 16, marginBottom: 30 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: '#64748b' }}>For Vehicle</span>
                            <div style={{ textAlign: 'right' }}>
                                <strong style={{ color: '#0f172a', display: 'block' }}>{car.make} {car.model}</strong>
                                {car.seller?.isVerifiedSeller && (
                                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                        <FiCheckCircle size={10} /> Verified Seller
                                    </span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: '#64748b' }}>Payment Now</span>
                            <strong style={{ color: '#2a9d8f', fontSize: '1.2rem' }}>{grandTotal.toLocaleString()} ETB</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #cbd5e1' }}>
                            <span style={{ color: '#64748b' }}>Remaining Balance</span>
                            <strong style={{ color: '#0f172a' }}>{(car.price - BOOKING_FEE).toLocaleString()} ETB</strong>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCheckoutStep('payment')}>Edit</button>
                        <button className="btn btn-primary" style={{ flex: 2, padding: 16, fontSize: '1.1rem' }} onClick={handleConfirmAndPay}>
                            Confirm &amp; Pay <FiArrowRight />
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && modalData && (
                <ChapaPaymentModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    paymentData={{ ...modalData, preferredMethod: paymentMethod, phone }}
                    onSuccess={handleFinalSuccess}
                />
            )}
        </div>
    );
}
