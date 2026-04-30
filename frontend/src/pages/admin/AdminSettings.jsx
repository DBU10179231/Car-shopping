import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { FiSave, FiGlobe, FiMail, FiShield, FiCreditCard, FiSearch, FiSend, FiUsers, FiInfo, FiDollarSign } from 'react-icons/fi';

const TABS = [
    { key: 'general', label: 'General', icon: <FiGlobe /> },
    { key: 'seo', label: 'SEO', icon: <FiSearch /> },
    { key: 'email', label: 'Email Templates', icon: <FiMail /> },
    { key: 'finance', label: 'Finance Partners', icon: <FiDollarSign /> },
    { key: 'broadcast', label: 'Broadcast', icon: <FiSend /> },
    { key: 'payment', label: 'Payment', icon: <FiCreditCard /> },
    { key: 'security', label: 'Security', icon: <FiShield /> },
];

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState('general');
    const [general, setGeneral] = useState({ siteName: 'AutoMarket', contactEmail: 'admin@automarket.com', currency: 'USD', timezone: 'Africa/Nairobi', language: 'English' });
    const [seo, setSeo] = useState({ metaTitle: 'AutoMarket — Buy & Sell Cars Online', metaDescription: 'Buy, sell, and browse thousands of cars.', generateSitemap: true });
    const [security, setSecurity] = useState({ twoFactor: false, ipWhitelist: '', sessionTimeout: 30 });

    // Broadcast State
    const [broadcast, setBroadcast] = useState({ subject: '', message: '', targetRole: 'all', channel: 'email' });
    const [sending, setSending] = useState(false);

    // Finance State
    const [partners, setPartners] = useState(['AutoMarket Direct', 'Bank ABC', 'FinCorp', 'Equity Bank']);

    const save = (section) => toast.success(`${section} settings saved!`);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await api.post('/admin/broadcast', broadcast);
            toast.success(`Broadcast sent to ${res.data.stats.emails} users!`);
            setBroadcast({ ...broadcast, subject: '', message: '' });
        } catch (err) {
            toast.error('Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    return (
        <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Settings & Configuration</h1>
            <p className="page-subtitle" style={{ marginBottom: 24 }}>Manage site-wide settings, integrations, and security.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                            background: activeTab === tab.key ? 'var(--primary)' : 'var(--bg-card)',
                            borderColor: activeTab === tab.key ? 'var(--primary)' : 'var(--border)',
                            color: activeTab === tab.key ? '#fff' : 'var(--text-muted)'
                        }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: 28, maxWidth: 720 }}>
                {activeTab === 'general' && (
                    <div>
                        <h3 style={{ marginBottom: 20 }}>General Settings</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group"><label>Site Name</label><input className="form-control" value={general.siteName} onChange={e => setGeneral({ ...general, siteName: e.target.value })} /></div>
                            <div className="form-group"><label>Contact Email</label><input className="form-control" value={general.contactEmail} onChange={e => setGeneral({ ...general, contactEmail: e.target.value })} /></div>
                            <div className="form-group"><label>Currency</label>
                                <select className="form-control" value={general.currency} onChange={e => setGeneral({ ...general, currency: e.target.value })}>
                                    <option>USD</option><option>EUR</option><option>GBP</option><option>ETB</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Timezone</label>
                                <select className="form-control" value={general.timezone} onChange={e => setGeneral({ ...general, timezone: e.target.value })}>
                                    <option value="Africa/Nairobi">Africa/Nairobi</option>
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">America/New_York</option>
                                    <option value="Europe/London">Europe/London</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={() => save('General')} style={{ marginTop: 8 }}><FiSave /> Save Changes</button>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div>
                        <h3 style={{ marginBottom: 20 }}><FiSend /> Send Broadcast Message</h3>
                        <form onSubmit={handleBroadcast}>
                            <div className="form-group">
                                <label>Target Audience</label>
                                <select className="form-control" value={broadcast.targetRole} onChange={e => setBroadcast({ ...broadcast, targetRole: e.target.value })}>
                                    <option value="all">All Users</option>
                                    <option value="user">Regular Buyers Only</option>
                                    <option value="dealer">Dealers Only</option>
                                    <option value="verified_seller">Verified Sellers Only</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Channel</label>
                                <select className="form-control" value={broadcast.channel} onChange={e => setBroadcast({ ...broadcast, channel: e.target.value })}>
                                    <option value="email">Email Only</option>
                                    <option value="sms">SMS Only</option>
                                    <option value="both">Both Email & SMS</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input className="form-control" placeholder="Notification Subject" value={broadcast.subject} onChange={e => setBroadcast({ ...broadcast, subject: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Message Content</label>
                                <textarea className="form-control" rows={5} placeholder="Write your announcement here..." value={broadcast.message} onChange={e => setBroadcast({ ...broadcast, message: e.target.value })} required />
                            </div>
                            <button className="btn btn-primary" type="submit" disabled={sending}>
                                {sending ? 'Sending...' : <><FiSend /> Send Broadcast</>}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div>
                        <h3 style={{ marginBottom: 20 }}>Finance Partners</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>Manage accredited financing institutions displayed to buyers.</p>
                        <div className="partners-list">
                            {partners.map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 8, marginBottom: 10 }}>
                                    <span style={{ fontWeight: 500 }}>{p}</span>
                                    <button className="icon-btn delete" onClick={() => setPartners(partners.filter((_, idx) => idx !== i))}>&times;</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <input className="form-control" placeholder="New Partner Name" id="new-partner" />
                            <button className="btn btn-secondary btn-sm" onClick={() => {
                                const val = document.getElementById('new-partner').value;
                                if (val) { setPartners([...partners, val]); document.getElementById('new-partner').value = ''; }
                            }}>Add Partner</button>
                        </div>
                    </div>
                )}

                {activeTab === 'seo' && (
                    <div>
                        <h3 style={{ marginBottom: 20 }}>SEO Settings</h3>
                        <div className="form-group"><label>Meta Title</label><input className="form-control" value={seo.metaTitle} onChange={e => setSeo({ ...seo, metaTitle: e.target.value })} /></div>
                        <div className="form-group"><label>Meta Description</label><textarea className="form-control" rows={3} value={seo.metaDescription} onChange={e => setSeo({ ...seo, metaDescription: e.target.value })} /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <input type="checkbox" id="sitemap" checked={seo.generateSitemap} onChange={e => setSeo({ ...seo, generateSitemap: e.target.checked })} />
                            <label htmlFor="sitemap">Auto-generate sitemap.xml</label>
                        </div>
                        <button className="btn btn-primary" onClick={() => save('SEO')}><FiSave /> Save SEO Settings</button>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div>
                        <h3 style={{ marginBottom: 20 }}>Email Templates</h3>
                        {['Welcome Email', 'Password Reset', 'Order Confirmation', 'Listing Approved'].map(tpl => (
                            <div key={tpl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 500 }}>{tpl}</span>
                                <button className="btn btn-secondary btn-sm" onClick={() => toast.info(`Editing: ${tpl}`)}>Edit Template</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div>
                        <h3 style={{ marginBottom: 20 }}>Payment Gateways</h3>
                        {['Stripe', 'PayPal', 'Bank Transfer'].map(gw => (
                            <div key={gw} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <strong>{gw}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                        {gw === 'Stripe' ? 'Configured' : gw === 'PayPal' ? 'Not configured' : 'Enabled'}
                                    </div>
                                </div>
                                <button className="btn btn-secondary btn-sm" onClick={() => toast.info(`Configure ${gw}`)}>Configure</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'security' && (
                    <div>
                        <h3 style={{ marginBottom: 20 }}>Security Settings</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <input type="checkbox" id="2fa" checked={security.twoFactor} onChange={e => setSecurity({ ...security, twoFactor: e.target.checked })} />
                            <label htmlFor="2fa">Enable Two-Factor Authentication for Admins</label>
                        </div>
                        <div className="form-group"><label>IP Whitelist (comma separated)</label><input className="form-control" placeholder="e.g. 192.168.1.1, 10.0.0.1" value={security.ipWhitelist} onChange={e => setSecurity({ ...security, ipWhitelist: e.target.value })} /></div>
                        <div className="form-group"><label>Session Timeout (minutes)</label><input type="number" className="form-control" value={security.sessionTimeout} onChange={e => setSecurity({ ...security, sessionTimeout: e.target.value })} style={{ width: 120 }} /></div>
                        <button className="btn btn-primary" onClick={() => save('Security')}><FiSave /> Save Security Settings</button>
                    </div>
                )}
            </div>
        </div>
    );
}
