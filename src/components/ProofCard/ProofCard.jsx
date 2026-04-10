import React from 'react';
import { Link } from 'react-router-dom';
import './ProofCard.css';
import userAvatar from '../../assets/avatar.png';

const ProofCard = ({ proof }) => {
  const { user, date, text, source } = proof;

  return (
    <Link to={`/review/${proof.id}`} state={{ review: proof }} className="block w-full">
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm hover:border-primary-400 hover:shadow-float hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer group">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-background border border-border shadow-sm">
               <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
            <span className="font-medium text-content-primary group-hover:text-primary-600 transition-colors">{user}</span>
          </div>
          <div className="text-sm text-content-secondary font-medium bg-background px-2.5 py-1 rounded-md border border-border/50">{date}</div>
        </div>
        <div className="flex-grow mb-6">
          <p className="text-content-secondary text-base leading-relaxed line-clamp-4 m-0 group-hover:text-content-primary transition-colors">{text}</p>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
          <div className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
            {source}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-content-secondary hover:text-content-primary hover:bg-background rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-content-muted">View</button>
            <button className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200">Share</button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProofCard;