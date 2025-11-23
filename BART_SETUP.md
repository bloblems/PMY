# Bart Simpson - PMY's Official Demo User

## 🏀 Who is Bart?

Bart Simpson (@bart) is PMY's distinguished first user and official demo account. He's an NBA player based in California who uses PMY to ensure clear, documented consent in all his interactions.

## 📋 Account Details

**Login Credentials:**
- **Email:** `bart.simpson@pmy.demo`
- **Password:** `BartPlaysNBA2024!`
- **Username:** `@bart`

**Profile:**
- **Bio:** NBA player
- **Location:** California
- **Default Preferences:**
  - State of Residence: California
  - Default Encounter Type: Intimate
  - Default Contract Duration: 60 minutes

## 📊 Test Data

Bart's account comes pre-loaded with realistic test data:

### Contracts
- **1 Active Contract** - Currently ongoing with Alex Johnson
- **1 Paused Contract** - On hold with Jordan Lee
- **1 Completed Contract** - Finished conversation with Taylor Martinez (from 7 days ago)
- **1 Draft Contract** - Work in progress

### Recordings
- **2 Voice Recordings** - Sample consent audio recordings

### Contacts
- **@lebron** - Saved contact for quick access

## 🔧 Setup & Recreation

### First-Time Setup
Run this command to create Bart's account:

```bash
npx tsx scripts/setup-bart.ts
```

### Resetting Bart's Account
If you need to reset Bart's account to default test data, simply run the setup script again. It will:
- ✅ Keep existing auth account (no duplicate creation)
- ✅ Keep existing profile (no duplicate creation)
- ✅ Add new test data (contracts, recordings)

### Manual Login
You can log in as Bart through the web interface:
1. Navigate to `/auth`
2. Enter email: `bart.simpson@pmy.demo`
3. Enter password: `BartPlaysNBA2024!`

## 🧪 Testing with Bart

### As a Demo User
- Use Bart's account to demonstrate PMY features to stakeholders
- Show realistic consent workflows with pre-existing data
- Test collaborative features by inviting other users to Bart's contracts

### In Test Scripts
Bart's credentials can be used in automated tests:

```typescript
const BART_EMAIL = "bart.simpson@pmy.demo";
const BART_PASSWORD = "BartPlaysNBA2024!";

// Login as Bart
const { data, error } = await supabase.auth.signInWithPassword({
  email: BART_EMAIL,
  password: BART_PASSWORD,
});
```

## 🎭 Bart's Persona

Bart is a high-net-worth professional athlete whose career depends on:
- **Clear Communication** - Every interaction must be documented
- **Legal Compliance** - Zero tolerance for ambiguity
- **Professional Polish** - The app must work flawlessly
- **Privacy & Security** - His reputation is at stake

This perspective guides how we build PMY - with the same standards Bart would demand for his own use.

## 📝 Notes

- Bart's account is stored in the **development database**
- Password is intentionally simple for demo purposes (in production, enforce stronger requirements)
- Test data uses realistic but fictional participant names
- All contracts and recordings use sample/placeholder content

---

**Need to recreate Bart?** Just run `npx tsx scripts/setup-bart.ts`
