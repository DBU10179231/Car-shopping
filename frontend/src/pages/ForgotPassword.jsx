import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiMail } from 'react-icons/fi';
import './Auth.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
            toast.success('Reset email sent successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <h2 className="auth-title">Reset Password</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, textAlign: 'center', lineHeight: 1.5 }}>
                    {success ? 'Check your email inbox. We have sent a secure link to reset your password.' : 'Enter your registered email address and we will send you a link to reset your password.'}
                </p>

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <FiMail className="input-icon" />
                                <input required type="email" className="form-control" style={{ paddingLeft: 42 }} placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 24 }}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <p className="auth-switch">
                    Remembered your password? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
