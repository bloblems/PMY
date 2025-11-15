# PMY iOS Deployment Strategy

## Executive Summary

PMY can be deployed to iOS using a **two-phase migration approach** that balances speed-to-market with long-term native iOS capabilities:

1. **Phase 1 (Quick Launch)**: Wrap the existing React web app in a Capacitor WebView container
2. **Phase 2 (Native Enhancement)**: Incrementally rebuild high-value features using React Native modules

---

## Phase 1: WebView Container (Recommended Starting Point)

### Technology: Capacitor by Ionic

**Why Capacitor:**
- ✅ Wraps existing React + Vite app with minimal changes
- ✅ Provides native API bridges (camera, biometrics, secure storage)
- ✅ Faster App Store approval than hybrid frameworks
- ✅ Maintains single codebase for web and iOS

**Timeline:** 2-4 weeks to App Store submission

### Required Changes

#### 1. Storage Abstraction (Critical)
Current implementation uses `sessionStorage` directly. Abstract behind a storage service:

```typescript
// services/storage.ts
interface StorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Web implementation
class WebStorage implements StorageService {
  async getItem(key: string) { return sessionStorage.getItem(key); }
  async setItem(key: string, value: string) { sessionStorage.setItem(key, value); }
  async removeItem(key: string) { sessionStorage.removeItem(key); }
}

// iOS implementation (using Capacitor SecureStorage)
class SecureStorage implements StorageService {
  async getItem(key: string) { 
    return await SecureStoragePlugin.get({ key }); 
  }
  async setItem(key: string, value: string) { 
    await SecureStoragePlugin.set({ key, value }); 
  }
  async removeItem(key: string) { 
    await SecureStoragePlugin.remove({ key }); 
  }
}
```

**Action:** Update `ConsentFlowContext.tsx` to use abstracted storage service

#### 2. Native API Bridges

Replace browser APIs with Capacitor plugins:

| Current (Browser) | Capacitor Plugin | Priority |
|------------------|-----------------|----------|
| `navigator.mediaDevices` (audio) | `@capacitor/voice-recorder` | High |
| `<input type="file">` (camera) | `@capacitor/camera` | High |
| WebAuthn (biometrics) | `@capacitor-community/native-biometric` | High |
| sessionStorage | `@capacitor/preferences` or `capacitor-secure-storage-plugin` | Critical |

#### 3. iOS-Specific Configuration

**Info.plist Permissions:**
```xml
<key>NSCameraUsageDescription</key>
<string>Required to capture dual selfie consent photos</string>

<key>NSMicrophoneUsageDescription</key>
<string>Required to record verbal consent agreements</string>

<key>NSFaceIDUsageDescription</key>
<string>Required for biometric consent authentication</string>
```

**Capabilities:**
- Keychain Sharing (for secure credential storage)
- Background Modes (if supporting offline uploads)

### App Store Requirements

#### Legal & Compliance Checklist
- [ ] **Privacy Policy** - Host at `pmy.app/privacy` (required by App Store)
- [ ] **Terms of Service** - Host at `pmy.app/terms`
- [ ] **Data Retention Policy** - Document how long consent records are stored
- [ ] **COPPA Compliance** - Age verification (users must be 18+)
- [ ] **Title IX Evidence Requirements** - Ensure audit trail meets institutional standards
- [ ] **App Store Privacy Nutrition Label** - Declare all data collected

#### App Store Review Guidelines
- [ ] Section 1.4.4: Medical/Health apps may require credentials (not applicable - Title IX education)
- [ ] Section 2.5.2: Legal services require proper licensing disclaimers
- [ ] Section 5.1.1: Data collection - transparent about consent recording
- [ ] Section 5.1.2: Data use - clear consent agreement storage purpose

**Recommended App Store Category:** Education > Reference (not Health & Fitness to avoid medical review)

---

## Phase 2: React Native Migration (Future Enhancement)

### Hybrid Approach: Keep WebView, Add Native Modules

Rather than full rewrite, incrementally replace critical flows:

#### Candidates for Native Modules
1. **Biometric Consent Capture** (highest value)
   - Native LocalAuthentication framework
   - Hardware-backed credential storage
   - Superior security and audit trail

2. **Audio Recording** (quality improvement)
   - AVFoundation for better compression
   - Background recording support
   - Native waveform visualization

3. **Camera Integration** (UX improvement)
   - AVCapture for real-time preview
   - Dual camera modes
   - Photo quality optimization

4. **Offline Support** (resilience)
   - Native SQLite for offline queue
   - Background sync when connectivity returns

### Migration Strategy
```
┌─────────────────────────────────────┐
│   Capacitor Container (Shell)      │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ React WebView│  │React Native │ │
│  │   (Forms,    │←→│   Modules   │ │
│  │  Education)  │  │ (Biometrics,│ │
│  │              │  │   Camera)   │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
│          Express REST API           │
│         (No changes needed)         │
└─────────────────────────────────────┘
```

**React Navigation Bridge:** Use `react-native-webview` with message passing

---

## Current Architecture: iOS Readiness Assessment

### ✅ Already iOS-Compatible

1. **State Management** - React Context + sessionStorage (WebView-ready with abstraction)
2. **Routing** - Wouter works in WebView; defensive routing prevents broken states
3. **API Layer** - REST endpoints work identically on iOS
4. **UI Components** - shadcn/ui renders correctly in WebView
5. **Design System** - Apple HIG already followed; mobile-first design

### ⚠️ Requires Attention

1. **Storage Persistence**
   - **Issue:** sessionStorage may clear in iOS private browsing
   - **Fix:** Abstract behind storage service, use Capacitor Preferences/SecureStorage
   - **Timeline:** 1 week

2. **Media Capture**
   - **Issue:** Browser APIs have limitations (no background recording, lower quality)
   - **Fix:** Use Capacitor plugins with fallback to browser APIs
   - **Timeline:** 2 weeks

3. **Biometric Authentication**
   - **Issue:** WebAuthn support varies across iOS versions
   - **Fix:** Use `@capacitor-community/native-biometric` plugin
   - **Timeline:** 1 week

4. **Push Notifications** (Future)
   - **Issue:** Not currently implemented
   - **Fix:** Use `@capacitor/push-notifications`
   - **Timeline:** 2-3 weeks when needed

5. **Background Operations** (Future)
   - **Issue:** iOS suspends WebView apps aggressively
   - **Fix:** Native background task handlers for uploads
   - **Timeline:** 3-4 weeks when needed

---

## Recommended Implementation Roadmap

### Milestone 1: Storage Abstraction (Week 1-2)
- [ ] Create `StorageService` interface
- [ ] Implement web and iOS implementations
- [ ] Update `ConsentFlowContext` to use abstraction
- [ ] Add fallback for private browsing mode
- [ ] Test in iOS Safari/WebView

### Milestone 2: Capacitor Setup (Week 2-3)
- [ ] Install Capacitor (`npm install @capacitor/core @capacitor/ios`)
- [ ] Initialize iOS project (`npx cap init`)
- [ ] Configure Info.plist permissions
- [ ] Add app icons and splash screens
- [ ] Test WebView rendering

### Milestone 3: Native Bridges (Week 3-5)
- [ ] Install Capacitor plugins (camera, voice recorder, biometric)
- [ ] Create abstraction layer for media APIs
- [ ] Implement iOS-specific biometric flow
- [ ] Add error handling for permission denials
- [ ] Test on physical iOS devices

### Milestone 4: App Store Preparation (Week 5-6)
- [ ] Create privacy policy and terms of service pages
- [ ] Prepare App Store screenshots and metadata
- [ ] Complete Privacy Nutrition Label
- [ ] Beta test with TestFlight
- [ ] Submit for App Store review

### Milestone 5: Post-Launch Optimization (Week 7+)
- [ ] Monitor crash reports and user feedback
- [ ] Implement push notifications (if needed)
- [ ] Add offline support for poor connectivity
- [ ] Consider React Native modules for high-value features

---

## Technical Debt & Future Considerations

### Items to Address Pre-iOS Launch

1. **Accessibility Audit**
   - VoiceOver optimization for all interactive elements
   - Dynamic Type support for text scaling
   - High contrast mode testing

2. **Localization Preparation**
   - Extract hardcoded strings
   - Set up i18n infrastructure (react-i18next)
   - Support Spanish (common in Title IX contexts)

3. **Performance Optimization**
   - Lazy load university list (287 items)
   - Implement virtualized lists for files page
   - Optimize bundle size (current: check with `npm run build`)

4. **Security Hardening**
   - Certificate pinning for API calls
   - Implement request signing
   - Add rate limiting client-side
   - Obfuscate sensitive constants

5. **Error Handling & Logging**
   - Implement crash reporting (Sentry)
   - Add analytics (PostHog, privacy-focused)
   - Create incident response runbook
   - Document legal evidence retention policies

### Documentation Updates Needed

1. **API Documentation**
   - OpenAPI/Swagger spec for backend
   - Client SDK generation (if going React Native)

2. **Compliance Documentation**
   - Title IX evidence retention requirements
   - FERPA compliance (if university partnerships)
   - Data handling procedures

3. **Developer Onboarding**
   - iOS build setup guide
   - TestFlight deployment process
   - App Store submission checklist

4. **User Documentation**
   - In-app help content
   - FAQ about legal validity of digital consent
   - Tutorial videos (optional)

---

## Decision Matrix: Container Technology

| Criteria | Capacitor | Expo (React Native) | Native Swift |
|----------|-----------|---------------------|--------------|
| **Development Speed** | ⭐⭐⭐⭐⭐ Fastest | ⭐⭐⭐ Moderate | ⭐⭐ Slow |
| **Code Reuse** | ⭐⭐⭐⭐⭐ ~95% | ⭐⭐⭐⭐ ~80% | ⭐ ~0% |
| **Native Performance** | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Better | ⭐⭐⭐⭐⭐ Best |
| **Plugin Ecosystem** | ⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Native |
| **App Store Approval** | ⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐⭐ Easiest |
| **Maintenance Burden** | ⭐⭐⭐⭐ Low | ⭐⭐⭐ Medium | ⭐⭐ High |
| **Team Skill Match** | ⭐⭐⭐⭐⭐ Web devs | ⭐⭐⭐⭐ React devs | ⭐⭐ iOS devs |

**Recommendation:** Start with Capacitor, evaluate React Native for Phase 2 if native performance becomes critical.

---

## Cost & Resource Estimates

### Phase 1: Capacitor WebView (MVP)
- **Development Time:** 4-6 weeks (1 full-time developer)
- **Apple Developer Program:** $99/year
- **TestFlight Beta Testing:** Free
- **App Store Submission:** Free (included in developer program)
- **Estimated Launch Budget:** $5,000 - $8,000 (developer time + Apple fees)

### Phase 2: React Native Modules (Enhancement)
- **Development Time:** 8-12 weeks (per major module)
- **Native iOS Developer:** $10,000 - $15,000 (contractor for biometric module)
- **Ongoing Maintenance:** $2,000 - $3,000/month

### Ongoing Costs
- **Apple Developer Program:** $99/year
- **Backend Hosting:** (current Express.js setup)
- **Push Notifications:** Free (Apple Push Notification service)
- **Analytics/Monitoring:** $0 - $200/month (depending on service)
- **Legal Compliance Review:** $2,000 - $5,000 (one-time for privacy policy)

---

## Success Metrics

### Phase 1 Launch KPIs
- [ ] **App Store Approval:** First submission approval rate >80%
- [ ] **Crash-Free Sessions:** >99% (monitored via Sentry)
- [ ] **Core Flow Completion:** >90% of users complete consent flow
- [ ] **iOS Version Support:** iOS 14+ (covers 95% of devices)
- [ ] **Performance:** <3s app launch time, <1s page transitions

### Phase 2 Enhancement KPIs
- [ ] **Native Feature Adoption:** >60% use biometric authentication
- [ ] **Offline Resilience:** >95% successful background sync
- [ ] **User Satisfaction:** >4.5★ App Store rating

---

## Next Immediate Actions

1. **Storage Abstraction** (highest priority)
   - Create `services/storage.ts` interface
   - Update `ConsentFlowContext` to use abstraction
   - Test in iOS Safari private mode

2. **Capacitor Installation**
   - Run `npm install @capacitor/core @capacitor/cli`
   - Initialize with `npx cap init PMY com.pmy.titleix`
   - Configure iOS project

3. **Documentation Review**
   - Update `replit.md` with iOS deployment section
   - Create privacy policy draft
   - Document API endpoints (for future native SDK)

4. **Compliance Audit**
   - Review Title IX legal evidence requirements
   - Consult legal advisor on digital consent validity
   - Prepare App Store privacy disclosures
