import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiLock } from 'react-icons/fi';
import './Auth.css';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            await api.put(`/auth/reset-password/${token}`, { password });
            toast.success('Password has been reset successfully');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid or expired token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <h2 className="auth-title">Create New Password</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, textAlign: 'center' }}>Enter your new strong password below.</p>

                <form onSubmit={handleSubmit}>
                    <input type="text" name="username" style={{ display: 'none' }} autoComplete="username" />
                    <div className="form-group">
                        <label>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock className="input-icon" />
                            <input required type="password" autoComplete="new-password" minLength={6} className="form-control" style={{ paddingLeft: 42 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label>Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock className="input-icon" />
                            <input required type="password" autoComplete="new-password" minLength={6} className="form-control" style={{ paddingLeft: 42 }} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 24 }}>
                        {loading ? 'Saving...' : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-switch" style={{ marginTop: 24 }}>
                    <Link to="/login">Back to Sign In</Link>
                </p>
            </div>
        </div>
    );
}
