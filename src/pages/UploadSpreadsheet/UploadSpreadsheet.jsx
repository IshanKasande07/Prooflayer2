import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import './UploadSpreadsheet.css';
import { FaUpload } from 'react-icons/fa';

const UploadSpreadsheet = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const allowedFileTypes = ['.csv', '.xlsx', '.xls'];
  const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const validateFile = (file) => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    // Check file extension
    if (!allowedFileTypes.includes(fileExtension)) {
      return 'Invalid file type. Please upload a CSV, XLS, or XLSX file.';
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return 'File size exceeds 5MB limit. Please upload a smaller file.';
    }

    return null;
  };

  const parseFileHeaders = (file) => {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

      if (fileExtension === '.csv') {
        // Parse CSV file - read as text first
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            // Try parsing with headers first
            Papa.parse(text, {
              header: true,
              preview: 1, // Only read first row to get headers
              skipEmptyLines: true,
              complete: (results) => {
                // Check for parsing errors
                if (results.errors && results.errors.length > 0) {
                  // Some errors are warnings, check if they're critical
                  const criticalErrors = results.errors.filter(err => err.type === 'Quotes' || err.type === 'Delimiter');
                  if (criticalErrors.length > 0) {
                    // Try fallback: parse first line directly
                    try {
                      const firstLine = text.split('\n')[0].trim();
                      if (firstLine) {
                        const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                        const cleanHeaders = headers.filter(h => h.length > 0);
                        if (cleanHeaders.length > 0) {
                          resolve(cleanHeaders);
                          return;
                        }
                      }
                    } catch (fallbackError) {
                      // Fallback failed, use original error
                    }
                    reject(new Error('Failed to parse CSV file: ' + criticalErrors[0].message));
                    return;
                  }
                }
                
                // Get column names from the first row
                if (!results.data || results.data.length === 0) {
                  // Fallback: try to parse first line directly
                  try {
                    const firstLine = text.split('\n')[0].trim();
                    if (firstLine) {
                      const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                      const cleanHeaders = headers.filter(h => h.length > 0);
                      if (cleanHeaders.length > 0) {
                        resolve(cleanHeaders);
                        return;
                      }
                    }
                  } catch (fallbackError) {
                    // Fallback failed
                  }
                  reject(new Error('No data found in CSV file'));
                  return;
                }
                
                const headers = Object.keys(results.data[0] || {});
                if (headers.length === 0) {
                  // Fallback: try to parse first line directly
                  try {
                    const firstLine = text.split('\n')[0].trim();
                    if (firstLine) {
                      const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                      const cleanHeaders = headers.filter(h => h.length > 0);
                      if (cleanHeaders.length > 0) {
                        resolve(cleanHeaders);
                        return;
                      }
                    }
                  } catch (fallbackError) {
                    // Fallback failed
                  }
                  reject(new Error('No headers found in CSV file. Please ensure the first row contains column names.'));
                  return;
                }
                
                // Filter out empty headers
                const cleanHeaders = headers.filter(h => h && h.trim().length > 0);
                if (cleanHeaders.length === 0) {
                  reject(new Error('No valid headers found in CSV file'));
                  return;
                }
                
                resolve(cleanHeaders);
              },
              error: (error) => {
                // Try fallback: parse first line directly
                try {
                  const firstLine = text.split('\n')[0].trim();
                  if (firstLine) {
                    const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                    const cleanHeaders = headers.filter(h => h.length > 0);
                    if (cleanHeaders.length > 0) {
                      resolve(cleanHeaders);
                      return;
                    }
                  }
                } catch (fallbackError) {
                  // Fallback failed, use original error
                }
                reject(new Error('Failed to parse CSV file: ' + (error.message || 'Unknown error')));
              }
            });
          } catch (error) {
            reject(new Error('Failed to read CSV file: ' + error.message));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(file);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Parse Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (workbook.SheetNames.length === 0) {
              reject(new Error('No sheets found in Excel file'));
              return;
            }
            
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            if (jsonData.length === 0) {
              reject(new Error('No data found in Excel file'));
              return;
            }
            
            // Get first row as headers
            const headers = jsonData[0] || [];
            // Filter out empty headers and convert to strings
            const cleanHeaders = headers
              .map(h => String(h).trim())
              .filter(h => h.length > 0);
            
            if (cleanHeaders.length === 0) {
              reject(new Error('No headers found in Excel file'));
              return;
            }
            
            resolve(cleanHeaders);
          } catch (error) {
            reject(new Error('Failed to parse Excel file: ' + error.message));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  };

  const handleFileSelect = async (file) => {
    setError('');
    setIsProcessing(true);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsProcessing(false);
      return;
    }

    try {
      // Parse file to get column names
      const columnNames = await parseFileHeaders(file);
      
      // Store file in sessionStorage for later parsing
      // Convert file to base64 for storage
      const storeFile = () => {
        return new Promise((resolve, reject) => {
          if (file.name.toLowerCase().endsWith('.csv')) {
            // For CSV files, read as text then convert to base64
            const reader = new FileReader();
            reader.onload = (e) => {
              const text = e.target.result;
              const base64 = btoa(unescape(encodeURIComponent(text)));
              const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64,
                extension: file.name.substring(file.name.lastIndexOf('.') + 1),
                isText: true
              };
              sessionStorage.setItem('uploadedFile', JSON.stringify(fileData));
              resolve();
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
          } else {
            // For Excel files, read as array buffer then convert to base64
            const reader = new FileReader();
            reader.onload = (e) => {
              const bytes = new Uint8Array(e.target.result);
              const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
              const base64 = btoa(binary);
              const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64,
                extension: file.name.substring(file.name.lastIndexOf('.') + 1),
                isArrayBuffer: true
              };
              sessionStorage.setItem('uploadedFile', JSON.stringify(fileData));
              resolve();
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
          }
        });
      };

      await storeFile();
      
      // Navigate to mapping page with file info and column names
      navigate('/map-columns', { 
        state: { 
          fileName: file.name,
          fileType: file.name.substring(file.name.lastIndexOf('.') + 1),
          columnNames: columnNames
        } 
      });
      setIsProcessing(false);
    } catch (err) {
      console.error('File parsing error:', err);
      const errorMessage = err.message || 'Failed to parse file. Please ensure the file is not corrupted and contains headers in the first row.';
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLabelClick = (e) => {
    e.stopPropagation(); // Prevent event from bubbling to parent div
    e.preventDefault(); // Prevent default label behavior
    if (!isProcessing) {
      document.getElementById('file-upload').click();
    }
  };

  const handleBoxClick = (e) => {
    // Only trigger if not clicking on the label or its parent paragraph
    if (e.target.tagName !== 'LABEL' && e.target.closest('label') === null && !isProcessing) {
      document.getElementById('file-upload').click();
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = 'Name,Role,Company,Testimonial,Rating,Date,AvatarURL\n' +
      'John Doe,CEO,TechFlow,"ProofLayer has completely transformed how we collect and display social proof. Highly recommended!",5,2024-05-10,https://i.pravatar.cc/150?u=john\n' +
      'Jane Smith,Marketing Manager,DesignPro,"The AI insights are a game changer. We finally understand the core sentiment of our users.",4,2024-05-08,https://i.pravatar.cc/150?u=jane\n' +
      'Robert Brown,Product Lead,AppScale,"Setting up the Wall of Love took less than 5 minutes. The integration is seamless.",5,2024-05-07,https://i.pravatar.cc/150?u=robert\n' +
      'Sarah Wilson,Founder,EcoStart,"Wait times for support are a bit long, but the product itself is amazing and very intuitive.",4,2024-05-06,https://i.pravatar.cc/150?u=sarah\n' +
      'Michael Chen,CTO,CloudNet,"The dashboard is a bit confusing at first, but the distribution features are top-notch.",3,2024-05-05,https://i.pravatar.cc/150?u=michael';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'prooflayer_sample_testimonials.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-background animate-fadeIn">
      <header className="bg-surface border-b border-border px-8 md:px-12 py-8 shadow-sm w-full">
        <h1 className="font-heading text-3xl font-bold text-content-primary mb-2 tracking-tight">Upload spreadsheet</h1>
        <p className="text-sm text-content-secondary font-medium m-0">
          Upload a CSV, XLS or XLSX file and ProofLayer will import your proof. 
          <button 
            onClick={downloadSampleCSV}
            className="ml-1 text-primary-600 hover:text-primary-700 font-bold bg-transparent border-none p-0 cursor-pointer underline decoration-primary-200 underline-offset-4"
          >
            Download a sample CSV file
          </button> with supported fields.
        </p>
      </header>

      <main className="flex-grow flex flex-col items-center p-8 md:p-16 w-full max-w-5xl mx-auto">
        <div 
          className={`w-full max-w-2xl aspect-[2/1] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 shadow-sm ${isDragging ? 'border-primary-500 bg-primary-50/80 scale-[1.02]' : 'border-border bg-surface hover:border-primary-400 hover:bg-primary-50/30'} ${isProcessing ? 'opacity-75 pointer-events-none cursor-wait' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBoxClick}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
              <p className="text-content-secondary font-medium m-0">Processing file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center pointer-events-none">
              <FaUpload className="text-5xl text-primary-500 mb-6 opacity-80" />
              <p className="text-content-secondary font-medium text-lg m-0 pointer-events-auto">Drag and drop spreadsheet here or <label className="text-primary-600 font-semibold cursor-pointer hover:underline transition-colors" onClick={handleLabelClick}>Choose file</label></p>
            </div>
          )}
          <input 
            type="file" 
            id="file-upload" 
            accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={handleFileInputChange}
            disabled={isProcessing}
            hidden 
          />
        </div>
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium w-full max-w-2xl text-center border border-red-200 shadow-sm animate-fadeIn">
            {error}
          </div>
        )}
        <div className="flex justify-between w-full max-w-2xl mt-6 text-xs font-semibold text-content-muted uppercase tracking-wider">
          <span>Supported formats: CSV, XLSX, XLS</span>
          <span>Maximum size: 5MB</span>
        </div>
      </main>
    </div>
  );
};

export default UploadSpreadsheet;