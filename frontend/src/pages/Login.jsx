import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiUser, FiLock, FiShoppingBag } from 'react-icons/fi';
import './Auth.css';

export default function Login() {
    const [form, setForm] = useState({ username: '', password: '', rememberMe: false });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', form);
            login(res.data);
            toast.success(`Welcome back, ${res.data.name}!`);

            if (res.data.role === 'admin' || res.data.role === 'super_admin') {
                navigate('/admin/dashboard');
            } else if (res.data.role === 'dealer') {
                navigate('/seller/dashboard');
            } else {
                navigate('/profile');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div className="auth-logo"><FiShoppingBag /><span>AutoMarket</span></div>
                <h2>Welcome Back</h2>
                <p className="auth-sub">Sign in to your account to continue</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username or Email</label>
                        <div className="input-icon">
                            <FiUser />
                            <input 
                                className="form-control" 
                                type="text" 
                                name="username" 
                                autoComplete="username" 
                                placeholder="Enter username or email"
                                value={form.username} 
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <FiLock className="input-icon" />
                            <input 
                                required 
                                type="password" 
                                autoComplete="current-password" 
                                minLength={6} 
                                className="form-control" 
                                style={{ paddingLeft: 42 }} 
                                placeholder="••••••••"
                                value={form.password} 
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={form.rememberMe} 
                                    onChange={e => setForm(f => ({ ...f, rememberMe: e.target.checked }))} 
                                />
                                Remember Me
                            </label>
                            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Forgot Password?</Link>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: 24 }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}
