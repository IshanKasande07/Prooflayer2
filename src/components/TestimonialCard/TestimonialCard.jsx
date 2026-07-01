import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

const TestimonialCard = ({ testimonial, onSelect, isSelected, onDelete, horizontal = false, onCardClick }) => {
  const navigate = useNavigate();

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(testimonial.id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this testimonial?')) {
      onDelete(testimonial.id);
    }
  };

  const handleCardClick = (e) => {
    if (!e.target.closest('.testimonial-action-btn')) {
      if (onCardClick) {
        onCardClick(testimonial);
      } else {
        navigate(`/review/${testimonial.id}`);
      }
    }
  };

  const filled = Math.max(0, Math.min(5, Math.round(testimonial.rating || 0)));

  // ─── Horizontal (list-row) variant ───────────────────────────────────────
  if (horizontal) {
    return (
      <div
        className={`group flex items-center gap-4 bg-surface rounded-xl px-5 py-4 shadow-sm border-2 transition-all duration-200 ease-in-out cursor-pointer hover:shadow-md ${isSelected ? 'border-primary-600 ring-4 ring-primary-50' : 'border-transparent hover:border-slate-200'}`}
        onClick={handleCardClick}
        style={{ minHeight: '88px', maxHeight: '88px' }}
      >
        {/* Checkbox */}
        <div className="testimonial-action-btn flex-shrink-0">
          <input
            type="checkbox"
            className="w-5 h-5 cursor-pointer accent-primary-600 rounded focus:ring-primary-500 focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out"
            checked={isSelected || false}
            onChange={handleCheckboxChange}
          />
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {testimonial.avatar ? (
            <img src={testimonial.avatar} alt={testimonial.author} className="w-10 h-10 rounded-full object-cover shadow-sm" onError={(e) => e.target.style.display = 'none'} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-sm font-bold shadow-sm">
              {testimonial.author?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Author info — fixed width */}
        <div className="flex-shrink-0 w-[140px] min-w-[120px]">
          <p className="font-semibold text-content-primary m-0 text-sm truncate">{testimonial.author}</p>
          <p className="text-xs text-content-secondary m-0 truncate">{testimonial.handle || testimonial.role}</p>
        </div>

        {/* Stars */}
        <div className="flex-shrink-0 text-sm leading-none">
          <span className="text-yellow-400">{"★".repeat(filled)}</span>
          <span className="text-gray-200">{"★".repeat(5 - filled)}</span>
        </div>

        {/* Content — fills remaining space, truncated to 2 lines */}
        <div className="flex-1 min-w-0">
          <p className="m-0 text-sm text-content-primary leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {testimonial.content}
          </p>
        </div>

        {/* Right side: badges + date + actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {testimonial.projectName && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="truncate max-w-[80px]">{testimonial.projectName}</span>
            </span>
          )}
          {testimonial.isDistributed && (
            <span className="hidden md:inline-flex bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">Shared</span>
          )}
          <span className="hidden sm:block text-xs text-content-muted whitespace-nowrap">{testimonial.date || new Date().toLocaleDateString()}</span>
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              className="testimonial-action-btn p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 border-none bg-transparent opacity-0 group-hover:opacity-100"
              title="Delete Testimonial"
            >
              <FaTrash size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Default vertical (card) variant ─────────────────────────────────────
  return (
    <div className="relative mb-6 group">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        {onDelete && (
          <button 
            onClick={handleDeleteClick}
            className="testimonial-action-btn p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 border-none bg-transparent opacity-0 group-hover:opacity-100"
            title="Delete Testimonial"
          >
            <FaTrash size={14} />
          </button>
        )}
        <div className="testimonial-action-btn cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 cursor-pointer accent-primary-600 rounded focus:ring-primary-500 focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out"
            checked={isSelected || false}
            onChange={handleCheckboxChange}
          />
        </div>
      </div>

      <div
        className={`bg-surface rounded-xl p-6 shadow-sm border-2 transition-all duration-300 ease-in-out cursor-pointer hover:shadow-float hover:-translate-y-1 ${isSelected ? 'border-primary-600 ring-4 ring-primary-50' : 'border-transparent'}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center mb-4">
          {testimonial.avatar ? (
            <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full mr-4 object-cover shadow-sm" onError={(e) => e.target.style.display = 'none'} />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-700 mr-4 flex items-center justify-center text-lg font-bold shadow-sm">
              {testimonial.author?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-grow flex items-center justify-between">
            <div>
              <p className="font-semibold text-content-primary m-0">{testimonial.author}</p>
              <p className="text-sm text-content-secondary m-0">{testimonial.handle || testimonial.role}</p>
            </div>
            {testimonial.isDistributed && (
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200 uppercase tracking-wider">Shared</span>
            )}
          </div>
        </div>
        <div className="mb-4">
          <span className="text-yellow-400 text-lg">{"★".repeat(filled)}</span>
          <span className="text-gray-200 text-lg">{"★".repeat(5 - filled)}</span>
        </div>

        <div className="mb-4 text-content-primary leading-relaxed">
          <p className="m-0">{testimonial.content}</p>
        </div>

        {/* Footer: date + project badge */}
        <div className="flex justify-between items-center text-sm text-content-muted mt-auto pt-4 border-t border-border/50 gap-2 flex-wrap">
          <p className="m-0 flex-shrink-0">{testimonial.date || new Date().toLocaleDateString()}</p>
          {testimonial.projectName && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex-shrink-0">
              {/* folder icon */}
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="truncate max-w-[120px]">{testimonial.projectName}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;