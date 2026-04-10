import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { USER_ROLES, ROLE_LABELS } from '../../constants/roles';
import { FaCheck, FaTimes, FaSpinner, FaTrash } from 'react-icons/fa';

const ManageUsers = () => {
    const { userProfile, userRole } = useAuth();
    const [companyUsers, setCompanyUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const isAdmin = userRole === USER_ROLES.ADMIN;

    useEffect(() => {
        if (userProfile?.company) {
            fetchCompanyUsers();
        } else {
            setLoading(false);
        }
    }, [userProfile]);

    const fetchCompanyUsers = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('company', '==', userProfile.company));
            const querySnapshot = await getDocs(q);

            const users = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCompanyUsers(users);
        } catch (error) {
            console.error("Error fetching company users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUser = async (userId) => {
        try {
            setActionLoading(userId);
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                isApproved: true,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setCompanyUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, isApproved: true } : user
            ));
        } catch (error) {
            console.error("Error approving user:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectUser = async (userId) => {
        if (!window.confirm('Are you sure you want to reject this user? They will lose access.')) return;

        try {
            setActionLoading(userId);
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                isApproved: false,
                role: USER_ROLES.USER,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setCompanyUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, isApproved: false, role: USER_ROLES.USER } : user
            ));
        } catch (error) {
            console.error("Error rejecting user:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;

        try {
            setActionLoading(userId);
            const userRef = doc(db, 'users', userId);
            await deleteDoc(userRef);

            // Update local state
            setCompanyUsers(prev => prev.filter(user => user.id !== userId));
        } catch (error) {
            console.error("Error deleting user:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setActionLoading(userId);
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: newRole,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setCompanyUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (error) {
            console.error("Error updating role:", error);
        } finally {
            setActionLoading(null);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">Access Restricted</h2>
                    <p className="text-yellow-700">Only approved administrators can manage users.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fadeIn">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-content-primary mb-2 tracking-tight">Manage Users</h1>
                    <p className="text-content-secondary m-0">Manage team members for <span className="font-semibold text-primary-600">{userProfile?.company}</span></p>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-border bg-background/30">
                    <div>
                        <h2 className="text-lg font-semibold text-content-primary">Team Members</h2>
                        <p className="text-sm text-content-secondary mt-1">Total: <span className="font-medium">{companyUsers.length}</span> users</p>
                    </div>
                    <button
                        onClick={fetchCompanyUsers}
                        className="px-4 py-2 bg-background hover:bg-border text-content-primary border border-border rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center flex-col items-center p-16 text-content-muted">
                        <FaSpinner className="animate-spin text-3xl text-primary-500 mb-4" />
                        <span className="text-base font-medium">Loading team data...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-background/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider w-2/5">User</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider w-1/5">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider w-1/5">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-content-secondary uppercase tracking-wider text-right w-1/5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {companyUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-primary-50/50 transition-colors duration-150 group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm">
                                                    {user.photoURL ? (
                                                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        user.name?.charAt(0)?.toUpperCase() || <FaUser size={14} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-content-primary truncate">{user.name || 'Unnamed User'}</div>
                                                    <div className="text-sm text-content-secondary truncate">{user.email}</div>
                                                    {user.designation && <div className="text-xs text-content-muted truncate mt-0.5">{user.designation}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={user.id === userProfile.uid || actionLoading === user.id}
                                                className="w-full px-3 py-2 border border-border rounded-lg text-sm font-medium bg-surface text-content-primary transition-all duration-200 hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-background disabled:text-content-muted disabled:cursor-not-allowed disabled:hover:border-border"
                                            >
                                                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            {user.isApproved ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                                                    <FaCheck size={10} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm">
                                                    <FaTimes size={10} /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                {user.id !== userProfile.uid && (
                                                    <>
                                                        {!user.isApproved && (
                                                            <button
                                                                onClick={() => handleApproveUser(user.id)}
                                                                disabled={actionLoading === user.id}
                                                                className="inline-flex items-center justify-center p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:text-green-700 transition-colors disabled:opacity-50"
                                                                title="Approve User"
                                                            >
                                                                {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                                            </button>
                                                        )}
                                                        {user.isApproved && (
                                                            <button
                                                                onClick={() => handleRejectUser(user.id)}
                                                                disabled={actionLoading === user.id}
                                                                className="inline-flex items-center justify-center p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 hover:text-yellow-700 transition-colors disabled:opacity-50"
                                                                title="Revoke Access"
                                                            >
                                                                {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            disabled={actionLoading === user.id}
                                                            className="inline-flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
                                                            title="Delete User"
                                                        >
                                                            {actionLoading === user.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                                        </button>
                                                    </>
                                                )}
                                                {user.id === userProfile.uid && (
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-500 bg-primary-50 px-3 py-1 border border-primary-100 rounded-full">You</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {companyUsers.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p>No team members found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;
