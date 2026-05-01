import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { FavProvider } from './context/FavContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CarListing from './pages/CarListing';
import CarDetail from './pages/CarDetail';
import Compare from './pages/Compare';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BuyerDashboard from './pages/BuyerDashboard';
import Orders from './pages/Orders';
import PaymentVerify from './pages/PaymentVerify';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardHome from './pages/admin/DashboardHome';
import ManageUsers from './pages/admin/ManageUsers';
import ManageRoles from './pages/admin/ManageRoles';
import ManageCars from './pages/admin/ManageCars';
import ManageOrders from './pages/admin/ManageOrders';
import AdminProfile from './pages/admin/AdminProfile';
import ManageSellers from './pages/admin/ManageSellers';
import ManageTestDrives from './pages/admin/ManageTestDrives';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSupport from './pages/admin/AdminSupport';
import AdminContent from './pages/admin/AdminContent';
import SystemHealth from './pages/admin/SystemHealth';
import ManageLogistics from './pages/admin/ManageLogistics';
import ManageFinance from './pages/admin/ManageFinance';
import AuditLogs from './pages/admin/AuditLogs';
import AdminHub from './pages/admin/AdminHub';
import ManagePayments from './pages/admin/ManagePayments';
import ManageReviews from './pages/admin/ManageReviews';
import ManageCategories from './pages/admin/ManageCategories';
import ApprovalsQueue from './pages/admin/ApprovalsQueue';
import SellerLayout from './pages/seller/SellerLayout';
import SellerDashboard from './pages/seller/SellerDashboard';
import ManageInventory from './pages/seller/ManageInventory';
import SellerProfile from './pages/seller/SellerProfile';
import ManageTestDrivesSeller from './pages/seller/ManageTestDrives';
import SellerOrders from './pages/seller/SellerOrders';
import SellerMessages from './pages/seller/SellerMessages';
import SellerHub from './pages/seller/SellerHub';
import About from './pages/About';
import Contact from './pages/Contact';
import FinancingApplication from './pages/FinancingApplication';
import Profile from './pages/Profile';
import UserHub from './pages/UserHub';
import NewTicket from './pages/support/NewTicket';
import TicketChat from './pages/support/TicketChat';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavProvider>
          <BrowserRouter>
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cars" element={<CarListing />} />
                <Route path="/cars/:id" element={<CarDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/payment/verify" element={<ProtectedRoute><PaymentVerify /></ProtectedRoute>} />
                <Route path="/hub" element={<ProtectedRoute><UserHub /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/financing" element={<ProtectedRoute><FinancingApplication /></ProtectedRoute>} />
                <Route path="/support/new" element={<ProtectedRoute><NewTicket /></ProtectedRoute>} />
                <Route path="/support/tickets/:id" element={<ProtectedRoute><TicketChat /></ProtectedRoute>} />

                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminHub />} />
                  <Route path="hub" element={<AdminHub />} />
                  <Route path="dashboard" element={<DashboardHome />} />
                  <Route path="users" element={<ProtectedRoute requiredPermission="edit_users"><ManageUsers /></ProtectedRoute>} />
                  <Route path="roles" element={<ProtectedRoute requiredPermission="manage_roles"><ManageRoles /></ProtectedRoute>} />
                  <Route path="cars" element={<ProtectedRoute requiredPermission="manage_listings"><ManageCars /></ProtectedRoute>} />
                  <Route path="orders" element={<ProtectedRoute requiredPermission="manage_orders"><ManageOrders /></ProtectedRoute>} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="sellers" element={<ProtectedRoute requiredPermission="edit_users"><ManageSellers /></ProtectedRoute>} />
                  <Route path="test-drives" element={<ProtectedRoute requiredPermission="manage_orders"><ManageTestDrives /></ProtectedRoute>} />
                  <Route path="analytics" element={<ProtectedRoute requiredPermission="view_analytics"><AdminAnalytics /></ProtectedRoute>} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="content" element={<AdminContent />} />
                  <Route path="system" element={<ProtectedRoute requiredPermission="manage_roles"><SystemHealth /></ProtectedRoute>} />
                  <Route path="logistics" element={<ProtectedRoute requiredPermission="manage_orders"><ManageLogistics /></ProtectedRoute>} />
                  <Route path="finance-old" element={<ProtectedRoute requiredPermission="manage_finance"><ManageFinance /></ProtectedRoute>} />
                  <Route path="payments" element={<ProtectedRoute requiredPermission="manage_finance"><ManagePayments /></ProtectedRoute>} />
                  <Route path="reviews" element={<ProtectedRoute requiredPermission="manage_reviews"><ManageReviews /></ProtectedRoute>} />
                  <Route path="categories" element={<ProtectedRoute requiredPermission="manage_catalog"><ManageCategories /></ProtectedRoute>} />
                  <Route path="audit-logs" element={<ProtectedRoute requiredPermission="view_audit_logs"><AuditLogs /></ProtectedRoute>} />
                  <Route path="approvals" element={<ProtectedRoute requiredPermission="manage_listings"><ApprovalsQueue /></ProtectedRoute>} />
                </Route>

                <Route path="/seller" element={<ProtectedRoute requiredRole="dealer"><SellerLayout /></ProtectedRoute>}>
                  <Route index element={<SellerHub />} />
                  <Route path="hub" element={<SellerHub />} />
                  <Route path="dashboard" element={<SellerDashboard />} />
                  <Route path="inventory" element={<ManageInventory />} />
                  <Route path="orders" element={<SellerOrders />} />
                  <Route path="test-drives" element={<ManageTestDrivesSeller />} />
                  <Route path="messages" element={<SellerMessages />} />
                  <Route path="profile" element={<SellerProfile />} />
                </Route>

                {/* Redirect common mistakes */}
                <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/buyer/dashboard" element={<Navigate to="/dashboard" replace />} />

                {/* Catch-all 404 Route */}
                <Route path="*" element={
                  <div className="not-found-page" style={{ padding: '100px 20px', textAlign: 'center' }}>
                    <h1>404 - Page Not Found</h1>
                    <p>The page you are looking for does not exist.</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>Go Home</Link>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
            <ToastContainer position="bottom-right" theme="dark" />
          </BrowserRouter>
        </FavProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
