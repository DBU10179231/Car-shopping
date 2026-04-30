import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole, requiredPermission }) {
    const { user, viewMode } = useAuth();

    if (!user) return <Navigate to="/login" replace />;

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const effectiveRole = isAdmin ? viewMode : user.role;

    // Super Admin/Admin in 'admin' viewMode has access to everything in admin panel
    if (isAdmin && viewMode === 'admin') return children;

    // Admin roles list
    const ADMIN_ROLES = ['admin', 'super_admin', 'support', 'finance', 'content_manager'];

    // If accessing /admin path
    if (requiredRole === 'admin') {
        if (!ADMIN_ROLES.includes(effectiveRole)) {
            return <Navigate to="/" replace />;
        }
    }

    // Direct role match (e.g. requiredRole="dealer")
    if (requiredRole && requiredRole !== 'admin' && effectiveRole !== requiredRole) {
        // Admins can view other dashboards in user mode
        if (!isAdmin) return <Navigate to="/" replace />;
    }

    // Granular permission check
    if (requiredPermission) {
        // Super admin bypasses permission checks
        if (user.role !== 'super_admin') {
            if (!user.permissions?.includes(requiredPermission)) {
                return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
            }
        }
    }

    return children;
}
