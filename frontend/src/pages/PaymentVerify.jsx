import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { FiCheckCircle, FiXCircle, FiExternalLink, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function PaymentVerify() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [order, setOrder] = useState(null);
    const [receiptUrl, setReceiptUrl] = useState(null);

    const tx_ref = searchParams.get('tx_ref');
    const chapaRef = searchParams.get('trx_ref') || searchParams.get('ref'); // Chapa returns either

    useEffect(() => {
        if (tx_ref) {
            verify();
        } else {
            setStatus('error');
        }
    }, [tx_ref]);

    const verify = async () => {
        try {
            const res = await api.get(`/payments/verify/${tx_ref}`);

            if (res.data.status === 'success' || res.data.order) {
                setStatus('success');
                setOrder(res.data.order);
                toast.success('Payment confirmed! Your vehicle is secured.');

                // Fetch receipt URL from Chapa if we have a reference
                const ref = searchParams.get('trx_ref') ||
                    searchParams.get('ref') ||
                    res.data.order?.transactionId ||
                    res.data.data?.reference;

                // Ensure we aren't using the internal tx_ref as a receipt link
                if (ref && !ref.startsWith('tx-')) {
                    try {
                        const receiptRes = await api.get(`/payments/receipt/${ref}`);
                        setReceiptUrl(receiptRes.data.receiptUrl);
                    } catch {
                        // Receipt URL is optional, non-fatal
                    }
                }
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error('Verification Error:', err);
            setStatus('error');
            toast.error('Could not verify payment status.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: '#f8fafc' }}>
            <div style={{ width: '100%', maxWidth: 480, background: '#ffffff', borderRadius: 24, padding: '48px 40px', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.05)', textAlign: 'center' }}>

                {/* Verifying State */}
                {status === 'verifying' && (
                    <>
                        <div style={{
                            width: 70, height: 70, borderRadius: '50%',
                            border: '4px solid var(--border)', borderTop: '4px solid var(--primary)',
                            margin: '0 auto 28px', animation: 'spin 0.8s linear infinite'
                        }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                            Verifying Payment...
                        </h2>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Please wait while we confirm your transaction with Chapa. Do not close this window.
                        </p>
                    </>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <>
                        <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#2a9d8f15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', border: '3px solid #2a9d8f30' }}>
                            <FiCheckCircle size={48} color="#2a9d8f" />
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2a9d8f', marginBottom: 12 }}>
                            Payment Successful!
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: 32 }}>
                            Your purchase has been confirmed. The seller will contact you shortly to complete the handover.
                        </p>

                        {/* Tx Ref & Order Info */}
                        {(tx_ref || order) && (
                            <div style={{ background: 'var(--bg-dark)', borderRadius: 14, padding: '16px 20px', marginBottom: 28, textAlign: 'left', border: '1px solid var(--border)' }}>
                                {tx_ref && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Transaction Ref</span>
                                        <code style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}>{tx_ref}</code>
                                    </div>
                                )}
                                {order?.totalPrice && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
                                        <strong style={{ color: 'var(--text)' }}>{order.totalPrice?.toLocaleString()} ETB</strong>
                                    </div>
                                )}
                                {order?.invoiceId && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Invoice</span>
                                        <strong style={{ color: 'var(--text)' }}>{order.invoiceId}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Chapa Receipt Link */}
                        {receiptUrl && (
                            <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: '#2a9d8f15', border: '1px solid #2a9d8f40', borderRadius: 12, color: '#2a9d8f', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', marginBottom: 20, transition: 'background 0.2s' }}
                            >
                                <FiExternalLink size={16} />
                                View Official Chapa Receipt
                            </a>
                        )}

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/dashboard" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12 }}>
                                Go to My Garage <FiArrowRight size={16} />
                            </Link>
                            <Link to="/hub" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                Go to My Hub <FiArrowRight size={16} />
                            </Link>
                            <Link to="/cars" className="btn btn-secondary" style={{ padding: '12px 24px', borderRadius: 12 }}>
                                Browse More Cars
                            </Link>
                        </div>
                    </>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid #fee2e2' }}>
                            <FiXCircle size={40} color="#ef4444" />
                        </div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginBottom: 16 }}>
                            Payment Not Confirmed
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 32 }}>
                            We couldn't confirm your transaction. This can happen if the payment was cancelled or if there was a network error.
                        </p>

                        <button
                            onClick={() => window.history.back()}
                            style={{
                                background: '#3b82f6',
                                color: '#fff',
                                padding: '12px 32px',
                                borderRadius: '12px',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                transition: 'all 0.2s ease',
                                marginBottom: 32
                            }}
                        >
                            Try Again
                        </button>

                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, borderTop: '1px solid #e2e8f0', paddingTop: 24, margin: 0 }}>
                            If funds were deducted but the status shows failed, please contact support with your transaction reference: <strong style={{ color: '#475569' }}>{tx_ref || chapaRef || 'N/A'}</strong>
                        </p>
                    </>
                )}

                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
}
