import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BsArrowUp } from 'react-icons/bs';
import './MapColumns.css';
import { TARGET_FIELDS, smartMapColumns } from '../../utils/columnMapper';
import { parseFullFile } from '../../utils/fileParser';
import { saveTestimonialsBatch } from '../../services/firestoreService'; 

const MapColumns = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileName = location.state?.fileName || 'spreadsheet.xlsx';
  const columnNames = location.state?.columnNames || []; // Get detected column names from uploaded file

  // Database fields (system fields)
  // UPDATED: Derive the list of labels from the central TARGET_FIELDS array
  const databaseFields = TARGET_FIELDS.map(field => field.label);

  // Use detected column names from the uploaded file, or show a message if none detected
  const inputFields = columnNames.length > 0 
    ? columnNames 
    : ['No columns detected - please upload a valid file'];

  if (columnNames.length === 0 && !location.state) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background animate-fadeIn">
        <header className="bg-surface border-b border-border px-8 md:px-12 py-8 shadow-sm w-full">
          <h1 className="font-heading text-3xl font-bold text-content-primary mb-2 tracking-tight">Upload spreadsheet</h1>
          <p className="text-sm text-content-secondary font-medium m-0">Upload a CSV, XLS or XLSX file and ProofLayer will import your proof. See a sample CSV file with supported fields.</p>
        </header>
        <main className="flex-grow overflow-y-auto px-6 md:px-12 py-10 flex flex-col items-center w-full">
          <div className="w-full max-w-4xl bg-surface rounded-2xl p-8 border border-border shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-center text-content-secondary text-lg mb-8 max-w-md">
              No file uploaded. Please go back and upload a spreadsheet file first.
            </p>
            <div className="mt-4">
              <button 
                className="px-6 py-2.5 bg-transparent border border-border text-content-primary font-medium rounded-xl hover:bg-background hover:border-content-muted transition-colors focus:outline-none focus:ring-4 focus:ring-content-muted" 
                onClick={() => navigate('/upload-spreadsheet')}
              >
                Go to Upload Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 1. Calculate smart mapping once on initial render
  const initialMappings = useMemo(() => {
    if (columnNames.length === 0) {
      // Create empty mapping if no columns are present
      return databaseFields.reduce((acc, label) => ({ ...acc, [label]: '' }), {});
    }
    // Perform the smart mapping using the new utility
    return smartMapColumns(columnNames);
  }, [columnNames]); // Depend on columnNames

  // 2. Initialize state with the smart mapping result
  const [fieldMappings, setFieldMappings] = useState(initialMappings);
  
  // NOTE: The hardcoded fields initialization has been replaced by the smart mapping logic.
  // const [fieldMappings, setFieldMappings] = useState(() => { ... });

  const handleMappingChange = (databaseField, inputField) => {
    setFieldMappings(prev => ({
      ...prev,
      [databaseField]: inputField
    }));
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadError('');

    try {
      // Collect the final mappings, translating the user-facing label back to the internal key
      const finalMapping = {};
      Object.entries(fieldMappings).forEach(([label, userColumn]) => {
        if (userColumn) {
          // Find the internal key (e.g., 'name') from the label (e.g., 'Customer Name')
          const targetField = TARGET_FIELDS.find(f => f.label === label);
          if (targetField) {
            finalMapping[targetField.key] = userColumn;
          }
        }
      });

      console.log('Final field mappings (Internal Key: User Column):', finalMapping);

      // Get file data from sessionStorage
      const fileDataStr = sessionStorage.getItem('uploadedFile');
      if (!fileDataStr) {
        throw new Error('File data not found. Please upload the file again.');
      }

      const fileData = JSON.parse(fileDataStr);
      
      // Reconstruct file object from stored data
      let file;
      if (fileData.isArrayBuffer) {
        // For Excel files - convert base64 back to ArrayBuffer
        const binary = atob(fileData.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: fileData.type });
        file = new File([blob], fileData.name, { type: fileData.type });
      } else if (fileData.isText) {
        // For CSV files - convert base64 back to text
        const text = decodeURIComponent(escape(atob(fileData.data)));
        const blob = new Blob([text], { type: fileData.type });
        file = new File([blob], fileData.name, { type: fileData.type });
      } else {
        throw new Error('Invalid file data format');
      }

      // Parse the full file
      const rawData = await parseFullFile(file);
      console.log('Parsed file data:', rawData);

      // Transform data using mappings
      const transformedData = rawData.map(row => {
        const testimonial = {};
        
        // Map each field from the row to the testimonial object
        Object.entries(finalMapping).forEach(([dbKey, userColumn]) => {
          if (userColumn && row[userColumn] !== undefined) {
            const value = row[userColumn];
            // Only add non-empty values
            if (value && String(value).trim().length > 0) {
              testimonial[dbKey] = String(value).trim();
            }
          }
        });

        // Set default values for required fields if missing
        if (!testimonial.name) testimonial.name = 'Unknown';
        if (!testimonial.text) testimonial.text = '';
        if (!testimonial.date) testimonial.date = new Date().toISOString().split('T')[0];

        return testimonial;
      }).filter(item => Object.keys(item).length > 0); // Filter out completely empty items

      if (transformedData.length === 0) {
        throw new Error('No valid data to upload after transformation.');
      }

      console.log('Transformed data to upload:', transformedData);

      // Save to Firestore
      const docIds = await saveTestimonialsBatch(transformedData);
      console.log('Successfully saved testimonials. Document IDs:', docIds);

      // Clear sessionStorage
      sessionStorage.removeItem('uploadedFile');

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload data. Please try again.');
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    navigate('/upload-spreadsheet');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background animate-fadeIn">
      <header className="bg-surface border-b border-border px-8 md:px-12 py-8 shadow-sm w-full">
        <h1 className="font-heading text-3xl font-bold text-content-primary mb-2 tracking-tight">Upload spreadsheet</h1>
        <p className="text-sm text-content-secondary font-medium m-0">Upload a CSV, XLS or XLSX file and ProofLayer will import your proof. See a sample CSV file with supported fields.</p>
      </header>

      <main className="flex-grow overflow-y-auto px-6 md:px-12 py-10 flex flex-col items-center w-full">
        <div className="w-full max-w-4xl bg-surface rounded-2xl p-8 lg:p-10 border border-border shadow-soft">
          <h2 className="text-xl font-bold text-content-primary mb-6">Map Columns</h2>
          
          <div className="w-full border border-border rounded-xl overflow-hidden mb-8 shadow-sm">
            <div className="grid grid-cols-[1fr_2fr] bg-background/50 border-b border-border text-xs font-semibold text-content-secondary uppercase tracking-wider">
              <div className="p-4 px-6 md:px-8 border-r border-border/50">Database Fields</div>
              <div className="p-4 px-6 md:px-8">Input Fields</div>
            </div>

            {databaseFields.map((dbField) => (
              <div key={dbField} className="grid grid-cols-[1fr_2fr] border-b border-border/50 last:border-0 hover:bg-background/30 transition-colors">
                <div className="p-4 px-6 md:px-8 flex items-center font-medium text-content-primary border-r border-border/50">
                  {dbField}
                </div>
                <div className="p-3 px-6 md:px-8 flex items-center">
                  <select
                    // The value is now pre-selected by the smart mapping function
                    value={fieldMappings[dbField] || ''}
                    onChange={(e) => handleMappingChange(dbField, e.target.value)}
                    className="w-full bg-surface border border-border text-content-primary rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-300 transition-all shadow-sm"
                  >
                    <option value="">Select field</option>
                    {inputFields.map((inputField) => (
                      <option key={inputField} value={inputField}>
                        {inputField}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {uploadError && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl mb-6 text-sm font-medium shadow-sm animate-fadeIn">
              {uploadError}
            </div>
          )}

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
            <button 
              className="px-6 py-2.5 bg-transparent border border-border text-content-primary font-medium rounded-xl hover:bg-background hover:border-content-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-content-muted" 
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 hover:shadow-float hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-sm border-none focus:outline-none focus:ring-4 focus:ring-primary-50" 
              onClick={handleUpload}
              disabled={isUploading}
            >
              <BsArrowUp /> {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapColumns;