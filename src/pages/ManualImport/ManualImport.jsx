import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBuilding, FaStar } from 'react-icons/fa';
import { BsList, BsArrowLeft } from 'react-icons/bs';
import './ManualImport.css';

const ManualImport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: '',
    designation: '',
    avatar: null,
    email: '',
    companyLogo: null,
    company: '',
    companyWebsite: '',
    companySize: '',
    team: '',
    region: '',
    proofType: '',
    rating: 0,
    testimonialTitle: '',
    testimonial: '',
  });

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
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-fadeIn">
      <header className="bg-surface border-b border-border px-8 md:px-12 py-8 flex items-start flex-col gap-2 shadow-sm relative w-full">
        <button className="absolute left-4 md:left-8 top-8 p-2 rounded-full hover:bg-background transition-colors text-content-secondary hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500" onClick={() => navigate('/')}>
          <BsArrowLeft className="text-xl" />
        </button>
        <div className="ml-10 md:ml-12">
          <h1 className="font-heading text-3xl font-bold text-content-primary m-0 tracking-tight">Manual import</h1>
          <p className="text-sm text-content-secondary font-medium m-0 mt-1">Manually add video, text or screengrabs proof to your account.</p>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto px-6 md:px-12 py-10 flex flex-col items-center w-full">
        <div className="w-full max-w-4xl bg-surface rounded-2xl p-8 lg:p-10 border border-border shadow-soft">
          <div className="flex justify-center mb-10 pb-6 border-b border-border/50">
            <button type="button" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all bg-primary-50 text-primary-700 border border-primary-200 shadow-sm hover:bg-primary-100">
              <BsList /> Text testimonial
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="border-t border-border/50 pt-8 flex flex-col gap-6 first:border-0 first:pt-0">
              <div className="flex flex-col gap-2">
                <label htmlFor="customerName" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Customer name <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="designation" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Designation
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
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
                  <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center text-content-muted shadow-sm overflow-hidden">
                    <FaUser />
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-content-primary hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => document.getElementById('avatar-upload').click()}
                  >
                    Pick an Image
                  </button>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    style={{ display: 'none' }}
                  />
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
                  <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center text-content-muted shadow-sm overflow-hidden">
                    <FaBuilding />
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-content-primary hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => document.getElementById('company-logo-upload').click()}
                  >
                    Pick an Image
                  </button>
                  <input
                    type="file"
                    id="company-logo-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'companyLogo')}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <option value="">Select Proof Type</option>
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
                <label htmlFor="testimonial" className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                  Testimonial
                </label>
                <textarea
                  id="testimonial"
                  name="testimonial"
                  value={formData.testimonial}
                  onChange={handleInputChange}
                  placeholder="Write your testimonial"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-content-primary placeholder:text-content-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm outline-none resize-y"
                  rows="6"
                />
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-border mt-4">
              <button type="submit" className="px-8 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-float shadow-sm border-none focus:outline-none focus:ring-4 focus:ring-primary-50 transition-all">
                Submit
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ManualImport;

