#!/usr/bin/env tsx
/**
 * PMY Custom Testing Agent
 * 
 * An AI-powered e2e testing tool that uses OpenAI and Playwright to test the app
 * without the built-in testing agent's Stripe prerequisite restrictions.
 */

import { chromium, type Browser, type Page } from 'playwright';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const APP_URL = 'http://localhost:5000';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

class TestAgent {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];

  async initialize() {
    console.log('🚀 Initializing Custom Testing Agent...');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    console.log('✅ Browser initialized');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`\n📝 Running: ${name}`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED (${duration}ms)`);
      return { name, status: 'passed', duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ FAILED (${duration}ms): ${errorMessage}`);
      
      // Take screenshot on failure
      let screenshot: string | undefined;
      if (this.page) {
        screenshot = await this.page.screenshot({ 
          path: `test-failure-${Date.now()}.png`,
          fullPage: true 
        }).then(() => 'Screenshot saved').catch(() => undefined);
      }
      
      return { name, status: 'failed', duration, error: errorMessage, screenshot };
    }
  }

  async analyzeFailureWithAI(result: TestResult): Promise<string> {
    if (result.status === 'passed') return 'Test passed!';
    
    const prompt = `You are a QA engineer analyzing a failed test. Here are the details:

Test Name: ${result.name}
Error: ${result.error}
Duration: ${result.duration}ms

Based on this information, provide:
1. Likely root cause
2. Suggested fix
3. Whether this seems like a real bug or test issue

Be concise and actionable.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 300
      });

      return completion.choices[0]?.message?.content || 'No analysis available';
    } catch (error) {
      return 'AI analysis unavailable';
    }
  }

  // ===== Test Suites =====

  async testBasicNavigation() {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.runTest('Navigate to homepage', async () => {
      await this.page!.goto(APP_URL, { waitUntil: 'networkidle' });
      await this.page!.waitForSelector('body', { timeout: 5000 });
    });

    await this.runTest('Verify bottom navigation exists', async () => {
      const nav = await this.page!.locator('nav').count();
      if (nav === 0) throw new Error('Bottom navigation not found');
    });

    await this.runTest('Click Tools tab', async () => {
      // Try multiple selectors for Tools tab
      const toolsButton = this.page!.locator('button:has-text("Tools"), a:has-text("Tools")').first();
      await toolsButton.click({ timeout: 5000 });
      await this.page!.waitForLoadState('networkidle');
    });

    await this.runTest('Click Contracts tab', async () => {
      const contractsButton = this.page!.locator('button:has-text("Contracts"), a:has-text("Contracts")').first();
      await contractsButton.click({ timeout: 5000 });
      await this.page!.waitForLoadState('networkidle');
    });

    await this.runTest('Click Profile tab', async () => {
      const profileButton = this.page!.locator('button:has-text("Profile"), a:has-text("Profile")').first();
      await profileButton.click({ timeout: 5000 });
      await this.page!.waitForLoadState('networkidle');
    });
  }

  async testContractsAPI() {
    if (!this.page) throw new Error('Page not initialized');

    await this.runTest('Verify contracts API is mounted', async () => {
      const response = await this.page!.evaluate(async () => {
        const res = await fetch('/api/contracts');
        return {
          status: res.status,
          ok: res.ok,
          body: await res.text()
        };
      });

      // Should return 401/403 (auth required) or 200, NOT 404
      if (response.status === 404) {
        throw new Error('Contracts API not mounted - returns 404');
      }
      
      console.log(`   ℹ️  API Status: ${response.status} (${response.body.substring(0, 50)})`);
    });

    await this.runTest('Verify universities API is mounted', async () => {
      const response = await this.page!.evaluate(async () => {
        const res = await fetch('/api/universities');
        return {
          status: res.status,
          ok: res.ok
        };
      });

      if (response.status === 404) {
        throw new Error('Universities API not mounted - returns 404');
      }
      
      console.log(`   ℹ️  API Status: ${response.status}`);
    });
  }

  async testConsentFlow() {
    if (!this.page) throw new Error('Page not initialized');

    await this.runTest('Navigate to consent creation', async () => {
      await this.page!.goto(APP_URL, { waitUntil: 'networkidle' });
      
      // Look for consent flow UI elements
      const hasEncounterType = await this.page!.locator('text=Encounter Type, text=encounter').count() > 0;
      const hasSteps = await this.page!.locator('[class*="step"], [class*="Step"]').count() > 0;
      
      if (!hasEncounterType && !hasSteps) {
        throw new Error('Consent creation flow UI not found');
      }
    });
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST REPORT');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${passRate}%`);

    if (failed > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('❌ FAILED TESTS:');
      console.log('-'.repeat(60));
      
      for (const result of this.results.filter(r => r.status === 'failed')) {
        console.log(`\n${result.name}:`);
        console.log(`  Error: ${result.error}`);
        
        if (process.env.OPENAI_API_KEY) {
          console.log('  🤖 AI Analysis:');
          const analysis = await this.analyzeFailureWithAI(result);
          console.log('  ' + analysis.split('\n').join('\n  '));
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    return { passed, failed, total, passRate: parseFloat(passRate) };
  }
}

// ===== Main Execution =====
async function main() {
  const agent = new TestAgent();

  try {
    await agent.initialize();
    
    console.log('\n🧪 Starting Test Suite...\n');
    
    // Run test suites
    await agent.testBasicNavigation();
    await agent.testContractsAPI();
    await agent.testConsentFlow();
    
    // Generate report
    const report = await agent.generateReport();
    
    // Exit with appropriate code
    process.exit(report.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await agent.cleanup();
  }
}

// Run if executed directly
main();

export { TestAgent };
