// MailMint Clipper — Content Script for LinkedIn & Career Pages
(() => {
  function extractProfileData() {
    const url = window.location.href;
    let name = '';
    let jobTitle = '';
    let company = '';
    let location = '';

    if (url.includes('linkedin.com')) {
      // 1. Name heuristics
      const nameEl = document.querySelector('h1.text-heading-xlarge') ||
                     document.querySelector('h1.inline.t-24') ||
                     document.querySelector('h1');
      if (nameEl) {
        name = nameEl.innerText.trim().replace(/[\r\n\t]+/g, ' ');
      }

      // 2. Headline / Role heuristics
      const headlineEl = document.querySelector('div.text-body-medium.break-words') ||
                         document.querySelector('.pv-text-details__left-panel div.text-body-medium') ||
                         document.querySelector('.pv-top-card--list-bullet');
      if (headlineEl) {
        jobTitle = headlineEl.innerText.trim().replace(/[\r\n\t]+/g, ' ');
      }

      // 3. Current Company heuristics
      const companyEl = document.querySelector('button[aria-label*="Current company"]') ||
                        document.querySelector('span[aria-label*="Current company"]') ||
                        document.querySelector('.pv-text-details__right-panel .inline-show-more-text') ||
                        document.querySelector('.experience-item .company-name');
      if (companyEl) {
        company = companyEl.innerText.trim().replace(/[\r\n\t]+/g, ' ');
      }

      // If company not found explicitly, try to parse from headline (e.g., "Tech Recruiter at Stripe" or "Senior Recruiter @ Google")
      if (!company && jobTitle) {
        const match = jobTitle.match(/(?:at|@)\s+([A-Za-z0-9\s&.,-]+)(?:\||\/|-|$)/i);
        if (match && match[1]) {
          company = match[1].trim();
        }
      }

      // 4. Location
      const locEl = document.querySelector('span.text-body-small.inline.t-black--light.break-words');
      if (locEl) {
        location = locEl.innerText.trim();
      }
    } else {
      // Generic fallback for career or portfolio pages
      name = document.title ? document.title.split(/[-|]/)[0].trim() : '';
      const h1 = document.querySelector('h1');
      if (h1 && h1.innerText) name = h1.innerText.trim();
    }

    return {
      name: name || '',
      jobTitle: jobTitle || '',
      company: company || '',
      location: location || '',
      profileUrl: url,
    };
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PROFILE') {
      const data = extractProfileData();
      sendResponse({ success: true, data });
    }
    return true;
  });
})();
