import { FiShoppingBag, FiUsers, FiAward, FiShield } from 'react-icons/fi';
import './About.css';

const stats = [
    { label: 'Cars Listed', value: '10,000+' },
    { label: 'Happy Buyers', value: '5,000+' },
    { label: 'Trusted Dealers', value: '500+' },
    { label: 'Cities Covered', value: '20+' },
];

const team = [
    { name: 'Alex Johnson', role: 'CEO & Co-Founder', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face' },
    { name: 'Sara Mitchell', role: 'Head of Operations', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face' },
    { name: 'James Li', role: 'Lead Engineer', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face' },
];

export default function About() {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-content">
                    <h1>About <span className="gradient-text">AutoMarket</span></h1>
                    <p>We connect car buyers with the best deals in the country. Premium, transparent, and trusted since 2020.</p>
                </div>
                <div className="about-hero-image-wrapper">
                    <img
                        src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&h=500&fit=crop"
                        alt="Premium car showroom"
                        className="about-hero-image"
                    />
                    <div className="about-hero-overlay" />
                </div>
            </section>

            {/* Mission */}
            <section className="about-mission container">
                <div className="mission-text">
                    <h2>Our Mission</h2>
                    <p>
                        AutoMarket was founded with a single goal: to make buying a car simple, transparent, and exciting.
                        We curate thousands of listings from verified dealers so you can shop with confidence,
                        compare features side-by-side, and get the best deal possible—without the stress.
                    </p>
                    <p>
                        Whether you're after a budget-friendly commuter or a premium luxury vehicle, AutoMarket puts
                        the right car in front of the right buyer.
                    </p>
                </div>
                <div className="mission-image-wrapper">
                    <img src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=400&fit=crop" alt="Car on the road" className="mission-image" />
                </div>
            </section>

            {/* Stats */}
            <section className="about-stats">
                <div className="container stats-grid">
                    {stats.map(s => (
                        <div key={s.label} className="stat-card">
                            <span className="stat-value">{s.value}</span>
                            <span className="stat-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Values */}
            <section className="about-values container">
                <h2>Why Choose Us</h2>
                <div className="values-grid">
                    <div className="value-card">
                        <FiShield className="value-icon" />
                        <h3>Trusted & Verified</h3>
                        <p>Every dealer on our platform goes through a rigorous verification process to ensure quality and authenticity.</p>
                    </div>
                    <div className="value-card">
                        <FiAward className="value-icon" />
                        <h3>Best Deals</h3>
                        <p>We aggregate the best pricing from top dealers so you never overpay for your next vehicle.</p>
                    </div>
                    <div className="value-card">
                        <FiUsers className="value-icon" />
                        <h3>Customer First</h3>
                        <p>Our support team is always here to guide you through every step of your car-buying journey.</p>
                    </div>
                    <div className="value-card">
                        <FiShoppingBag className="value-icon" />
                        <h3>Easy to Use</h3>
                        <p>Our intuitive platform makes browsing, comparing, and purchasing your next car a breeze.</p>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="about-team container">
                <h2>Meet the Team</h2>
                <div className="team-grid">
                    {team.map(m => (
                        <div key={m.name} className="team-card">
                            <img src={m.photo} alt={m.name} className="team-photo" />
                            <h4>{m.name}</h4>
                            <p>{m.role}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
