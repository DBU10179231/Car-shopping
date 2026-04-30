import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiTrash2, FiPlus, FiFileText, FiImage, FiStar } from 'react-icons/fi';

const PAGES = [
    { id: 1, title: 'About Us', slug: '/about', lastEdited: '2026-02-28' },
    { id: 2, title: 'Contact', slug: '/contact', lastEdited: '2026-02-20' },
    { id: 3, title: 'Terms of Service', slug: '/terms', lastEdited: '2026-01-15' },
    { id: 4, title: 'Privacy Policy', slug: '/privacy', lastEdited: '2026-01-15' },
    { id: 5, title: 'FAQ', slug: '/faq', lastEdited: '2026-03-01' },
];

const BANNERS = [
    { id: 1, title: 'Summer Sale', active: true, clicks: 342, from: '2026-03-01', to: '2026-03-31' },
    { id: 2, title: 'New Arrivals', active: false, clicks: 128, from: '2026-02-15', to: '2026-02-28' },
];

const BLOG_POSTS = [
    { id: 1, title: '10 Tips for Buying Your First Car', category: 'Buying Guide', date: '2026-03-01', published: true },
    { id: 2, title: 'Electric Vehicles: Worth the Investment?', category: 'EV', date: '2026-02-20', published: true },
    { id: 3, title: 'How to Negotiate With Car Dealers', category: 'Tips', date: '2026-02-10', published: false },
];

export default function AdminContent() {
    const [activeSection, setActiveSection] = useState('pages');
    const [pages, setPages] = useState(PAGES);
    const [banners, setBanners] = useState(BANNERS);
    const [posts, setPosts] = useState(BLOG_POSTS);

    const SECTIONS = [
        { key: 'pages', label: 'Static Pages', icon: <FiFileText /> },
        { key: 'blog', label: 'Blog / News', icon: <FiEdit2 /> },
        { key: 'banners', label: 'Banners & Promos', icon: <FiImage /> },
    ];

    return (
        <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Content Management (CMS)</h1>
            <p className="page-subtitle" style={{ marginBottom: 24 }}>Manage static pages, blog posts, and promotional banners.</p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {SECTIONS.map(s => (
                    <button key={s.key} onClick={() => setActiveSection(s.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                            background: activeSection === s.key ? 'var(--primary)' : 'var(--bg-card)',
                            borderColor: activeSection === s.key ? 'var(--primary)' : 'var(--border)',
                            color: activeSection === s.key ? '#fff' : 'var(--text-muted)'
                        }}>
                        {s.icon} {s.label}
                    </button>
                ))}
            </div>

            {activeSection === 'pages' && (
                <div className="card admin-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Static Pages</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => toast.info('Create new page')}><FiPlus /> New Page</button>
                        </div>
                    </div>
                    <div className="admin-table">
                        <table>
                            <thead><tr><th>Page Title</th><th>URL Slug</th><th>Last Edited</th><th>Actions</th></tr></thead>
                            <tbody>
                                {pages.map(p => (
                                    <tr key={p.id}>
                                        <td><strong style={{ fontSize: '0.9rem' }}>{p.title}</strong></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.slug}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{p.lastEdited}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="icon-btn edit" title="Edit" onClick={() => toast.info(`Opening editor for: ${p.title}`)}><FiEdit2 /></button>
                                                <button className="icon-btn delete" title="Delete" onClick={() => { setPages(prev => prev.filter(x => x.id !== p.id)); toast.success('Page deleted'); }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSection === 'blog' && (
                <div className="card admin-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Blog & News</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => toast.info('Create new article')}><FiPlus /> New Article</button>
                        </div>
                    </div>
                    <div className="admin-table">
                        <table>
                            <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Published</th><th>Actions</th></tr></thead>
                            <tbody>
                                {posts.map(p => (
                                    <tr key={p.id}>
                                        <td><strong style={{ fontSize: '0.88rem' }}>{p.title}</strong></td>
                                        <td><span className="badge">{p.category}</span></td>
                                        <td style={{ fontSize: '0.82rem' }}>{p.date}</td>
                                        <td>
                                            <span className="badge" style={{ background: p.published ? 'rgba(42,157,143,0.15)' : 'rgba(230,57,70,0.15)', color: p.published ? '#2a9d8f' : '#e63946' }}>
                                                {p.published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="icon-btn edit" onClick={() => toast.info('Edit article')}><FiEdit2 /></button>
                                                <button className="icon-btn delete" onClick={() => { setPosts(prev => prev.filter(x => x.id !== p.id)); toast.success('Article deleted'); }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSection === 'banners' && (
                <div className="card admin-panel">
                    <div className="panel-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Banners & Promotions</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => toast.info('Add new banner')}><FiPlus /> Add Banner</button>
                        </div>
                    </div>
                    <div className="admin-table">
                        <table>
                            <thead><tr><th>Title</th><th>Duration</th><th>Clicks</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {banners.map(b => (
                                    <tr key={b.id}>
                                        <td><strong style={{ fontSize: '0.9rem' }}>{b.title}</strong></td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{b.from} → {b.to}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{b.clicks}</td>
                                        <td>
                                            <span className="badge" style={{ background: b.active ? 'rgba(42,157,143,0.15)' : 'rgba(230,57,70,0.15)', color: b.active ? '#2a9d8f' : '#e63946' }}>
                                                {b.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="icon-btn" style={{ color: '#e9c46a' }} title="Feature" onClick={() => toast.info('Banner featured')}><FiStar /></button>
                                                <button className="icon-btn delete" onClick={() => { setBanners(prev => prev.filter(x => x.id !== b.id)); toast.success('Banner removed'); }}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
