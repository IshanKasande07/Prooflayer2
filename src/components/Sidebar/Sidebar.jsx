import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../constants/roles';
import { BsFolder2, BsPlusSquare, BsDownload, BsHeart, BsGraphUp, BsGear, BsPeople } from 'react-icons/bs';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

import userAvatar from '../../assets/avatar.png';

const Sidebar = ({ isMobileOpen, isCollapsed, toggleMobileMenu, toggleCollapse }) => {
  const { currentUser, userProfile, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const canImport = hasPermission(userRole, 'canImportTestimonials') || userRole === 'admin';
  const canAccessSettings = hasPermission(userRole, 'canAccessSettings') || userRole === 'admin';
  const canManageUsers = hasPermission(userRole, 'canManageUsers') || userRole === 'admin';

  const firstName = (userProfile?.displayName || userProfile?.name || currentUser?.email?.split('@')[0] || 'User').split(' ')[0];

  const navItemBase = `flex items-center gap-3 px-3 py-3 rounded-xl no-underline font-medium transition-all duration-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 ${isCollapsed ? 'justify-center' : ''}`;
  const navItemActive = 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm border-l-4 border-indigo-600';

  return (
    <aside
      className={`
        ${isCollapsed ? 'w-[88px]' : 'w-[280px]'} 
        bg-surface flex flex-col justify-between h-screen py-6 shrink-0
        sticky top-0 border-r border-border transition-all duration-300 ease-in-out z-[1002]
        max-md:fixed max-md:left-0 max-md:top-0 max-md:h-full max-md:shadow-xl max-md:w-[280px]
        ${isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
      `}
    >
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4">
        {/* Header: Logo + Toggle */}
        <div className={`flex items-center mb-8 px-2 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {/* Logo */}
          {!isCollapsed && (
            <div className="flex items-center text-slate-800 font-bold text-xl font-heading tracking-tight gap-2">
              <span className="text-primary-600 text-2xl">◆</span> ProofLayer
            </div>
          )}
          {isCollapsed && (
             <div className="flex items-center justify-center text-primary-600 text-2xl font-bold">
              ◆
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button 
            onClick={toggleCollapse}
            className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <FiMenu className="text-xl" />
          </button>
        </div>

        {/* Profile (condensed if collapsed) */}
        <div className={`flex items-center mb-8 px-2 gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
           <img
             src={userProfile?.photoURL || userAvatar}
             alt={firstName}
             className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-100 shadow-sm"
           />
           {!isCollapsed && (
             <div className="flex flex-col">
               <span className="text-sm text-slate-800 font-bold leading-tight">
                 {firstName}
               </span>
               <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                 {userRole}
               </span>
             </div>
           )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {/* WORKSPACE */}
          <div className="mb-6">
            {!isCollapsed && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-3">
                Workspace
              </p>
            )}
            <Link
              to="/projects"
              className={`${navItemBase} ${isActive('/projects') || location.pathname.startsWith('/projects/') ? navItemActive : ''}`}
              onClick={() => { if(isMobileOpen) toggleMobileMenu(); }}
              title="Projects"
            >
              <BsFolder2 size={20} className={isActive('/projects') || location.pathname.startsWith('/projects/') ? 'text-indigo-600' : ''} /> 
              {!isCollapsed && <span>Projects</span>}
            </Link>
          </div>

          {/* COLLECT */}
          <div className="mb-6">
            {!isCollapsed && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-3">
                Collect
              </p>
            )}
            <Link
              to="/new-proof"
              className={`${navItemBase} ${isActive('/new-proof') ? navItemActive : ''}`}
              onClick={() => { if(isMobileOpen) toggleMobileMenu(); }}
              title="New Proof"
            >
              <BsPlusSquare size={20} className={isActive('/new-proof') ? 'text-indigo-600' : ''} /> 
              {!isCollapsed && <span>New Proof</span>}
            </Link>
            {canImport && (
              <Link
                to="/import"
                className={`${navItemBase} ${isActive('/import') ? navItemActive : ''}`}
                onClick={() => { if(isMobileOpen) toggleMobileMenu(); }}
                title="Import"
              >
                <BsDownload size={20} className={isActive('/import') ? 'text-indigo-600' : ''} /> 
                {!isCollapsed && <span>Import</span>}
              </Link>
            )}
          </div>

          {/* MANAGE */}
          <div className="mb-6">
            {!isCollapsed && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-3">
                Manage
              </p>
            )}
            <Link
              to="/dashboard"
              className={`${navItemBase} ${isActive('/dashboard') ? navItemActive : ''}`}
              onClick={() => { if(isMobileOpen) toggleMobileMenu(); }}
              title="Dashboard"
            >
              <BsHeart size={20} className={isActive('/dashboard') ? 'text-indigo-600' : ''} /> 
              {!isCollapsed && <span>Your Proofs</span>}
            </Link>
            {canManageUsers && (
              <Link
                to="/manage-users"
                className={`${navItemBase} ${isActive('/manage-users') ? navItemActive : ''}`}
                onClick={() => { if(isMobileOpen) toggleMobileMenu(); }}
                title="Manage Users"
              >
                <BsPeople size={20} className={isActive('/manage-users') ? 'text-indigo-600' : ''} /> 
                {!isCollapsed && <span>Users</span>}
              </Link>
            )}
          </div>

          {/* SHARE */}
          <div className="mb-6">
            {!isCollapsed && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-3">
                Share
              </p>
            )}
            <Link
              to="/distribute"
              className={`${navItemBase} ${isActive('/distribute') ? navItemActive : ''}`}
              onClick={() => { if(isMobileOpen) toggleMobileMenu(); }}
              title="Distribute"
            >
              <BsGraphUp size={20} className={isActive('/distribute') ? 'text-indigo-600' : ''} /> 
              {!isCollapsed && <span>Distribute</span>}
            </Link>
            <Link
              to="/ai-insights"
              className={`${navItemBase} ${isActive('/ai-insights') ? navItemActive : ''}`}
              onClick={() => { if(isMobileOpen) toggleMobileMenu(); }}
              title="AI Insights"
            >
              <FaRobot size={20} className={isActive('/ai-insights') ? 'text-indigo-600' : ''} /> 
              {!isCollapsed && <span className="flex items-center gap-2">AI Insights</span>}
            </Link>
          </div>

          {/* ACCOUNT */}
          {canAccessSettings && (
            <div className="mb-6 mt-auto">
              {!isCollapsed && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-3">
                  Account
                </p>
              )}
              <Link
                to="/settings"
                className={`${navItemBase} ${isActive('/settings') ? navItemActive : ''}`}
                title="Settings"
              >
                <BsGear size={20} className={isActive('/settings') ? 'text-indigo-600' : ''} /> 
                {!isCollapsed && <span>Settings</span>}
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Footer: Logout Only */}
      <div className={`pt-4 mt-2 border-t border-border px-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          className={`flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-all duration-200 ${isCollapsed ? 'w-10 h-10 p-0 rounded-full' : 'w-full px-4'}`}
          onClick={handleLogout}
          title="Sign Out"
        >
          <FiLogOut className="text-lg" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;