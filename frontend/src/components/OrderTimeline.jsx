import {
    FiCheckCircle, FiClock, FiTruck, FiDollarSign, FiPackage, FiHome
} from 'react-icons/fi';

const STEPS = [
    { key: 'ordered', label: 'Order Placed', icon: <FiPackage />, color: '#457b9d' },
    { key: 'approved', label: 'Seller Approved', icon: <FiCheckCircle />, color: '#2a9d8f' },
    { key: 'paid', label: 'Payment Verified', icon: <FiDollarSign />, color: '#e9c46a' },
    { key: 'in_transit', label: 'In Transit', icon: <FiTruck />, color: '#f4a261' },
    { key: 'delivered', label: 'Delivered', icon: <FiHome />, color: '#2a9d8f' },
];

export default function OrderTimeline({ order }) {
    if (!order) return null;

    // Determine current step index
    let currentStep = 0;
    if (order.status === 'approved') currentStep = 1;
    if (order.paymentStatus === 'paid') currentStep = 2;
    if (order.status === 'in_transit' || order.status === 'shipped') currentStep = 3;
    if (order.status === 'delivered' || order.status === 'completed') currentStep = 4;

    return (
        <div className="order-timeline-container" style={{ padding: '20px 0px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 40 }}>
                {/* Connecting Line (Inactive) */}
                <div style={{
                    position: 'absolute', top: '22px', left: '10%', right: '10%',
                    height: '2px', background: 'var(--border)', zIndex: 0
                }} />
                {/* Connecting Line (Active) */}
                <div style={{
                    position: 'absolute', top: '22px', left: '10%',
                    width: `${(currentStep / (STEPS.length - 1)) * 80}%`,
                    height: '2px', background: 'var(--accent)', zIndex: 0,
                    transition: 'width 0.8s ease'
                }} />

                {STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isActive = index <= currentStep;

                    return (
                        <div key={step.key} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            flex: 1, position: 'relative', zIndex: 1
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '50%',
                                background: isActive ? 'var(--bg-card)' : 'var(--bg-body)',
                                border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', marginBottom: 10,
                                transition: 'all 0.3s ease',
                                boxShadow: isCurrent ? '0 0 15px rgba(69,123,157, 0.3)' : 'none'
                            }}>
                                {isCompleted ? <FiCheckCircle style={{ color: 'var(--accent)' }} /> : step.icon}
                            </div>
                            <span style={{
                                fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                                textAlign: 'center', maxWidth: 80
                            }}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Status Details */}
            <div className="timeline-info card" style={{ padding: 16, background: 'rgba(69,123,157, 0.05)', border: '1px dashed var(--accent)', margin: '0 20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--accent)' }}><FiClock /></div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Current Status: {STEPS[currentStep].label}</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {currentStep === 0 && "Seller is reviewing your inquiry. We'll notify you once they approve."}
                            {currentStep === 1 && "Seller has approved! You can now proceed to payment to secure the vehicle."}
                            {currentStep === 2 && "Payment confirmed. Logistics is preparing the vehicle for dispatch."}
                            {currentStep === 3 && "Your vehicle is in transit! Track its physical progress in the Logistics tab."}
                            {currentStep === 4 && "Delivery completed. Enjoy your new car!"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
