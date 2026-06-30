import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import "./Import.css";
import TestimonialCard from "../../components/TestimonialCard/TestimonialCard";
import ImportSuccessModal from "../../components/ImportSuccessModal/ImportSuccessModal";
import ProjectPickerModal from "../../components/ProjectPickerModal/ProjectPickerModal";
import { useAuth } from "../../contexts/AuthContext";
import { FaSpinner, FaFolderOpen, FaTrash } from 'react-icons/fa';
import { getProjects, assignStagedProofsToProject } from '../../services/projectService';
import { fetchedReviews } from "../../data/fetchedReviews";

const Import = () => {
  const [scrapedTestimonials, setScrapedTestimonials] = useState([]);
  const [selectedTestimonials, setSelectedTestimonials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  // Project reassignment state
  const [projects, setProjects] = useState([]);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [lastReassignedProject, setLastReassignedProject] = useState(null);

  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchScrapedTestimonials();
  }, [userProfile]);

  // Fetch projects for the company once profile is available
  useEffect(() => {
    if (userProfile?.company) {
      getProjects(userProfile.company)
        .then(setProjects)
        .catch(err => console.warn('Could not load projects for reassignment:', err));
    }
  }, [userProfile]);

  const fetchScrapedTestimonials = async () => {
    try {
      setLoading(true);
      let allData = [];

      // 1. Fetch from Firebase (Staging)
      try {
        const q = collection(db, 'imported');
        const querySnapshot = await getDocs(q);
        const fbData = querySnapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        allData = [...fbData];
      } catch (fbError) {
        console.warn("Firebase fetch failed, falling back to local:", fbError);
      }

      // 2. Fetch from LocalStorage
      const localData = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');

      // 3. Add Mock Data if nothing else exists (for demo)
      if (allData.length === 0 && localData.length === 0) {
        allData = [...fetchedReviews];
      } else {
        allData = [...allData, ...localData];
      }

      setScrapedTestimonials(allData);
    } catch (error) {
      console.error("Error fetching imported testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTestimonial = (id) => {
    setSelectedTestimonials((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTestimonials.length === scrapedTestimonials.length) {
      setSelectedTestimonials([]);
    } else {
      setSelectedTestimonials(scrapedTestimonials.map((t) => t.id));
    }
  };

  // ─── Approve & Import ─────────────────────────────────────────────────────
  const handleImport = async () => {
    if (selectedTestimonials.length === 0) return;

    try {
      setImporting(true);
      const batch = writeBatch(db);

      const toImport = scrapedTestimonials.filter(t => selectedTestimonials.includes(t.id));
      const firebaseIdsToDelete = [];
      const localIdsToRemove = [];

      toImport.forEach(item => {
        // 1. Create new doc in 'testimonials' (Live)
        const newRef = doc(collection(db, 'testimonials'));
        const { id, ...data } = item;

        batch.set(newRef, {
          ...data,
          status: 'active',
          approvedAt: new Date().toISOString()
        });

        if (id.toString().startsWith('local-')) {
          localIdsToRemove.push(id);
        } else if (id.toString().startsWith('mock-')) {
          // Mock — skip deletion
        } else {
          firebaseIdsToDelete.push(id);
        }
      });

      firebaseIdsToDelete.forEach(id => {
        batch.delete(doc(db, 'imported', id));
      });

      await batch.commit();

      if (localIdsToRemove.length > 0) {
        const currentLocal = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
        const updatedLocal = currentLocal.filter(t => !localIdsToRemove.includes(t.id));
        localStorage.setItem('temp_scraped_reviews', JSON.stringify(updatedLocal));
      }

      setIsModalOpen(true);
      fetchScrapedTestimonials();
    } catch (error) {
      console.error("Error approving testimonials:", error);
      alert("Failed to import selected testimonials to live database. " + error.message);
    } finally {
      setImporting(false);
    }
  };

  // ─── Delete single proof ──────────────────────────────────────────────────
  const handleDeleteSingle = async (id) => {
    try {
      setLoading(true);
      const idStr = id.toString();
      
      if (!idStr.startsWith('local-') && !idStr.startsWith('mock-')) {
        const docRef = doc(db, 'imported', id);
        const batch = writeBatch(db);
        batch.delete(docRef);
        await batch.commit();
      }

      if (idStr.startsWith('local-')) {
        const currentLocal = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
        const updatedLocal = currentLocal.filter(t => t.id !== id);
        localStorage.setItem('temp_scraped_reviews', JSON.stringify(updatedLocal));
      }

      setScrapedTestimonials(prev => prev.filter(t => t.id !== id));
      setSelectedTestimonials(prev => prev.filter(t_id => t_id !== id));
    } catch (error) {
      console.error("Error deleting single testimonial:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Discard selected proofs ──────────────────────────────────────────────
  const handleDeleteSelected = async () => {
    if (selectedTestimonials.length === 0) return;
    if (!window.confirm(`Discard ${selectedTestimonials.length} selected testimonial(s)? They will not be imported.`)) return;

    try {
      setImporting(true);
      const batch = writeBatch(db);
      const idsToDelete = [...selectedTestimonials];
      const firebaseIds = [];
      const localIds = [];

      idsToDelete.forEach(id => {
        const idStr = id.toString();
        if (idStr.startsWith('local-')) {
          localIds.push(id);
        } else if (!idStr.startsWith('mock-')) {
          firebaseIds.push(id);
        }
      });

      if (firebaseIds.length > 0) {
        firebaseIds.forEach(id => {
          batch.delete(doc(db, 'imported', id));
        });
        await batch.commit();
      }

      if (localIds.length > 0) {
        const currentLocal = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
        const updatedLocal = currentLocal.filter(t => !localIds.includes(t.id));
        localStorage.setItem('temp_scraped_reviews', JSON.stringify(updatedLocal));
      }

      setScrapedTestimonials(prev => prev.filter(t => !selectedTestimonials.includes(t.id)));
      setSelectedTestimonials([]);
    } catch (error) {
      console.error("Error discarding testimonials:", error);
    } finally {
      setImporting(false);
    }
  };

  // ─── Change Project (Reassign) ────────────────────────────────────────────
  const handleChangeProject = () => {
    if (selectedTestimonials.length === 0) return;
    setIsProjectPickerOpen(true);
  };

  const handleProjectReassignConfirmed = async (project) => {
    setReassigning(true);
    try {
      // Separate Firebase IDs from local IDs
      const firebaseIds = selectedTestimonials.filter(
        id => !id.toString().startsWith('local-') && !id.toString().startsWith('mock-')
      );
      const localIds = selectedTestimonials.filter(id => id.toString().startsWith('local-'));

      // Update Firebase staged docs
      if (firebaseIds.length > 0) {
        await assignStagedProofsToProject(firebaseIds, project.id, project.name);
      }

      // Update localStorage docs
      if (localIds.length > 0) {
        const existing = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
        const updated = existing.map(r =>
          localIds.includes(r.id)
            ? { ...r, projectId: project.id, projectName: project.name }
            : r
        );
        localStorage.setItem('temp_scraped_reviews', JSON.stringify(updated));
      }

      setLastReassignedProject(project.name);
      setIsProjectPickerOpen(false);
      setSelectedTestimonials([]);

      // Refresh the list so badges update
      await fetchScrapedTestimonials();
    } catch (err) {
      console.error("Failed to reassign project:", err);
      alert("Could not reassign project. Please try again.");
    } finally {
      setReassigning(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTestimonials([]);
    navigate('/dashboard');
  };

  const selectedCount = selectedTestimonials.length;
  const allSelected = selectedCount === scrapedTestimonials.length && scrapedTestimonials.length > 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-fadeIn min-h-[calc(100vh-80px)]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-content-primary m-0 tracking-tight">
            Review Imported Testimonials
          </h1>
          <p className="text-content-secondary m-0 mt-2 text-base">
            Select testimonials to add to your dashboard ({scrapedTestimonials.length} pending)
          </p>
        </div>

        {/* ── Toolbar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">

          {/* Discard — appears only when something is selected */}
          {selectedCount > 0 && (
            <button
              className="flex-grow md:flex-none px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm flex items-center justify-center gap-2"
              onClick={handleDeleteSelected}
              disabled={importing}
            >
              <FaTrash size={12} /> Discard ({selectedCount})
            </button>
          )}

          {/* Select All toggle */}
          <button
            className="flex-grow md:flex-none px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-bold text-content-primary hover:bg-background hover:border-content-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            onClick={handleSelectAll}
            disabled={scrapedTestimonials.length === 0}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>

          {/* Change Project — appears only when something is selected */}
          {selectedCount > 0 && (
            <button
              className="flex-1 md:flex-none px-4 py-2.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
              onClick={handleChangeProject}
              disabled={reassigning}
            >
              {reassigning
                ? <><FaSpinner className="animate-spin" /> Reassigning...</>
                : <><FaFolderOpen /> Change Project ({selectedCount})</>
              }
            </button>
          )}

          {/* Approve & Import */}
          <button
            className="flex-1 md:flex-none px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border-none"
            onClick={handleImport}
            disabled={selectedCount === 0 || importing}
          >
            {importing && <FaSpinner className="animate-spin" />}
            Approve &amp; Import ({selectedCount})
          </button>
        </div>
      </div>

      {/* ── Reassign feedback toast ─────────────────────────────── */}
      {lastReassignedProject && (
        <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium shadow-sm animate-fadeIn">
          <FaFolderOpen className="text-green-500 flex-shrink-0" />
          <span>
            Selected proofs reassigned to <strong>{lastReassignedProject}</strong>.
          </span>
          <button
            className="ml-auto text-green-600 hover:text-green-800 font-semibold bg-transparent border-none text-xs uppercase tracking-wide"
            onClick={() => setLastReassignedProject(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Proof Cards ────────────────────────────────────────── */}
      {scrapedTestimonials.length === 0 ? (
        <div className="text-center py-16 px-6 text-content-muted bg-surface rounded-2xl border-2 border-dashed border-border mt-4 flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 border border-border">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-content-primary mb-2">No pending imports found</p>
          <p className="text-base text-content-secondary max-w-sm mb-6">
            Use "New Proof" to import from G2, Capterra, or other sources to start building your Wall of Love.
          </p>
          <button
            onClick={() => navigate('/new-proof')}
            className="px-6 py-3 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl font-medium hover:bg-primary-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Start New Import
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
          {scrapedTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="h-full">
              <TestimonialCard
                testimonial={testimonial}
                onSelect={handleSelectTestimonial}
                isSelected={selectedTestimonials.includes(testimonial.id)}
                onDelete={handleDeleteSingle}
                projectName={testimonial.projectName}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      <ImportSuccessModal
        count={selectedCount}
        source="G2"
        onClose={handleCloseModal}
        isOpen={isModalOpen}
      />

      <ProjectPickerModal
        isOpen={isProjectPickerOpen}
        onClose={() => setIsProjectPickerOpen(false)}
        onConfirm={handleProjectReassignConfirmed}
        projects={projects}
        count={selectedCount}
        title="Change Project Assignment"
        subtitle={`Reassign ${selectedCount} selected proof${selectedCount !== 1 ? 's' : ''} to a different project.`}
        confirmLabel="Reassign Proofs"
        mandatory={false}
      />
    </div>
  );
};

export default Import;