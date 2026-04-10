import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setError('');
            setLoading(true);
            const cleanEmail = email.trim();
            console.log('Attempting login for:', cleanEmail);
            await login(cleanEmail, password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login failed:', err);

            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password. Please check your credentials.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (err.code === 'auth/user-disabled') {
                setError('This account has been disabled');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later');
            } else {
                setError('Failed to login. Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            const result = await signInWithGoogle();

            if (result.isNewUser) {
                navigate('/onboarding', {
                    state: {
                        uid: result.user.uid,
                        email: result.user.email
                    }
                });
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Google sign-in failed:', err);

            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked. Please allow popups for this site');
            } else {
                setError('Failed to sign in with Google. Please try again');
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
                    <h1 className="font-heading text-3xl md:text-2xl font-bold text-slate-800 mb-2 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 text-base m-0">Sign in to your account to continue</p>
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
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                autoComplete="current-password"
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
                    </div>

                    <div className="flex justify-end -mt-2">
                        <Link to="/forgot-password" className="text-indigo-600 text-sm font-medium transition-colors duration-200 hover:text-indigo-700 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white border-none py-3.5 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 mt-2 flex items-center justify-center gap-2 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
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
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-surface text-content-primary border-[1.5px] border-border py-3.5 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-3 mb-4 hover:bg-gray-50 text-gray-700 hover:border-gray-300 hover:shadow-sm active:scale-[0.98] disabled:bg-gray-100 disabled:text-content-muted disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                >
                    <FaGoogle className="text-xl text-[#4285f4]" />
                    Sign in with Google
                </button>

                <div className="text-center mt-8 pt-6 border-t border-slate-200">
                    <p className="text-slate-500 text-sm m-0">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 font-medium transition-colors duration-200 hover:text-indigo-700 hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
