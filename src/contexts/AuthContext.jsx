import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { USER_ROLES, isValidRole } from '../constants/roles';

// Create Auth Context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const profile = userDoc.data();
                setUserProfile(profile);
                setUserRole(profile.role || USER_ROLES.USER);
                return profile;
            }
            return null;
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError(err.message);
            return null;
        }
    };

    // Sign up function
    const signup = async (email, password, displayName, role = USER_ROLES.USER) => {
        try {
            setError(null);

            // Validate role
            if (!isValidRole(role)) {
                throw new Error('Invalid role specified');
            }

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, { displayName });

            // Send email verification
            await sendEmailVerification(user);

            // Create user profile in Firestore
            const userProfile = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                emailVerified: user.emailVerified,
                isActive: true,
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);

            // Set local state
            setUserProfile(userProfile);
            setUserRole(role);

            return { user, profile: userProfile };
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.message);
            throw err;
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            setError(null);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user profile
            await fetchUserProfile(user.uid);

            return user;
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
            throw err;
        }
    };

    // Google Sign-In function
    const signInWithGoogle = async () => {
        try {
            setError(null);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user profile exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                // New user - create profile with default role
                const userProfile = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email?.split('@')[0] || 'User',
                    company: '',
                    designation: '',
                    role: USER_ROLES.USER,
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    emailVerified: user.emailVerified,
                    photoURL: user.photoURL || null
                };

                await setDoc(doc(db, 'users', user.uid), userProfile);
                setUserProfile(userProfile);
                setUserRole(USER_ROLES.USER);

                // Return flag indicating new user (needs onboarding)
                return { user, isNewUser: true };
            } else {
                // Existing user - fetch profile
                await fetchUserProfile(user.uid);
                return { user, isNewUser: false };
            }
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError(err.message);
            throw err;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            setError(null);
            await signOut(auth);
            setCurrentUser(null);
            setUserRole(null);
            setUserProfile(null);
        } catch (err) {
            console.error('Logout error:', err);
            setError(err.message);
            throw err;
        }
    };

    // Reset password function
    const resetPassword = async (email) => {
        try {
            setError(null);
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            console.error('Password reset error:', err);
            setError(err.message);
            throw err;
        }
    };

    // Update user role (Admin only)
    const updateUserRole = async (uid, newRole) => {
        try {
            setError(null);

            // Validate role
            if (!isValidRole(newRole)) {
                throw new Error('Invalid role specified');
            }

            // Check if current user is admin
            if (userRole !== USER_ROLES.ADMIN) {
                throw new Error('Only admins can update user roles');
            }

            // Update role in Firestore
            await updateDoc(doc(db, 'users', uid), {
                role: newRole,
                updatedAt: new Date().toISOString()
            });

            // If updating own role, refresh profile
            if (uid === currentUser?.uid) {
                await fetchUserProfile(uid);
            }
        } catch (err) {
            console.error('Update role error:', err);
            setError(err.message);
            throw err;
        }
    };

    // Update user profile
    const updateUserProfile = async (updates) => {
        try {
            setError(null);

            if (!currentUser) {
                throw new Error('No user logged in');
            }

            // Update Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                ...updates,
                updatedAt: new Date().toISOString()
            });

            // Refresh profile
            await fetchUserProfile(currentUser.uid);
        } catch (err) {
            console.error('Update profile error:', err);
            setError(err.message);
            throw err;
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            if (user) {
                setCurrentUser(user);
                await fetchUserProfile(user.uid);
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        userProfile,
        loading,
        error,
        signup,
        login,
        signInWithGoogle,
        logout,
        resetPassword,
        updateUserRole,
        updateUserProfile,
        fetchUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export default AuthContext;
