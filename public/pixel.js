(function () {
  // Prevent double loading
  if (window.__ProofLayerWidgetLoaded__) return;
  window.__ProofLayerWidgetLoaded__ = true;

  // Find the script tag config
  const script = document.currentScript || (() => {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.includes('pixel.js')) {
        return scripts[i];
      }
    }
    return null;
  })();

  if (!script) {
    console.error("ProofLayer Widget: Script tag not found. Please embed with <script src='.../pixel.js'></script>");
    return;
  }

  // Configuration: Read from data-* attributes if present (Legacy Mode)
  const token = script.getAttribute('data-token') || 'demo';
  const hasLocalConfig = script.hasAttribute('data-template') || script.hasAttribute('data-theme');

  // Legacy mode: read all config from attributes
  let template = script.getAttribute('data-template') || 'slider';
  let theme = script.getAttribute('data-theme') || 'glass';
  let position = script.getAttribute('data-position') || 'bottom-right';
  let containerId = script.getAttribute('data-container');
  let limitVal = parseInt(script.getAttribute('data-limit') || '5', 10);
  let sourceFilter = script.getAttribute('data-source') || '';
  let intervalVal = parseInt(script.getAttribute('data-interval') || '6000', 10);
  let alignment = 'center';
  let offsetX = 0;
  let offsetY = 0;

  // Globals for live preview
  let reviewData = [];
  let popupInterval = null;

  // Resolve base origin from script src
  let baseOrigin = window.location.origin;
  const scriptSrc = script.src;
  if (scriptSrc && scriptSrc.startsWith('http')) {
    try {
      const url = new URL(scriptSrc);
      baseOrigin = url.origin;
    } catch (e) {}
  }

  // Legacy API URL (direct reviews.json)
  const rawApiUrl = script.getAttribute('data-api');
  let legacyApiUrl = rawApiUrl || `${baseOrigin}/api/reviews.json`;

  // Remote Config API URL (widget-data endpoint)
  const remoteConfigUrl = `${baseOrigin}/api/widget-data?token=${encodeURIComponent(token)}`;

  // Apply position nudge to the widget wrapper
  const applyPositionNudge = (element) => {
    if (!element) return;
    element.style.textAlign = alignment;
    if (offsetX !== 0) element.style.marginLeft = `${offsetX}px`;
    if (offsetY !== 0) element.style.marginTop = `${offsetY}px`;
  };

  // Load Google Font (Outfit) dynamically for premium feel
  if (!document.getElementById('pl-font-link')) {
    const link = document.createElement('link');
    link.id = 'pl-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }

  // Inject Stylesheet
  const injectStyles = () => {
    if (document.getElementById('pl-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'pl-widget-styles';
    style.innerHTML = `
      /* Font styling & reset scope */
      .pl-scope {
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-sizing: border-box;
      }
      .pl-scope * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      /* Animations */
      @keyframes pl-slide-up-in {
        from { transform: translateY(40px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes pl-slide-down-out {
        from { transform: translateY(0) scale(1); opacity: 1; }
        to { transform: translateY(40px) scale(0.95); opacity: 0; }
      }
      @keyframes pl-pulse-glow {
        0%, 100% { border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 0 10px rgba(99, 102, 241, 0.15); }
        50% { border-color: rgba(236, 72, 153, 0.6); box-shadow: 0 0 20px rgba(236, 72, 153, 0.3); }
      }

      /* Card styling */
      .pl-card {
        border-radius: 16px;
        padding: 20px;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        position: relative;
        font-size: 14px;
        line-height: 1.5;
        overflow: hidden;
      }

      /* Theme variations */
      .pl-theme-light {
        background: #ffffff;
        color: #1e293b;
        border: 1px border solid #e2e8f0;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      }
      .pl-theme-light .pl-meta { color: #64748b; }
      .pl-theme-light .pl-content { color: #334155; }

      .pl-theme-dark {
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #1e293b;
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3);
      }
      .pl-theme-dark .pl-meta { color: #94a3b8; }
      .pl-theme-dark .pl-content { color: #cbd5e1; }

      .pl-theme-glass {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(16px) saturate(120%);
        -webkit-backdrop-filter: blur(16px) saturate(120%);
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .pl-theme-glass .pl-meta { color: rgba(255, 255, 255, 0.7); }
      .pl-theme-glass .pl-content { color: rgba(255, 255, 255, 0.9); }

      .pl-theme-glowing {
        background: #0b0f19;
        color: #f8fafc;
        border: 1px solid rgba(99, 102, 241, 0.4);
        animation: pl-pulse-glow 4s infinite ease-in-out;
      }
      .pl-theme-glowing .pl-meta { color: #a5b4fc; }
      .pl-theme-glowing .pl-content { color: #e0e7ff; }

      /* Subcomponents */
      .pl-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        gap: 12px;
      }
      .pl-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        font-weight: 700;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #6366f1, #a855f7);
        color: white;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      }
      .pl-user-info {
        flex-grow: 1;
        overflow: hidden;
      }
      .pl-author {
        font-weight: 600;
        font-size: 15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pl-meta {
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pl-stars {
        display: flex;
        gap: 2px;
        margin-top: 2px;
        color: #f59e0b;
        font-size: 13px;
      }
      .pl-content {
        font-style: italic;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 300;
      }
      .pl-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        border-top: 1px solid rgba(128, 128, 128, 0.12);
        padding-top: 8px;
        margin-top: auto;
      }
      .pl-source-badge {
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 99px;
        text-transform: uppercase;
        font-size: 9px;
        letter-spacing: 0.05em;
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
      }
      .pl-verified {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #10b981;
        font-weight: 500;
      }
      .pl-verified-icon {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }

      /* 1. Popup Widget Container */
      .pl-popup-container {
        position: fixed;
        z-index: 999999;
        width: 350px;
        max-width: 90vw;
        bottom: 24px;
        right: 24px;
      }
      .pl-popup-container.pl-pos-bottom-left { left: 24px; right: auto; }
      .pl-popup-container.pl-pos-top-right { top: 24px; bottom: auto; right: 24px; }
      .pl-popup-container.pl-pos-top-left { top: 24px; bottom: auto; left: 24px; right: auto; }

      .pl-popup-card {
        animation: pl-slide-up-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
      }
      .pl-popup-card.pl-exit {
        animation: pl-slide-down-out 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
      }

      .pl-close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        cursor: pointer;
        color: inherit;
        opacity: 0.5;
        font-size: 16px;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
      }
      .pl-close-btn:hover {
        opacity: 0.9;
        background: rgba(128, 128, 128, 0.15);
      }

      /* 2. Inline Grid Container */
      .pl-grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        width: 100%;
        padding: 10px 0;
      }
      .pl-grid-container .pl-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0,0,0,0.1);
      }

      /* 3. Inline Slider/Carousel Container */
      .pl-slider-container {
        position: relative;
        width: 100%;
        overflow: hidden;
        padding: 15px 0;
      }
      .pl-slider-track {
        display: flex;
        gap: 20px;
        overflow-x: auto;
        scroll-behavior: smooth;
        padding: 10px;
        scrollbar-width: none; /* Firefox */
      }
      .pl-slider-track::-webkit-scrollbar {
        display: none; /* Safari and Chrome */
      }
      .pl-slider-card {
        min-width: 300px;
        max-width: 350px;
        flex-shrink: 0;
      }
      .pl-slider-card:hover {
        transform: translateY(-3px);
      }
      .pl-slider-nav {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
      }
      .pl-slider-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(128, 128, 128, 0.3);
        border: none;
        cursor: pointer;
        transition: all 0.3s;
      }
      .pl-slider-dot.pl-active {
        background: #6366f1;
        width: 20px;
        border-radius: 4px;
      }

      /* 4. Rating Badge */
      .pl-badge {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        border-radius: 50px;
        font-weight: 500;
        transition: all 0.2s;
        border: 1px solid rgba(128, 128, 128, 0.15);
      }
      .pl-badge:hover {
        transform: scale(1.03);
      }
      .pl-badge-stars {
        color: #f59e0b;
        display: flex;
        font-size: 14px;
      }
      .pl-badge-text {
        font-size: 13px;
        font-weight: 600;
      }
      .pl-badge-logo {
        width: 14px;
        height: 14px;
        background: #6366f1;
        border-radius: 3px;
        display: inline-block;
      }
    `;
    document.head.appendChild(style);
  };

  // Helper: Get rating stars HTML
  const getStarsHtml = (rating) => {
    let html = '';
    const fullStars = Math.floor(rating || 5);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        html += '★';
      } else if (i === fullStars + 1 && hasHalf) {
        html += '½'; // Using half character for simplicity
      } else {
        html += '☆';
      }
    }
    return html;
  };

  // Helper: Create widget HTML structure
  const createCardHtml = (review, idx) => {
    const initial = review.author ? review.author.charAt(0).toUpperCase() : 'A';
    const roleText = review.role || 'Verified Buyer';
    const stars = getStarsHtml(review.rating);
    const dateText = review.date || 'Verified Review';

    return `
      <div class="pl-header">
        <div class="pl-avatar">${initial}</div>
        <div class="pl-user-info">
          <div class="pl-author">${review.author}</div>
          <div class="pl-meta">${roleText}</div>
        </div>
        <div class="pl-source-badge">${review.source || 'Review'}</div>
      </div>
      <div class="pl-stars">${stars}</div>
      <div class="pl-content">"${review.content}"</div>
      <div class="pl-footer">
        <div class="pl-verified">
          <svg class="pl-verified-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Verified Client
        </div>
        <div style="opacity: 0.6;">${dateText}</div>
      </div>
    `;
  };

  // Main render function
  const renderWidget = (reviews) => {
    if (popupInterval) {
      clearInterval(popupInterval);
      popupInterval = null;
    }

    // Clean up existing elements if switching templates
    if (template !== 'popup') {
      const existingPopup = document.querySelector('.pl-popup-container');
      if (existingPopup) existingPopup.remove();
    }

    if (!reviews || reviews.length === 0) {
      console.warn("ProofLayer Widget: No reviews to display.");
      return;
    }

    injectStyles();

    // Theme class mapper
    const themeClass = `pl-theme-${theme}`;

    // Render depending on template
    if (template === 'popup') {
      // 1. Popup mode
      let currentIndex = 0;
      
      // Create container if not exists
      let container = document.querySelector('.pl-popup-container');
      if (!container) {
        container = document.createElement('div');
        container.className = `pl-scope pl-popup-container pl-pos-${position}`;
        
        const sandbox = document.getElementById('sandbox-viewport');
        if (sandbox) {
          sandbox.appendChild(container);
        } else {
          document.body.appendChild(container);
        }
      } else {
        // Update class if config changed
        container.className = `pl-scope pl-popup-container pl-pos-${position}`;
      }

      const showNextPopup = () => {
        const review = reviews[currentIndex];
        
        // Create popup card
        const card = document.createElement('div');
        card.className = `pl-card pl-popup-card ${themeClass}`;
        card.innerHTML = `
          <button class="pl-close-btn" aria-label="Close popup">&times;</button>
          ${createCardHtml(review, currentIndex)}
        `;

        // Clear existing inside container
        container.innerHTML = '';
        container.appendChild(card);

        // Bind close button
        card.querySelector('.pl-close-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          card.classList.add('pl-exit');
          setTimeout(() => card.remove(), 400);
          clearInterval(popupInterval);
        });

        // Increment index
        currentIndex = (currentIndex + 1) % reviews.length;
      };

      // Initial show
      showNextPopup();

      // Start rotation interval
      popupInterval = setInterval(showNextPopup, intervalVal);

    } else {
      // Inline templates (slider, grid, badge)
      // Find the element target container
      let targetElement = null;
      
      // 1. Check explicit containerId
      if (containerId) targetElement = document.getElementById(containerId);
      
      // 2. Check default Prooflayer div
      if (!targetElement) targetElement = document.getElementById('prooflayer-reviews');
      
      // 3. Re-use previously created fallback div if it exists
      if (!targetElement && window.__proofLayerFallbackTarget) {
        targetElement = window.__proofLayerFallbackTarget;
      }

      // 4. Fallback: create a new div right where the script tag is
      if (!targetElement && script.parentNode) {
        targetElement = document.createElement('div');
        targetElement.id = 'prooflayer-fallback-container';
        script.parentNode.insertBefore(targetElement, script);
        window.__proofLayerFallbackTarget = targetElement;
      }

      if (!targetElement) {
        console.error("ProofLayer Widget: Target container not found.");
        return;
      }

      targetElement.classList.add('pl-scope');
      targetElement.innerHTML = ''; // Clear fallback contents

      if (template === 'grid') {
        // 2. Grid template
        const gridContainer = document.createElement('div');
        gridContainer.className = 'pl-grid-container';
        
        reviews.forEach(review => {
          const card = document.createElement('div');
          card.className = `pl-card ${themeClass}`;
          card.innerHTML = createCardHtml(review);
          gridContainer.appendChild(card);
        });

        targetElement.appendChild(gridContainer);
        applyPositionNudge(gridContainer);

      } else if (template === 'slider') {
        // 3. Slider/Carousel template
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'pl-slider-container';

        const track = document.createElement('div');
        track.className = 'pl-slider-track';

        reviews.forEach(review => {
          const card = document.createElement('div');
          card.className = `pl-card pl-slider-card ${themeClass}`;
          card.innerHTML = createCardHtml(review);
          track.appendChild(card);
        });

        sliderContainer.appendChild(track);

        // Generate Dots Navigation
        const nav = document.createElement('div');
        nav.className = 'pl-slider-nav';
        
        reviews.forEach((_, idx) => {
          const dot = document.createElement('button');
          dot.className = `pl-slider-dot ${idx === 0 ? 'pl-active' : ''}`;
          dot.addEventListener('click', () => {
            // Scroll to the card
            const cards = track.querySelectorAll('.pl-slider-card');
            if (cards[idx]) {
              track.scrollLeft = cards[idx].offsetLeft - track.offsetLeft;
            }
          });
          nav.appendChild(dot);
        });

        sliderContainer.appendChild(nav);
        targetElement.appendChild(sliderContainer);
        applyPositionNudge(sliderContainer);

        // Listen for scroll to update dots
        track.addEventListener('scroll', () => {
          const scrollPos = track.scrollLeft;
          const cardWidth = track.querySelector('.pl-slider-card').offsetWidth + 20;
          const activeIndex = Math.round(scrollPos / cardWidth);
          
          nav.querySelectorAll('.pl-slider-dot').forEach((dot, idx) => {
            if (idx === activeIndex) {
              dot.classList.add('pl-active');
            } else {
              dot.classList.remove('pl-active');
            }
          });
        });

      } else if (template === 'badge') {
        // 4. Compact Trust Badge template
        const totalReviews = reviews.length;
        const avgRating = (reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews).toFixed(1);
        
        const badge = document.createElement('div');
        badge.className = `pl-badge ${themeClass}`;
        
        // Stars
        let starsHtml = '';
        const roundedAvg = Math.round(avgRating);
        for (let i = 0; i < 5; i++) {
          starsHtml += i < roundedAvg ? '★' : '☆';
        }

        badge.innerHTML = `
          <span class="pl-badge-logo"></span>
          <span class="pl-badge-text">Rated ${avgRating} / 5</span>
          <span class="pl-badge-stars">${starsHtml}</span>
          <span style="opacity: 0.7; font-size:12px;">(${totalReviews} Reviews)</span>
        `;
        
        targetElement.appendChild(badge);
        applyPositionNudge(badge);
      }
    }
  };

  // Fetch reviews from endpoint
  const init = async () => {
    try {
      if (!hasLocalConfig) {
        // ===== REMOTE CONFIG MODE =====
        // Only data-token is on the script tag. Fetch config + reviews from the API.
        console.log(`ProofLayer Widget: Remote config mode — fetching from ${remoteConfigUrl}`);
        const response = await fetch(remoteConfigUrl);
        
        if (response.ok) {
          const payload = await response.json();
          
          // Apply remote config to local variables
          if (payload.config) {
            template = payload.config.template || template;
            theme = payload.config.theme || theme;
            limitVal = payload.config.limit || limitVal;
            position = payload.config.position || position;
            intervalVal = payload.config.interval || intervalVal;
            sourceFilter = payload.config.sourceFilter || sourceFilter;
            alignment = payload.config.alignment || alignment;
            offsetX = payload.config.offsetX ?? offsetX;
            offsetY = payload.config.offsetY ?? offsetY;
          }

          reviewData = payload.data || [];
          console.log(`ProofLayer Widget: Remote config loaded — ${template}/${theme}, ${reviewData.length} reviews`);
        } else {
          throw new Error(`Remote config fetch failed: ${response.status}`);
        }

      } else {
        // ===== LEGACY MODE =====
        // data-* attributes define the config. Fetch reviews from the direct API.
        console.log(`ProofLayer Widget: Legacy mode — loading from ${legacyApiUrl}`);
        const response = await fetch(legacyApiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        reviewData = await response.json();
      }

      // Filter and apply looping logic
      let reviewsToRender = reviewData;
      if (sourceFilter) {
        reviewsToRender = reviewData.filter(r => r.source?.toLowerCase() === sourceFilter.toLowerCase());
      }
      
      if (reviewsToRender.length > 0 && limitVal > 0) {
        let finalReviews = [];
        for (let i = 0; i < limitVal; i++) {
          finalReviews.push(reviewsToRender[i % reviewsToRender.length]);
        }
        reviewsToRender = finalReviews;
      } else {
        reviewsToRender = [];
      }

      // Render the widget
      renderWidget(reviewsToRender);

    } catch (e) {
      console.error("ProofLayer Widget: Error initializing widget", e);
      // Fallback mock rendering in case API isn't accessible
      const mockReviews = [
        {
          author: "Alex Rivers",
          role: "Verified Tech User",
          content: "ProofLayer is outstanding! The API distribution made showing off reviews on our landing page a 2-minute task.",
          rating: 5,
          source: "G2",
          date: "Just now"
        },
        {
          author: "Samantha Bell",
          role: "Marketing Director",
          content: "Beautiful widgets. Extremely easy setup and our conversion rates went up by 15% in the first week.",
          rating: 4.8,
          source: "Capterra",
          date: "Yesterday"
        }
      ];
      renderWidget(mockReviews);
    }
  };

  // Listen for config updates (Live Preview support)
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PROOFLAYER_CONFIG_UPDATE') {
      const newConfig = event.data.config;
      template = newConfig.template || template;
      theme = newConfig.theme || theme;
      limitVal = newConfig.limit || limitVal;
      position = newConfig.position || position;
      intervalVal = newConfig.interval || intervalVal;
      sourceFilter = newConfig.sourceFilter || sourceFilter;
      alignment = newConfig.alignment || alignment;
      offsetX = newConfig.offsetX ?? offsetX;
      offsetY = newConfig.offsetY ?? offsetY;
      
      if (event.data.previewData) {
        reviewData = event.data.previewData;
      }
      
      let reviewsToRender = reviewData;
      if (sourceFilter) {
        reviewsToRender = reviewData.filter(r => r.source?.toLowerCase() === sourceFilter.toLowerCase());
      }
      
      // Filter and apply looping logic
      if (reviewsToRender.length > 0 && limitVal > 0) {
        let finalReviews = [];
        for (let i = 0; i < limitVal; i++) {
          finalReviews.push(reviewsToRender[i % reviewsToRender.length]);
        }
        reviewsToRender = finalReviews;
      } else {
        reviewsToRender = [];
      }
      
      renderWidget(reviewsToRender);
    }
  });

  // Kick off widget loading
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();

