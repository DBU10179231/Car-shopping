import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
    FiCalendar, FiCheck, FiX, FiClock, FiUser,
    FiPhone, FiCalendar as FiDate, FiMapPin,
    FiCheckCircle, FiChevronRight, FiGrid
} from 'react-icons/fi';

export default function ManageTestDrives() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/seller/orders');
            // Filter only test drive requests
            setRequests(res.data.orders.filter(o => o.type === 'test_drive'));
        } catch (err) {
            toast.error('Failed to sync appointment calendar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/seller/orders/${id}/status`, { status });
            toast.success(`Schedule updated to ${status}`);
            setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
        } catch (err) {
            toast.error('Calendar update failed');
        }
    };

    if (loading) return <div className="spinner" style={{ margin: '60px auto' }} />;

    return (
        <div className="fade-in appointments-suite" style={{ paddingBottom: 60 }}>
            {/* Appointment Header */}
            <div className="suite-header card glass-panel" style={{ padding: '30px 40px', marginBottom: 40, border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, mb: 5 }}>Test Drive <span className="gradient-text">Schedule</span></h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage and arrange times for buyers to test your cars (Point 9).</p>
                    </div>
                    <div className="calendar-stats">
                        <div className="stat">
                            <strong>{requests.filter(r => r.status === 'pending').length}</strong>
                            <span>Awaiting Action</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid of Appointments */}
            <div className="appointments-grid">
                {requests.length === 0 ? (
                    <div className="card glass-panel empty-state" style={{ padding: 100, textAlign: 'center', gridColumn: '1 / -1' }}>
                        <FiCalendar size={50} style={{ opacity: 0.2, marginBottom: 20 }} />
                        <h3>Quiet Roads</h3>
                        <p style={{ color: 'var(--text-muted)' }}>No test drive appointments scheduled at this moment.</p>
                    </div>
                ) : requests.map(r => (
                    <div key={r._id} className="appointment-card glass-panel">
                        <div className="appointment-header">
                            <div className="asset-info">
                                <img src={r.car?.images?.[0]?.startsWith('http') ? r.car.images[0] : `${window.location.protocol}//${window.location.hostname}:5001${r.car?.images?.[0]}`} alt="" />
                                <div>
                                    <h4>{r.car?.make} {r.car?.model}</h4>
                                    <span>{r.car?.year} Edition</span>
                                </div>
                            </div>
                            <span className={`status-pill ${r.status}`}>{r.status.toUpperCase()}</span>
                        </div>

                        <div className="appointment-body">
                            <div className="appointment-metric">
                                <div className="icon"><FiUser /></div>
                                <div className="detail">
                                    <label>Client</label>
                                    <strong>{r.user?.name}</strong>
                                </div>
                            </div>
                            <div className="appointment-metric">
                                <div className="icon"><FiDate /></div>
                                <div className="detail">
                                    <label>Scheduled Date</label>
                                    <strong>{r.bookingDate || 'Not Set'}</strong>
                                </div>
                            </div>
                            <div className="appointment-metric">
                                <div className="icon"><FiClock /></div>
                                <div className="detail">
                                    <label>Session Time</label>
                                    <strong>{r.bookingTime || 'Not Set'}</strong>
                                </div>
                            </div>
                            {r.phone && (
                                <div className="appointment-metric">
                                    <div className="icon"><FiPhone /></div>
                                    <div className="detail">
                                        <label>Contact</label>
                                        <strong>{r.phone}</strong>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="appointment-footer">
                            {r.status === 'pending' ? (
                                <>
                                    <button className="btn-action approve" onClick={() => updateStatus(r._id, 'approved')}>
                                        Confirm Session
                                    </button>
                                    <button className="btn-action reject" onClick={() => updateStatus(r._id, 'rejected')}>
                                        Decline
                                    </button>
                                </>
                            ) : r.status === 'approved' ? (
                                <button className="btn-action complete" onClick={() => updateStatus(r._id, 'completed')}>
                                    <FiCheckCircle /> Mark as Conducted
                                </button>
                            ) : (
                                <div className="conducted-note">Session {r.status}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .appointments-suite { color: var(--text); }
                .glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border) !important;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.2) !important;
                }
                
                .calendar-stats { display: flex; gap: 40px; }
                .calendar-stats .stat { display: flex; flex-direction: column; align-items: flex-end; }
                .calendar-stats .stat strong { font-size: 2rem; font-weight: 900; line-height: 1; color: var(--primary); }
                .calendar-stats .stat span { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-top: 5px; }
                
                .appointments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 25px; }
                .appointment-card { padding: 25px; border-radius: 24px; transition: all 0.3s; }
                .appointment-card:hover { transform: translateY(-5px); border-color: var(--primary) !important; }
                
                .appointment-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                .asset-info { display: flex; gap: 15px; align-items: center; }
                .asset-info img { width: 70px; height: 50px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border); }
                .asset-info h4 { margin: 0; font-size: 1rem; font-weight: 800; }
                .asset-info span { font-size: 0.75rem; color: var(--text-muted); }
                
                .status-pill { 
                    font-size: 0.65rem; font-weight: 900; padding: 4px 12px; border-radius: 20px;
                    letter-spacing: 1px;
                }
                .status-pill.pending { background: rgba(255, 159, 28, 0.1); color: #ff9f1c; }
                .status-pill.approved { background: rgba(67, 97, 238, 0.1); color: #4361ee; }
                .status-pill.completed { background: rgba(42, 157, 143, 0.1); color: #2a9d8f; }
                .status-pill.rejected { background: rgba(255,255,255,0.05); color: var(--text-muted); }
                
                .appointment-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
                .appointment-metric { display: flex; gap: 12px; align-items: center; }
                .appointment-metric .icon { width: 34px; height: 34px; background: rgba(255,255,255,0.05); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .appointment-metric label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
                .appointment-metric strong { display: block; font-size: 0.85rem; font-weight: 800; }
                
                .appointment-footer { display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid var(--border); }
                .btn-action { 
                    flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 800; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .btn-action.approve { background: var(--primary); color: white; box-shadow: 0 5px 15px rgba(230, 57, 70, 0.2); }
                .btn-action.reject { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--border); }
                .btn-action.complete { background: #2a9d8f; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; }
                
                .btn-action:hover { opacity: 0.9; transform: scale(1.02); }
                .conducted-note { width: 100%; text-align: center; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); padding: 10px; }
            `}</style>
        </div>
    );
}
