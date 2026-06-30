import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

const TestimonialCard = ({ testimonial, onSelect, isSelected, onDelete }) => {
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
      navigate(`/review/${testimonial.id}`);
    }
  };

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
          <span className="text-yellow-400 text-lg">{"★".repeat(Math.round(testimonial.rating || 0))}</span>
          <span className="text-gray-200 text-lg">{"★".repeat(5 - Math.round(testimonial.rating || 0))}</span>
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