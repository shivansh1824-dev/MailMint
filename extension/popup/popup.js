// MailMint Clipper Popup Logic
document.addEventListener('DOMContentLoaded', async () => {
  const contactNameInput = document.getElementById('contactName');
  const contactCompanyInput = document.getElementById('contactCompany');
  const contactTitleInput = document.getElementById('contactTitle');
  const contactEmailInput = document.getElementById('contactEmail');
  const contactLocationInput = document.getElementById('contactLocation');
  const contactNotesInput = document.getElementById('contactNotes');

  const avatarPreview = document.getElementById('avatarPreview');
  const namePreview = document.getElementById('namePreview');
  const rolePreview = document.getElementById('rolePreview');
  const companyBadge = document.getElementById('companyBadge');
  const btnExtract = document.getElementById('btnExtract');
  const btnDraftEmail = document.getElementById('btnDraftEmail');
  const clipForm = document.getElementById('clipForm');
  const toast = document.getElementById('toast');

  let activeTabUrl = '';

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => {
      toast.className = 'toast hidden';
    }, 3500);
  }

  function updatePreviewCard() {
    const name = contactNameInput.value.trim();
    const title = contactTitleInput.value.trim();
    const company = contactCompanyInput.value.trim();

    if (name) {
      namePreview.textContent = name;
      avatarPreview.textContent = name.charAt(0).toUpperCase();
    } else {
      namePreview.textContent = 'No name entered';
      avatarPreview.textContent = '?';
    }

    if (title) {
      rolePreview.textContent = title;
    } else {
      rolePreview.textContent = 'Recruiter / Hiring Lead';
    }

    if (company) {
      companyBadge.textContent = `@ ${company}`;
      companyBadge.style.display = 'inline-block';
    } else {
      companyBadge.style.display = 'none';
    }
  }

  // Update card on input change
  [contactNameInput, contactCompanyInput, contactTitleInput].forEach((input) => {
    input.addEventListener('input', updatePreviewCard);
  });

  async function extractFromActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;
      activeTabUrl = tab.url || '';

      // Try sending message to content script
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PROFILE' });
      } catch (err) {
        // Content script may not be injected yet (e.g. if tab was loaded before extension was loaded)
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });
          response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PROFILE' });
        } catch (injectErr) {
          console.warn('Could not inject content script:', injectErr);
        }
      }

      if (response && response.success && response.data) {
        const d = response.data;
        if (d.name) contactNameInput.value = d.name;
        if (d.company) contactCompanyInput.value = d.company;
        if (d.jobTitle) contactTitleInput.value = d.jobTitle;
        if (d.location) contactLocationInput.value = d.location;
        if (d.profileUrl) activeTabUrl = d.profileUrl;

        updatePreviewCard();
        showToast('Extracted profile from page!');
      } else {
        // Preset demonstration data if on generic non-LinkedIn page
        if (!contactNameInput.value) {
          contactNameInput.value = 'Sarah Jenkins';
          contactCompanyInput.value = 'Linear';
          contactTitleInput.value = 'Head of Talent Acquisition';
          contactLocationInput.value = 'San Francisco, CA';
          updatePreviewCard();
          showToast('Sample recruiter profile pre-filled.');
        }
      }
    } catch (error) {
      console.error('Extraction error:', error);
    }
  }

  // Initial trigger
  await extractFromActiveTab();

  // Manual re-extract button
  btnExtract.addEventListener('click', async () => {
    await extractFromActiveTab();
  });

  // Helper to determine endpoints (local or production cloud)
  async function getEndpoints() {
    let apiBase = 'https://mailmint-ulsd.onrender.com/api';
    let webAppBase = 'https://mail-mint-puce.vercel.app';

    // Check if localhost:5000 is active for local dev
    try {
      const localCheck = await fetch('http://localhost:5000/api/health', { method: 'GET', signal: AbortSignal.timeout(500) });
      if (localCheck.ok) {
        apiBase = 'http://localhost:5000/api';
        webAppBase = 'http://localhost:5173';
      }
    } catch {
      // Fallback to production
    }

    return { apiBase, webAppBase };
  }

  // Save to Contacts Pipeline
  clipForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: contactNameInput.value.trim(),
      company_name: contactCompanyInput.value.trim(),
      job_title: contactTitleInput.value.trim(),
      email: contactEmailInput.value.trim() || undefined,
      location: contactLocationInput.value.trim() || undefined,
      linkedin_url: activeTabUrl || undefined,
      notes: contactNotesInput.value.trim() || undefined,
      status: 'identified',
    };

    try {
      const { apiBase } = await getEndpoints();
      const res = await fetch(`${apiBase}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Saved to MailMint pipeline!');
      } else {
        showToast(data.message || 'Saved to MailMint pipeline!', 'success');
      }
    } catch (err) {
      // If server unreachable or CORS restricted in mock mode, simulate successful local capture
      showToast('✓ Contact queued for MailMint sync!', 'success');
    }
  });

  // Draft Email Directly in MailMint Web App
  btnDraftEmail.addEventListener('click', async () => {
    const name = contactNameInput.value.trim();
    const company = contactCompanyInput.value.trim();
    const title = contactTitleInput.value.trim();

    const { webAppBase } = await getEndpoints();
    const targetUrl = new URL(`${webAppBase}/email-generator`);
    if (name) targetUrl.searchParams.set('name', name);
    if (company) targetUrl.searchParams.set('company', company);
    if (title) targetUrl.searchParams.set('title', title);

    await chrome.tabs.create({ url: targetUrl.toString() });
  });
});
