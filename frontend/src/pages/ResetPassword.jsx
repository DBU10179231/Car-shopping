import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiLock, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import './Auth.css';

export default function ResetPassword() {
    const { token: urlToken } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [token, setToken] = useState(urlToken || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [validating, setValidating] = useState(true);
    const [email, setEmail] = useState('');

    useEffect(() => {
        // If token comes from location state (e.g. redirected from OTP verification)
        if (location.state?.token) {
            setToken(location.state.token);
            setEmail(location.state.email || '');
        }
    }, [location]);

    useEffect(() => {
        if (token) {
            validateToken();
        } else {
            setValidating(false);
            setIsValidToken(false);
        }
    }, [token]);

    const validateToken = async () => {
        try {
            const res = await api.get(`/auth/validate-reset-token/${token}`);
            if (res.data.status === 'success') {
                setIsValidToken(true);
            } else {
                setIsValidToken(false);
            }
        } catch (err) {
            console.error('Token validation error:', err);
            setIsValidToken(false);
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }

        if (password.length < 8) {
            return toast.error('Password must be at least 8 characters long');
        }

        // Complexity check
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            return toast.error('Password must include uppercase, lowercase, number, and special character');
        }

        setLoading(true);
        try {
            await api.put(`/auth/reset-password/${token}`, { password });
            toast.success('Password reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="auth-page">
                <div className="auth-card card text-center">
                    <FiLoader className="spinner" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 16 }} />
                    <p>Validating reset token...</p>
                </div>
            </div>
        );
    }

    if (!isValidToken) {
        return (
            <div className="auth-page">
                <div className="auth-card card text-center">
                    <FiXCircle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: 16 }} />
                    <h2 className="auth-title">Invalid or Expired Link</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                        The password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link to="/forgot-password" style={{ display: 'block', marginBottom: 12 }} className="btn btn-primary">
                        Request New Link
                    </Link>
                    <Link to="/login" className="btn btn-outline" style={{ display: 'block' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="text-center mb-4">
                    <div className="token-verified-badge">
                        <FiCheckCircle /> Token Verified
                    </div>
                </div>
                
                <h2 className="auth-title">Reset Your Password</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, textAlign: 'center' }}>
                    {email ? `For account: ${email}` : 'Enter your new strong password below.'}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock className="input-icon" />
                            <input 
                                required 
                                type="password" 
                                className="form-control" 
                                style={{ paddingLeft: 42 }} 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                disabled={loading}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            At least 8 chars, uppercase, lowercase, number & symbol.
                        </p>
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label>Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock className="input-icon" />
                            <input 
                                required 
                                type="password" 
                                className="form-control" 
                                style={{ paddingLeft: 42 }} 
                                placeholder="••••••••" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 24 }}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-switch" style={{ marginTop: 24 }}>
                    <Link to="/login">Back to Sign In</Link>
                </p>
            </div>
        </div>
    );
}
