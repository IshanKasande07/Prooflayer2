import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { testimonials } from '../../data/testimonials';
import defaultAvatar from '../../assets/avatar.png';
import './ReviewDetails.css';
import { BsGrid, BsChatLeftQuote, BsEnvelopeOpen, BsChatDots, BsFileEarmarkText, BsPencil, BsTrash, BsShare, BsEnvelope, BsBuildings, BsGlobe, BsUpload, BsArrowLeft } from 'react-icons/bs';
import g2Logo from '../../assets/image-49.png';
import { FaXTwitter, FaLinkedinIn, FaFacebookF } from 'react-icons/fa6';

const ReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateReview = location.state?.review;
  const review = stateReview || testimonials.find((t) => t.id === parseInt(id));

  if (!review) {
    return <div>Review not found</div>;
  }

  const displayName = review.author || review.user || 'Customer';
  const displayContent = review.content || review.text || '';
  const displayDate = review.date || '';
  const displayRating = review.rating || null;
  const avatarSrc = review.avatar || defaultAvatar;

  return (
    <div className="flex h-full min-h-screen bg-[#f8fafc] text-slate-800 animate-fadeIn overflow-hidden">
      {/* Sidebar */}
      <div className="w-[320px] bg-white border-r border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto">
        <button 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold w-fit mb-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          onClick={() => navigate('/dashboard')}
        >
          <BsArrowLeft className="text-lg" />
          <span>Customers</span>
        </button>
        
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white mb-8 relative shadow-lg shadow-indigo-500/20">
          <div className="text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/20 p-1 mb-4 shadow-sm backdrop-blur-md">
                <img src={avatarSrc} alt={displayName} className="w-full h-full rounded-full object-cover ring-4 ring-white/10" />
            </div>
            <h2 className="m-0 text-2xl font-bold tracking-tight">{displayName}</h2>
            <p className="m-0 text-white/80 text-sm mt-1.5 font-medium uppercase tracking-widest">Sr. Engineer</p>
          </div>
        </div>

        <div className="flex flex-col gap-5 mb-8">
          <div className="grid grid-cols-[100px_1fr] items-center">
            <div className="inline-flex items-center gap-2 text-slate-700 font-semibold text-sm"><BsEnvelope className="text-slate-400 text-lg" /> <span>Email</span></div>
            <div className="text-slate-600 text-sm truncate bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 font-medium">{displayName.split(' ')[0].toLowerCase()}@example.com</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center">
            <div className="inline-flex items-center gap-2 text-slate-700 font-semibold text-sm"><BsBuildings className="text-slate-400 text-lg" /> <span>Company</span></div>
            <div className="text-slate-600 text-sm truncate bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 font-medium">Acme Corp</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center">
            <div className="inline-flex items-center gap-2 text-slate-700 font-semibold text-sm"><BsGlobe className="text-slate-400 text-lg" /> <span>Website</span></div>
            <div className="text-slate-600 text-sm truncate bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 font-medium">acme.com</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center">
            <div className="inline-flex items-center gap-2 text-slate-700 font-semibold text-sm"><BsUpload className="text-slate-400 text-lg" /> <span>Logo</span></div>
            <div className="text-left"><button className="text-indigo-600 text-sm hover:underline font-semibold hover:text-indigo-700 transition-colors bg-transparent border-none p-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded">Upload a company logo</button></div>
          </div>
          <div className="grid grid-cols-[100px_1fr] items-center mt-2">
            <div className="inline-flex items-center gap-2 text-slate-700 font-semibold text-sm"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> <span>Socials</span></div>
            <div className="flex gap-2 bg-slate-50 border border-slate-200/60 rounded-xl p-1.5 shadow-sm w-fit">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><FaXTwitter /></button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><FaLinkedinIn /></button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><FaFacebookF /></button>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 border-none">
            Invite to a form
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 p-8 md:p-10 bg-[#f8fafc] overflow-y-auto">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide bg-slate-200/50 p-1.5 rounded-xl w-fit">
          <button className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all bg-white text-slate-800 shadow-sm border-none"><BsGrid className="text-indigo-600" /> All</button>
          <button className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50 border-none whitespace-nowrap"><BsChatLeftQuote /> Testimonials</button>
          <button className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50 border-none whitespace-nowrap"><BsEnvelopeOpen /> Invites</button>
          <button className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50 border-none whitespace-nowrap"><BsChatDots /> Feedback</button>
          <button className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50 border-none whitespace-nowrap"><BsFileEarmarkText /> Case studies</button>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-8 text-slate-500 text-sm">
            <div className="inline-flex items-center gap-2.5 font-medium">
                <img src={g2Logo} alt="G2" className="w-6 h-6 rounded-md object-contain bg-slate-50 p-0.5 border border-slate-200 shadow-sm" /> 
                <span>Testimonial imported 3 days ago</span>
            </div>
            <div className="border border-slate-200 px-3 py-1 rounded-md bg-slate-50 text-xs font-bold tracking-widest text-slate-600">
              EN
            </div>
          </div>

          <div className="mb-8">
           {displayRating && (
             <div className="text-yellow-400 text-xl tracking-widest mb-4 flex drop-shadow-sm">
               {"★".repeat(displayRating)}
             </div>
           )}
            <h3 className="text-3xl font-bold text-slate-800 font-heading mb-4 tracking-tight">Developer Friendly IDE</h3>
            <p className="text-slate-600 leading-relaxed text-[17px] m-0 font-medium">{displayContent}</p>
            
            <div className="mt-8">
              <button className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 border-dashed px-4 py-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <div className="w-5 h-5 flex items-center justify-center text-lg">+</div>
                Add a tag
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-8 border-t border-slate-100 gap-6">
            <div className="flex gap-3 w-full sm:w-auto">
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all text-sm flex-1 sm:flex-none border-none focus:outline-none focus:ring-2 focus:ring-emerald-500">Approve</button>
              <button className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-colors text-sm flex-1 sm:flex-none inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-300">Thank Customer <span className="text-[10px] opacity-70">▼</span></button>
            </div>
            <div className="flex gap-2.5 w-full sm:w-auto flex-wrap">
              <button className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 font-semibold px-4 py-2 rounded-xl transition-colors text-sm shadow-sm flex-1 sm:flex-none justify-center focus:outline-none focus:ring-2 focus:ring-slate-300"><BsPencil className="text-[16px]"/> Edit</button>
              <button className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-500 font-semibold px-4 py-2 rounded-xl transition-colors text-sm shadow-sm flex-1 sm:flex-none justify-center focus:outline-none focus:ring-2 focus:ring-slate-300"><BsTrash className="text-[16px]"/> Delete</button>
              <button className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 font-semibold px-4 py-2 rounded-xl transition-colors text-sm shadow-sm flex-1 sm:flex-none justify-center focus:outline-none focus:ring-2 focus:ring-slate-300"><BsShare className="text-[16px]"/> Share</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetails;