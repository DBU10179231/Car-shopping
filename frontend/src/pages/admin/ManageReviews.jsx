import { useState, useEffect } from 'react';
import { FiStar, FiTrash2, FiSearch, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function ManageReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/reviews');
            setReviews(res.data);
        } catch (err) {
            toast.error('Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const deleteReview = async (id) => {
        if (!window.confirm('Are you sure you want to remove this review? This action is permanent.')) return;
        try {
            await api.delete(`/admin/reviews/${id}`);
            setReviews(prev => prev.filter(r => r._id !== id));
            toast.success('Review removed successfully');
        } catch {
            toast.error('Failed to remove review');
        }
    };

    const filteredReviews = reviews.filter(r =>
        r.comment?.toLowerCase().includes(search.toLowerCase()) ||
        r.car?.make?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const averageRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : 0;

    return (
        <div className="manage-reviews tab-fade-in">
            <header className="desk-header-flex">
                <div>
                    <h2>Moderation Desk</h2>
                    <p>Enforce community standards by managing user-generated content.</p>
                </div>
                <div className="stats-group">
                    <div className="stat-pill card glass-panel">
                        <FiStar className="gold" />
                        <span>AVG Rating: <strong>{averageRating}</strong></span>
                    </div>
                    <div className="stat-pill card glass-panel">
                        <FiMessageSquare className="blue" />
                        <span>Total Reviews: <strong>{reviews.length}</strong></span>
                    </div>
                </div>
            </header>

            <div className="table-controls card glass-panel">
                <div className="search-box">
                    <FiSearch />
                    <input type="text" placeholder="Search comments, reviewers, or vehicle names..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-group">
                    <FiTrendingUp />
                    <span>Live Stream</span>
                </div>
            </div>

            <div className="reviews-masonry">
                {loading ? <div className="spinner-container"><div className="spinner" /></div> : (
                    filteredReviews.map(r => (
                        <div key={r._id} className="review-card card glass-panel">
                            <div className="review-header">
                                <div className="reviewer">
                                    <div className="avatar-small">{r.user?.name?.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <strong>{r.user?.name}</strong>
                                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="rating">
                                    {[...Array(5)].map((_, i) => (
                                        <FiStar key={i} className={i < r.rating ? 'active' : ''} />
                                    ))}
                                </div>
                            </div>
                            <div className="review-content">
                                <p className="car-tag">Ref: {r.car?.make} {r.car?.model} ({r.car?.year})</p>
                                <p className="comment">"{r.comment}"</p>
                            </div>
                            <div className="review-footer">
                                <button className="btn btn-icon delete" onClick={() => deleteReview(r._id)} title="Delete Review">
                                    <FiTrash2 />
                                </button>
                                <button className="btn btn-sm btn-secondary">Flag Content</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .manage-reviews { padding: 20px 0; }
                .desk-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .stats-group { display: flex; gap: 15px; }
                .stat-pill { display: flex; align-items: center; gap: 10px; padding: 10px 20px; border-radius: 50px; font-size: 0.9rem; }
                .stat-pill .gold { color: #f1c40f; }
                .stat-pill .blue { color: #3498db; }
                
                .reviews-masonry { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
                .review-card { padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--border); }
                .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                .reviewer { display: flex; gap: 12px; align-items: center; }
                .avatar-small { width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; }
                .reviewer div { display: flex; flex-direction: column; }
                .reviewer strong { font-size: 0.9rem; }
                .reviewer span { font-size: 0.7rem; color: var(--text-muted); }
                
                .rating .FiStar { font-size: 0.8rem; color: rgba(255,255,255,0.1); margin-left: 2px; }
                .rating .FiStar.active { color: #f1c40f; fill: #f1c40f; }
                
                .review-content { margin-bottom: 20px; }
                .car-tag { font-size: 0.75rem; font-weight: 800; color: var(--primary); margin-bottom: 8px; }
                .comment { font-size: 0.9rem; font-style: italic; color: var(--text-main); line-height: 1.5; }
                
                .review-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 15px; }
                .btn-icon.delete:hover { background: #e74c3c20; color: #e74c3c; border-color: #e74c3c; }

                @media (max-width: 800px) { .reviews-masonry { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
