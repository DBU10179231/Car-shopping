import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiSend, FiPaperclip, FiInfo, FiArrowLeft, FiX } from 'react-icons/fi';
import './Support.css';

export default function NewTicket() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        category: 'General',
        priority: 'medium',
        description: ''
    });
    const [attachments, setAttachments] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (attachments.length + files.length > 5) {
            return toast.error('Maximum 5 attachments allowed');
        }
        setAttachments([...attachments, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('subject', formData.subject);
        data.append('category', formData.category);
        data.append('priority', formData.priority);
        data.append('description', formData.description);
        attachments.forEach(file => data.append('attachments', file));

        try {
            await api.post('/tickets', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Support ticket created successfully');
            navigate('/hub'); // Or to a ticket list page if we add one
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="support-page fade-in">
            <div className="container narrow">
                <button onClick={() => navigate(-1)} className="back-btn-minimal">
                    <FiArrowLeft /> Back
                </button>

                <div className="glass-card support-form-card">
                    <div className="card-header">
                        <FiInfo className="header-icon" />
                        <div>
                            <h1>Open Support Ticket</h1>
                            <p>Our concierge team will review your inquiry within 24 hours.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="premium-form">
                        <div className="form-group">
                            <label>Inquiry Subject</label>
                            <input
                                type="text"
                                placeholder="e.g. Issue with payment verification"
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="General">General Inquiry</option>
                                    <option value="Technical">Technical Issue</option>
                                    <option value="Billing">Billing & Payments</option>
                                    <option value="Account">Account Access</option>
                                    <option value="Feedback">Feedback</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority Level</label>
                                <select
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Detailed Description</label>
                            <textarea
                                rows={6}
                                placeholder="Please provide as much detail as possible..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Attachments (Max 5)</label>
                            <div className="attachment-zone">
                                <input
                                    type="file"
                                    id="file-upload"
                                    multiple
                                    onChange={handleFileChange}
                                    hidden
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <label htmlFor="file-upload" className="upload-trigger">
                                    <FiPaperclip /> Click to attach files or screenshots
                                </label>
                                
                                {attachments.length > 0 && (
                                    <div className="file-previews">
                                        {attachments.map((file, i) => (
                                            <div key={i} className="file-chip">
                                                <span>{file.name}</span>
                                                <button type="button" onClick={() => removeAttachment(i)}><FiX /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? <span className="loader" /> : <><FiSend /> Submit Ticket</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
