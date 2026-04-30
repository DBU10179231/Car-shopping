import { useState, useEffect } from 'react';
import { FiDollarSign, FiPercent, FiClock, FiArrowRight } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

export default function LoanCalculator({ carPrice }) {
    const { id: carId } = useParams();
    const navigate = useNavigate();
    const [loanAmount, setLoanAmount] = useState(carPrice || 0);
    const [downPayment, setDownPayment] = useState(0);
    const [interestRate, setInterestRate] = useState(5.5);
    const [loanTerm, setLoanTerm] = useState(60); // months
    const [monthlyPayment, setMonthlyPayment] = useState(0);

    useEffect(() => {
        calculatePayment();
    }, [carPrice, downPayment, interestRate, loanTerm]);

    const calculatePayment = () => {
        const principal = carPrice - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const numberOfPayments = loanTerm;

        if (monthlyRate === 0) {
            setMonthlyPayment(principal / numberOfPayments);
        } else {
            const x = Math.pow(1 + monthlyRate, numberOfPayments);
            const monthly = (principal * x * monthlyRate) / (x - 1);
            setMonthlyPayment(monthly);
        }
    };

    const handleApplyNow = () => {
        const params = new URLSearchParams({
            carId: carId || '',
            loanAmount: (carPrice - downPayment).toString(),
            downPayment: downPayment.toString(),
            term: loanTerm.toString()
        });
        navigate(`/financing?${params.toString()}`);
    };

    return (
        <div className="card" style={{ padding: 24, margin: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FiDollarSign style={{ color: 'var(--primary)' }} /> Financing Estimator
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Down Payment (ETB)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                    />
                </div>
                <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Interest Rate (%)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            className="form-control"
                            value={interestRate}
                            onChange={(e) => setInterestRate(Number(e.target.value))}
                        />
                        <FiPercent style={{ position: 'absolute', right: 10, top: 12, opacity: 0.5 }} />
                    </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loan Term (Months): {loanTerm} Months</label>
                    <input
                        type="range"
                        min="12"
                        max="84"
                        step="12"
                        className="form-control"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        style={{ padding: 0, height: 8 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5 }}>
                        <span>12mo</span>
                        <span>36mo</span>
                        <span>60mo</span>
                        <span>84mo</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                <div style={{ padding: 16, background: 'var(--primary)', borderRadius: 12, textAlign: 'center', boxShadow: '0 8px 16px rgba(42, 157, 143, 0.2)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Estimated Monthly Payment</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>
                        {monthlyPayment > 0 ? monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'} ETB
                    </div>
                    <button
                        onClick={handleApplyNow}
                        style={{
                            marginTop: 12, background: 'white', color: 'var(--primary)', border: 'none',
                            padding: '8px 24px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Apply for this Loan <FiArrowRight />
                    </button>
                </div>

                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                    * This is an estimate. Actual rates may vary based on credit score.
                </p>
            </div>
        </div>
    );
}
