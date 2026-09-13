# MailMint Clipper — Chrome Extension (Manifest V3)

**"1-Click Recruiter Pipeline for Job Seekers"**

MailMint Clipper enables job seekers to capture recruiter profiles, talent leads, and hiring managers from LinkedIn and career sites directly into their MailMint outreach pipeline.

---

## Features

- **Automated Profile Parsing**: Extracts recruiter name, headline/title, company, location, and LinkedIn URL.
- **Instant Pipeline Sync**: One-click addition to MailMint Contacts (`/contacts` Kanban) in `identified` state.
- **Deep-Linked AI Generator**: Click "Draft AI Email in MailMint" to immediately jump into `/email-generator` with candidate, company, and role parameters pre-filled.
- **High-Contrast Brand UI**: Built with MailMint's signature dark/light palette, crisp typography, and status feedback.

---

## How to Install Locally (Developer Mode)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top right corner to **ON**.
3. Click the **Load unpacked** button in the top left.
4. Select the `extension/` directory inside this repository:
   ```
   c:\Users\Prajjwal Rai\OneDrive\Desktop\MailMint\extension
   ```
5. The **MailMint Clipper** icon will appear in your Chrome toolbar!
6. Pin the extension to your toolbar for easy access.

---

## Testing & Verification

1. Navigate to any LinkedIn profile page (e.g., `https://www.linkedin.com/in/...`).
2. Click the **MailMint Clipper** icon in your toolbar.
3. Observe the extracted recruiter name, company, and job title in the live card preview.
4. Click **Save to MailMint Contacts** to sync to your Kanban pipeline.
5. Click **Draft AI Email in MailMint** to instantly load the AI Cold Email generator with full recruiter context.
