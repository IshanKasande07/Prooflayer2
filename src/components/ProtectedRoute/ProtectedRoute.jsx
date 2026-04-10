import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';

/**
 * ProtectedRoute - Requires authentication AND a completed profile.
 * - If not authenticated → redirects to /login
 * - If authenticated but no Firestore profile → redirects to /onboarding
 */
export const ProtectedRoute = ({ children }) => {
    const { currentUser, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // User is authenticated but hasn't completed onboarding (no Firestore profile)
    if (!userProfile) {
        return <Navigate to="/onboarding" replace state={{ uid: currentUser.uid, email: currentUser.email }} />;
    }

    return children;
};

/**
 * RoleProtectedRoute - Requires specific role(s)
 * Redirects to unauthorized page if user doesn't have required role
 */
export const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { currentUser, userRole, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (!userProfile) {
        return <Navigate to="/onboarding" replace state={{ uid: currentUser.uid, email: currentUser.email }} />;
    }

    // Require approval for privileged access
    if (allowedRoles.length > 0) {
        if (userRole !== USER_ROLES.ADMIN && userProfile.isApproved === false) {
            return <Navigate to="/unauthorized" replace />;
        }
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

/**
 * AdminRoute - Only accessible by admins
 */
export const AdminRoute = ({ children }) => {
    return (
        <RoleProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            {children}
        </RoleProtectedRoute>
    );
};

/**
 * PrivilegedRoute - Accessible by privileged users and admins
 */
export const PrivilegedRoute = ({ children }) => {
    return (
        <RoleProtectedRoute allowedRoles={[USER_ROLES.PRIVILEGED_USER, USER_ROLES.ADMIN]}>
            {children}
        </RoleProtectedRoute>
    );
};

/**
 * PublicRoute - Only accessible when NOT logged in
 * Redirects to dashboard if already authenticated WITH a profile.
 * If authenticated but no profile, allows access (so they can reach onboarding).
 */
export const PublicRoute = ({ children }) => {
    const { currentUser, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Only redirect to dashboard if user is fully set up (has profile)
    if (currentUser && userProfile) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};
