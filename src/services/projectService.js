import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';

/**
 * PROJECT SERVICES
 */

export const createProject = async (projectData) => {
    try {
        const dataWithTimestamp = {
            ...projectData,
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, 'projects'), dataWithTimestamp);
        return { id: docRef.id, ...dataWithTimestamp };
    } catch (error) {
        console.error('Error creating project:', error);
        throw new Error('Failed to create project: ' + error.message);
    }
};

export const getProjects = async (companyId) => {
    try {
        let q;
        if (companyId) {
            q = query(
                collection(db, 'projects'),
                where('companyId', '==', companyId),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                collection(db, 'projects'),
                orderBy('createdAt', 'desc')
            );
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        if (error.code === 'failed-precondition') {
            console.warn("Missing index for projects ordering. Fetching without order.");
            const querySnapshot = await getDocs(collection(db, 'projects'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        }
        console.error('Error fetching projects:', error);
        throw new Error('Failed to fetch projects: ' + error.message);
    }
};

export const deleteProject = async (projectId) => {
    try {
        await deleteDoc(doc(db, 'projects', projectId));
    } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error('Failed to delete project: ' + error.message);
    }
};

export const getProjectById = async (projectId) => {
    try {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Project not found');
        }
    } catch (error) {
        console.error('Error fetching project details:', error);
        throw new Error('Failed to fetch project details: ' + error.message);
    }
};

/**
 * ASSET SERVICES
 */

export const createAsset = async (assetData) => {
    try {
        const dataWithTimestamp = {
            ...assetData,
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, 'assets'), dataWithTimestamp);
        return { id: docRef.id, ...dataWithTimestamp };
    } catch (error) {
        console.error('Error creating asset:', error);
        throw new Error('Failed to create asset: ' + error.message);
    }
};

export const getAssetsByProject = async (projectId) => {
    try {
        const q = query(
            collection(db, 'assets'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        if (error.code === 'failed-precondition') {
            console.warn("Missing index for assets ordering. Fetching without order.");
            const q = query(collection(db, 'assets'), where('projectId', '==', projectId));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        }
        console.error('Error fetching assets:', error);
        throw new Error('Failed to fetch assets: ' + error.message);
    }
};

export const getTestimonialsByProject = async (projectId) => {
    try {
        // Query both approved (testimonials) and staged (imported) collections in parallel
        const [approvedSnap, stagedSnap] = await Promise.all([
            getDocs(query(
                collection(db, 'testimonials'),
                where('projectId', '==', projectId)
            )),
            getDocs(query(
                collection(db, 'imported'),
                where('projectId', '==', projectId)
            ))
        ]);

        const approved = approvedSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            _staged: false
        }));

        const staged = stagedSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            _staged: true  // flag so the UI can show a "Pending" badge
        }));

        // Approved first, then pending
        return [...approved, ...staged];
    } catch (error) {
        console.error('Error fetching project testimonials:', error);
        throw new Error('Failed to fetch project testimonials: ' + error.message);
    }
};


export const uploadAssetFile = async (file, companyId, projectId, onProgress) => {
    if (!file) throw new Error('No file provided');

    const safeCompanyId = companyId || 'default_company';
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `businesses/${safeCompanyId}/projects/${projectId}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(progress);
            },
            (error) => {
                console.error('Upload failed:', error);
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};

export const deleteAsset = async (asset) => {
    try {
        if (asset.url && asset.url.includes('firebasestorage.googleapis.com')) {
            try {
                const fileRef = ref(storage, asset.url);
                await deleteObject(fileRef);
            } catch (storageErr) {
                console.warn('Failed to delete file from storage:', storageErr);
            }
        }
        await deleteDoc(doc(db, 'assets', asset.id));
    } catch (error) {
        console.error('Error deleting asset:', error);
        throw new Error('Failed to delete asset: ' + error.message);
    }
};

/**
 * Stamps projectId + projectName onto staged (imported) docs.
 * Called right after any ingestion (scrape / manual / spreadsheet).
 */
export const assignStagedProofsToProject = async (docIds, projectId, projectName) => {
    try {
        const batch = writeBatch(db);
        docIds.forEach(id => {
            const ref = doc(db, 'imported', id);
            batch.update(ref, { projectId, projectName });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error assigning staged proofs to project:', error);
        throw new Error('Failed to assign staged proofs: ' + error.message);
    }
};

/**
 * Stamps projectId + projectName onto live testimonial docs.
 * Called from the Dashboard "Assign Project" action.
 */
export const assignTestimonialsToProject = async (docIds, projectId, projectName) => {
    try {
        const batch = writeBatch(db);
        docIds.forEach(id => {
            const ref = doc(db, 'testimonials', id);
            batch.update(ref, { projectId, projectName });
        });
        await batch.commit();
    } catch (error) {
        console.error('Error assigning testimonials to project:', error);
        throw new Error('Failed to assign testimonials: ' + error.message);
    }
};

