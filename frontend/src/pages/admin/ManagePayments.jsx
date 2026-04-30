import { useState, useEffect } from 'react';
import { FiCreditCard, FiCheck, FiX, FiSearch, FiFilter, FiDownload, FiDollarSign, FiServer, FiActivity, FiArrowUpRight, FiRefreshCw, FiList, FiTrendingUp, FiDatabase } from 'react-icons/fi';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function ManagePayments() {
    const [activeTab, setActiveTab] = useState('local'); // local, chapa_tx, payouts

    // Local State
    const [orders, setOrders] = useState([]);
    const [loadingLocal, setLoadingLocal] = useState(true);

    // Chapa State
    const [chapaData, setChapaData] = useState({ balance: 0, transactions: [], banks: [] });
    const [loadingChapa, setLoadingChapa] = useState(false);
    const [receiptLoading, setReceiptLoading] = useState(null);

    // Modal State
    const [logsModal, setLogsModal] = useState({ open: false, tx_ref: '', logs: null, loading: false });
    const [transferModal, setTransferModal] = useState({ open: false, data: { account_name: '', account_number: '', amount: '', bank_code: '' } });

    useEffect(() => {
        fetchLocalPayments();
    }, []);

    useEffect(() => {
        if (activeTab === 'chapa_tx' && !chapaData.transactions.length) {
            fetchChapaData();
        }
    }, [activeTab]);

    const fetchLocalPayments = async () => {
        setLoadingLocal(true);
        try {
            const res = await api.get('/admin/orders');
            setOrders(res.data.orders || []);
        } catch {
            toast.error('Failed to fetch local records');
        } finally {
            setLoadingLocal(false);
        }
    };

    const fetchChapaData = async () => {
        setLoadingChapa(true);
        try {
            const [balRes, txRes, bankRes] = await Promise.all([
                api.get('/payments/balance').catch(() => ({ data: { data: { balance: 0 } } })),
                api.get('/payments/transactions').catch(() => ({ data: { data: [] } })),
                api.get('/payments/banks').catch(() => ({ data: { data: [] } }))
            ]);

            setChapaData({
                balance: balRes.data?.data?.[0]?.balance || balRes.data?.data?.balance || 0,
                transactions: txRes.data?.data || [],
                banks: bankRes.data?.data || []
            });
        } catch (err) {
            toast.error('Failed to fetch Chapa gateway data');
        } finally {
            setLoadingChapa(false);
        }
    };

    const verifyLocalPayment = async (id) => {
        try {
            await api.put(`/admin/orders/${id}/status`, { paymentStatus: 'paid' });
            setOrders(prev => prev.map(o => o._id === id ? { ...o, paymentStatus: 'paid' } : o));
            toast.success('Payment verified successfully');
        } catch (err) {
            toast.error('Failed to verify payment with Chapa');
        }
    };

    const handleViewReceipt = async (tx_ref) => {
        setReceiptLoading(tx_ref);
        try {
            const { data } = await api.get(`/payments/receipt/${tx_ref}`);
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

    const cancelChapaPayment = async (tx_ref) => {
        if (!window.confirm(`Are you sure you want to cancel transaction ${tx_ref}?`)) return;
        try {
            await api.put(`/payments/cancel/${tx_ref}`);
            toast.success('Transaction cancelled successfully');
            fetchChapaData(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel transaction');
        }
    };

    const viewLogs = async (tx_ref) => {
        setLogsModal({ open: true, tx_ref, logs: null, loading: true });
        try {
            const res = await api.get(`/payments/logs/${tx_ref}`);
            setLogsModal(p => ({ ...p, logs: res.data?.data || [], loading: false }));
        } catch {
            toast.error('Could not fetch logs');
            setLogsModal(p => ({ ...p, open: false, loading: false }));
        }
    };

    const initiateTransfer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/payments/transfer', transferModal.data);
            toast.success('Transfer initiated successfully');
            setTransferModal({ open: false, data: { account_name: '', account_number: '', amount: '', bank_code: '' } });
            fetchChapaData(); // Refresh balance
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transfer failed');
        }
    };

    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    return (
        <div className="manage-payments tab-fade-in">
            <header className="desk-header-flex">
                <div>
                    <h2>Finance & Gateway</h2>
                    <p>Monitor local orders, live gateway logs, and initiate payouts.</p>
                </div>
                <div style={{ display: 'flex', gap: 15 }}>
                    <div className="revenue-card card glass-panel">
                        <FiDatabase />
                        <div>
                            <span className="label">System Revenue</span>
                            <span className="value">{totalRevenue.toLocaleString()} ETB</span>
                        </div>
                    </div>
                    {activeTab !== 'local' && (
                        <div className="revenue-card card glass-panel" style={{ borderLeftColor: '#f39c12' }}>
                            <FiServer style={{ color: '#f39c12' }} />
                            <div>
                                <span className="label">Chapa Balance</span>
                                <span className="value">{loadingChapa ? '...' : parseFloat(chapaData.balance || 0).toLocaleString()} ETB</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* TABS */}
            <div className="admin-tabs" style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                <button className={`btn ${activeTab === 'local' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('local')}>
                    <FiList /> Local Orders
                </button>
                <button className={`btn ${activeTab === 'chapa_tx' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('chapa_tx')}>
                    <FiServer /> Gateway Logs (Chapa)
                </button>
                <button className={`btn ${activeTab === 'payouts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('payouts')}>
                    <FiArrowUpRight /> Payouts / Transfers
                </button>
            </div>

            {/* TAB 1: LOCAL ORDERS */}
            {activeTab === 'local' && (
                <div className="admin-table card glass-panel">
                    {loadingLocal ? <div className="spinner-container"><div className="spinner" /></div> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Transaction Ref</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Gateway Status</th>
                                    <th>System Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o._id}>
                                        <td className="mono" title={o._id}>{o.tx_ref || `ORD-${o._id.slice(-6).toUpperCase()}`}</td>
                                        <td>
                                            <div className="user-info">
                                                <strong>{o.user?.name}</strong>
                                                <span>{o.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="price-col">{(o.totalPrice || 0).toLocaleString()} <small>ETB</small></td>
                                        <td><span className="method-pill">{o.paymentMethod || 'Chapa'}</span></td>
                                        <td>
                                            <span className={`status-dot ${o.paymentStatus === 'paid' ? 'success' : o.paymentStatus === 'failed' ? 'danger' : 'warning'}`}></span>
                                            {o.paymentStatus?.toUpperCase() || 'PENDING'}
                                        </td>
                                        <td>
                                            <span className={`badge ${o.status === 'completed' ? 'badge-success' : 'badge-gold'}`}>{o.status}</span>
                                        </td>
                                        <td>
                                            {o.paymentStatus !== 'paid' && (
                                                <button className="btn btn-icon success" onClick={() => verifyLocalPayment(o._id)} title="Manually Verify Payment">
                                                    <FiCheck />
                                                </button>
                                            )}
                                            {o.paymentStatus === 'paid' && o.tx_ref && (
                                                <button
                                                    className="btn btn-icon primary"
                                                    title="View Official Receipt"
                                                    disabled={receiptLoading === o.tx_ref}
                                                    onClick={() => handleViewReceipt(o.tx_ref)}
                                                >
                                                    {receiptLoading === o.tx_ref ? (
                                                        <span style={{ width: 14, height: 14, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                                                    ) : (
                                                        <FiDownload />
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders found.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB 2: CHAPA GATEWAY LOGS */}
            {activeTab === 'chapa_tx' && (
                <div className="admin-table card glass-panel">
                    <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Live Gateway Transactions</h3>
                        <button className="btn btn-secondary btn-sm" onClick={fetchChapaData}><FiRefreshCw className={loadingChapa ? 'spin' : ''} /> Sync Chapa</button>
                    </div>
                    {loadingChapa ? <div className="spinner-container"><div className="spinner" /></div> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Tx Ref</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Currency</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Logs / Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chapaData.transactions.map(tx => (
                                    <tr key={tx.id || tx.tx_ref}>
                                        <td className="mono">{tx.tx_ref}</td>
                                        <td>
                                            <div className="user-info">
                                                <strong>{tx.first_name} {tx.last_name}</strong>
                                                <span>{tx.email}</span>
                                            </div>
                                        </td>
                                        <td className="price-col">{parseFloat(tx.amount).toLocaleString()}</td>
                                        <td>{tx.currency}</td>
                                        <td>
                                            <span className={`badge ${tx.status === 'success' ? 'badge-success' : tx.status === 'failed' ? 'badge-danger' : 'badge-gold'}`}>
                                                {tx.status?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>{new Date(tx.created_at).toLocaleString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-icon btn-sm" onClick={() => viewLogs(tx.tx_ref)} title="View Event Logs">
                                                    <FiActivity />
                                                </button>
                                                {tx.status === 'pending' && (
                                                    <button className="btn btn-icon btn-sm danger" onClick={() => cancelChapaPayment(tx.tx_ref)} title="Cancel Transaction">
                                                        <FiX />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {chapaData.transactions.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No gateway transactions found.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB 3: PAYOUTS */}
            {activeTab === 'payouts' && (
                <div className="card glass-panel" style={{ padding: 30, maxWidth: 600 }}>
                    <h3 style={{ marginBottom: 20 }}>Initiate Bank Payout</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
                        Transfer funds from your Chapa merchant balance to a partner bank account.
                    </p>
                    <form onSubmit={initiateTransfer}>
                        <div className="form-group">
                            <label>Select Destination Bank</label>
                            <select className="form-control" required value={transferModal.data.bank_code} onChange={e => setTransferModal(p => ({ ...p, data: { ...p.data, bank_code: e.target.value } }))}>
                                <option value="">-- Choose Bank --</option>
                                {chapaData.banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Account Name</label>
                            <input type="text" className="form-control" required placeholder="Exact name on account" value={transferModal.data.account_name} onChange={e => setTransferModal(p => ({ ...p, data: { ...p.data, account_name: e.target.value } }))} />
                        </div>
                        <div className="form-group">
                            <label>Account Number</label>
                            <input type="text" className="form-control" required placeholder="Account number" value={transferModal.data.account_number} onChange={e => setTransferModal(p => ({ ...p, data: { ...p.data, account_number: e.target.value } }))} />
                        </div>
                        <div className="form-group">
                            <label>Amount (ETB)</label>
                            <input type="number" min="10" className="form-control" required placeholder="Transfer amount" value={transferModal.data.amount} onChange={e => setTransferModal(p => ({ ...p, data: { ...p.data, amount: e.target.value } }))} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loadingChapa}>
                            <FiArrowUpRight /> Execute Payout
                        </button>
                    </form>
                </div>
            )}

            {/* EVENT LOGS MODAL */}
            {logsModal.open && (
                <div className="modal-overlay" onClick={() => setLogsModal(p => ({ ...p, open: false }))}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, padding: 30 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3>Timeline: <span className="mono" style={{ fontSize: '1rem', color: 'var(--primary)' }}>{logsModal.tx_ref}</span></h3>
                            <button className="close-btn" onClick={() => setLogsModal(p => ({ ...p, open: false }))}><FiX size={24} /></button>
                        </div>

                        {logsModal.loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
                            <div className="logs-timeline">
                                {logsModal.logs && logsModal.logs.length > 0 ? logsModal.logs.map((log, idx) => (
                                    <div key={idx} className="log-item" style={{ padding: '12px 16px', background: 'var(--bg-dark)', borderRadius: 8, marginBottom: 10, borderLeft: `4px solid ${log.type === 'error' ? '#e74c3c' : '#2ecc71'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <strong>{log.type?.toUpperCase()}</strong>
                                            <span>{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <p style={{ margin: '8px 0 0', fontSize: '0.95rem' }}>{log.message || log.event || JSON.stringify(log)}</p>
                                    </div>
                                )) : (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No logs available or mock mode active.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .manage-payments { padding: 20px 0; }
                .desk-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .revenue-card { display: flex; align-items: center; gap: 15px; padding: 15px 25px; border-left: 4px solid #2ecc71; min-width: 240px; }
                .revenue-card svg { font-size: 1.5rem; color: #2ecc71; }
                .revenue-card .label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
                .revenue-card .value { font-size: 1.4rem; font-weight: 800; }
                
                .method-pill { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border); }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
                .status-dot.success { background: #2ecc71; box-shadow: 0 0 10px #2ecc7180; }
                .status-dot.warning { background: #f1c40f; box-shadow: 0 0 10px #f1c40f80; }
                .status-dot.danger { background: #e74c3c; box-shadow: 0 0 10px #e74c3c80; }
                
                .user-info strong { display: block; font-size: 0.9rem; }
                .user-info span { font-size: 0.75rem; color: var(--text-muted); }
                .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--primary); }
                .price-col { font-weight: 800; color: #2ecc71; }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
