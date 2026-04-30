import { useState, useEffect } from 'react';
import { 
    FiGlobe, FiSmartphone, FiCreditCard, FiArrowRight, 
    FiCheckCircle, FiXCircle, FiLock, FiX, FiCheck 
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './ChapaPaymentModal.css';

export default function ChapaPaymentModal({ 
    isOpen, 
    onClose, 
    paymentData, 
    onSuccess 
}) {
    const [activeMethod, setActiveMethod] = useState('bank');
    const [phone, setPhone] = useState('0900123456');
    const [pin, setPin] = useState('');
    const [step, setStep] = useState(1); // 1: Init, 2: PIN/OTP
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const paymentMethods = [
        { id: 'bank', title: 'Test Bank Payment', icon: <FiGlobe />, prompt: 'Enter Bank PIN' },
        { id: 'card', title: 'Test Card Payment', icon: <FiCreditCard />, prompt: 'Enter Card PIN' },
        { id: 'telebirr', title: 'Telebirr', icon: <FiSmartphone />, prompt: 'Enter OTP' },
        { id: 'cbe', title: 'CBE Birr', icon: <FiSmartphone />, prompt: 'Enter OTP' }
    ];

    const currentMethod = paymentMethods.find(m => m.id === activeMethod) || paymentMethods[0];

    const handleNext = () => {
        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }
        setStep(2);
    };

    const handlePay = async () => {
        if (!pin || pin.length < 4) {
            toast.error('Please enter a valid 4-digit PIN');
            return;
        }

        setIsSubmitting(true);
        try {
            await new Promise(r => setTimeout(r, 1500));

            const res = await api.post('/payments/simulate-mobile-confirm', {
                tx_ref: paymentData?.tx_ref,
                pin: pin
            });

            if (res.data.status === 'success') {
                setStatus('success');
                setTimeout(() => {
                    onSuccess(res.data.order);
                }, 2000);
            } else {
                throw new Error(res.data.message || 'Payment failed');
            }
        } catch (err) {
            console.error('Payment Modal Error:', err);
            setStatus('error');
            setErrorMsg(err.response?.data?.message || err.message || 'Transaction Declined');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="chapa-portal-overlay">
            <div className="chapa-portal-container">
                <button className="chapa-close-btn" onClick={onClose}>
                    <FiX />
                </button>

                {/* Sidebar */}
                <aside className="chapa-sidebar">
                    <div className="chapa-logo-section">
                        <div className="chapa-logo">
                            <FiCheckCircle /> Chapa
                        </div>
                        <p className="chapa-logo-sub">Select your payment method here</p>
                    </div>

                    <nav className="chapa-nav">
                        {paymentMethods.map(method => (
                            <div 
                                key={method.id}
                                className={`chapa-nav-item ${activeMethod === method.id ? 'active' : ''}`}
                                onClick={() => setActiveMethod(method.id)}
                            >
                                <div className="chapa-nav-icon">{method.icon}</div>
                                <div className="chapa-nav-text">
                                    <span className="chapa-nav-title">{method.title}</span>
                                </div>
                                <FiArrowRight className="chapa-nav-arrow" />
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Pane */}
                <main className="chapa-main">
                    <header className="chapa-header">
                        <div className="chapa-brand">
                            <div className="chapa-brand-icon">
                                <FiCheckCircle />
                            </div>
                            <span className="chapa-brand-name">AutoMarket</span>
                        </div>
                        <div className="chapa-lang-select">
                            EN <FiGlobe />
                        </div>
                    </header>

                    <div className="chapa-info-box">
                        <p className="chapa-item-desc">
                            {paymentData?.carMake || 'Vehicle'} {paymentData?.carModel || 'Selection'} - Booking Fee
                        </p>
                        <div className="chapa-test-notice">
                            No actual money is used in test mode. 
                            Only our test cards and bank accounts can be used.
                            <a href="#" className="chapa-test-link" onClick={e => e.preventDefault()}>
                                Testing phone number
                            </a>
                        </div>
                    </div>

                    {step === 1 ? (
                        <>
                            <div className="chapa-field-group">
                                <label className="chapa-label">Phone Number</label>
                                <div className="chapa-input-wrapper">
                                    <input 
                                        type="text" 
                                        className="chapa-input"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="0900123456"
                                    />
                                    {phone.length >= 10 && <FiCheckCircle className="chapa-input-check" />}
                                </div>
                            </div>

                            <button 
                                className="chapa-pay-btn" 
                                disabled={phone.length < 10}
                                onClick={handleNext}
                            >
                                Pay with {activeMethod === 'bank' ? 'Bank' : activeMethod === 'card' ? 'Card' : currentMethod?.title}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="chapa-field-group">
                                <label className="chapa-label">{currentMethod?.prompt || 'Enter PIN'}</label>
                                <div className="chapa-input-wrapper">
                                    <input 
                                        type="password" 
                                        className="chapa-input"
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        placeholder="****"
                                        maxLength={4}
                                        autoFocus
                                    />
                                    {pin.length === 4 && <FiCheckCircle className="chapa-input-check" />}
                                </div>
                            </div>

                            <button 
                                className="chapa-pay-btn" 
                                disabled={isSubmitting || pin.length < 4}
                                onClick={handlePay}
                            >
                                {isSubmitting ? 'Verifying...' : 'Confirm Payment'}
                            </button>

                            <button 
                                className="chapa-test-link" 
                                style={{ background: 'none', border: 'none', margin: '15px auto 0', cursor: 'pointer' }}
                                onClick={() => setStep(1)}
                            >
                                Back to Phone Number
                            </button>
                        </>
                    )}

                    <div className="chapa-footer-secure">
                        <FiLock /> Secured By Chapa
                    </div>
                </main>

                {/* Status Overlays */}
                {status === 'success' && (
                    <div className="chapa-status-overlay">
                        <div className="chapa-status-icon success">
                            <FiCheck />
                        </div>
                        <h2 className="chapa-status-title">Payment Successful</h2>
                        <p className="chapa-status-text">Your booking is confirmed! Redirecting you to your order details...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="chapa-status-overlay">
                        <div className="chapa-status-icon error">
                            <FiX />
                        </div>
                        <h2 className="chapa-status-title">Payment Failed</h2>
                        <p className="chapa-status-text">{errorMsg}</p>
                        <button 
                            className="chapa-pay-btn" 
                            style={{ maxWidth: 200, marginTop: 30 }}
                            onClick={() => setStatus(null)}
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>

    );
}
