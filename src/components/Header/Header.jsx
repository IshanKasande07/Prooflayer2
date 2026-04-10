// src/components/Header/Header.jsx
import React from 'react';

const Header = () => {
    return (
        <header className="px-6 md:px-12 py-6 md:py-8 border-b border-border bg-surface shadow-sm">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-content-primary tracking-tight">Add proof to your account</h1>
            <p className="text-content-secondary m-0">Connect your sources and import proofs to ProofLayer.</p>
        </header>
    );
};

export default Header;
