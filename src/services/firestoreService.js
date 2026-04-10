import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Save testimonial/proof data to Firestore
 * @param {Object} testimonialData - The testimonial data object
 * @returns {Promise<string>} - Document ID of the created document
 */
export const saveTestimonial = async (testimonialData) => {
  try {
    // Add timestamp if not provided
    const dataWithTimestamp = {
      ...testimonialData,
      createdAt: testimonialData.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Save to 'testimonials' collection (will be created automatically if it doesn't exist)
    const docRef = await addDoc(collection(db, 'testimonials'), dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error('Error saving testimonial:', error);
    throw new Error('Failed to save testimonial: ' + error.message);
  }
};

/**
 * Save multiple testimonials in batch
 * @param {Array<Object>} testimonials - Array of testimonial data objects
 * @returns {Promise<Array<string>>} - Array of document IDs
 */
export const saveTestimonialsBatch = async (testimonials) => {
  try {
    const docIds = [];
    for (const testimonial of testimonials) {
      const docId = await saveTestimonial(testimonial);
      docIds.push(docId);
    }
    return docIds;
  } catch (error) {
    console.error('Error saving testimonials batch:', error);
    throw new Error('Failed to save testimonials: ' + error.message);
  }
};

