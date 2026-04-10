import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPencilAlt, FaFileExcel, FaPlus, FaLock } from 'react-icons/fa';
import ProofSourceCard from '../../components/ProofSourceCard/ProofSourceCard';
import ImportModal from '../../components/ImportModal/ImportModal';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../constants/roles';
import './NewProof.css';

// Import the logos from your assets folder
import g2Logo from '../../assets/image-49.png';
import capterraLogo from '../../assets/image-50.png';
import trustradiusLogo from '../../assets/image-51.png';
import getappLogo from '../../assets/image-54.png';

const BrandLogo = ({ src, alt }) => (
  <img src={src} alt={alt} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
);

// All available sources with their required permission
const allSources = [
  { id: 1, icon: <FaPencilAlt style={{ fontSize: '2.5rem' }} />, title: 'Manual Import', requiresImport: false },
  { id: 2, icon: <FaFileExcel style={{ fontSize: '2.5rem' }} />, title: 'Upload Spreadsheet', requiresImport: true },
  { id: 3, icon: <BrandLogo src={g2Logo} alt="G2" />, title: 'G2', requiresImport: true },
  { id: 4, icon: <BrandLogo src={capterraLogo} alt="Capterra" />, title: 'Capterra', requiresImport: true },
  { id: 5, icon: <BrandLogo src={trustradiusLogo} alt="Trustradius" />, title: 'Trustradius', requiresImport: true },
  { id: 6, icon: <BrandLogo src={getappLogo} alt="Getapp" />, title: 'Getapp', requiresImport: true },
];

const NewProof = () => {
  const [selectedSource, setSelectedSource] = useState(null);
  const [loadingCard, setLoadingCard] = useState(null);
  const [isBannerVisible, setBannerVisible] = useState(true);
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const canImport = hasPermission(userRole, 'canImportTestimonials');

  const handleCardClick = (source) => {
    // Block click if source requires import permission and user doesn't have it
    if (source.requiresImport && !canImport) {
      return;
    }

    if (source.title === 'Upload Spreadsheet') {
      navigate('/upload-spreadsheet');
    } else if (source.title === 'Manual Import') {
      navigate('/manual-import');
    } else if (source.title !== 'Request a New Source') {
      setLoadingCard(source.id);
      setTimeout(() => {
        setSelectedSource(source);
        setLoadingCard(null);
      }, 400);
    }
  };

  const handleCloseModal = () => {
    setSelectedSource(null);
  };

  const handleCloseBanner = () => {
    setBannerVisible(false);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-transparent w-full animate-fadeIn relative">
        {isBannerVisible && (
          <div className="bg-slate-900 text-slate-100 text-center py-2.5 px-6 flex justify-center items-center relative text-[13px] font-medium shadow-sm z-50">
            <span>You are on the Free Plan. <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors ml-1 font-semibold underline decoration-indigo-400/30 underline-offset-2">Upgrade Now!</a></span>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 text-xl leading-none cursor-pointer hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" onClick={handleCloseBanner}>&times;</button>
          </div>
        )}
        <header className="bg-surface border-b border-slate-200 px-6 md:px-10 py-8 w-full shadow-sm z-10 sticky top-0 md:static">
          <h1 className="font-heading text-3xl font-bold text-slate-800 mb-1.5 tracking-tight">Add proof to your account</h1>
          <p className="text-sm text-slate-500 font-medium m-0">Connect your sources and import proofs to ProofLayer.</p>
        </header>

        <main className="flex-grow overflow-y-auto px-6 md:px-12 py-10 flex flex-col items-center w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-6xl mx-auto">
            {allSources.map((source, index) => {
              const isLocked = source.requiresImport && !canImport;
              return (
                <div key={source.id} className={`relative w-full group transition-all duration-300 animate-slideUp fill-mode-both`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <ProofSourceCard
                    icon={source.icon}
                    title={source.title}
                    onClick={() => handleCardClick(source)}
                    isLoading={loadingCard === source.id}
                  />
                  {isLocked && (
                    <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 z-10 p-4 border border-slate-200/50 group-hover:bg-slate-50/50 transition-colors pointer-events-none">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shadow-sm mb-1 border border-slate-200">
                        <FaLock className="text-lg text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Privileged access</span>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="relative w-full animate-slideUp fill-mode-both" style={{ animationDelay: `${allSources.length * 0.1}s` }}>
              <ProofSourceCard
                icon={<FaPlus />}
                title="Request a New Source"
                isPrimary={true}
                onClick={() => console.log("Request new source clicked")}
              />
            </div>
          </div>
        </main>
      </div>

      <ImportModal source={selectedSource} onClose={handleCloseModal} />
    </>
  );
};

export default NewProof;