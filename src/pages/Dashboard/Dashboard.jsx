import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './Dashboard.css';
import TestimonialCard from '../../components/TestimonialCard/TestimonialCard';
import TestimonialDrawer from '../../components/TestimonialDrawer/TestimonialDrawer';
import ProjectPickerModal from '../../components/ProjectPickerModal/ProjectPickerModal';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../constants/roles';
import { FaPlus, FaSearch, FaBell, FaEllipsisV, FaTrash, FaSpinner, FaShareAlt, FaFolderOpen, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { BsList } from 'react-icons/bs';
import { fetchedReviews } from '../../data/fetchedReviews';
import { getProjects, assignTestimonialsToProject } from '../../services/projectService';

const Dashboard = () => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Project assignment state
  const [projects, setProjects] = useState([]);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [lastAssignedProject, setLastAssignedProject] = useState(null);

  // Collapsible project sections — track which are collapsed (by name)
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  // Drawer state
  const [drawerTestimonial, setDrawerTestimonial] = useState(null);

  const navigate = useNavigate();
  const { userRole, userProfile } = useAuth();

  const canCreate = hasPermission(userRole, 'canCreateTestimonials');
  const canDelete = hasPermission(userRole, 'canDeleteOwnTestimonials');

  useEffect(() => {
    fetchProofs();
  }, [userProfile]);

  // Fetch projects for the company
  useEffect(() => {
    if (userProfile?.company) {
      getProjects(userProfile.company)
        .then(setProjects)
        .catch(err => console.warn('Dashboard: Could not load projects:', err));
    }
  }, [userProfile]);

  const fetchProofs = async () => {
    try {
      setLoading(true);
      let allData = [];

      try {
        const q = query(collection(db, 'testimonials'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        allData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (fbError) {
        console.warn("Dashboard: Firebase fetch failed:", fbError);
      }

      const localData = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');

      if (allData.length === 0 && localData.length === 0) {
        allData = [...fetchedReviews];
      } else {
        allData = [...allData, ...localData];
      }

      setProofs(allData);
    } catch (error) {
      console.error("Error fetching proofs:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filteredProofs = useMemo(() =>
    proofs.filter(p =>
      p.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [proofs, searchQuery]);

  // ─── Group by project ───────────────────────────────────────────────────────
  const projectGroups = useMemo(() => {
    const groups = {};
    filteredProofs.forEach(proof => {
      const key = proof.projectName || '⬜ Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(proof);
    });

    // Sort: named projects alphabetically, Unassigned last
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      if (a === '⬜ Unassigned') return 1;
      if (b === '⬜ Unassigned') return -1;
      return a.localeCompare(b);
    });

    return sorted; // [ [projectName, [proofs...]], ... ]
  }, [filteredProofs]);

  const allSelected = selectedCards.size === filteredProofs.length && filteredProofs.length > 0;

  // ─── Selection helpers ──────────────────────────────────────────────────────
  const handleCardSelect = (cardId) => {
    setSelectedCards(prev => {
      const next = new Set(prev);
      next.has(cardId) ? next.delete(cardId) : next.add(cardId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredProofs.map(p => p.id)));
    }
  };

  // Select / deselect all proofs within one project section
  const handleSelectGroup = (groupProofs) => {
    const groupIds = groupProofs.map(p => p.id);
    const allGroupSelected = groupIds.every(id => selectedCards.has(id));
    setSelectedCards(prev => {
      const next = new Set(prev);
      if (allGroupSelected) {
        groupIds.forEach(id => next.delete(id));
      } else {
        groupIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(sectionName) ? next.delete(sectionName) : next.add(sectionName);
      return next;
    });
  };

  // ─── Assign to Project ─────────────────────────────────────────────────────
  const handleAssignProject = () => {
    if (selectedCards.size === 0) return;
    setIsProjectPickerOpen(true);
  };

  const handleProjectAssignConfirmed = async (project) => {
    setAssigning(true);
    try {
      const firebaseIds = [...selectedCards].filter(
        id => !id.toString().startsWith('local-') && !id.toString().startsWith('mock-')
      );
      const localIds = [...selectedCards].filter(id => id.toString().startsWith('local-'));

      if (firebaseIds.length > 0) {
        await assignTestimonialsToProject(firebaseIds, project.id, project.name);
      }
      if (localIds.length > 0) {
        const existing = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
        const updated = existing.map(r =>
          localIds.includes(r.id) ? { ...r, projectId: project.id, projectName: project.name } : r
        );
        localStorage.setItem('temp_scraped_reviews', JSON.stringify(updated));
      }

      setLastAssignedProject(project.name);
      setIsProjectPickerOpen(false);
      setSelectedCards(new Set());
      await fetchProofs();
    } catch (err) {
      console.error("Failed to assign project:", err);
      alert("Could not assign project. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (!canDelete || selectedCards.size === 0) return;
    if (!window.confirm(`Delete ${selectedCards.size} selected testimonial(s)?`)) return;

    try {
      setLoading(true);
      const batch = writeBatch(db);
      const idsToDelete = [...selectedCards];
      const firebaseIds = [];
      const localIds = [];

      idsToDelete.forEach(id => {
        const s = id.toString();
        if (s.startsWith('local-')) localIds.push(id);
        else if (!s.startsWith('mock-')) firebaseIds.push(id);
      });

      if (firebaseIds.length > 0) {
        firebaseIds.forEach(id => batch.delete(doc(db, 'testimonials', id)));
        await batch.commit();
      }

      if (localIds.length > 0) {
        const currentLocal = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
        localStorage.setItem('temp_scraped_reviews',
          JSON.stringify(currentLocal.filter(t => !localIds.includes(t.id))));
      }

      setProofs(prev => prev.filter(p => !selectedCards.has(p.id)));
      setSelectedCards(new Set());
    } catch (error) {
      console.error("Error deleting testimonials:", error);
      alert("Failed to delete selected testimonials. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Share ─────────────────────────────────────────────────────────────────
  const handleShareSelected = async () => {
    if (selectedCards.size === 0) return;
    if (!window.confirm(`Share ${selectedCards.size} testimonial(s) to your public API endpoint?`)) return;

    try {
      setLoading(true);
      const batch = writeBatch(db);
      const idsToShare = [...selectedCards];
      const firebaseIdsToShare = new Set(idsToShare.filter(
        id => !id.toString().startsWith('local-') && !id.toString().startsWith('mock-')
      ));
      const localIdsToShare = new Set(idsToShare.filter(id => id.toString().startsWith('local-')));

      let batchHasWrites = false;

      // 1. Unshare currently distributed firebase proofs that aren't in the new selection
      proofs.forEach(proof => {
        const isFirebase = !proof.id.toString().startsWith('local-') && !proof.id.toString().startsWith('mock-');
        if (isFirebase) {
          if (proof.isDistributed && !firebaseIdsToShare.has(proof.id)) {
            batch.update(doc(db, 'testimonials', proof.id), { isDistributed: false });
            batchHasWrites = true;
          }
        }
      });

      // 2. Share the newly selected firebase proofs
      firebaseIdsToShare.forEach(id => {
        batch.update(doc(db, 'testimonials', id), {
          isDistributed: true,
          sharedAt: new Date().toISOString()
        });
        batchHasWrites = true;
      });

      if (batchHasWrites) {
        await batch.commit();
      }

      // Handle local storage unsharing/sharing
      const currentLocal = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
      let localUpdated = false;
      const updatedLocal = currentLocal.map(t => {
        if (localIdsToShare.has(t.id)) {
          localUpdated = true;
          return { ...t, isDistributed: true };
        } else if (t.isDistributed) {
          localUpdated = true;
          return { ...t, isDistributed: false };
        }
        return t;
      });
      
      if (localUpdated) {
        localStorage.setItem('temp_scraped_reviews', JSON.stringify(updatedLocal));
      }

      await fetchProofs();
      setSelectedCards(new Set());
      alert(`Successfully shared ${idsToShare.length} review(s)! They are now available on your Distribution endpoint.`);
    } catch (error) {
      console.error("Error sharing testimonials:", error);
      alert("Failed to share selected testimonials. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedCards.size;

  return (
    <div className="flex flex-col w-full h-full bg-background animate-fadeIn">
      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <header className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-8 border-b border-slate-200 bg-surface shadow-sm z-10 sticky top-0 md:static">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-800 m-0 tracking-tight">Testimonial Library</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Review and organize your testimonials. Assign them to Project Workspaces or share them directly.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button className="hidden md:flex p-2 items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors" onClick={() => {}}>
              <FaEllipsisV />
            </button>
            {canCreate && (
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2.5 font-semibold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={() => navigate('/new-proof')}>
                <FaPlus size={14} /> Create Proof
              </button>
            )}
          </div>
        </div>

        {/* Search + Select All row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <div className="relative w-full sm:max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by author or content..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button className="p-2.5 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative" onClick={() => {}}>
              <FaBell className="text-[18px]" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-surface"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none font-medium hover:text-indigo-600 transition-colors group">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                disabled={filteredProofs.length === 0}
                className="w-4 h-4 cursor-pointer text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
              />
              <span className="group-hover:text-indigo-600">Select all</span>
            </label>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {/* ── Action Toolbar ─────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
          <button className="flex items-center gap-2.5 bg-surface border border-slate-200 rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" onClick={() => {}}>
            <BsList className="text-[16px]" /> Filters
          </button>

          {selectedCount > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap animate-fadeIn">
              {/* Assign to Project */}
              <button
                className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-full px-5 py-2 text-sm font-semibold hover:bg-amber-100 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                onClick={handleAssignProject}
                disabled={assigning}
              >
                {assigning
                  ? <><FaSpinner className="animate-spin" /> Assigning...</>
                  : <><FaFolderOpen size={12} /> Assign Project ({selectedCount})</>
                }
              </button>

              {/* Share */}
              <button className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-5 py-2 text-sm font-semibold hover:bg-indigo-100 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" onClick={handleShareSelected}>
                <FaShareAlt size={12} /> Share ({selectedCount})
              </button>

              {/* Delete */}
              {canDelete && (
                <button className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-full px-5 py-2 text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" onClick={handleDeleteSelected}>
                  <FaTrash size={12} /> Delete ({selectedCount})
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Assign feedback toast ───────────────────────────────── */}
        {lastAssignedProject && (
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium shadow-sm animate-fadeIn">
            <FaFolderOpen className="text-green-500 flex-shrink-0" />
            <span>Selected proofs assigned to <strong>{lastAssignedProject}</strong>.</span>
            <button className="ml-auto text-green-600 hover:text-green-800 font-semibold bg-transparent border-none text-xs uppercase tracking-wide" onClick={() => setLastAssignedProject(null)}>Dismiss</button>
          </div>
        )}

        {/* ── Main Content ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center p-12 text-content-muted">
            <FaSpinner className="animate-spin text-2xl text-primary-500" />
            <span className="ml-3 font-medium">Loading proofs...</span>
          </div>
        ) : filteredProofs.length === 0 ? (
          <div className="text-center py-16 text-content-secondary bg-surface rounded-xl border border-border border-dashed">
            <p className="text-lg font-medium text-content-primary">No proofs found.</p>
            {proofs.length === 0 && (
              <p className="text-sm mt-2">Get started by clicking <strong>"Create a New Proof"</strong> or import from G2!</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {projectGroups.map(([groupName, groupProofs]) => {
              const isUnassigned = groupName === '⬜ Unassigned';
              const isCollapsed = collapsedSections.has(groupName);
              const allGroupSelected = groupProofs.every(p => selectedCards.has(p.id));
              const someGroupSelected = groupProofs.some(p => selectedCards.has(p.id));

              return (
                <section key={groupName}>
                  {/* Project section header */}
                  <div className={`flex items-center gap-3 mb-5 pb-3 border-b-2 ${isUnassigned ? 'border-slate-200' : 'border-indigo-100'}`}>
                    {/* Group checkbox */}
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected; }}
                      onChange={() => handleSelectGroup(groupProofs)}
                      className="w-4 h-4 cursor-pointer accent-indigo-600 rounded"
                      title={`Select all in "${groupName}"`}
                    />

                    {/* Folder icon + name */}
                    <div className={`flex items-center gap-2 flex-1 min-w-0 cursor-pointer group`} onClick={() => toggleSection(groupName)}>
                      <FaFolderOpen className={`text-base flex-shrink-0 ${isUnassigned ? 'text-slate-400' : 'text-indigo-500'}`} />
                      <h2 className={`font-heading font-bold text-base m-0 truncate group-hover:text-indigo-700 transition-colors ${isUnassigned ? 'text-slate-500' : 'text-slate-700'}`}>
                        {isUnassigned ? 'Unassigned' : groupName}
                      </h2>
                      {/* Count badge */}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${isUnassigned ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700'}`}>
                        {groupProofs.length}
                      </span>
                      {/* Collapse chevron */}
                      {isCollapsed
                        ? <FaChevronDown className="ml-auto text-slate-400 text-xs flex-shrink-0" />
                        : <FaChevronUp className="ml-auto text-slate-400 text-xs flex-shrink-0" />
                      }
                    </div>
                  </div>

                  {/* Cards grid */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {groupProofs.map(proof => (
                        <TestimonialCard
                          key={proof.id}
                          testimonial={proof}
                          isSelected={selectedCards.has(proof.id)}
                          onSelect={handleCardSelect}
                          onCardClick={(t) => setDrawerTestimonial(t)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Project Picker Modal ───────────────────────────────────── */}
      <ProjectPickerModal
        isOpen={isProjectPickerOpen}
        onClose={() => setIsProjectPickerOpen(false)}
        onConfirm={handleProjectAssignConfirmed}
        projects={projects}
        count={selectedCount}
        title="Assign to a Project"
        subtitle={`Move ${selectedCount} selected proof${selectedCount !== 1 ? 's' : ''} to a project.`}
        confirmLabel="Assign Proofs"
        mandatory={false}
      />

      {/* ── Testimonial Detail Drawer ──────────────────────────── */}
      <TestimonialDrawer
        testimonial={drawerTestimonial}
        isOpen={!!drawerTestimonial}
        onClose={() => setDrawerTestimonial(null)}
      />
    </div>
  );
};

export default Dashboard;