import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../constants/roles';
import { FaUser, FaEnvelope, FaBuilding, FaBriefcase, FaShieldAlt } from 'react-icons/fa';

const Settings = () => {
    const { currentUser, userProfile, userRole } = useAuth();

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
            <h1 className="font-heading text-3xl font-bold text-content-primary mb-2 tracking-tight">Account Settings</h1>
            <p className="text-content-secondary mb-8">View and manage your profile information</p>

            {/* Profile Section */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-8">
                <div className="flex items-center gap-8 mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl text-white font-semibold overflow-hidden shadow-sm">
                        {userProfile?.photoURL ? (
                            <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <FaUser />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-content-primary mb-1">{userProfile?.name || userProfile?.displayName}</h2>
                        <p className="text-content-secondary">{userProfile?.designation}</p>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700">
                                <FaShieldAlt size={12} />
                                {ROLE_LABELS[userRole]}
                            </span>
                            {userProfile?.isApproved !== false && (
                                <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                    ✓ Approved
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-border rounded-xl p-5 hover:border-primary-200 transition-colors duration-200 bg-background/50">
                        <div className="flex items-center gap-2 text-content-muted mb-3">
                            <FaUser className="text-primary-500" />
                            <label className="text-sm font-medium uppercase tracking-wider text-xs">Full Name</label>
                        </div>
                        <div className="text-content-primary font-medium text-lg">{userProfile?.name || userProfile?.displayName || 'Not set'}</div>
                    </div>

                    <div className="border border-border rounded-xl p-5 hover:border-primary-200 transition-colors duration-200 bg-background/50">
                        <div className="flex items-center gap-2 text-content-muted mb-3">
                            <FaEnvelope className="text-primary-500" />
                            <label className="text-sm font-medium uppercase tracking-wider text-xs">Email Address</label>
                        </div>
                        <div className="text-content-primary font-medium text-lg">{currentUser?.email}</div>
                    </div>

                    <div className="border border-border rounded-xl p-5 hover:border-primary-200 transition-colors duration-200 bg-background/50">
                        <div className="flex items-center gap-2 text-content-muted mb-3">
                            <FaBuilding className="text-primary-500" />
                            <label className="text-sm font-medium uppercase tracking-wider text-xs">Company</label>
                        </div>
                        <div className="text-content-primary font-medium text-lg">{userProfile?.company || 'Not set'}</div>
                    </div>

                    <div className="border border-border rounded-xl p-5 hover:border-primary-200 transition-colors duration-200 bg-background/50">
                        <div className="flex items-center gap-2 text-content-muted mb-3">
                            <FaBriefcase className="text-primary-500" />
                            <label className="text-sm font-medium uppercase tracking-wider text-xs">Designation</label>
                        </div>
                        <div className="text-content-primary font-medium text-lg">{userProfile?.designation || 'Not set'}</div>
                    </div>
                </div>

                {userProfile?.isApproved === false && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-1">Pending Approval</h3>
                        <p className="text-sm text-yellow-700">
                            Your account is pending approval from your company administrator. You will have limited access until approved.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
