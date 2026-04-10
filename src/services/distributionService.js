import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { fetchedReviews } from '../data/fetchedReviews';

/**
 * Distribution API Service
 * This service provides reviews for the "Distribute" feature, 
 * merging Firebase data, Local Storage, and the Fetched Reviews fallback.
 */

export const getDistributionReviews = async (options = {}) => {
  const { maxReviews = 10, source = null, distributedOnly = true } = options;
  let reviews = [];

  // 1. Try fetching from Firebase Approved Testimonials
  try {
    let q;
    if (distributedOnly) {
      q = source 
        ? query(collection(db, 'testimonials'), where('status', '==', 'active'), where('isDistributed', '==', true), where('source', '==', source), limit(maxReviews))
        : query(collection(db, 'testimonials'), where('status', '==', 'active'), where('isDistributed', '==', true), limit(maxReviews));
    } else {
      q = source 
        ? query(collection(db, 'testimonials'), where('status', '==', 'active'), where('source', '==', source), limit(maxReviews))
        : query(collection(db, 'testimonials'), where('status', '==', 'active'), limit(maxReviews));
    }
    
    const querySnapshot = await getDocs(q);
    reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'firebase'
    }));
  } catch (error) {
    console.warn("Distribution API: Firebase fetch failed, continuing to local sources.", error);
  }

  // 2. Fetch from Local Storage (fallback/temp)
  try {
    const localData = JSON.parse(localStorage.getItem('temp_scraped_reviews') || '[]');
    const formattedLocal = localData.map(r => ({ ...r, type: 'local' }));
    reviews = [...reviews, ...formattedLocal];
  } catch (error) {
    console.error("Distribution API: Local Storage error", error);
  }

  // 3. Fallback to Static JSON API (The "Fetched Review" API)
  if (reviews.length < 2) {
    try {
      const response = await fetch('/api/reviews.json');
      if (response.ok) {
        const jsonData = await response.json();
        const formattedApi = jsonData.map(r => ({ ...r, type: 'api-fetched' }));
        reviews = [...reviews, ...formattedApi];
      }
    } catch (error) {
      console.warn("Distribution API: Static JSON fetch failed, using internal mock fallback.", error);
      const mockData = fetchedReviews.map(r => ({ ...r, type: 'mock' }));
      reviews = [...reviews, ...mockData];
    }
  }

  // 4. Final filtering and limit
  if (source) {
    reviews = reviews.filter(r => r.source?.toLowerCase() === source.toLowerCase());
  }

  return reviews.slice(0, maxReviews);
};

/**
 * Public distribution API (JSON endpoint simulation)
 */
export const getDistributionApiUrl = () => {
  return `${window.location.origin}/api/reviews.json`;
};

/**
 * Simulates an external API call that might be used by a distribution pixel
 */
export const fetchPublicReviews = async (token) => {
  console.log(`Fetching public reviews for token: ${token}`);
  return await getDistributionReviews({ maxReviews: 5 });
};
