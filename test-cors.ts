/**
 * CORS Security Test
 * 
 * Verifies that PMY properly rejects requests from unauthorized origins with 403.
 */

const TEST_ORIGIN_ALLOWED = "http://localhost:5000";
const TEST_ORIGIN_DISALLOWED = "https://evil-site.com";
const API_BASE = "http://localhost:5000";

async function testCORS() {
  console.log("\n🔒 CORS Security Test");
  console.log("═".repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Allowed origin should work
  console.log("\n📝 Test 1: Allowed origin (localhost) should work...");
  try {
    const res = await fetch(`${API_BASE}/api/universities`, {
      headers: {
        "Origin": TEST_ORIGIN_ALLOWED,
      },
    });
    
    if (res.status === 200) {
      console.log("  ✅ PASSED - Allowed origin returned 200");
      passed++;
    } else {
      console.log(`  ❌ FAILED - Expected 200, got ${res.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED - Request error: ${error}`);
    failed++;
  }
  
  // Test 2: Disallowed origin should get 403
  console.log("\n📝 Test 2: Disallowed origin should get 403...");
  try {
    const res = await fetch(`${API_BASE}/api/universities`, {
      headers: {
        "Origin": TEST_ORIGIN_DISALLOWED,
      },
    });
    
    const body = await res.json();
    
    if (res.status === 403) {
      console.log("  ✅ PASSED - Disallowed origin returned 403");
      console.log(`     Response: ${JSON.stringify(body)}`);
      
      // Verify response structure
      if (body.error && body.error.includes("CORS")) {
        console.log("  ✅ PASSED - Response includes CORS error message");
        passed++;
      } else {
        console.log(`  ❌ FAILED - Expected CORS error in response, got: ${JSON.stringify(body)}`);
        failed++;
      }
    } else {
      console.log(`  ❌ FAILED - Expected 403, got ${res.status}`);
      console.log(`     Response: ${JSON.stringify(body)}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED - Request error: ${error}`);
    failed++;
  }
  
  // Test 3: No origin (mobile app) should work
  console.log("\n📝 Test 3: No origin header (mobile app) should work...");
  try {
    const res = await fetch(`${API_BASE}/api/universities`);
    
    if (res.status === 200) {
      console.log("  ✅ PASSED - No origin header returned 200");
      passed++;
    } else {
      console.log(`  ❌ FAILED - Expected 200, got ${res.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAILED - Request error: ${error}`);
    failed++;
  }
  
  // Results
  console.log("\n" + "═".repeat(60));
  console.log("📊 CORS TEST REPORT");
  console.log("═".repeat(60));
  console.log(`\nTotal Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log("\n" + "═".repeat(60));
  
  if (failed === 0) {
    console.log("\n✨ CORS protection is working correctly!");
    process.exit(0);
  } else {
    console.log("\n⚠️  CORS protection has issues!");
    process.exit(1);
  }
}

testCORS();
