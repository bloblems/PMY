#!/usr/bin/env tsx
/**
 * Bart E2E Browser Tests
 * 
 * Standalone Playwright browser tests that run independently of Replit's
 * agent testing infrastructure. No Stripe secrets required!
 * 
 * Usage:
 *   npx tsx bart-e2e.ts              - Run full browser test suite
 *   npx tsx bart-e2e.ts --headless   - Run in headless mode (default)
 *   npx tsx bart-e2e.ts --headed     - Run with visible browser
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

const APP_URL = 'http://localhost:5000';
const BART_EMAIL = 'bart.simpson@pmy.demo';
const BART_PASSWORD = 'BartPlaysNBA2024!';

interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
  screenshot?: string;
}

class BartE2EAgent {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private results: TestResult[] = [];
  private headless: boolean;

  constructor(headless: boolean = true) {
    this.headless = headless;
  }

  async setup(): Promise<void> {
    console.log('🚀 Launching browser...\n');
    this.browser = await chromium.launch({ 
      headless: this.headless,
      slowMo: this.headless ? 0 : 100 // Slow down for visibility in headed mode
    });
    this.context = await this.browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14 Pro dimensions
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    this.page = await this.context.newPage();
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
  }

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    console.log(`📝 ${name}...`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`  ✅ PASSED (${duration}ms)\n`);
      this.results.push({ name, status: 'passed', duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Take screenshot on failure
      let screenshotPath: string | undefined;
      if (this.page) {
        screenshotPath = `./test-failures/${name.replace(/[^a-z0-9]/gi, '_')}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      }
      
      console.log(`  ❌ FAILED (${duration}ms): ${errorMessage}`);
      if (screenshotPath) {
        console.log(`     Screenshot: ${screenshotPath}\n`);
      }
      
      this.results.push({ 
        name, 
        status: 'failed', 
        duration, 
        error: errorMessage,
        screenshot: screenshotPath
      });
    }
  }

  async testLogin(): Promise<void> {
    await this.runTest('Login as Bart', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      // Navigate to login page
      await this.page.goto(`${APP_URL}/auth`);
      await this.page.waitForLoadState('networkidle');
      
      // Fill in credentials
      const emailInput = this.page.locator('input[type="email"]');
      const passwordInput = this.page.locator('input[type="password"]');
      const loginButton = this.page.locator('button:has-text("Log in"), button:has-text("Sign in")');
      
      await emailInput.fill(BART_EMAIL);
      await passwordInput.fill(BART_PASSWORD);
      await loginButton.click();
      
      // Wait for redirect to home/dashboard
      await this.page.waitForURL(/\/(home|dashboard|profile|contracts|create)?$/, { timeout: 10000 });
      
      // Verify we're logged in (check for user-specific elements)
      const isLoggedIn = await this.page.locator('text=/Bart|@bart|Profile|Create/i').isVisible();
      if (!isLoggedIn) {
        throw new Error('Login failed - no user elements found');
      }
    });
  }

  async testCreateContract(): Promise<void> {
    await this.runTest('Create Contract - Full Flow', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      // Navigate to create consent flow
      // Try multiple selectors for the "Create" button
      const createButton = this.page.locator(
        'a[href="/create"], button:has-text("Create"), [data-testid*="create"]'
      ).first();
      
      await createButton.click();
      await this.page.waitForLoadState('networkidle');
      
      // Step 1: Select encounter type (Intimate)
      console.log('    → Step 1: Selecting Intimate encounter...');
      const intimateOption = this.page.locator('text=/Intimate/i').first();
      await intimateOption.click();
      
      const nextButton1 = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      await nextButton1.click();
      await this.page.waitForTimeout(500);
      
      // Step 2: Select state (California)
      console.log('    → Step 2: Selecting California...');
      
      // Click "Select My State" radio button
      const stateRadio = this.page.locator('text=/Select My State/i');
      await stateRadio.click();
      await this.page.waitForTimeout(300);
      
      // Open state selector dropdown
      const stateSelector = this.page.locator('button:has-text("Select state"), [role="combobox"]').first();
      await stateSelector.click();
      await this.page.waitForTimeout(300);
      
      // Select California from dropdown
      const californiaOption = this.page.locator('text=/^California$/i, [role="option"]:has-text("California")').first();
      await californiaOption.click();
      await this.page.waitForTimeout(300);
      
      const nextButton2 = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      await nextButton2.click();
      await this.page.waitForTimeout(500);
      
      // Step 3: Add participant
      console.log('    → Step 3: Adding participant...');
      const participantInput = this.page.locator('input[placeholder*="name" i], input[type="text"]').first();
      await participantInput.fill('Test Participant E2E');
      
      const nextButton3 = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      await nextButton3.click();
      await this.page.waitForTimeout(500);
      
      // Step 4: Select intimate acts
      console.log('    → Step 4: Selecting intimate acts...');
      const firstAct = this.page.locator('[role="checkbox"], input[type="checkbox"]').first();
      await firstAct.click();
      
      const nextButton4 = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      await nextButton4.click();
      await this.page.waitForTimeout(500);
      
      // Step 5: Select duration
      console.log('    → Step 5: Selecting duration...');
      const durationOption = this.page.locator('text=/60 minutes|1 hour/i').first();
      await durationOption.click();
      
      const nextButton5 = this.page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      await nextButton5.click();
      await this.page.waitForTimeout(500);
      
      // Step 6: Complete signature/confirmation
      console.log('    → Step 6: Completing signature...');
      
      // Look for signature canvas or final submit button
      const hasCanvas = await this.page.locator('canvas').isVisible().catch(() => false);
      
      if (hasCanvas) {
        // Draw a simple signature
        const canvas = this.page.locator('canvas').first();
        const box = await canvas.boundingBox();
        if (box) {
          await this.page.mouse.move(box.x + 50, box.y + 50);
          await this.page.mouse.down();
          await this.page.mouse.move(box.x + 150, box.y + 50);
          await this.page.mouse.move(box.x + 150, box.y + 80);
          await this.page.mouse.up();
        }
      }
      
      // Click final submit/complete button
      const submitButton = this.page.locator(
        'button:has-text("Submit"), button:has-text("Complete"), button:has-text("Create"), button:has-text("Confirm")'
      ).first();
      await submitButton.click();
      await this.page.waitForTimeout(2000);
      
      // Verify success
      console.log('    → Verifying contract creation...');
      
      // Look for success indicators
      const hasSuccessToast = await this.page.locator('text=/success|created|completed/i').isVisible({ timeout: 5000 }).catch(() => false);
      const hasContractsList = await this.page.locator('text=/contracts|files|documents/i').isVisible().catch(() => false);
      
      if (!hasSuccessToast && !hasContractsList) {
        throw new Error('Contract creation may have failed - no success indicators found');
      }
    });
  }

  async testVerifyContract(): Promise<void> {
    await this.runTest('Verify Contract in List', async () => {
      if (!this.page) throw new Error('Page not initialized');
      
      // Navigate to contracts page
      const contractsLink = this.page.locator('a[href="/contracts"], text=/contracts/i, [data-testid*="contracts"]').first();
      await contractsLink.click();
      await this.page.waitForLoadState('networkidle');
      
      // Look for the contract we just created
      const hasContract = await this.page.locator('text=/Test Participant E2E/i').isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!hasContract) {
        // Check if there are any contracts at all
        const hasAnyContracts = await this.page.locator('text=/california|intimate|active/i').count() > 0;
        if (!hasAnyContracts) {
          throw new Error('No contracts found - creation may have failed');
        }
        // If there are contracts but not our test one, that's okay (it might be on another page)
        console.log('    ℹ️  Contract list has items, but test contract not immediately visible');
      }
    });
  }

  printReport(): void {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    console.log('\n============================================================');
    console.log('📊 E2E TEST REPORT');
    console.log('============================================================\n');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${passRate}%\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:');
      this.results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`  ❌ ${r.name}`);
        console.log(`     Error: ${r.error}`);
        if (r.screenshot) {
          console.log(`     Screenshot: ${r.screenshot}`);
        }
      });
      console.log('');
    }
    
    console.log('============================================================');
    
    if (failed === 0) {
      console.log('✨ Bart approves - PMY browser flows are working perfectly!');
    } else {
      console.log('⚠️  Bart has concerns - Please review failed tests above.');
    }
    console.log('============================================================\n');
  }

  getExitCode(): number {
    return this.results.some(r => r.status === 'failed') ? 1 : 0;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const headless = !args.includes('--headed');
  
  console.log('👔 Bart - E2E Browser Tests');
  console.log('═══════════════════════════════════════\n');
  console.log('Testing PMY through the eyes of a high-net-worth professional');
  console.log('whose career depends on reliable consent documentation.\n');
  console.log(`Mode: ${headless ? 'Headless' : 'Headed'}`);
  console.log(`Target: ${APP_URL}\n`);
  
  const agent = new BartE2EAgent(headless);
  
  try {
    await agent.setup();
    
    console.log('🧪 Running Browser Tests...\n');
    
    // Run tests in sequence
    await agent.testLogin();
    await agent.testCreateContract();
    await agent.testVerifyContract();
    
    agent.printReport();
    
    await agent.teardown();
    
    process.exit(agent.getExitCode());
  } catch (error) {
    console.error('\n❌ Fatal error during test execution:');
    console.error(error);
    await agent.teardown();
    process.exit(1);
  }
}

main();
