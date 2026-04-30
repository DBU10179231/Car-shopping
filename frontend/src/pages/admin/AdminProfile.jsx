import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiCamera, FiUser } from 'react-icons/fi';
import { sanitizeImageUrl } from '../../utils/imageUtils';

// Version: 1.0.1 (Forced Refresh)
export default function AdminProfile() {
    const { user, login } = useAuth(); // login function from context acts as setUser if we pass the payload
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loadingPic, setLoadingPic] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setLoadingPic(true);
        try {
            const res = await api.put('/auth/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Profile photo updated!');
            // Update context and local storage
            const updatedUser = { ...user, profilePhoto: res.data.profilePhoto };
            login(updatedUser);
        } catch (err) {
            toast.error('Failed to upload photo');
        } finally {
            setLoadingPic(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        setLoadingPass(true);
        try {
            const res = await api.put('/auth/update-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            toast.success('Password updated successfully!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });

            const updatedUser = { ...user, token: res.data.token };
            login(updatedUser);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password update failed');
        } finally {
            setLoadingPass(false);
        }
    };

    return (
        <div className="admin-profile-container" style={{ width: '100%' }}>
            <h1 className="page-title">Profile Settings</h1>

            {!user?.profilePhoto && (
                <div className="card" style={{ padding: '16px 24px', background: 'rgba(230, 57, 70, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', marginBottom: 24, color: 'var(--primary)' }}>
                    <p><strong>Heads up!</strong> You haven't uploaded a profile photo yet. Please upload one below to complete your admin identity.</p>
                </div>
            )}

            <div className="card" style={{ padding: 32, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32 }}>
                <label htmlFor="photo-upload" className="avatar-upload-wrapper" style={{ width: 120, height: 120 }}>
                    <div className="avatar-upload-overlay">
                        <FiCamera />
                    </div>
                    {user?.profilePhoto ? (
                        <img
                            src={sanitizeImageUrl(user.profilePhoto, 'avatar')}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="avatar-default" style={{ width: '100%', height: '100%', fontSize: '3rem' }}>
                            <FiUser />
                        </div>
                    )}
                </label>
                <input id="photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={loadingPic} />
                <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{user?.name}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                    <span className="badge badge-gold" style={{ marginTop: 12, display: 'inline-block' }}>Super Admin</span>
                </div>
            </div>

            <div className="card" style={{ padding: 32 }}>
                <h3 style={{ marginBottom: 24 }}>Change Password</h3>
                <form onSubmit={handlePasswordUpdate}>
                    <input type="text" name="username" defaultValue={user?.email} style={{ display: 'none' }} autoComplete="username" />
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label>Current Password</label>
                        <input required type="password" name="current-password" autoComplete="current-password" className="form-control" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>New Password</label>
                            <input required type="password" name="new-password" autoComplete="new-password" className="form-control" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Confirm New Password</label>
                            <input required type="password" name="confirm-password" autoComplete="new-password" className="form-control" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loadingPass}>
                        {loadingPass ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div >
    );
}
