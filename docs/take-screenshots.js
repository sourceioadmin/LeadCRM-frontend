/**
 * take-screenshots.js
 * -------------------
 * Captures screenshots for the Leadbox Company Admin user guide.
 * Walks through the full registration flow from scratch, then captures
 * every authenticated page.
 *
 * Prerequisites:
 *   1.  npm run dev            (app running at http://localhost:5173)
 *   2.  npx playwright install chromium   (first time only)
 *
 * Usage:
 *   node docs/take-screenshots.js
 *
 * When it reaches the OTP step it will pause so you can type the code
 * into the browser window, then press Enter here to continue.
 */

const { chromium } = require('playwright');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const OUT_DIR  = path.join(__dirname, 'screenshots');

// ── Sample registration data ──────────────────────────────────────────────────
const SAMPLE = {
  companyName : 'NovaSpark Solutions',
  industry    : 'Technology',
  companySize : '11-50',
  fullName    : 'Saniya Chogle',
  email       : 'saniya@saniyachogle.com',
  username    : 'saniyac',
  phone       : '9637609002',
  password    : 'Leadbox@2026',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function waitForLoad(page, extra = 800) {
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(extra);
}

async function shot(page, filename, caption) {
  const fp = path.join(OUT_DIR, filename);
  await page.screenshot({ path: fp, fullPage: false });
  console.log(`  ✓  ${filename}   — ${caption}`);
}

// ── main ─────────────────────────────────────────────────────────────────────

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Leadbox – User Guide Screenshot Tool                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('Registering with sample data:');
  console.log(`  Company  : ${SAMPLE.companyName}`);
  console.log(`  Name     : ${SAMPLE.fullName}`);
  console.log(`  Email    : ${SAMPLE.email}`);
  console.log(`  Username : ${SAMPLE.username}`);
  console.log(`  Phone    : ${SAMPLE.phone}`);
  console.log(`  Password : ${SAMPLE.password}\n`);
  console.log('Make sure  npm run dev  is already running.\n');

  // ── Use sample data directly ───────────────────────────────────────────────
  const { companyName, industry, companySize,
          fullName, email, username, phone, password } = SAMPLE;

  console.log('\n📸  Starting browser…\n');

  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await context.newPage();

  try {

    // ════════════════════════════════════════════════════════════════════════
    // 1. Login page
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/login`);
    await waitForLoad(page);
    await shot(page, '01-login.png', 'Login page');


    // ════════════════════════════════════════════════════════════════════════
    // 2. Register – Step 1 (Company Details)
    // ════════════════════════════════════════════════════════════════════════
    // Click "Create Account" / "Register" link on login page
    const registerLink = page.locator('a[href*="register"], a:has-text("Create"), a:has-text("Register"), a:has-text("Sign up")').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
    } else {
      await page.goto(`${BASE_URL}/register`);
    }
    await waitForLoad(page);
    await shot(page, '02-register-step1-empty.png', 'Registration page – blank Step 1');

    // Fill Step 1 fields
    const nameField = page.locator('input[name="companyName"], input[placeholder*="company name" i], input[placeholder*="Company" i]').first();
    if (await nameField.isVisible()) await nameField.fill(companyName);

    // Industry – try select first, then text input
    const industrySelect = page.locator('select[name="industry"], select').first();
    if (await industrySelect.isVisible()) {
      // Try to pick a matching option, else pick the second option
      const options = await industrySelect.locator('option').allInnerTexts();
      const match = options.find(o => o.toLowerCase().includes(industry.toLowerCase().substring(0, 4)));
      if (match) {
        await industrySelect.selectOption({ label: match });
      } else {
        await industrySelect.selectOption({ index: 1 });
      }
    }

    // Company size
    const sizeSelect = page.locator('select[name="companySize"], select').nth(1);
    if (await sizeSelect.isVisible()) {
      const sizeOptions = await sizeSelect.locator('option').allInnerTexts();
      const sizeMatch = sizeOptions.find(o => o.includes(companySize));
      if (sizeMatch) {
        await sizeSelect.selectOption({ label: sizeMatch });
      } else {
        await sizeSelect.selectOption({ index: 1 });
      }
    }

    await page.waitForTimeout(400);
    await shot(page, '02-register-step1.png', 'Registration – Step 1 filled in');

    // Click Next
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button[type="submit"]').first();
    await nextBtn.click();
    await waitForLoad(page);


    // ════════════════════════════════════════════════════════════════════════
    // 3. Register – Step 2 (User Details)
    // ════════════════════════════════════════════════════════════════════════
    await shot(page, '03-register-step2-empty.png', 'Registration – blank Step 2');

    // Fill Step 2 fields
    const fillIfVisible = async (selector, value) => {
      const el = page.locator(selector).first();
      if (await el.isVisible().catch(() => false)) await el.fill(value);
    };

    await fillIfVisible('input[name="fullName"], input[placeholder*="full name" i], input[placeholder*="name" i]', fullName);
    await fillIfVisible('input[name="email"], input[type="email"]', email);
    await fillIfVisible('input[name="username"], input[placeholder*="username" i]', username);
    await fillIfVisible('input[name="phone"], input[placeholder*="phone" i]', phone);
    await fillIfVisible('input[name="password"], input[type="password"]', password);
    // Confirm password if present
    const confirmField = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]').first();
    if (await confirmField.isVisible().catch(() => false)) await confirmField.fill(password);

    await page.waitForTimeout(400);
    await shot(page, '03-register-step2.png', 'Registration – Step 2 filled in');

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")').first();
    await submitBtn.click();
    await waitForLoad(page, 1500);


    // ════════════════════════════════════════════════════════════════════════
    // 4. OTP Verification
    // ════════════════════════════════════════════════════════════════════════
    await shot(page, '04-verify-otp.png', 'OTP Verification page');

    console.log('\n──────────────────────────────────────────────────────────');
    console.log('  📧  Check your email for the 6-digit verification code.');
    console.log('  Type it into the browser window that just opened.');
    console.log('  Once you have verified successfully and are on the');
    console.log('  Dashboard, come back here and press Enter to continue.');
    console.log('──────────────────────────────────────────────────────────\n');
    await ask(rl, '  Press Enter when you are on the Dashboard → ');


    // ════════════════════════════════════════════════════════════════════════
    // 5. Dashboard
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/`);
    await waitForLoad(page, 2500); // charts need time to render
    await shot(page, '05-dashboard.png', 'Dashboard');


    // ════════════════════════════════════════════════════════════════════════
    // 6. Add Lead modal
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/add-lead`);
    await waitForLoad(page, 1200);
    await shot(page, '06-add-lead-modal.png', 'Add Lead modal');

    // Close modal if open before navigating away
    const closeBtn = page.locator('button[aria-label="Close"], button.btn-close').first();
    if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();


    // ════════════════════════════════════════════════════════════════════════
    // 7. My Leads
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/my-leads`);
    await waitForLoad(page);
    await shot(page, '07-my-leads.png', 'My Leads');


    // ════════════════════════════════════════════════════════════════════════
    // 8. All Leads
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/all-leads`);
    await waitForLoad(page);
    await shot(page, '08-all-leads.png', 'All Leads');


    // ════════════════════════════════════════════════════════════════════════
    // 9. Assign Leads
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/assign-leads`);
    await waitForLoad(page);
    await shot(page, '09-assign-leads.png', 'Assign Leads');


    // ════════════════════════════════════════════════════════════════════════
    // 10. Follow-Ups
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/followups`);
    await waitForLoad(page);
    await shot(page, '10-followups.png', 'Follow-Ups');


    // ════════════════════════════════════════════════════════════════════════
    // 11. Reports Hub
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/reports`);
    await waitForLoad(page);
    await shot(page, '11-reports-hub.png', 'Reports Hub');


    // ════════════════════════════════════════════════════════════════════════
    // 12. Conversion Report
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/reports/conversion`);
    await waitForLoad(page, 2000);
    await shot(page, '12-conversion-report.png', 'Conversion Report');


    // ════════════════════════════════════════════════════════════════════════
    // 13. Win / Loss Report
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/reports/win-loss`);
    await waitForLoad(page, 2000);
    await shot(page, '13-win-loss-report.png', 'Win vs Loss Report');


    // ════════════════════════════════════════════════════════════════════════
    // 14. Additional Analytics
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/reports/additional`);
    await waitForLoad(page, 2000);
    await shot(page, '14-additional-analytics.png', 'Additional Analytics');


    // ════════════════════════════════════════════════════════════════════════
    // 15. Import Leads
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/import-leads`);
    await waitForLoad(page);
    await shot(page, '15-import-leads.png', 'Import Leads');


    // ════════════════════════════════════════════════════════════════════════
    // 16. Import History
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/import-history`);
    await waitForLoad(page);
    await shot(page, '16-import-history.png', 'Import History');


    // ════════════════════════════════════════════════════════════════════════
    // 17. Manage Users
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/manage-users`);
    await waitForLoad(page);
    await shot(page, '17-manage-users.png', 'Manage Users');


    // ════════════════════════════════════════════════════════════════════════
    // 18. Settings
    // ════════════════════════════════════════════════════════════════════════
    await page.goto(`${BASE_URL}/settings`);
    await waitForLoad(page);
    await shot(page, '18-settings.png', 'Settings – Company tab');

    // Settings – User Profile tab
    const profileTab = page.locator('a[data-rr-ui-event-key="profile"], a:has-text("User Profile")').first();
    if (await profileTab.isVisible().catch(() => false)) {
      await profileTab.click();
      await page.waitForTimeout(600);
      await shot(page, '18b-settings-profile.png', 'Settings – User Profile tab');
    }

    // Settings – Interested In tab
    const interestedTab = page.locator('a[data-rr-ui-event-key="interested-in"], a:has-text("Interested In")').first();
    if (await interestedTab.isVisible().catch(() => false)) {
      await interestedTab.click();
      await page.waitForTimeout(600);
      await shot(page, '18c-settings-interested-in.png', 'Settings – Interested In Options tab');
    }


    // ════════════════════════════════════════════════════════════════════════
    // Done
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n✅  All screenshots saved to docs/screenshots/\n');
    console.log('Next steps:');
    console.log('  1. Open docs/user-guide-company-admin.html in your browser.');
    console.log('     The screenshots should appear inline.');
    console.log('  2. To import into Google Docs:');
    console.log('     Drag the HTML file into Google Drive →');
    console.log('     Right-click → Open with → Google Docs\n');

  } catch (err) {
    console.error('\n❌  Error:', err.message);
    console.error(err.stack);
  } finally {
    rl.close();
    await browser.close();
  }
})();
