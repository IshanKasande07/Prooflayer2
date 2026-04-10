import React, { useState, useRef } from 'react';
import { FaTimes, FaSpinner, FaUpload } from 'react-icons/fa';
import { ASSET_TYPES } from '../../pages/ProjectDashboard/ProjectDashboard'; 

const UploadAssetModal = ({ isOpen, onClose, onUpload }) => {
  const [isExternalLink, setIsExternalLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [newAsset, setNewAsset] = useState({ title: '', type: 'document', url: '' });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!newAsset.title) {
        setNewAsset(prev => ({ ...prev, title: selectedFile.name }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAsset.title.trim()) return;
    if (!isExternalLink && !file) return;
    if (isExternalLink && !newAsset.url.trim()) return;

    try {
      setUploading(true);
      setProgress(0);
      
      const submitData = { ...newAsset };
      if (isExternalLink) {
        submitData.type = 'link'; 
        await onUpload(submitData, null, null); 
      } else {
        await onUpload(submitData, file, (p) => setProgress(p));
      }

      setNewAsset({ title: '', type: 'document', url: '' });
      setFile(null);
      setProgress(0);
      setIsExternalLink(false);
      onClose();
    } catch (error) {
      console.error('Failed to upload asset:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setNewAsset({ title: '', type: 'document', url: '' });
      setFile(null);
      setProgress(0);
      setIsExternalLink(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-content-primary m-0">Upload Asset</h2>
          <button 
            onClick={handleClose}
            disabled={uploading}
            className="text-content-muted hover:text-content-primary transition-colors focus:outline-none p-1 rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex bg-background border border-border p-1 rounded-xl mb-2 items-center">
            <button
              type="button"
              onClick={() => setIsExternalLink(false)}
              disabled={uploading}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${!isExternalLink ? 'bg-white text-primary-600 shadow-sm' : 'text-content-secondary hover:text-content-primary'}`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setIsExternalLink(true)}
              disabled={uploading}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all ${isExternalLink ? 'bg-white text-primary-600 shadow-sm' : 'text-content-secondary hover:text-content-primary'}`}
            >
              External Link
            </button>
          </div>

          {!isExternalLink ? (
            <div>
              <label className="block text-sm font-semibold text-content-secondary mb-1.5">File</label>
              <div 
                className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-primary-400 bg-primary-50/50' : 'border-border hover:border-primary-400 hover:bg-background'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  hidden 
                  disabled={uploading}
                />
                <FaUpload className={`text-2xl mb-2 ${file ? 'text-primary-500' : 'text-content-muted'}`} />
                <p className="text-sm font-medium text-center text-content-primary m-0">
                  {file ? file.name : 'Click to select a file'}
                </p>
                {file && <p className="text-xs text-content-secondary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-content-secondary mb-1.5">Asset URL</label>
              <input 
                type="url" 
                required={isExternalLink}
                value={newAsset.url}
                onChange={(e) => setNewAsset({...newAsset, url: e.target.value})}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                placeholder="https://..."
                disabled={uploading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-content-secondary mb-1.5">Asset Title</label>
            <input 
              type="text" 
              required
              value={newAsset.title}
              onChange={(e) => setNewAsset({...newAsset, title: e.target.value})}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              placeholder="e.g., Q3 Case Study PDF"
              disabled={uploading}
            />
          </div>
          {!isExternalLink && (
            <div>
              <label className="block text-sm font-semibold text-content-secondary mb-1.5">Asset Type</label>
              <select
                value={newAsset.type}
                onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium appearance-none"
                disabled={uploading}
              >
                {ASSET_TYPES.filter(t => t.id !== 'link').map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          )}
          
          {uploading && !isExternalLink && (
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={handleClose}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl font-medium text-content-secondary hover:bg-background transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={uploading || !newAsset.title.trim() || (!isExternalLink && !file) || (isExternalLink && !newAsset.url.trim())}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {uploading && <FaSpinner className="animate-spin" />}
              {uploading ? 'Saving...' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadAssetModal;
