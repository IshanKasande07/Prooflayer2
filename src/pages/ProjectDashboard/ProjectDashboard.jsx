import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../constants/roles';
import { getProjectById, getAssetsByProject, getTestimonialsByProject, createAsset, uploadAssetFile, deleteAsset } from '../../services/projectService';
import TestimonialCard from '../../components/TestimonialCard/TestimonialCard';
import UploadAssetModal from '../../components/UploadAssetModal/UploadAssetModal';
import { FaArrowLeft, FaPlus, FaSpinner, FaFileAlt, FaVideo, FaImage, FaLink, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';

export const ASSET_TYPES = [
  { id: 'document', label: 'Document', icon: <FaFileAlt /> },
  { id: 'video', label: 'Video', icon: <FaVideo /> },
  { id: 'image', label: 'Image', icon: <FaImage /> },
  { id: 'link', label: 'External Link', icon: <FaLink /> }
];

const ProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, userRole } = useAuth();
  // using admin bypass logic embedded here or in helper
  const canManageAssets = hasPermission(userRole, 'canImportTestimonials') || userRole === 'admin';
  
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets');
  
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projData, assetsData, testimonialsData] = await Promise.all([
        getProjectById(id),
        getAssetsByProject(id),
        getTestimonialsByProject(id)
      ]);
      setProject(projData);
      setAssets(assetsData);
      setTestimonials(testimonialsData);
    } catch (error) {
      console.error('Error fetching project dashboard data:', error);
      if (error.message.includes('not found')) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAsset = async (assetData, file, onProgress) => {
    let finalUrl = assetData.url;

    if (file) {
      finalUrl = await uploadAssetFile(file, userProfile?.company, id, onProgress);
    }
    
    const created = await createAsset({
      projectId: id,
      title: assetData.title,
      type: assetData.type,
      url: finalUrl,
      uploadedBy: userProfile?.uid || 'Unknown',
    });
    setAssets([created, ...assets]);
  };

  const handleDeleteAsset = async (e, asset) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${asset.title}"?`)) {
      try {
        await deleteAsset(asset);
        setAssets(assets.filter(a => a.id !== asset.id));
      } catch (error) {
        console.error("Error deleting asset:", error);
      }
    }
  };

  const getAssetIcon = (typeId) => {
    const type = ASSET_TYPES.find(t => t.id === typeId);
    return type ? type.icon : <FaFileAlt />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-background">
        <FaSpinner className="animate-spin text-3xl text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-background animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col gap-6 px-6 py-8 md:px-10 border-b border-border bg-surface shadow-sm z-10 sticky top-0 md:static">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="p-2 rounded-full hover:bg-background text-content-secondary hover:text-content-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <FaArrowLeft />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-content-primary m-0 tracking-tight flex items-center gap-3">
              {project?.name}
            </h1>
            <p className="text-sm text-content-secondary font-medium mt-1 mb-0">{project?.description}</p>
          </div>
          <div className="flex items-center gap-3">
             {canManageAssets && (
               <button 
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-none"
                  onClick={() => setIsAssetModalOpen(true)}
                >
                  <FaPlus /> Upload Asset
               </button>
             )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border mt-2">
          <button
            className={`pb-3 text-sm font-semibold transition-colors relative focus:outline-none ${activeTab === 'assets' ? 'text-primary-600' : 'text-content-secondary hover:text-content-primary'}`}
            onClick={() => setActiveTab('assets')}
          >
            Assets ({assets.length})
            {activeTab === 'assets' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></span>
            )}
          </button>
          <button
            className={`pb-3 text-sm font-semibold transition-colors relative focus:outline-none ${activeTab === 'testimonials' ? 'text-primary-600' : 'text-content-secondary hover:text-content-primary'}`}
            onClick={() => setActiveTab('testimonials')}
          >
            Testimonials ({testimonials.length})
            {activeTab === 'testimonials' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* Assets Tab Content */}
        {activeTab === 'assets' && (
          <div className="animate-fadeIn">
            {assets.length === 0 ? (
               <div className="text-center py-16 text-content-secondary bg-surface rounded-xl border border-border border-dashed shadow-sm">
                 <FaFileAlt className="text-4xl text-content-muted mx-auto mb-4" />
                 <p className="text-lg font-medium text-content-primary">No assets uploaded yet.</p>
                 {canManageAssets && (
                   <button 
                    onClick={() => setIsAssetModalOpen(true)}
                    className="mt-4 text-primary-600 font-semibold hover:underline bg-transparent border-none focus:outline-none"
                   >
                     Upload your first asset
                   </button>
                 )}
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {assets.map(asset => (
                  <div key={asset.id} className="bg-surface rounded-xl border border-border p-5 flex flex-col hover:shadow-md hover:border-primary-300 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-lg">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div className="flex items-center gap-2">
                        {canManageAssets && (
                          <button
                            onClick={(e) => handleDeleteAsset(e, asset)}
                            className="p-1.5 text-content-muted hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
                            title="Delete Asset"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                        <a 
                          href={asset.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 text-content-muted hover:text-primary-600 transition-colors rounded-md hover:bg-primary-50"
                          title="Open Link"
                        >
                          <FaExternalLinkAlt size={12} />
                        </a>
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-content-primary mb-1 line-clamp-2">{asset.title}</h3>
                    <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-4">{ASSET_TYPES.find(t => t.id === asset.type)?.label || asset.type}</p>
                    <div className="mt-auto text-xs text-content-secondary font-medium">
                      Added {asset.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Testimonials Tab Content */}
        {activeTab === 'testimonials' && (
          <div className="animate-fadeIn">
             {testimonials.length === 0 ? (
               <div className="text-center py-16 text-content-secondary bg-surface rounded-xl border border-border border-dashed shadow-sm">
                 <p className="text-lg font-medium text-content-primary">No testimonials attached to this project yet.</p>
                 <p className="text-sm mt-2 text-content-secondary max-w-sm mx-auto">
                   Import proofs and assign them to this project, or use the Dashboard to reassign existing proofs.
                 </p>
               </div>
            ) : (
              <div className="flex flex-col gap-3">
                {testimonials.map(proof => (
                  <div key={proof.id} className="relative">
                    {proof._staged && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          ⏳ Pending Approval
                        </span>
                      </div>
                    )}
                    <TestimonialCard
                      testimonial={proof}
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <UploadAssetModal 
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onUpload={handleUploadAsset}
      />
    </div>
  );
};

export default ProjectDashboard;
