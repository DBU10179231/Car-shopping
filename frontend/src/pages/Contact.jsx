import { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Contact.css';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate a network request
        setTimeout(() => {
            setLoading(false);
            toast.success('Message sent! We\'ll get back to you shortly.');
            setForm({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    return (
        <div className="contact-page">
            {/* Hero */}
            <section className="contact-hero">
                <div className="contact-hero-content">
                    <h1>Get in <span className="gradient-text">Touch</span></h1>
                    <p>Have a question, feedback, or want to partner with us? We'd love to hear from you.</p>
                </div>
                <div className="contact-hero-image-wrapper">
                    <img
                        src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&h=400&fit=crop"
                        alt="Contact AutoMarket"
                        className="contact-hero-image"
                    />
                    <div className="contact-hero-overlay" />
                </div>
            </section>

            {/* Contact Body */}
            <section className="contact-body container">
                {/* Info Cards */}
                <div className="contact-info">
                    <h2>Contact Information</h2>
                    <p>Reach out to us through any of the channels below or fill in the form and we'll respond within 24 hours.</p>
                    <div className="contact-info-cards">
                        <div className="contact-info-card">
                            <FiMail className="contact-info-icon" />
                            <div>
                                <strong>Email</strong>
                                <p>support@automarket.com</p>
                            </div>
                        </div>
                        <div className="contact-info-card">
                            <FiPhone className="contact-info-icon" />
                            <div>
                                <strong>Phone</strong>
                                <p>+1 (800) 555-0199</p>
                            </div>
                        </div>
                        <div className="contact-info-card">
                            <FiMapPin className="contact-info-icon" />
                            <div>
                                <strong>Address</strong>
                                <p>123 AutoMarket Ave, San Francisco, CA 94103</p>
                            </div>
                        </div>
                    </div>
                    <div className="contact-map-image-wrapper">
                        <img
                            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=300&fit=crop"
                            alt="AutoMarket office"
                            className="contact-map-image"
                        />
                    </div>
                </div>

                {/* Form */}
                <div className="contact-form-wrapper">
                    <h2>Send Us a Message</h2>
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="form-control" type="text" placeholder="John Doe" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input className="form-control" type="email" placeholder="you@example.com" value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <input className="form-control" type="text" placeholder="How can we help?" value={form.subject}
                                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea className="form-control" rows={6} placeholder="Tell us more..." value={form.message}
                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
                        </div>
                        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                            {loading ? 'Sending...' : <><FiSend style={{ marginRight: 8 }} />Send Message</>}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}
