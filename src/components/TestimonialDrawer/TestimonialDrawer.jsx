import React, { useEffect } from 'react';
import { FaTimes, FaStar, FaRegStar, FaFolderOpen, FaShareAlt, FaCalendarAlt, FaUser, FaBriefcase, FaQuoteLeft } from 'react-icons/fa';

const TestimonialDrawer = ({ testimonial, isOpen, onClose }) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const filled = Math.max(0, Math.min(5, Math.round(testimonial?.rating || 0)));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer panel — slides from LEFT */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-surface z-[2001] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800 m-0 tracking-tight font-heading">
            Testimonial Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 border-none bg-transparent"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        {testimonial && (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Author Section */}
            <div className="flex items-center gap-4 mb-6">
              {testimonial.avatar ? (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-primary-100"
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center text-xl font-bold shadow-md">
                  {testimonial.author?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-base m-0 truncate">{testimonial.author}</p>
                {(testimonial.handle || testimonial.role) && (
                  <p className="text-sm text-slate-500 m-0 mt-0.5 truncate">{testimonial.handle || testimonial.role}</p>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <span className="text-sm font-semibold text-slate-600 mr-1">Rating</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  i < filled
                    ? <FaStar key={i} className="text-yellow-400 text-lg" />
                    : <FaRegStar key={i} className="text-slate-200 text-lg" />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-500 ml-1">{testimonial.rating || 0}/5</span>
            </div>

            {/* Full content */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <FaQuoteLeft className="text-primary-200 text-lg mt-1 flex-shrink-0" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest m-0">Full Review</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <p className="text-slate-700 text-[15px] leading-relaxed m-0 whitespace-pre-wrap">
                  {testimonial.content}
                </p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-col gap-3">
              {/* Source */}
              {testimonial.source && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FaShareAlt className="text-indigo-500 text-xs" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">Source</p>
                    <p className="text-slate-700 font-medium m-0">{testimonial.source}</p>
                  </div>
                </div>
              )}

              {/* Date */}
              {testimonial.date && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <FaCalendarAlt className="text-emerald-500 text-xs" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">Date</p>
                    <p className="text-slate-700 font-medium m-0">{testimonial.date}</p>
                  </div>
                </div>
              )}

              {/* Project */}
              {testimonial.projectName && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <FaFolderOpen className="text-amber-500 text-xs" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">Project</p>
                    <p className="text-slate-700 font-medium m-0">{testimonial.projectName}</p>
                  </div>
                </div>
              )}

              {/* Status badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {testimonial.isDistributed && (
                  <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-200 uppercase tracking-wider">
                    <FaShareAlt size={10} /> Shared
                  </span>
                )}
                {testimonial.status && (
                  <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${
                    testimonial.status === 'active'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : testimonial.status === 'pending'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {testimonial.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default TestimonialDrawer;
