import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
    FiSave, FiUpload, FiCheckCircle, FiFileText,
    FiShield, FiInfo, FiBriefcase, FiMapPin,
    FiMessageSquare, FiTrendingUp
} from 'react-icons/fi';

export default function SellerProfile() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        phone: '',
        sellerType: 'private',
        sellerBio: '',
        shopName: '',
        shopLogo: '',
        autoResponse: '',
        address: { street: '', city: '', state: '', zip: '' }
    });

    useEffect(() => {
        api.get('/auth/profile')
            .then(res => {
                const p = res.data;
                setProfile({
                    name: p.name || '',
                    phone: p.phone || '',
                    sellerType: p.sellerType || 'private',
                    sellerBio: p.sellerBio || '',
                    shopName: p.shopName || '',
                    shopLogo: p.shopLogo || '',
                    autoResponse: p.autoResponse || '',
                    address: p.address || { street: '', city: '', state: '', zip: '' }
                });
                setLoading(false);
            })
            .catch(err => {
                toast.error('Failed to sync identity data');
                setLoading(false);
            });
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put('/seller/profile', profile);
            toast.success('Enterprise profile synchronized');
        } catch (err) {
            toast.error('Synchronization failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDocUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(f => formData.append('docs', f));

        try {
            const res = await api.post('/seller/upload-docs', formData);
            await api.put('/seller/profile', { verificationDocs: res.data.paths });
            toast.success('Verification assets queued for review');
        } catch (err) {
            toast.error('Asset upload failed');
        }
    };

    if (loading) return <div className="spinner" style={{ margin: '60px auto' }} />;

    return (
        <div className="fade-in profile-suite" style={{ paddingBottom: 60 }}>
            {/* Identity Header */}
            <div className="suite-header card glass-panel" style={{ padding: '30px 40px', marginBottom: 40, border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, mb: 5 }}>Business <span className="gradient-text">Profile</span></h1>
                        <p style={{ color: 'var(--text-muted)' }}>Provide your personal or business details for buyer trust (Point 1).</p>
                    </div>
                    <div className="badge-display">
                        <div className="verified-badge">
                            <FiShield size={18} /> Verified Partner
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-layout">
                <div className="form-section card glass-panel">
                    <form onSubmit={handleUpdate}>
                        <div className="section-group">
                            <h3 className="section-title"><FiBriefcase /> Business Foundation</h3>
                            <div className="input-grid">
                                <div className="field">
                                    <label>Primary Contact Name</label>
                                    <input className="suite-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                                </div>
                                <div className="field">
                                    <label>Dealer Classification</label>
                                    <select className="suite-input" value={profile.sellerType} onChange={e => setProfile({ ...profile, sellerType: e.target.value })}>
                                        <option value="private">Private Individual</option>
                                        <option value="dealership">Dealership</option>
                                        <option value="broker">Certified Broker</option>
                                        <option value="importer_exporter">Importer/Exporter</option>
                                    </select>
                                </div>
                            </div>
                            <div className="field full">
                                <label>Showroom / Business Name (Display)</label>
                                <input className="suite-input" value={profile.shopName} onChange={e => setProfile({ ...profile, shopName: e.target.value })} placeholder="e.g. Star Motors Addis" />
                            </div>
                        </div>

                        <div className="section-group">
                            <h3 className="section-title"><FiInfo /> Professional Context</h3>
                            <div className="field full">
                                <label>Business Bio / Value Proposition</label>
                                <textarea className="suite-input" rows="4" value={profile.sellerBio} onChange={e => setProfile({ ...profile, sellerBio: e.target.value })} placeholder="Describe your dealership's legacy and commitment to clients..." />
                            </div>
                            <div className="field full">
                                <label>A.I. Smart-Response Template</label>
                                <textarea className="suite-input" rows="2" value={profile.autoResponse} onChange={e => setProfile({ ...profile, autoResponse: e.target.value })} placeholder="Automated greeting for incoming leads..." />
                                <span className="hint">This message will be sent instantly to potential buyers who inquire about your vehicles.</span>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-suite-primary" disabled={submitting}>
                                <FiSave /> {submitting ? 'Propagating...' : 'Sync Profile Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="sidebar-section">
                    <div className="card glass-panel sidebar-card">
                        <h3>Trust Level</h3>
                        <div className="trust-meter">
                            <div className="meter-fill" style={{ width: '85%' }}></div>
                        </div>
                        <div className="verification-steps">
                            <div className="v-step active"><FiCheckCircle /> Basic Authentication</div>
                            <div className="v-step active"><FiCheckCircle /> Connectivity Core</div>
                            <div className="v-step"><FiCheckCircle /> Enterprise Verification</div>
                        </div>
                        <label className="btn-upload">
                            <FiUpload /> Update Credentials
                            <input type="file" multiple style={{ display: 'none' }} onChange={handleDocUpload} />
                        </label>
                    </div>

                    <div className="card glass-panel sidebar-card guideline-card">
                        <h3><FiTrendingUp /> Growth Guidelines</h3>
                        <div className="tip-item">
                            <div className="bullet"></div>
                            <p><strong>Visual Impact:</strong> Listings with 10+ 4K photos have 65% higher conversion.</p>
                        </div>
                        <div className="tip-item">
                            <div className="bullet"></div>
                            <p><strong>Response Velocity:</strong> Replying within 15 minutes secures the lead.</p>
                        </div>
                        <div className="tip-item">
                            <div className="bullet"></div>
                            <p><strong>Metadata:</strong> Fill 100% of technical specs to appear in advanced searches.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .profile-suite { color: var(--text); }
                .glass-panel {
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border) !important;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.2) !important;
                }
                
                .badge-display { display: flex; align-items: center; }
                .verified-badge { 
                    background: rgba(42, 157, 143, 0.1); color: #2a9d8f;
                    padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.85rem;
                    display: flex; align-items: center; gap: 8px; border: 1px solid rgba(42, 157, 143, 0.2);
                }
                
                .profile-layout { display: grid; grid-template-columns: 1fr 340px; gap: 30px; }
                .section-group { margin-bottom: 40px; }
                .section-title { 
                    font-size: 1.1rem; font-weight: 900; margin-bottom: 25px; 
                    display: flex; align-items: center; gap: 10px; color: var(--primary);
                }
                
                .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .field { display: flex; flex-direction: column; gap: 8px; }
                .field label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
                .suite-input {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
                    padding: 14px 18px; border-radius: 12px; color: white; outline: none; transition: all 0.2s;
                    font-size: 0.95rem;
                }
                .suite-input:focus { border-color: var(--primary); background: rgba(255,255,255,0.05); }
                .hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 5px; font-style: italic; }
                
                .form-actions { padding-top: 30px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }
                .btn-suite-primary {
                    background: var(--primary); color: white; border: none; padding: 16px 32px;
                    border-radius: 14px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px;
                    box-shadow: 0 10px 20px rgba(230, 57, 70, 0.2); transition: all 0.2s;
                }
                .btn-suite-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(230, 57, 70, 0.3); }
                
                .sidebar-card { padding: 30px; border-radius: 24px; margin-bottom: 30px; }
                .sidebar-card h3 { font-size: 1rem; font-weight: 800; margin-bottom: 20px; }
                
                .trust-meter { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; margin-bottom: 25px; overflow: hidden; }
                .meter-fill { height: 100%; background: var(--primary); }
                
                .verification-steps { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
                .v-step { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
                .v-step.active { color: #2a9d8f; }
                
                .btn-upload {
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    background: rgba(255,255,255,0.03); border: 1px dashed var(--border);
                    padding: 15px; border-radius: 15px; cursor: pointer; transition: all 0.2s;
                    font-weight: 700; font-size: 0.85rem;
                }
                .btn-upload:hover { background: rgba(255,255,255,0.05); border-color: var(--primary); }
                
                .guideline-card h3 { color: var(--primary); display: flex; align-items: center; gap: 8px; }
                .tip-item { display: flex; gap: 12px; margin-bottom: 15px; }
                .tip-item .bullet { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); margin-top: 6px; flex-shrink: 0; }
                .tip-item p { margin: 0; font-size: 0.8rem; line-height: 1.5; color: var(--text-muted); }
                .tip-item strong { color: var(--text); }
            `}</style>
        </div>
    );
}
