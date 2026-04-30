import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
    FiUser, FiMail, FiPhone, FiMapPin, FiCamera,
    FiShield, FiBell, FiEdit3, FiSave, FiX,
    FiChevronRight, FiCheckCircle, FiLock, FiSmartphone,
    FiGlobe, FiClock, FiSettings, FiActivity, FiArrowLeft
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { sanitizeImageUrl } from '../utils/imageUtils';
import './Profile.css';

export default function Profile() {
    const { user, login, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('identity');
    const [stats, setStats] = useState({ orders: 0, favorites: 0 });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zip: ''
        },
        notifications: {
            email: true,
            sms: false,
            inApp: true
        }
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/orders/mine') // Simple way to get some stats
            ]);

            const p = profileRes.data;
            setFormData({
                name: p.name || '',
                email: p.email || '',
                phone: p.phone || '',
                address: {
                    street: p.address?.street || '',
                    city: p.address?.city || '',
                    state: p.address?.state || '',
                    zip: p.address?.zip || ''
                },
                notifications: {
                    email: p.notificationPreferences?.email ?? true,
                    sms: p.notificationPreferences?.sms ?? false,
                    inApp: p.notificationPreferences?.inApp ?? true
                }
            });
            setStats({
                orders: statsRes.data.length,
                favorites: JSON.parse(localStorage.getItem('favorites') || '[]').length
            });
        } catch (err) {
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/auth/profile', {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                notificationPreferences: formData.notifications
            });
            login({ ...user, name: res.data.name, profilePhoto: res.data.profilePhoto });
            toast.success('Identity synchronized successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('avatar', file);

        toast.info('Uploading premium avatar...');
        try {
            const res = await api.put('/auth/upload-photo', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            login({ ...user, profilePhoto: res.data.profilePhoto });
            toast.success('Identity visual updated');
        } catch (err) {
            toast.error('Identity update failed');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return toast.error('Passwords do not match');
        }
        setSaving(true);
        try {
            await api.put('/auth/update-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast.success('Security credentials updated');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Security update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

    const navItems = [
        { id: 'identity', label: 'Identity & Bio', icon: <FiUser /> },
        { id: 'security', label: 'Security Hub', icon: <FiShield /> },
        { id: 'preferences', label: 'Preferences', icon: <FiBell /> },
        { id: 'system', label: 'System Access', icon: <FiGlobe /> }
    ];

    return (
        <div className="premium-profile-page fade-in">
            <div className="container">
                {/* Back Button / Header */}
                <div className="profile-top-nav">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <FiArrowLeft /> Back to Experience
                    </button>
                    <div className="system-badge">
                        <span className="dot" /> System Status: Optimal
                    </div>
                </div>

                <div className="profile-layout">
                    {/* Left Sidebar */}
                    <aside className="profile-sidebar">
                        <div className="glass-card identity-card">
                            <div className="avatar-container">
                                <img src={sanitizeImageUrl(user?.profilePhoto, 'avatar')} alt="Profile" />
                                <div className="avatar-overlay" onClick={() => fileInputRef.current.click()}>
                                    <FiCamera />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    hidden
                                    accept="image/*"
                                />
                            </div>
                            <h2>{user?.name}</h2>
                            <p className="user-email">{user?.email}</p>
                            <div className="role-chip">
                                <span className={`status-indicator ${user?.role === 'super_admin' ? 'gold' : 'blue'}`} />
                                {user?.role?.toUpperCase().replace('_', ' ')}
                            </div>

                            <div className="sidebar-stats">
                                <Link to="/buyer/dashboard" className="stat-item">
                                    <strong>{stats.orders}</strong>
                                    <span>Portfolio</span>
                                </Link>
                                <div className="stat-separator" />
                                <Link to="/favorites" className="stat-item">
                                    <strong>{stats.favorites}</strong>
                                    <span>Wishlist</span>
                                </Link>
                            </div>
                        </div>

                        <nav className="profile-nav glass-card">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    className={`profile-nav-item ${activeSection === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveSection(item.id)}
                                >
                                    <span className="icon">{item.icon}</span>
                                    <span className="label">{item.label}</span>
                                    <FiChevronRight className="arrow" />
                                </button>
                            ))}
                        </nav>

                        <button onClick={logout} className="logout-button glass-card">
                            <FiActivity /> Sign Out of All Services
                        </button>
                    </aside>

                    {/* Main Content Area */}
                    <main className="profile-main">
                        <div className="glass-card main-content-card">
                            {activeSection === 'identity' && (
                                <section className="section-fade">
                                    <div className="section-header">
                                        <div className="header-info">
                                            <h3>Identity & Bio</h3>
                                            <p>Manage your public-facing persona and verified contact details.</p>
                                        </div>
                                        <div className="section-icon"><FiUser /></div>
                                    </div>

                                    <form onSubmit={handleUpdateProfile} className="premium-form">
                                        <div className="form-grid">
                                            <div className="form-group full-width">
                                                <label>Legal Name</label>
                                                <div className="input-with-icon">
                                                    <FiUser className="input-icon" />
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        placeholder="Your full legal name"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Primary Email</label>
                                                <div className="input-with-icon disabled">
                                                    <FiMail className="input-icon" />
                                                    <input type="email" value={formData.email} disabled />
                                                    <span className="status-verify">VERIFIED</span>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Mobile Contact</label>
                                                <div className="input-with-icon">
                                                    <FiPhone className="input-icon" />
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        placeholder="+1 (555) 000-0000"
                                                    />
                                                </div>
                                            </div>

                                            <div className="section-divider full-width">Residential Address</div>

                                            <div className="form-group full-width">
                                                <label>Street Address</label>
                                                <div className="input-with-icon">
                                                    <FiMapPin className="input-icon" />
                                                    <input
                                                        type="text"
                                                        value={formData.address.street}
                                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                                        placeholder="Suite, Street Number"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>City</label>
                                                <input
                                                    type="text"
                                                    className="basic-input"
                                                    value={formData.address.city}
                                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>State / Region</label>
                                                <input
                                                    type="text"
                                                    className="basic-input"
                                                    value={formData.address.state}
                                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button type="submit" className="save-btn" disabled={saving}>
                                                {saving ? <span className="loader" /> : <><FiSave /> Sync Identity</>}
                                            </button>
                                        </div>
                                    </form>
                                </section>
                            )}

                            {activeSection === 'security' && (
                                <section className="section-fade">
                                    <div className="section-header">
                                        <div className="header-info">
                                            <h3>Security Hub</h3>
                                            <p>Manage your authentication layers and verify your access logs.</p>
                                        </div>
                                        <div className="section-icon security-glow"><FiShield /></div>
                                    </div>

                                    <div className="security-status-card">
                                        <div className="status-item">
                                            <FiSmartphone />
                                            <div className="text">
                                                <strong>Two-Factor Authentication</strong>
                                                <span>Enhanced protection via mobile secure-code.</span>
                                            </div>
                                            <button className="status-toggle active">ACTIVE</button>
                                        </div>
                                    </div>

                                    <div className="section-divider">Credential Update</div>

                                    <form onSubmit={handlePasswordChange} className="premium-form">
                                        <div className="form-group">
                                            <label>Current Authentication Trace</label>
                                            <div className="input-with-icon">
                                                <FiLock className="input-icon" />
                                                <input
                                                    type="password"
                                                    value={passwords.current}
                                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                                    placeholder="Existing password"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>New Secret Key</label>
                                                <input
                                                    type="password"
                                                    className="basic-input"
                                                    value={passwords.new}
                                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Confirm Identity Key</label>
                                                <input
                                                    type="password"
                                                    className="basic-input"
                                                    value={passwords.confirm}
                                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button type="submit" className="save-btn" disabled={saving}>
                                                {saving ? <span className="loader" /> : <><FiShield /> Update Security</>}
                                            </button>
                                        </div>
                                    </form>
                                </section>
                            )}

                            {activeSection === 'preferences' && (
                                <section className="section-fade">
                                    <div className="section-header">
                                        <div className="header-info">
                                            <h3>Communication Center</h3>
                                            <p>Tailor how the concierge interacts with you.</p>
                                        </div>
                                        <div className="section-icon preference-glow"><FiBell /></div>
                                    </div>

                                    <div className="preference-list">
                                        <div className="preference-item">
                                            <div className="pref-info">
                                                <FiMail />
                                                <div>
                                                    <strong>Digest Reports</strong>
                                                    <span>Weekly summaries of your portfolio trends.</span>
                                                </div>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.notifications.email}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        notifications: { ...formData.notifications, email: e.target.checked }
                                                    })}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>

                                        <div className="preference-item">
                                            <div className="pref-info">
                                                <FiSmartphone />
                                                <div>
                                                    <strong>Urgent SMS Dispatches</strong>
                                                    <span>Instant alerts for confirmed acquisitions.</span>
                                                </div>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.notifications.sms}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        notifications: { ...formData.notifications, sms: e.target.checked }
                                                    })}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button onClick={handleUpdateProfile} className="save-btn">
                                            <FiSave /> Sync Preferences
                                        </button>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'system' && (
                                <section className="section-fade">
                                    <div className="section-header">
                                        <div className="header-info">
                                            <h3>System Access</h3>
                                            <p>Verified nodes and session architecture details.</p>
                                        </div>
                                        <div className="section-icon"><FiGlobe /></div>
                                    </div>

                                    <div className="access-log">
                                        {[
                                            { device: 'Safari Web Environment', loc: 'Adama, ET', time: 'Active Now', icon: <FiGlobe /> },
                                            { device: 'Mobile Node Access', loc: 'Addis Ababa, ET', time: '6 hours ago', icon: <FiSmartphone /> }
                                        ].map((session, i) => (
                                            <div key={i} className="log-entry">
                                                <div className="log-icon">{session.icon}</div>
                                                <div className="log-details">
                                                    <strong>{session.device}</strong>
                                                    <span>{session.loc} • <FiClock /> {session.time}</span>
                                                </div>
                                                {i === 0 && <span className="current-badge">CURRENT</span>}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
