import React from 'react';
import './ImportSuccessModal.css';
import { FaCheckCircle } from 'react-icons/fa';
import { BsArrowRight } from 'react-icons/bs';

import { useNavigate } from 'react-router-dom';

const ImportSuccessModal = ({ count, source, onClose, isOpen }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleDistribute = () => {
    onClose();
    navigate('/distribute');
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl p-8 max-w-sm w-full shadow-2xl relative animate-slideUp border border-border flex flex-col items-center text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <FaCheckCircle className="text-4xl text-green-500 animate-[bounce_1s_ease-out_1]" />
          </div>
        </div>
        <div className="w-full mb-8">
          <h2 className="text-2xl font-bold text-content-primary font-heading tracking-tight m-0 mb-2">
            Success!
          </h2>
          <p className="text-content-secondary">Imported {count} testimonials from {source}</p>
        </div>
        <div className="flex flex-col gap-3 w-full mt-2">
          <button 
            className="w-full bg-primary-600 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-primary-200 border-none" 
            onClick={handleDistribute}
          >
            Distribute Now <BsArrowRight className="text-lg" />
          </button>
          <button 
            className="w-full text-content-secondary font-medium py-2 hover:text-content-primary hover:underline transition-all focus:outline-none" 
            onClick={onClose}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSuccessModal;