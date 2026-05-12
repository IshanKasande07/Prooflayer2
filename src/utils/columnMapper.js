// src/utils/columnMapper.js

// 1. Define the complete Target Schema (Your Database Fields)
export const TARGET_FIELDS = [
    { key: 'author', label: 'Customer Name', keywords: ['customer name', 'client name', 'name', 'full name', 'author'] },
    { key: 'email', label: 'Customer Email', keywords: ['customer email', 'email', 'email address'] },
    { key: 'avatar', label: 'Customer Photo', keywords: ['customer photo', 'user photo', 'avatar', 'profile image', 'photo'] },
    { key: 'role', label: 'Customer Tagline', keywords: ['customer tagline', 'tagline', 'job title', 'designation', 'role'] },
    { key: 'date', label: 'Date', keywords: ['date', 'uploaded date', 'creation date', 'review date'] },
    { key: 'video_mp4_url', label: 'Video MP4 URL', keywords: ['video mp4 url', 'video url', 'video link', 'mp4 link'] },
    { key: 'username', label: 'Customer Username', keywords: ['customer username', 'username', 'handle'] },
    { key: 'integration', label: 'Integration', keywords: ['integration', 'source', 'platform', 'import source'] },
    { key: 'content', label: 'Testimonial Text', keywords: ['testimonial text', 'review', 'comment', 'feedback', 'content', 'text'] },
    { key: 'rating', label: 'Rating', keywords: ['rating', 'star rating', 'stars'] },
    { key: 'url', label: 'Source URL', keywords: ['source url', 'url', 'link'] },
    { key: 'tags', label: 'Tags', keywords: ['tags', 'categories', 'keywords'] },
    { key: 'company', label: 'Customer Company', keywords: ['customer company', 'company', 'organization'] },
    { key: 'images', label: 'Images', keywords: ['images', 'photos', 'screengrabs', 'screenshots'] },
    { key: 'title', label: 'Testimonial Title', keywords: ['testimonial title', 'title', 'headline'] },
  ];
  
  // 2. Utility function for preprocessing text (standardize to lowercase alphanumeric)
  const preprocess = (text) => String(text).toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, '');
  
  // 3. The main smart mapping function
  export const smartMapColumns = (userHeaders) => {
    const mapping = {};
    const processedHeaders = userHeaders.map(h => ({ 
        original: h, 
        processed: preprocess(h) 
    }));
  
    // Track used user headers to prevent mapping the same column twice
    const usedUserHeaders = new Set();
  
    TARGET_FIELDS.forEach(target => {
      let bestMatch = null;
      let highestScore = 0;
  
      target.keywords.forEach(keyword => {
        const processedKeyword = preprocess(keyword);
  
        processedHeaders.forEach(userHeader => {
          if (usedUserHeaders.has(userHeader.original)) {
            return;
          }
  
          let score = 0;
  
          // Score 1: Exact containment (Highest Score)
          if (userHeader.processed.includes(processedKeyword)) {
            score = 100;
          } 
          // Score 2: Partial overlap (word-based similarity)
          else {
            const targetWords = processedKeyword.split(' ').filter(w => w.length > 2);
            const userWords = userHeader.processed.split(' ').filter(w => w.length > 2);
            
            if (targetWords.length > 0 && userWords.length > 0) {
              const sharedWords = targetWords.filter(tw => userWords.includes(tw)).length;
              const uniqueWords = new Set([...targetWords, ...userWords]).size;
              score = (sharedWords / uniqueWords) * 90;
            }
          }
  
          if (score > highestScore) {
            highestScore = score;
            bestMatch = userHeader.original;
          }
        });
      });
  
      // If a good match is found (confidence score > 50), set the mapping
      if (highestScore > 50 && bestMatch) {
        mapping[target.label] = bestMatch;
        usedUserHeaders.add(bestMatch);
      } else {
        mapping[target.label] = '';
      }
    });
  
    return mapping;
  };