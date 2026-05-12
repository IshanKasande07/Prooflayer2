import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBuilding, FaStar, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { BsList, BsArrowLeft, BsX } from 'react-icons/bs';
import { useAuth } from '../../contexts/AuthContext';
import { saveTestimonial } from '../../services/firestoreService';
import { uploadFile } from '../../services/storageService';
import './ManualImport.css';

const ManualImport = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    author: '',
    role: '',
    avatar: null,
    email: '',
    companyLogo: null,
    company: '',
    companyWebsite: '',
    companySize: '',
    team: '',
    region: '',
    proofType: 'text',
    rating: 0,
    testimonialTitle: '',
    content: '',
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    companyLogo: null
  });

  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
    message: ''
  });

  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) { // Increased to 5MB just in case
        setStatus({ ...status, error: "Image size should be less than 5MB" });
        return;
      }

      setFormData(prev => ({
        ...prev,
        [field]: file
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({
          ...prev,
          [field]: reader.result
        }));
      };
      reader.readAsDataURL(file);
      
      // Clear error if any
      setStatus(prev => ({ ...prev, error: null, message: '' }));
    }
  };

  const removeFile = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }));
    setPreviews(prev => ({ ...prev, [field]: null }));
    if (field === 'avatar' && avatarInputRef.current) avatarInputRef.current.value = '';
    if (field === 'companyLogo' && logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('--- Starting Manual Import Submission ---');
    
    if (!formData.author || !formData.content) {
      setStatus({ ...status, error: "Please fill in all required fields (Name and Testimonial)." });
      return;
    }

    setStatus({ loading: true, error: null, success: false, message: 'Preparing upload...' });

    try {
      let avatarUrl = null;
      let logoUrl = null;

      // 1. Upload Avatar if it exists and is a File object
      if (formData.avatar instanceof File) {
        console.log('Uploading avatar:', formData.avatar.name);
        setStatus(prev => ({ ...prev, message: `Uploading avatar (${(formData.avatar.size / 1024).toFixed(1)} KB)...` }));
        
        // Sanitize filename
        const cleanName = formData.avatar.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const path = `testimonials/avatars/${Date.now()}_${cleanName}`;
        
        try {
          avatarUrl = await uploadFile(formData.avatar, path);
          console.log('Avatar uploaded successfully:', avatarUrl);
        } catch (uploadErr) {
          console.error('Avatar upload failed:', uploadErr);
          throw new Error(`Failed to upload avatar: ${uploadErr.message}`);
        }
      }

      // 2. Upload Company Logo if it exists and is a File object
      if (formData.companyLogo instanceof File) {
        console.log('Uploading company logo:', formData.companyLogo.name);
        setStatus(prev => ({ ...prev, message: `Uploading logo (${(formData.companyLogo.size / 1024).toFixed(1)} KB)...` }));
        
        const cleanName = formData.companyLogo.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const path = `testimonials/logos/${Date.now()}_${cleanName}`;
        
        try {
          logoUrl = await uploadFile(formData.companyLogo, path);
          console.log('Logo uploaded successfully:', logoUrl);
        } catch (uploadErr) {
          console.error('Logo upload failed:', uploadErr);
          throw new Error(`Failed to upload logo: ${uploadErr.message}`);
        }
      }

      // 3. Prepare CLEAN data (Firestore will reject raw File objects)
      setStatus(prev => ({ ...prev, message: 'Saving to database...' }));
      
      const testimonialData = {
        author: formData.author || 'Anonymous',
        role: formData.role || '',
        email: formData.email || '',
        company: formData.company || '',
        companyWebsite: formData.companyWebsite || '',
        companySize: formData.companySize || '',
        team: formData.team || '',
        region: formData.region || '',
        proofType: formData.proofType || 'text',
        rating: Number(formData.rating) || 0,
        testimonialTitle: formData.testimonialTitle || '',
        content: formData.content || '',
        avatar: avatarUrl,
        companyLogo: logoUrl,
        ownerId: currentUser?.uid || 'anonymous',
        source: 'manual',
        status: 'active',
        isDistributed: false,
        importedAt: new Date().toISOString()
      };

      console.log('Saving cleaned data to Firestore:', testimonialData);

      // 4. Save to Firestore
      try {
        const docId = await saveTestimonial(testimonialData);
        console.log('Document saved successfully with ID:', docId);
      } catch (dbErr) {
        console.error('Firestore save failed:', dbErr);
        throw new Error(`Database error: ${dbErr.message}`);
      }

      setStatus({ loading: false, error: null, success: true, message: 'Saved successfully!' });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      console.error('SUBMISSION FAILED:', err);
      setStatus({ 
        loading: false, 
        error: err.message || 'An unexpected error occurred.', 
        success: false,
        message: '' 
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fadeIn">
      <header className="bg-surface border-b border-border px-8 md:px-12 py-8 flex items-start flex-col gap-2 shadow-sm relative w-full">
        <button 
          className="absolute left-4 md:left-8 top-8 p-2 rounded-full hover:bg-background transition-colors text-content-secondary hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500" 
          onClick={() => navigate(-1)}
        >
          <BsArrowLeft className="text-xl" />
        </button>
        <div className="ml-10 md:ml-12">
          <h1 className="font-heading text-3xl font-bold text-content-primary m-0 tracking-tight">Manual import</h1>
          <p className="text-sm text-content-secondary font-medium m-0 mt-1">Manually add video, text or screengrabs proof to your account.</p>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-6 md:px-12 py-10 flex flex-col items-center w-full">
        <div className="w-full max-w-4xl bg-surface rounded-2xl p-8 lg:p-10 border border-border shadow-soft">
          
          {/* Status Messages */}
          {status.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-slideIn">
              <FaExclamationCircle />
              <span>{status.error}</span>
            </div>
          )}

          {status.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-slideIn">
              <FaCheckCircle />
              <span>Testimonial saved successfully! Redirecting...</span>
            </div>
          )}

          <div className="flex justify-center mb-10 pb-6 border-b border-border/50">
            <button type="button" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all bg-primary-50 text-primary-700 border border-primary-200 shadow-sm hover:bg-primary-100">
              <BsList /> Text testimonial
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="border-t border-border/50 pt-8 flex flex-col gap-6 first:border-0 first:pt-0">
              <div className="flex flex-col gap-2">
                <label htmlFor="author" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Customer name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="role" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Designation
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="Your Designation"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-content-secondary uppercase tracking-wider">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center text-content-muted shadow-sm overflow-hidden group">
                    {previews.avatar ? (
                      <img src={previews.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <FaUser className="text-xl" />
                    )}
                    {previews.avatar && (
                      <button 
                        type="button"
                        onClick={() => removeFile('avatar')}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <BsX className="text-2xl" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-content-primary hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => avatarInputRef.current.click()}
                  >
                    {previews.avatar ? 'Change Image' : 'Pick an Image'}
                  </button>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    id="avatar-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    style={{ display: 'none' }}
                  />
                  {formData.avatar && !previews.avatar && <span className="text-xs text-content-muted">{formData.avatar.name}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your Email"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-content-secondary uppercase tracking-wider">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-background border border-border rounded-full flex items-center justify-center text-content-muted shadow-sm overflow-hidden group">
                    {previews.companyLogo ? (
                      <img src={previews.companyLogo} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <FaBuilding className="text-xl" />
                    )}
                    {previews.companyLogo && (
                      <button 
                        type="button"
                        onClick={() => removeFile('companyLogo')}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <BsX className="text-2xl" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-content-primary hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => logoInputRef.current.click()}
                  >
                    {previews.companyLogo ? 'Change Image' : 'Pick an Image'}
                  </button>
                  <input
                    type="file"
                    ref={logoInputRef}
                    id="company-logo-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'companyLogo')}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="company" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your Company"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="companyWebsite" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    Company Website
                  </label>
                  <input
                    type="url"
                    id="companyWebsite"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleInputChange}
                    placeholder="www.example.com"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="companySize" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    Company Size
                  </label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select Company Size</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1000+">1000+</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="team" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    Team
                  </label>
                  <input
                    type="text"
                    id="team"
                    name="team"
                    value={formData.team}
                    onChange={handleInputChange}
                    placeholder="Your Team"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="region" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    Region
                  </label>
                  <input
                    type="text"
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder="Your Region"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="proofType" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                    Proof Type
                  </label>
                  <select
                    id="proofType"
                    name="proofType"
                    value={formData.proofType}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none appearance-none cursor-pointer pr-10"
                  >
                    <option value="text">Text</option>
                    <option value="video">Video</option>
                    <option value="screengrab">Screengrab</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-content-secondary uppercase tracking-wider">Ratings</label>
                <div className="flex items-center gap-2 text-2xl mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`cursor-pointer hover:scale-110 transition-transform ${formData.rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                      onClick={() => handleRatingClick(star)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="testimonialTitle" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Testimonial Title
                </label>
                <input
                  type="text"
                  id="testimonialTitle"
                  name="testimonialTitle"
                  value={formData.testimonialTitle}
                  onChange={handleInputChange}
                  placeholder="Write your testimonial title"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="content" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Testimonial <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your testimonial"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none resize-y"
                  rows="6"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-border mt-4">
              <button 
                type="submit" 
                disabled={status.loading}
                className={`px-8 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-float shadow-sm border-none focus:outline-none focus:ring-4 focus:ring-primary-50 transition-all flex items-center gap-2 ${status.loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {status.loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> {status.message || 'Saving...'}
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ManualImport;


