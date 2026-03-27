---
name: user-guide
description: Generate a role-specific onboarding user guide for Leadbox with real screenshots captured via Chrome DevTools MCP. Use when the user wants to create or update a user guide for any Leadbox role (Company Admin, Company Manager, Team Member, Referral Partner, System Admin).
---

## Pre-flight: Ask the user these questions before starting

Before doing any work, ask the user:

1. **Which role** is this guide for? (Company Admin, Company Manager, Team Member, Referral Partner, System Admin)
2. **Login credentials** — email and password for a test account of that role
3. **Test data** — company name, industry, company size, website, phone (for registration if needed), full name, username, phone number
4. **Output file name** — suggest `docs/user-guide-{role-slug}.html` (e.g. `user-guide-team-member.html`)
5. **Does the account already exist**, or does it need to be registered fresh?

Do not proceed until all answers are provided.

---

## Core Rules (MUST follow every step)

1. **Never capture empty forms.** Always fill in test data first, then take the screenshot.
2. **Always save screenshots to file** using `filePath` parameter — the user cannot see inline previews.
3. **Always use `fullPage: true`** on every screenshot.
4. **Verify every screenshot** — after saving each one, tell the user the file name and ask them to confirm before moving to the next step.
5. **React inputs require `evaluate_script`** — use the native input value setter pattern (see below) for text fields. The standard `fill` tool alone does not trigger React state updates.
6. **OTP / manual steps** — pause and ask the user to complete these manually, then wait for confirmation before continuing.
7. **Screenshots folder**: `docs/screenshots/` — save all screenshots here.
8. **Viewport**: Set to 1280×900 before starting using `resize_page`.
9. **Reference theme**: The HTML guide must use the same CSS styling as `docs/user-guide-company-admin.html` — read that file for the theme before generating any HTML.

---

## React Input Fill Pattern

Use this script whenever filling text inputs (React controlled components ignore DOM value setter without native events):

```javascript
() => {
  function fillInput(placeholder, value) {
    const input = document.querySelector(`input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`);
    if (!input) return `Not found: ${placeholder}`;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return `Filled: ${placeholder}`;
  }
  // call fillInput() for each field
}
```

---

## Workflow

### Phase 1 — Setup
1. Load Chrome DevTools MCP tools (new_page, navigate_page, take_screenshot, take_snapshot, fill, click, evaluate_script, wait_for, resize_page, handle_dialog).
2. Set viewport: `resize_page(1280, 900)`.
3. Navigate to `http://localhost:5173`.

---

### Phase 2 — Screenshot Capture

Follow the pages/workflow relevant to the role. For each page:
- Fill in all form fields with test data FIRST
- Then take screenshot with `fullPage: true` and save to `docs/screenshots/NN-descriptive-name.png`
- Tell user the file name and wait for confirmation before moving to the next screenshot

#### Standard Registration Flow (if account needs to be created)
| # | Screenshot | Action |
|---|---|---|
| 01 | `01-register-step1-filled.png` | Fill Step 1 (Company Details) with test data, then screenshot |
| 02 | `02-register-step2-filled.png` | Fill Step 2 (User Details) with test data, then screenshot |
| 03 | `03-verify-otp.png` | Navigate to OTP page — **pause, ask user to enter OTP manually**, then screenshot after entry |

#### Standard Login Flow
| # | Screenshot | Action |
|---|---|---|
| 04 | `04-login-filled.png` | Fill login form with credentials, then screenshot |
| 05 | `05-dashboard.png` | After login, screenshot dashboard |

#### Company Admin — Page Order
| # | Screenshot | Page | Notes |
|---|---|---|---|
| 06 | `06-settings-company.png` | `/settings` — Company tab | Shows company info |
| 07 | `07-settings-interested-in.png` | `/settings` — Interested In tab | List of options |
| 08 | `08-settings-add-interested-in.png` | Add New Option modal — filled | Fill option name first |
| 09 | `09-manage-users.png` | `/manage-users` | Team list |
| 10 | `10-invite-user.png` | Invite User modal — filled | Fill email first |
| 11 | `11-add-lead-filled.png` | `/add-lead` modal — filled | Fill all lead fields first |
| 12 | `12-dashboard-with-lead.png` | `/` dashboard | After lead is created |
| 13 | `13-my-leads.png` | `/my-leads` | Lead list |
| 14 | `14-all-leads.png` | `/all-leads` | All company leads |
| 15 | `15-assign-leads.png` | `/assign-leads` | Unassigned leads list |
| 16 | `16-followups.png` | `/followups` | Follow-ups page |
| 17 | `17-reports.png` | `/reports` | Reports hub |
| 18 | `18-reports-conversion.png` | `/reports/conversion` | Conversion report |
| 19 | `19-reports-winloss.png` | `/reports/win-loss` | Win/Loss report |
| 20 | `20-reports-additional.png` | `/reports/additional` | Additional analytics |
| 21 | `21-import-leads.png` | `/import-leads` | Import page |
| 22 | `22-import-history.png` | `/import-history` | History page |

For **other roles**, capture only the pages accessible to that role (check sidebar items and route permissions in `src/components/Sidebar.tsx` and `src/App.tsx`).

#### Dialog Handling
If a browser dialog appears (`confirm`, `alert`), use `handle_dialog` to dismiss or accept before continuing.

---

### Phase 3 — Generate HTML Guide

After all screenshots are confirmed:

1. Read `docs/user-guide-company-admin.html` to extract the full CSS theme (cover, TOC, section styles, screenshot-block, steps, tip/warning, field-table classes).
2. Create `docs/user-guide-{role-slug}.html` (overwrite if it exists) using that exact same CSS.

#### HTML Structure Rules
- **Cover page**: App name "Leadbox", subtitle "User Guide", role badge, version and today's date
- **Table of contents**: Numbered list with anchor links to each section
- **One section per workflow step** — numbered, with teal circle badge
- **Each section contains**:
  - Brief plain-English intro (1–3 sentences, written for a non-technical user)
  - Screenshot image (relative path `screenshots/NN-name.png`, max-width 780px, border + shadow)
  - Screenshot caption (italic, centred)
  - Step-by-step `<ol class="steps">` instructions
  - Field table (where a form is involved) listing field name, what to enter, required/optional
  - `<div class="tip">` or `<div class="warning">` for important notes
- **Language**: Plain English. No jargon. Write as if explaining to someone who has never used software before.
- **No external dependencies**: All CSS inline in `<style>` block. Works offline and prints cleanly.

#### Correct Admin Onboarding Section Order (reference for all roles)
1. Creating Your Account *(if registering fresh)*
2. Verifying Your Email *(if registering fresh)*
3. Logging In
4. Your Dashboard
5. Setting Up Your Company *(Admin only)*
6. Setting Up "Interested In" Options *(Admin only — must be done before any leads)*
7. Managing Your Team *(Admin/Manager only)*
8. Adding a Lead
9. Viewing Your Leads
10. Viewing All Company Leads *(Admin/Manager only)*
11. Assigning Leads *(Admin/Manager only)*
12. Follow-ups
13. Reports
14. Importing Leads in Bulk *(Admin/Manager only)*

For other roles, include only the sections relevant to their accessible pages.

---

### Phase 4 — Verification

After generating the HTML:
1. Tell the user the output file path.
2. Ask them to open it in a browser and confirm all screenshots load and content is correct.

---

## Role Access Reference

| Feature | System Admin | Company Admin | Company Manager | Team Member | Referral Partner |
|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add Lead | ✓ | ✓ | ✓ | ✓ | ✓ |
| My Leads | ✓ | ✓ | ✓ | ✓ | ✓ |
| All Leads | ✓ | ✓ | ✓ | — | — |
| Assign Leads | ✓ | ✓ | ✓ | — | — |
| Follow-ups | ✓ | ✓ | ✓ | ✓ | — |
| Reports | ✓ | ✓ | ✓ | ✓ | — |
| Import Leads | ✓ | ✓ | ✓ | — | — |
| Import History | ✓ | ✓ | ✓ | — | — |
| Manage Users | ✓ | ✓ | — | — | — |
| Settings | ✓ | ✓ | ✓ | ✓ | — |

---

## Known Issues & Solutions

| Problem | Solution |
|---|---|
| React text inputs don't show filled value | Use `evaluate_script` with native input setter + `input`/`change` events |
| OTP boxes don't fill via script | Pause and ask user to fill OTP manually |
| Browser confirm dialog blocks screenshot | Use `handle_dialog` to dismiss before continuing |
| Screenshot path not found in WSL | MCP saves to Windows path — files appear at the WSL-equivalent path automatically |
| Screenshot appears cropped | Always use `fullPage: true` |
| `fill` tool not working on select dropdown | Use `fill` with the option label text — works for `<select>` elements |
