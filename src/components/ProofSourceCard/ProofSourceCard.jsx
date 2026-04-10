// src/components/ProofSourceCard/ProofSourceCard.jsx
import React from 'react';
import './ProofSourceCard.css';

// Add onClick to the component's props
const ProofSourceCard = ({ icon, title, isPrimary = false, onClick, isLoading = false }) => {
  return (
    <div 
      className={`relative w-full aspect-[4/3] rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col 
      ${isPrimary ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-md' : 'bg-surface border-slate-200 hover:border-indigo-400 hover:shadow-md hover:-translate-y-1'} 
      ${isLoading ? 'opacity-70 pointer-events-none' : ''}`} 
      onClick={onClick}
    >
      {/* Icon Area background */}
      <div className={`absolute top-0 w-full h-[65%] flex items-center justify-center ${isPrimary ? 'bg-transparent' : 'bg-slate-50/50 border-b border-slate-100/50'}`}>
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-all duration-300 group-hover:scale-110 shadow-sm border 
          ${isPrimary ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 group-hover:shadow-indigo-100'}`}>
          {isLoading ? <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div> : icon}
        </div>
      </div>

      {/* Title area */}
      <div className={`absolute bottom-0 w-full h-[35%] flex items-center justify-center px-4`}>
        <h3 className={`m-0 font-semibold text-center text-sm md:text-base tracking-tight ${isPrimary ? 'text-indigo-900' : 'text-slate-800'}`}>{title}</h3>
      </div>
    </div>
  );
};

export default ProofSourceCard;

