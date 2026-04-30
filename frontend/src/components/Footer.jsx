import { Link } from 'react-router-dom';
import { FiShoppingBag, FiFacebook, FiTwitter, FiInstagram } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <FiShoppingBag /> AutoMarket
                    </Link>
                    <p>Find your perfect car with the best deals in town.</p>
                    <div className="footer-socials">
                        <a href="#"><FiFacebook /></a>
                        <a href="#"><FiTwitter /></a>
                        <a href="#"><FiInstagram /></a>
                    </div>
                </div>
                <div className="footer-links">
                    <h4>Browse</h4>
                    <Link to="/cars">All Cars</Link>
                    <Link to="/cars?category=SUV">SUVs</Link>
                    <Link to="/cars?category=Sedan">Sedans</Link>
                    <Link to="/cars?category=Truck">Trucks</Link>
                </div>
                <div className="footer-links">
                    <h4>Account</h4>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                    <Link to="/profile">Profile</Link>
                    <Link to="/favorites">Favorites</Link>
                </div>
                <div className="footer-links">
                    <h4>Company</h4>
                    <Link to="/about">About Us</Link>
                    <Link to="/contact">Contact</Link>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} AutoMarket. All rights reserved.</p>
            </div>
        </footer>
    );
}
