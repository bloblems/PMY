# 🤖 Bart Quick Start Guide

## Run Tests in 5 Seconds

```bash
npx tsx bart.ts
```

That's it! Bart will:
- ✅ Test 53 endpoints across 8 domain routers
- ✅ Analyze failures with AI
- ✅ Generate a comprehensive report

## Common Commands

```bash
# Run all tests (full suite)
npx tsx bart.ts

# View this guide
cat BART_QUICK_START.md

# View full documentation
cat BART_README.md
```

## What Gets Tested

- **App Health** (2 tests): Server & Stripe status
- **Contracts Router** (23 tests): All consent & collaboration endpoints
- **Other Routers** (28 tests): Universities, auth, profile, notifications, etc.

## Understanding Results

### ✅ Green = Good
Endpoint is mounted and responding correctly.

### ❌ Red = Needs Attention
- **404**: Router not mounted (CRITICAL!)
- **200 when expecting 401**: Missing authentication
- **500**: Application error

## When to Run Bart

- ✅ After making routing changes
- ✅ Before committing major refactors
- ✅ When debugging API issues
- ✅ To verify all routers are mounted correctly

## Exit Codes

- **0** = All tests passed
- **1** = Some tests failed

## Need Help?

See `BART_README.md` for full documentation.
