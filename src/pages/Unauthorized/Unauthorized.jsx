import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import './Unauthorized.css';

const Unauthorized = () => {
    return (
        <div className="unauthorized-container">
            <div className="unauthorized-card">
                <div className="unauthorized-icon">
                    <FaExclamationTriangle />
                </div>
                <h1>Access Denied</h1>
                <p>You don't have permission to access this page.</p>
                <p className="unauthorized-hint">
                    Please contact your administrator if you believe this is an error.
                </p>
                <Link to="/dashboard" className="back-to-dashboard-btn">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
