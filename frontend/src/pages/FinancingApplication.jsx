import { useState, useEffect } from 'react';
import { FiDollarSign, FiBriefcase, FiUser, FiCheckCircle, FiChevronRight, FiChevronLeft, FiInfo } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function FinancingApplication() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [car, setCar] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        ssn: '',
        phone: '',
        employer: '',
        jobTitle: '',
        yearsEmployed: '',
        annualIncome: '',
        downPayment: searchParams.get('downPayment') || '',
        loanAmount: searchParams.get('loanAmount') || '',
        creditScore: 'Good',
        provider: 'AutoMarket Direct',
        agreeToCreditCheck: false
    });

    const carId = searchParams.get('carId');

    useEffect(() => {
        if (carId) {
            api.get(`/cars/${carId}`).then(res => setCar(res.data)).catch(() => { });
        }
    }, [carId]);

    const handleNext = () => setStep(s => s + 1);
    const handlePrev = () => setStep(s => s - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/finance/apply', {
                carId,
                provider: formData.provider,
                personalInfo: {
                    fullName: formData.fullName,
                    dob: formData.dob,
                    ssn: formData.ssn,
                    phone: formData.phone
                },
                employmentInfo: {
                    employer: formData.employer,
                    jobTitle: formData.jobTitle,
                    yearsEmployed: Number(formData.yearsEmployed),
                    annualIncome: Number(formData.annualIncome)
                },
                financialInfo: {
                    downPayment: Number(formData.downPayment),
                    loanAmount: Number(formData.loanAmount),
                    creditScore: formData.creditScore
                }
            });
            toast.success("Application Submitted! Redirecting to your dashboard...");
            setTimeout(() => navigate('/profile'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit application');
            setLoading(false);
        }
    };

    return (
        <div className="financing-page fade-in" style={{ padding: '60px 0', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: 800 }}>
                {car && (
                    <div className="card" style={{ marginBottom: 24, padding: 16, display: 'flex', alignItems: 'center', gap: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <img src={car.images?.[0]} alt="" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8 }} />
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Applying For</p>
                            <h4 style={{ margin: 0, color: '#1e293b' }}>{car.year} {car.make} {car.model}</h4>
                            <p style={{ margin: 0, color: '#2a9d8f', fontWeight: 700 }}>${car.price.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <h1 className="page-title">Quick Finance Application</h1>
                    <p className="page-subtitle">Get pre-approved in minutes with our premium lending partners</p>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    {/* Progress Bar */}
                    <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} style={{
                                flex: 1, padding: '16px', textAlign: 'center',
                                borderBottom: step === s ? '3px solid #2a9d8f' : 'none',
                                color: step >= s ? '#1e293b' : '#94a3b8',
                                transition: 'all 0.3s',
                                fontWeight: step === s ? 700 : 500,
                                fontSize: '0.85rem'
                            }}>
                                Step {s}: {s === 1 ? 'Personal' : s === 2 ? 'Employment' : s === 3 ? 'Financial' : 'Review'}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: 40 }}>
                        {step === 1 && (
                            <div className="step-content">
                                <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><FiUser color="#2a9d8f" /> Personal Information</h3>
                                <div className="grid grid-2" style={{ gap: 20 }}>
                                    <div className="form-group">
                                        <label>Full Legal Name</label>
                                        <input className="form-control" placeholder="John Doe" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="date" className="form-control" required value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" className="form-control" placeholder="+1 (555) 000-0000" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Social Security Number (Last 4)</label>
                                        <input type="password" maxLength="4" className="form-control" placeholder="****" required value={formData.ssn} onChange={e => setFormData({ ...formData, ssn: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="step-content">
                                <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><FiBriefcase color="#2a9d8f" /> Employment Details</h3>
                                <div className="grid grid-2" style={{ gap: 20 }}>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Current Employer</label>
                                        <input className="form-control" placeholder="Company Name" required value={formData.employer} onChange={e => setFormData({ ...formData, employer: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Job Title</label>
                                        <input className="form-control" placeholder="Software Engineer" required value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Years Employed</label>
                                        <input type="number" className="form-control" placeholder="2" required value={formData.yearsEmployed} onChange={e => setFormData({ ...formData, yearsEmployed: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Estimated Annual Income ($)</label>
                                        <input type="number" className="form-control" placeholder="75000" required value={formData.annualIncome} onChange={e => setFormData({ ...formData, annualIncome: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="step-content">
                                <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}><FiDollarSign color="#2a9d8f" /> Financial Requirements</h3>
                                <div className="grid grid-2" style={{ gap: 20 }}>
                                    <div className="form-group">
                                        <label>Desired Loan Amount ($)</label>
                                        <input type="number" className="form-control" placeholder="25000" required value={formData.loanAmount} onChange={e => setFormData({ ...formData, loanAmount: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Down Payment ($)</label>
                                        <input type="number" className="form-control" placeholder="5000" required value={formData.downPayment} onChange={e => setFormData({ ...formData, downPayment: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Preferred Lender</label>
                                        <select className="form-control" value={formData.provider} onChange={e => setFormData({ ...formData, provider: e.target.value })}>
                                            <option value="AutoMarket Direct">AutoMarket Direct (Fastest)</option>
                                            <option value="Dashen Bank">Dashen Bank</option>
                                            <option value="Oromia Bank">Oromia Bank</option>
                                            <option value="Local Bank">Local Bank</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Estimated Credit Score</label>
                                        <select className="form-control" value={formData.creditScore} onChange={e => setFormData({ ...formData, creditScore: e.target.value })}>
                                            <option value="Excellent">Excellent (750+)</option>
                                            <option value="Good">Good (700-749)</option>
                                            <option value="Fair">Fair (650-699)</option>
                                            <option value="Poor">Poor (Below 650)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="step-content" style={{ textAlign: 'center' }}>
                                <FiCheckCircle size={64} color="#2a9d8f" style={{ marginBottom: 20 }} />
                                <h3 style={{ marginBottom: 16 }}>Ready to Submit</h3>
                                <p style={{ color: '#64748b', marginBottom: 32 }}>
                                    By submitting, you agree to our Terms of Service and authorize AutoMarket to conduct a soft credit pull which will not affect your credit score.
                                </p>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', padding: 20, borderRadius: 12 }}>
                                    <input type="checkbox" required checked={formData.agreeToCreditCheck} onChange={e => setFormData({ ...formData, agreeToCreditCheck: e.target.checked })} />
                                    <span style={{ fontWeight: 500 }}>I agree to the credit check and terms</span>
                                </label>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 30, borderTop: '1px solid #e2e8f0' }}>
                            <button type="button" className="btn btn-secondary" disabled={step === 1} onClick={handlePrev} style={{ borderRadius: 10 }}>
                                <FiChevronLeft /> Previous
                            </button>
                            {step < 4 ? (
                                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ borderRadius: 10, padding: '10px 30px' }}>
                                    Next Step <FiChevronRight />
                                </button>
                            ) : (
                                <button type="submit" className="btn btn-primary" style={{ padding: '12px 40px', borderRadius: 10, background: '#2a9d8f' }} disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <FiInfo /> All data is encrypted and sent securely to our partners.
                </p>
            </div>

            <style>{`
                .form-control {
                    border: 1.5px solid #e2e8f0 !important;
                    border-radius: 10px !important;
                    padding: 12px 16px !important;
                }
                .form-control:focus {
                    border-color: #2a9d8f !important;
                    box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.1) !important;
                }
                .form-group label {
                    font-size: 0.8rem;
                    color: #475569;
                    margin-bottom: 8px;
                    display: block;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .step-content {
                    animation: fadeIn 0.4s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
