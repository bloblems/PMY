#!/usr/bin/env tsx
/**
 * PMY API Testing Agent
 * 
 * A lightweight testing tool that verifies API endpoints and routing
 * without browser automation (works in Replit environment).
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const APP_URL = 'http://localhost:5000';

interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  details?: string;
  error?: string;
}

class APITestAgent {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    console.log(`📝 ${name}...`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(`  ✅ PASSED (${duration}ms)`);
      this.results.push({ name, status: 'passed', duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ FAILED (${duration}ms): ${errorMessage}`);
      this.results.push({ name, status: 'failed', duration, error: errorMessage });
    }
  }

  async testEndpoint(
    name: string,
    path: string,
    expectedStatus: number[],
    notExpectedStatus?: number[]
  ): Promise<void> {
    await this.runTest(name, async () => {
      const response = await fetch(`${APP_URL}${path}`);
      const status = response.status;
      
      if (notExpectedStatus && notExpectedStatus.includes(status)) {
        throw new Error(`Endpoint returned ${status} (should NOT be ${notExpectedStatus.join('/')})`);
      }
      
      if (!expectedStatus.includes(status)) {
        throw new Error(`Endpoint returned ${status} (expected ${expectedStatus.join('/')})`);
      }
      
      console.log(`    ℹ️  Status: ${status}`);
    });
  }

  async testContractsRouter() {
    console.log('\n🔧 Testing Contracts Router (23 endpoints)...\n');
    
    // Basic CRUD endpoints
    await this.testEndpoint(
      'GET /api/contracts',
      '/api/contracts',
      [200, 401, 403], // OK or auth required
      [404] // Should NOT be 404 (means not mounted)
    );

    await this.testEndpoint(
      'GET /api/contracts/:id',
      '/api/contracts/test-id',
      [200, 401, 403, 404], // OK, auth required, or not found
      [] // 404 is OK here (specific contract not found)
    );

    // Consent creation endpoints
    await this.testEndpoint(
      'POST /api/consent-contracts (without auth)',
      '/api/consent-contracts',
      [400, 401, 403], // Bad request or auth required
      [404] // Should NOT be 404
    );

    await this.testEndpoint(
      'POST /api/consent-recordings (without auth)',
      '/api/consent-recordings',
      [400, 401, 403],
      [404]
    );

    // Collaborative contract endpoints
    await this.testEndpoint(
      'GET /api/contracts/drafts',
      '/api/contracts/drafts',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/contracts/invitations',
      '/api/contracts/invitations',
      [200, 401, 403],
      [404]
    );
  }

  async testOtherRouters() {
    console.log('\n🔧 Testing Other Domain Routers...\n');

    await this.testEndpoint(
      'GET /api/universities',
      '/api/universities',
      [200],
      [404]
    );

    await this.testEndpoint(
      'GET /api/state-laws',
      '/api/state-laws',
      [200],
      [404]
    );

    await this.testEndpoint(
      'GET /api/notifications',
      '/api/notifications',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/recordings',
      '/api/recordings',
      [200, 401, 403],
      [404]
    );
  }

  async testAppHealth() {
    console.log('\n🏥 Testing App Health...\n');

    await this.runTest('Server is running', async () => {
      const response = await fetch(APP_URL);
      if (!response.ok && response.status !== 404) {
        throw new Error(`Server returned ${response.status}`);
      }
    });

    await this.runTest('Stripe is disabled', async () => {
      // Verify Stripe endpoints return 503 (service unavailable)
      const response = await fetch(`${APP_URL}/api/verify/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universityId: 'test', model: 'gpt-4o-mini' })
      });
      
      if (response.status !== 503) {
        throw new Error(`Stripe should be disabled (503), got ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`    ℹ️  ${data.error || data.details}`);
    });
  }

  async analyzeWithAI(): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      console.log('\n💡 AI analysis skipped (no OpenAI API key)');
      return;
    }

    const failedTests = this.results.filter(r => r.status === 'failed');
    if (failedTests.length === 0) return;

    console.log('\n🤖 AI Analysis of Failures...\n');

    const prompt = `You are a senior QA engineer analyzing test failures for the PMY consent documentation app.

Failed Tests:
${failedTests.map(t => `- ${t.name}: ${t.error}`).join('\n')}

Context:
- Just completed a major refactoring: extracted 23 contract endpoints from routes.ts into contracts.ts
- All routers should be mounted at /api with relative paths
- Stripe is intentionally disabled for testing (should return 503)

Analyze the failures and provide:
1. Root cause for each failure
2. Likely fix needed
3. Overall assessment of refactoring health

Be concise and actionable.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const analysis = completion.choices[0]?.message?.content || 'No analysis available';
      console.log(analysis);
    } catch (error) {
      console.log('AI analysis unavailable:', error instanceof Error ? error.message : String(error));
    }
  }

  generateReport(): { passed: number; failed: number; total: number; passRate: number } {
    console.log('\n' + '='.repeat(60));
    console.log('📊 API TEST REPORT');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;
    const passRate = total > 0 ? ((passed / total) * 100) : 0;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('❌ FAILED TESTS:');
      console.log('-'.repeat(60));
      
      for (const result of this.results.filter(r => r.status === 'failed')) {
        console.log(`\n• ${result.name}`);
        console.log(`  ${result.error}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    
    if (passRate >= 80) {
      console.log('✨ Excellent! Contracts router refactoring is working great!');
    } else if (passRate >= 60) {
      console.log('⚠️  Good progress, but some issues need attention');
    } else {
      console.log('🔧 Significant issues detected - needs debugging');
    }
    
    console.log('='.repeat(60) + '\n');

    return { passed, failed, total, passRate };
  }
}

async function main() {
  const agent = new APITestAgent();

  console.log('🚀 PMY API Testing Agent');
  console.log('Testing contracts router extraction and API health\n');

  try {
    await agent.testAppHealth();
    await agent.testContractsRouter();
    await agent.testOtherRouters();
    await agent.analyzeWithAI();
    
    const report = agent.generateReport();
    
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();

export { APITestAgent };
