import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSend, FiPaperclip, FiArrowLeft, FiX, FiPaperclip as FiFile } from 'react-icons/fi';
import './Support.css';

export default function TicketChat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [sending, setSending] = useState(false);
    const chatRef = useRef(null);

    const fetchTicket = async () => {
        try {
            const res = await api.get(`/tickets/${id}`);
            setTicket(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load ticket history');
            navigate('/support');
        }
    };

    useEffect(() => {
        fetchTicket();
        const interval = setInterval(fetchTicket, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [ticket?.messages]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!reply.trim() && attachments.length === 0) return;

        setSending(true);
        const data = new FormData();
        data.append('content', reply);
        attachments.forEach(file => data.append('attachments', file));

        try {
            const res = await api.post(`/tickets/${id}/reply`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTicket(res.data);
            setReply('');
            setAttachments([]);
            toast.success('Reply dispatched');
        } catch (err) {
            toast.error('Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

    return (
        <div className="support-page fade-in">
            <div className="container narrow">
                <button onClick={() => navigate(-1)} className="back-btn-minimal">
                    <FiArrowLeft /> Back to Dashboard
                </button>

                <div className="glass-card ticket-chat-card">
                    <div className="ticket-header">
                        <div className="ticket-meta">
                            <h2>{ticket.subject}</h2>
                            <div className="details">
                                <span className={`badge-minimal ${ticket.status}`}>{ticket.status.toUpperCase()}</span>
                                <span className="dot" /> Category: {ticket.category}
                                <span className="dot" /> Priority: {ticket.priority}
                            </div>
                        </div>
                        <div className="ticket-id">#{ticket._id.slice(-6).toUpperCase()}</div>
                    </div>

                    <div className="chat-history" ref={chatRef}>
                        {ticket.messages.map((msg, i) => {
                            const isOwn = msg.sender._id === user._id;
                            const isAdminMsg = msg.sender.role === 'admin' || msg.sender.role === 'super_admin';

                            return (
                                <div key={i} className={`ticket-msg ${isOwn ? 'own' : (isAdminMsg ? 'admin' : 'other')}`}>
                                    <div className="msg-bubble">
                                        {!isOwn && <div className="sender-name">{msg.sender.name} {isAdminMsg && <span className="admin-tag">ADMIN</span>}</div>}
                                        <p>{msg.content}</p>
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="msg-attachments">
                                                {msg.attachments.map((url, j) => (
                                                    <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="msg-attachment">
                                                        <FiFile /> Attachment {j + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="msg-time">
                                        {new Date(msg.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="chat-input-area">
                        {attachments.length > 0 && (
                            <div className="file-previews" style={{ marginBottom: 15 }}>
                                {attachments.map((file, i) => (
                                    <div key={i} className="file-chip">
                                        <span>{file.name}</span>
                                        <button onClick={() => setAttachments(attachments.filter((_, j) => i !== j))}><FiX /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleSendReply} className="chat-input-wrapper">
                            <input
                                type="file"
                                id="reply-file"
                                multiple
                                onChange={handleFileChange}
                                hidden
                                accept="image/*,.pdf,.doc,.docx"
                            />
                            <label htmlFor="reply-file" className="icon-btn-minimal">
                                <FiPaperclip />
                            </label>
                            <textarea
                                rows={1}
                                placeholder="Write your reply..."
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply(e);
                                    }
                                }}
                            />
                            <button type="submit" className="send-btn-chat" disabled={sending || (!reply.trim() && attachments.length === 0)}>
                                {sending ? <span className="loader-mini" /> : <FiSend />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
