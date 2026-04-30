import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiUser, FiShoppingBag } from 'react-icons/fi';
import './Auth.css';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(form.password)) {
            toast.error('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/register', form);
            login(res.data);
            toast.success('Account created! Welcome aboard 🎉');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-logo"><FiShoppingBag /><span>AutoMarket</span></div>
                <h2>Create Account</h2>
                <p className="auth-sub">Join AutoMarket and find your perfect car</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-icon">
                            <FiUser />
                            <input className="form-control" type="text" name="name" autoComplete="name" placeholder="John Doe"
                                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-icon">
                            <FiMail />
                            <input className="form-control" type="email" name="email" autoComplete="username" placeholder="you@example.com"
                                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-icon">
                            <FiLock />
                            <input className="form-control" type="password" name="password" autoComplete="new-password" placeholder="Min 8 characters, 1 Uppercase, 1 Number, 1 Special"
                                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
                        </div>
                        <small style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                            Must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, & 1 special (@$!%*?&)
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Account Type</label>
                        <div className="role-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                            <button
                                type="button"
                                className={`btn ${form.role === 'user' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setForm(f => ({ ...f, role: 'user' }))}
                                style={{ padding: '10px', fontSize: '0.85rem' }}
                            >
                                <FiUser style={{ marginRight: '8px' }} /> Individual Buyer
                            </button>
                            <button
                                type="button"
                                className={`btn ${form.role === 'dealer' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setForm(f => ({ ...f, role: 'dealer' }))}
                                style={{ padding: '10px', fontSize: '0.85rem' }}
                            >
                                <FiShoppingBag style={{ marginRight: '8px' }} /> Dealer / Seller
                            </button>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
