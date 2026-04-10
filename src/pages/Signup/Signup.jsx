import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { signInWithGoogle } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.email) {
            setError('Please enter your email');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
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

            // Trim email to prevent accidentally creating accounts with spaces
            const cleanEmail = formData.email.trim();
            console.log('Attempting signup for:', cleanEmail);

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                cleanEmail,
                formData.password
            );

            navigate('/onboarding', {
                state: {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email
                }
            });

        } catch (err) {
            console.error('Signup failed:', err);

            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Use at least 6 characters');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('Email/password accounts are not enabled');
            } else {
                setError('Failed to create account. Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            setError('');
            setLoading(true);
            const result = await signInWithGoogle();

            navigate('/onboarding', {
                state: {
                    uid: result.user.uid,
                    email: result.user.email
                }
            });
        } catch (err) {
            console.error('Google sign-up failed:', err);

            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-up cancelled');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked. Please allow popups for this site');
            } else {
                setError('Failed to sign up with Google. Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8 md:p-4">
            <div className="bg-surface rounded-2xl shadow-float p-12 md:p-8 w-full max-w-md animate-slideUp">
                <div className="text-center mb-8">
                    <div className="font-heading text-4xl font-bold text-indigo-600 mb-4 tracking-tight">◆ ProofLayer</div>
                    <h1 className="font-heading text-3xl md:text-2xl font-bold text-slate-800 mb-2 tracking-tight">Create Account</h1>
                    <p className="text-slate-500 text-base m-0">Sign up to start managing your testimonials</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3.5 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <span className="text-xl">⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-sm font-semibold text-content-primary">
                            Email Address
                        </label>
                        <div className="relative flex items-center">
                            <FaEnvelope className="absolute left-4 text-content-muted text-base pointer-events-none" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                autoComplete="email"
                                className="w-full py-3.5 px-4 pl-11 border-[1.5px] border-slate-200 rounded-lg text-base transition-all duration-200 bg-surface text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-sm font-semibold text-content-primary">
                            Password
                        </label>
                        <div className="relative flex items-center">
                            <FaLock className="absolute left-4 text-content-muted text-base pointer-events-none" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                autoComplete="new-password"
                                className="w-full py-3.5 px-4 pl-11 pr-12 border-[1.5px] border-slate-200 rounded-lg text-base transition-all duration-200 bg-surface text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                                className="absolute right-4 bg-transparent border-none text-slate-400 cursor-pointer p-2 flex items-center transition-colors duration-200 hover:text-indigo-600 focus:outline-none"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        <small className="text-xs text-content-muted mt-1">Minimum 6 characters</small>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-content-primary">
                            Confirm Password
                        </label>
                        <div className="relative flex items-center">
                            <FaLock className="absolute left-4 text-content-muted text-base pointer-events-none" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={loading}
                                autoComplete="new-password"
                                className="w-full py-3.5 px-4 pl-11 pr-12 border-[1.5px] border-slate-200 rounded-lg text-base transition-all duration-200 bg-surface text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex="-1"
                                className="absolute right-4 bg-transparent border-none text-slate-400 cursor-pointer p-2 flex items-center transition-colors duration-200 hover:text-indigo-600 focus:outline-none"
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white border-none py-3.5 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 mt-2 flex items-center justify-center gap-2 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Creating Account...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </form>

                <div className="flex items-center text-center my-6 text-content-muted text-sm">
                    <div className="flex-1 border-b border-border"></div>
                    <span className="px-4 font-medium uppercase tracking-wider text-xs">or</span>
                    <div className="flex-1 border-b border-border"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="w-full bg-surface text-content-primary border-[1.5px] border-border py-3.5 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-3 mb-4 hover:bg-gray-50 text-gray-700 hover:border-gray-300 hover:shadow-sm active:scale-[0.98] disabled:bg-gray-100 disabled:text-content-muted disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                >
                    <FaGoogle className="text-xl text-[#4285f4]" />
                    Sign up with Google
                </button>

                <div className="text-center mt-8 pt-6 border-t border-slate-200">
                    <p className="text-slate-500 text-sm m-0">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 font-medium transition-colors duration-200 hover:text-indigo-700 hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
