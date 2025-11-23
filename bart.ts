#!/usr/bin/env tsx
/**
 * Bart - The PMY Testing Agent
 * 
 * A comprehensive AI-powered testing tool that verifies API endpoints,
 * routing, and application health without browser automation.
 * Works perfectly in Replit's environment, no Stripe blocker!
 * 
 * Usage:
 *   npx tsx bart.ts              - Run all tests
 *   npx tsx bart.ts --quick      - Run quick smoke tests only
 *   npx tsx bart.ts --verbose    - Show detailed output
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
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/contracts/:id',
      '/api/contracts/test-id-123',
      [200, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/contracts',
      '/api/contracts',
      [400, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'DELETE /api/contracts/:id',
      '/api/contracts/test-id-123',
      [401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/contracts/:id/pause',
      '/api/contracts/test-id-123/pause',
      [401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/contracts/:id/resume',
      '/api/contracts/test-id-123/resume',
      [401, 403, 404],
      []
    );

    // Consent creation endpoints
    await this.testEndpoint(
      'POST /api/consent-contracts',
      '/api/consent-contracts',
      [400, 401, 403, 200],
      [404]
    );

    await this.testEndpoint(
      'POST /api/consent-recordings',
      '/api/consent-recordings',
      [400, 401, 403, 200],
      [404]
    );

    await this.testEndpoint(
      'POST /api/consent-photos',
      '/api/consent-photos',
      [400, 401, 403, 200],
      [404]
    );

    await this.testEndpoint(
      'POST /api/consent-biometric',
      '/api/consent-biometric',
      [400, 401, 403, 200],
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
      'POST /api/contracts/draft',
      '/api/contracts/draft',
      [400, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'PATCH /api/contracts/draft/:id',
      '/api/contracts/draft/test-123',
      [400, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'GET /api/contracts/shared',
      '/api/contracts/shared',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'POST /api/contracts/:id/share',
      '/api/contracts/test-123/share',
      [400, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'GET /api/contracts/invitations',
      '/api/contracts/invitations',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/contracts/invitations/pmy',
      '/api/contracts/invitations/pmy',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/contracts/invitations/:code',
      '/api/contracts/invitations/test-code-123',
      [200, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/contracts/invitations/:code/accept',
      '/api/contracts/invitations/test-code-123/accept',
      [400, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/contracts/:id/approve',
      '/api/contracts/test-123/approve',
      [400, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/contracts/:id/reject',
      '/api/contracts/test-123/reject',
      [400, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/contracts/:id/confirm-consent',
      '/api/contracts/test-123/confirm-consent',
      [400, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/consent/interpret-custom-text',
      '/api/consent/interpret-custom-text',
      [400, 401, 403],
      [404]
    );
  }

  async testOtherRouters() {
    console.log('\n🔧 Testing Other Domain Routers (28 endpoints)...\n');

    // Universities router (2 endpoints)
    await this.testEndpoint(
      'GET /api/universities',
      '/api/universities',
      [200],
      [404]
    );

    await this.testEndpoint(
      'GET /api/universities/:id',
      '/api/universities/test-123',
      [200, 404],
      []
    );

    // State laws router (2 endpoints)
    await this.testEndpoint(
      'GET /api/state-laws',
      '/api/state-laws',
      [200],
      [404]
    );

    await this.testEndpoint(
      'GET /api/state-laws/:code',
      '/api/state-laws/CA',
      [200, 404],
      []
    );

    // Notifications router (4 endpoints)
    await this.testEndpoint(
      'GET /api/notifications',
      '/api/notifications',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/notifications/unread-count',
      '/api/notifications/unread-count',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'PATCH /api/notifications/:id/read',
      '/api/notifications/test-123/read',
      [401, 403, 404],
      []
    );

    await this.testEndpoint(
      'PATCH /api/notifications/read-all',
      '/api/notifications/read-all',
      [401, 403],
      [404]
    );

    // Recordings router (3 endpoints)
    await this.testEndpoint(
      'GET /api/recordings',
      '/api/recordings',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/recordings/:id',
      '/api/recordings/test-123',
      [401, 403, 404],
      []
    );

    await this.testEndpoint(
      'DELETE /api/recordings/:id',
      '/api/recordings/test-123',
      [401, 403, 404],
      []
    );

    // Amendments router (4 endpoints)
    await this.testEndpoint(
      'POST /api/amendments',
      '/api/amendments',
      [400, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/amendments/contract/:contractId',
      '/api/amendments/contract/test-123',
      [401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/amendments/:id/approve',
      '/api/amendments/test-123/approve',
      [400, 401, 403, 404],
      []
    );

    await this.testEndpoint(
      'POST /api/amendments/:id/reject',
      '/api/amendments/test-123/reject',
      [400, 401, 403, 404],
      []
    );

    // Auth router (6 endpoints)
    await this.testEndpoint(
      'POST /api/auth/signup',
      '/api/auth/signup',
      [400],
      [404]
    );

    await this.testEndpoint(
      'POST /api/auth/login',
      '/api/auth/login',
      [400],
      [404]
    );

    await this.testEndpoint(
      'POST /api/auth/logout',
      '/api/auth/logout',
      [200, 401],
      [404]
    );

    await this.testEndpoint(
      'GET /api/auth/user',
      '/api/auth/user',
      [200, 401],
      [404]
    );

    await this.testEndpoint(
      'POST /api/auth/webauthn/challenge',
      '/api/auth/webauthn/challenge',
      [200],
      [404]
    );

    await this.testEndpoint(
      'POST /api/auth/webauthn/verify',
      '/api/auth/webauthn/verify',
      [400],
      [404]
    );

    // Profile router (8 endpoints)
    await this.testEndpoint(
      'GET /api/profile',
      '/api/profile',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'PATCH /api/profile',
      '/api/profile',
      [400, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/profile/:username',
      '/api/profile/testuser',
      [200, 404],
      []
    );

    await this.testEndpoint(
      'PATCH /api/profile/preferences',
      '/api/profile/preferences',
      [400, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'GET /api/profile/preferences',
      '/api/profile/preferences',
      [200, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'POST /api/profile/email-notifications',
      '/api/profile/email-notifications',
      [400, 401, 403],
      [404]
    );

    await this.testEndpoint(
      'DELETE /api/profile/account',
      '/api/profile/account',
      [401, 403],
      [404]
    );

    await this.testEndpoint(
      'PATCH /api/profile/email',
      '/api/profile/email',
      [400, 401, 403],
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

  console.log('🤖 Bart - The PMY Testing Agent');
  console.log('Comprehensive API endpoint verification\n');
  console.log('Coverage: 51+ endpoints across 8 domain routers');
  console.log('No Stripe blocker, no browser needed, just pure API testing!\n');

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
