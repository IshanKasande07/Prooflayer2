import React, { useState, useMemo } from 'react';
import { FaFolderOpen, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';

/**
 * ProjectPickerModal
 *
 * Props:
 *  isOpen       — boolean
 *  onClose      — () => void  (only used in reassign mode, not post-import mode)
 *  onConfirm    — (project: { id, name }) => Promise<void>
 *  projects     — array of project objects { id, name, description }
 *  count        — number of proofs being assigned
 *  title        — optional custom modal title
 *  subtitle     — optional custom subtitle
 *  confirmLabel — optional custom confirm button label
 *  mandatory    — if true, hides the close/cancel button (post-import mode)
 */
const ProjectPickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  projects = [],
  count = 0,
  title = 'Assign to a Project',
  subtitle,
  confirmLabel = 'Confirm Assignment',
  mandatory = false,
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => p.name?.toLowerCase().includes(q));
  }, [projects, search]);

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      setConfirming(true);
      await onConfirm(selected);
      setSearch('');
      setSelected(null);
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    if (mandatory || confirming) return;
    setSearch('');
    setSelected(null);
    onClose?.();
  };

  if (!isOpen) return null;

  const defaultSubtitle =
    subtitle ||
    `Choose the project that ${count > 0 ? `these ${count} proof${count !== 1 ? 's' : ''}` : 'these proofs'} belong to.`;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-slate-800 m-0">{title}</h2>
            <p className="text-sm text-slate-500 mt-1 m-0">{defaultSubtitle}</p>
          </div>
          {!mandatory && (
            <button
              onClick={handleClose}
              disabled={confirming}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none border-none"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Project list */}
        <div className="px-4 py-2 max-h-64 overflow-y-auto flex flex-col gap-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FaFolderOpen className="text-3xl mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">
                {search ? 'No projects match your search.' : 'No projects found. Create one first.'}
              </p>
            </div>
          ) : (
            filtered.map(project => {
              const isActive = selected?.id === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => setSelected(project)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border focus:outline-none ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm'
                      : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    <FaFolderOpen className="text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm m-0 truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-slate-500 m-0 truncate mt-0.5">{project.description}</p>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            disabled={!selected || confirming}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed border-none focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            {confirming && <FaSpinner className="animate-spin" />}
            {confirming ? 'Assigning...' : confirmLabel}
          </button>
          {mandatory && (
            <p className="text-center text-xs text-slate-400 font-medium">
              You must assign a project to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPickerModal;
