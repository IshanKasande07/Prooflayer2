import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parse full file data (not just headers)
 * @param {File} file - The file to parse
 * @returns {Promise<Array<Object>>} - Array of row objects with column names as keys
 */
export const parseFullFile = (file) => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    if (fileExtension === '.csv') {
      // Parse CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors && results.errors.length > 0) {
                const criticalErrors = results.errors.filter(
                  err => err.type === 'Quotes' || err.type === 'Delimiter'
                );
                if (criticalErrors.length > 0) {
                  reject(new Error('Failed to parse CSV file: ' + criticalErrors[0].message));
                  return;
                }
              }

              if (!results.data || results.data.length === 0) {
                reject(new Error('No data found in CSV file'));
                return;
              }

              // Filter out completely empty rows
              const validData = results.data.filter(row => {
                return Object.values(row).some(value => value && String(value).trim().length > 0);
              });

              if (validData.length === 0) {
                reject(new Error('No valid data rows found in CSV file'));
                return;
              }

              resolve(validData);
            },
            error: (error) => {
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

          // First row is headers
          const headers = jsonData[0].map(h => String(h).trim()).filter(h => h.length > 0);
          if (headers.length === 0) {
            reject(new Error('No headers found in Excel file'));
            return;
          }

          // Convert remaining rows to objects
          const rows = jsonData.slice(1).map(row => {
            const rowObj = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
            });
            return rowObj;
          });

          // Filter out completely empty rows
          const validData = rows.filter(row => {
            return Object.values(row).some(value => value && value.length > 0);
          });

          if (validData.length === 0) {
            reject(new Error('No valid data rows found in Excel file'));
            return;
          }

          resolve(validData);
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

