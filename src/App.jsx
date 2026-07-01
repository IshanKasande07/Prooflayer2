import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Sidebar from './components/Sidebar/Sidebar';
import { ProtectedRoute, PublicRoute, PrivilegedRoute, AdminRoute } from './components/ProtectedRoute/ProtectedRoute';

// Pages
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Onboarding from './pages/Onboarding/Onboarding';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import NewProof from './pages/NewProof/NewProof';
import Import from './pages/Import/Import';
import UploadSpreadsheet from './pages/UploadSpreadsheet/UploadSpreadsheet';
import ReviewDetails from './pages/ReviewDetails/ReviewDetails';
import Dashboard from './pages/Dashboard/Dashboard';
import ManualImport from './pages/ManualImport/ManualImport';
import MapColumns from './pages/MapColumns/MapColumns';
import Settings from './pages/Settings/Settings';
import ManageUsers from './pages/ManageUsers/ManageUsers';
import Projects from './pages/Projects/Projects';
import ProjectDashboard from './pages/ProjectDashboard/ProjectDashboard';
import Distribute from './pages/Distribute/Distribute';
import AIInsightsPanel from './pages/AIInsights/AIInsights';




function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - Only accessible when NOT logged in */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />

          {/* Onboarding - Semi-public (after signup, before profile complete) */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Unauthorized Page */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes - Require authentication - MUST BE LAST */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Separate component for authenticated app layout
function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden relative text-slate-800">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        isCollapsed={isSidebarCollapsed}
        toggleMobileMenu={toggleMobileMenu} 
        toggleCollapse={toggleSidebarCollapse}
      />
      <main className="flex-grow flex flex-col overflow-y-auto h-screen bg-background relative w-full transition-all duration-300">
        
        {/* Mobile Header to avoid overlapping */}
        <div className="md:hidden sticky top-0 z-[1000] flex items-center justify-between px-4 py-4 bg-surface border-b border-border shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center justify-center p-2 text-content-secondary hover:text-content-primary hover:bg-background rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={toggleMobileMenu}
              aria-label="Toggle Mobile Menu"
            >
              <FaBars className="text-xl" />
            </button>
            <div className="font-heading font-bold text-lg text-primary-600 tracking-tight flex items-center gap-2">
              <span className="text-xl">◆</span> ProofLayer
            </div>
          </div>
        </div>

        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Projects - All authenticated users */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDashboard />} />

          {/* Dashboard - All authenticated users */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* New Proof - All authenticated users */}
          <Route path="/new-proof" element={<NewProof />} />

          {/* Review Details - All authenticated users */}
          <Route path="/review/:id" element={<ReviewDetails />} />

          {/* Import Routes - All authenticated users (already inside parent ProtectedRoute) */}
          <Route path="/import" element={<Import />} />
          <Route path="/upload-spreadsheet" element={<UploadSpreadsheet />} />
          <Route path="/map-columns" element={<MapColumns />} />
          <Route path="/manual-import" element={<ManualImport />} />

          {/* Manage Users - Admin only */}
          <Route path="/manage-users" element={
            <AdminRoute>
              <ManageUsers />
            </AdminRoute>
          } />

          {/* Distribute - All authenticated users */}
          <Route path="/distribute" element={<Distribute />} />

          {/* AI Insights - All authenticated users */}
          <Route path="/ai-insights" element={<AIInsightsPanel />} />


          {/* Settings - All authenticated users (Admin section handled inside) */}
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1001] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default App;
