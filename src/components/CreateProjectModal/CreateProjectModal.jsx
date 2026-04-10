import React, { useState } from 'react';
import { FaTimes, FaSpinner } from 'react-icons/fa';

const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onCreate({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-content-primary m-0">Create New Project</h2>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-content-muted hover:text-content-primary transition-colors focus:outline-none p-1 rounded hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-content-secondary mb-1.5">Project Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              placeholder="e.g., Marketing Q3 Campaign"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-content-secondary mb-1.5">Description (Optional)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium min-h-[100px] resize-none"
              placeholder="Brief description of the project goals..."
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <button 
              type="button" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-medium text-content-secondary hover:bg-background transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {isSubmitting && <FaSpinner className="animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
