# 👔 Bart - Quick Reference

## Who is Bart?

Bart is a high-net-worth professional whose career depends on PMY working flawlessly. He's PMY's most demanding early adopter and trusted advisor - we regularly consult with Bart for feedback on features and reliability.

## Testing with Bart

### API Testing
```bash
npx tsx bart.ts
```
Comprehensive backend testing across 54 API endpoints. Validates routing, authentication, and middleware.

### E2E Browser Testing
```bash
# Headless mode (CI/automated testing)
npx tsx bart-e2e.ts --headless

# Headed mode (visual debugging)
npx tsx bart-e2e.ts --headed
```
End-to-end browser automation testing the complete user experience: login, contract creation, and verification.

## What Bart Tests

### API Tests (bart.ts)
- **App Health** (2 tests): Server & configuration status
- **Contracts Router** (23 tests): All consent & collaboration endpoints
- **Other Routers** (28 tests): Universities, auth, profile, notifications, etc.

### E2E Browser Tests (bart-e2e.ts) 
- **Login Flow** (1 test): Supabase authentication
- **Contract Creation** (1 test): Complete 6-step consent flow
- **Contract Verification** (1 test): List view validation

## Understanding Bart's Feedback

### ✨ Bart Approves
PMY is performing to professional standards. All critical systems are reliable and legally compliant.

### ⚠️ Bart is Concerned
Issues detected that could impact user trust or legal compliance. Fix these before deployment.

## Bart's Perspective

> "I'm a busy professional with a lot at stake. PMY needs to be as reliable as my legal team and as easy to use as texting. There's no room for errors - one glitch could cost me my reputation and career."

## When to Consult Bart

- ✅ Before deploying or merging major changes
- ✅ After refactoring critical systems
- ✅ When adding new features
- ✅ For regular health checks

## Exit Codes

- **0** = Bart approves ✨
- **1** = Bart has concerns ⚠️

## Learn More

See `BART_README.md` for full documentation including Bart's persona, technical implementation, and AI-powered analysis.

---

**Remember**: Bart isn't just a test suite. He's PMY's first champion, toughest critic, and most valuable advisor. 👔
