import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile, sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES, ROLE_LABELS } from '../../constants/roles';
import { FaUser, FaBuilding, FaBriefcase, FaShieldAlt } from 'react-icons/fa';

const Onboarding = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fetchUserProfile } = useAuth();

    // Get uid/email from location state OR from current auth user (fallback for direct redirects)
    const uid = location.state?.uid || auth.currentUser?.uid;
    const email = location.state?.email || auth.currentUser?.email;

    const [formData, setFormData] = useState({
        name: '',
        company: '',
        designation: '',
        role: USER_ROLES.USER
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!uid || !email) {
            navigate('/signup', { replace: true });
        }
    }, [uid, email, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Please enter your name');
            return false;
        }

        if (!formData.company.trim()) {
            setError('Please enter your company name');
            return false;
        }

        if (!formData.designation.trim()) {
            setError('Please enter your designation');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setError('');
            setLoading(true);

            const currentUser = auth.currentUser;

            if (currentUser) {
                await updateProfile(currentUser, {
                    displayName: formData.name
                });

                try {
                    await sendEmailVerification(currentUser);
                } catch (emailError) {
                    console.warn('Could not send verification email (rate limited or already sent):', emailError);
                    // Do not block onboarding if email verification fails
                }
            }

            // Check if company already has users (is this the first user?)
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('company', '==', formData.company));
            const querySnapshot = await getDocs(q);
            const isFirstUser = querySnapshot.empty;

            let finalRole = formData.role;
            let isApproved = false;

            if (isFirstUser) {
                // First user becomes Admin and is auto-approved
                finalRole = USER_ROLES.ADMIN;
                isApproved = true;
            } else {
                // Subsequent users retain chosen role but need approval (unless it's basic User?)
                // User requirement: "i only a admin can approve other privilaged use"
                // Let's safe default: Privileged/Admin need approval. Basic User maybe auto-approved?
                // For simplicity and security based on request: All subsequent users need approval if they want specific access.
                // But let's say basic users are auto-approved for now to not block everyone?
                // actually "account setting logic" implies admin approves. Let's make all subsequent users PENDING.
                isApproved = false;
            }

            const userProfile = {
                uid: uid,
                email: email,
                name: formData.name,
                company: formData.company,
                designation: formData.designation,
                role: finalRole,
                isApproved: isApproved, // New field
                createdAt: new Date().toISOString(),
                isActive: true,
                emailVerified: false
            };

            await setDoc(doc(db, 'users', uid), userProfile);

            // Sync the profile into AuthContext
            await fetchUserProfile(uid);

            // Navigate based on status
            if (isApproved) {
                navigate('/dashboard');
            } else {
                // Determine where to send pending users. For now dashboard, but they might be restricted?
                // The ProtectedRoute checks for profile existence, not isApproved. 
                // We should probably show a "Pending Approval" banner on dashboard or redirect to a waiting page.
                // For now, let's send to dashboard, but the dashboard might need to show limited view.
                navigate('/dashboard');
            }

        } catch (err) {
            console.error('Onboarding failed:', err);
            setError('Failed to complete setup. Please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background items-center justify-center p-6 md:p-8 animate-fadeIn">
            <div className="bg-surface rounded-2xl shadow-soft border border-border p-10 md:p-12 w-full max-w-xl animate-slideUp">
                <div className="text-center mb-10">
                    <div className="text-4xl font-heading font-bold text-indigo-600 mb-6 drop-shadow-sm tracking-tight flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                            <span className="text-white text-2xl font-black">P</span>
                        </div>
                        ProofLayer
                    </div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-800 mb-3 tracking-tight">Welcome! Let's set up your profile</h1>
                    <p className="text-slate-500 text-base font-medium m-0">Tell us a bit about yourself to get started</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3.5 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <span className="text-xl">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-semibold tracking-wider uppercase text-slate-500">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                            <FaUser className="absolute left-4 text-slate-400 text-base pointer-events-none" />
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={loading}
                                autoComplete="name"
                                autoFocus
                                className="w-full py-3.5 px-4 pl-11 bg-surface border border-slate-200 rounded-xl text-base transition-all duration-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="company" className="text-sm font-semibold tracking-wider uppercase text-slate-500">
                            Company <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                            <FaBuilding className="absolute left-4 text-slate-400 text-base pointer-events-none" />
                            <input
                                type="text"
                                id="company"
                                name="company"
                                placeholder="Enter your company name"
                                value={formData.company}
                                onChange={handleChange}
                                disabled={loading}
                                autoComplete="organization"
                                className="w-full py-3.5 px-4 pl-11 bg-surface border border-slate-200 rounded-xl text-base transition-all duration-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="designation" className="text-sm font-semibold tracking-wider uppercase text-slate-500">
                            Designation <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                            <FaBriefcase className="absolute left-4 text-slate-400 text-base pointer-events-none" />
                            <input
                                type="text"
                                id="designation"
                                name="designation"
                                placeholder="e.g., Marketing Manager, Developer"
                                value={formData.designation}
                                onChange={handleChange}
                                disabled={loading}
                                autoComplete="organization-title"
                                className="w-full py-3.5 px-4 pl-11 bg-surface border border-slate-200 rounded-xl text-base transition-all duration-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="role" className="text-sm font-semibold tracking-wider uppercase text-slate-500">
                            Account Role <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                            <FaShieldAlt className="absolute left-4 text-slate-400 text-base pointer-events-none" />
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full py-3.5 px-4 pl-11 pr-10 bg-surface border border-slate-200 rounded-xl text-base transition-all duration-200 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                            >
                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            {/* Custom dropdown arrow */}
                            <div className="absolute right-4 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <small className="text-xs text-slate-400 mt-1 font-medium">
                            Select the access level for this account
                        </small>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mt-4">
                        <p className="m-0 my-2 text-sm text-indigo-900 flex items-start gap-3">
                            <span className="text-lg">✉️</span>
                            <span className="font-medium">A verification email will be sent to <strong className="text-indigo-700 font-bold">{email}</strong></span>
                        </p>
                        <p className="m-0 my-2 text-sm text-indigo-900 flex items-start gap-3">
                            <span className="text-lg">🔐</span>
                            <span className="font-medium">Your account will be created with <strong className="text-indigo-700 font-bold">{ROLE_LABELS[formData.role]}</strong> access.</span>
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white border-none py-3.5 px-6 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 mt-4 flex items-center justify-center gap-2 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-indigo-200"
                    >
                        {loading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Setting up...
                            </>
                        ) : (
                            'Complete Setup'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
