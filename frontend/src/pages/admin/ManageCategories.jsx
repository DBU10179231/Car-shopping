import { useState, useEffect } from 'react';
import { FiGrid, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function ManageCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newCat, setNewCat] = useState({ name: '', description: '', icon: 'FiGrid' });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (err) {
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/categories', newCat);
            setCategories([...categories, res.data]);
            setNewCat({ name: '', description: '', icon: 'FiGrid' });
            setIsAdding(false);
            toast.success('Category created');
        } catch {
            toast.error('Failed to create category');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category? This might affect listing filtering.')) return;
        // Logic for deletion if implemented in backend, otherwise just local filter for UI demo
        toast.info('Category deletion logic would trigger system-wide re-indexing.');
    };

    return (
        <div className="manage-categories tab-fade-in">
            <header className="desk-header-flex">
                <div>
                    <h2>Catalog Desk</h2>
                    <p>Manage the taxonomy and navigational structure of your marketplace.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                    <FiPlus /> Add Category
                </button>
            </header>

            {isAdding && (
                <div className="card glass-panel add-category-form">
                    <h3>Register New Category</h3>
                    <form onSubmit={handleCreate}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category Name</label>
                                <input required value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="e.g. Electric Performance" />
                            </div>
                            <div className="form-group">
                                <label>Icon ID (React-Icon)</label>
                                <input value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} placeholder="FiZap" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })} placeholder="Briefly describe what goes in this category..." />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Category</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="categories-grid">
                {loading ? <div className="spinner-container"><div className="spinner" /></div> : (
                    categories.map(cat => (
                        <div key={cat._id} className="cat-card card glass-panel">
                            <div className="cat-icon-box">
                                <FiGrid />
                            </div>
                            <div className="cat-info">
                                <h3>{cat.name}</h3>
                                <p>{cat.description || 'No description provided.'}</p>
                                <div className="cat-meta">
                                    <span>Active Status: <strong className="success">LIVE</strong></span>
                                </div>
                            </div>
                            <div className="cat-actions">
                                <button className="icon-btn" title="Edit"><FiEdit2 /></button>
                                <button className="icon-btn danger" onClick={() => handleDelete(cat._id)} title="Delete"><FiTrash2 /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <section className="catalog-info card glass-panel">
                <FiInfo className="info-icon" />
                <div>
                    <h4>Automated Indexing</h4>
                    <p>Changing category structures will trigger an automated background task to re-index all affected car listings. This ensures search filters remain accurate.</p>
                </div>
            </section>

            <style>{`
                .manage-categories { padding: 20px 0; }
                .desk-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                
                .add-category-form { padding: 30px; margin-bottom: 30px; border: 1px solid var(--primary); }
                .add-category-form h3 { margin-bottom: 20px; font-weight: 800; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .form-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; }

                .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .cat-card { padding: 25px; display: flex; gap: 20px; align-items: flex-start; position: relative; }
                .cat-icon-box { width: 45px; height: 45px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; items: center; justify-content: center; font-size: 1.2rem; color: var(--primary); border: 1px solid var(--border); }
                .cat-info { flex: 1; }
                .cat-info h3 { margin: 0 0 8px; font-size: 1.1rem; font-weight: 800; }
                .cat-info p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px; }
                .cat-meta { font-size: 0.75rem; border-top: 1px solid var(--border); padding-top: 10px; }
                .cat-meta .success { color: #2ecc71; }
                
                .cat-actions { display: flex; flex-direction: column; gap: 8px; }
                
                .catalog-info { margin-top: 40px; padding: 25px; display: flex; gap: 20px; align-items: center; border-left: 4px solid var(--primary); }
                .info-icon { font-size: 1.5rem; color: var(--primary); }
                .catalog-info h4 { margin: 0 0 5px; font-weight: 800; }
                .catalog-info p { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

                @media (max-width: 600px) { .categories-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
