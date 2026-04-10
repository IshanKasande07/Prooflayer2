import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import "./Import.css";
import TestimonialCard from "../../components/TestimonialCard/TestimonialCard";
import ImportSuccessModal from "../../components/ImportSuccessModal/ImportSuccessModal";
import { useAuth } from "../../contexts/AuthContext";
import { FaSpinner } from 'react-icons/fa';

import { fetchedReviews } from "../../data/fetchedReviews";

const Import = () => {
  const [scrapedTestimonials, setScrapedTestimonials] = useState([]);
  const [selectedTestimonials, setSelectedTestimonials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchScrapedTestimonials();
  }, [userProfile]); // Refresh when profile loads

  const fetchScrapedTestimonials = async () => {
    try {
      setLoading(true);
      let allData = [];

      // 1. Fetch from Firebase (Staging)
      try {
        const q = query(
          collection(db, 'imported')
        );
        const querySnapshot = await getDocs(q);
        const fbData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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
        // Merge them, avoiding duplicates if possible (simple merge for now)
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

  const handleImport = async () => {
    if (selectedTestimonials.length === 0) return;

    try {
      setImporting(true);
      const batch = writeBatch(db);

      // Get the full data objects for selected IDs
      const toImport = scrapedTestimonials.filter(t => selectedTestimonials.includes(t.id));
      const firebaseIdsToDelete = [];
      const localIdsToRemove = [];

      toImport.forEach(item => {
        // 1. Create new doc in 'testimonials' (Live)
        // Note: Even if we got the review from local, we try to save to Firebase 'testimonials'
        const newRef = doc(collection(db, 'testimonials'));
        const { id, ...data } = item; // Remove the old ID

        batch.set(newRef, {
          ...data,
          status: 'active',
          approvedAt: new Date().toISOString()
        });

        // 2. Track where to delete from
        if (id.toString().startsWith('local-')) {
          localIdsToRemove.push(id);
        } else if (id.toString().startsWith('mock-')) {
          // Mock data doesn't need to be deleted from anywhere persistent
        } else {
          firebaseIdsToDelete.push(id);
        }
      });

      // Commit Firebase batch (creates new testimonials and deletes from 'imported')
      firebaseIdsToDelete.forEach(id => {
        const oldRef = doc(db, 'imported', id);
        batch.delete(oldRef);
      });

      await batch.commit();

      // Clean up localStorage
      if (localIdsToRemove.length > 0) {
        const currentLocal = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
        const updatedLocal = currentLocal.filter(t => !localIdsToRemove.includes(t.id));
        localStorage.setItem('temp_scraped_reviews', JSON.stringify(updatedLocal));
      }

      setIsModalOpen(true);
      fetchScrapedTestimonials(); // Refresh list
    } catch (error) {
      console.error("Error approving testimonials:", error);
      alert("Failed to import selected testimonials to live database. " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTestimonials([]);
    navigate('/dashboard'); // Go to dashboard to see active proof
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-fadeIn min-h-[calc(100vh-80px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-content-primary m-0 tracking-tight">Review Imported Testimonials</h1>
          <p className="text-content-secondary m-0 mt-2 text-base">Select testimonials to add to your dashboard ({scrapedTestimonials.length} pending)</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            className="flex-1 md:flex-none px-4 py-2.5 bg-surface border border-border rounded-lg text-sm font-medium text-content-primary hover:bg-background hover:border-content-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            onClick={handleSelectAll}
            disabled={scrapedTestimonials.length === 0}
          >
            {selectedTestimonials.length === scrapedTestimonials.length && scrapedTestimonials.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          <button
            className="flex-1 md:flex-none px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border-none"
            onClick={handleImport}
            disabled={selectedTestimonials.length === 0 || importing}
          >
            {importing && <FaSpinner className="animate-spin" />}
            Approve & Import ({selectedTestimonials.length})
          </button>
        </div>
      </div>

      {scrapedTestimonials.length === 0 ? (
        <div className="text-center py-16 px-6 text-content-muted bg-surface rounded-2xl border-2 border-dashed border-border mt-4 flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 border border-border">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
          </div>
          <p className="text-xl font-semibold text-content-primary mb-2">No pending imports found</p>
          <p className="text-base text-content-secondary max-w-sm mb-6">Use "New Proof" to import from G2, Capterra, or other sources to start building your Wall of Love.</p>
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
              />
            </div>
          ))}
        </div>
      )}

      <ImportSuccessModal
        count={selectedTestimonials.length}
        source="G2" // Or dynamic based on selection
        onClose={handleCloseModal}
        isOpen={isModalOpen}
      />
    </div>
  );
};

export default Import;