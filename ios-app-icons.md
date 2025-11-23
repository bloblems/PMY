# iOS App Icons & Splash Screens for PMY

## ⚠️ CRITICAL: Required for App Store Submission

**App icons and splash screens are mandatory for Apple App Store submission.**

Without these assets:
- ❌ App Store Connect will reject your upload
- ❌ App cannot pass asset validation
- ❌ TestFlight builds will fail

**Status:** Assets not yet created. Follow instructions below to generate and configure.

---

## App Icon Requirements

### Primary App Icon
- **Size:** 1024×1024 pixels
- **Format:** PNG (no transparency)
- **Color Space:** sRGB or Display P3
- **Purpose:** App Store listing and iOS generates all other sizes from this

### iOS Icon Sizes (Auto-generated from 1024×1024)
iOS automatically generates these sizes from your 1024×1024 icon:
- iPhone: 180×180, 120×120, 87×87, 80×80, 60×60, 58×58, 40×40, 29×29
- iPad: 167×167, 152×152, 76×76
- Settings: 58×58, 29×29
- Notifications: 40×40, 20×20

### Design Guidelines
1. **Keep it simple**: Icons should be recognizable at all sizes
2. **No text**: Avoid small text that becomes illegible
3. **Centered design**: Icon should work in a square format
4. **No transparency**: Use solid background color
5. **Consistent branding**: Match your app's visual identity

### Recommended Icon Design for PMY
**Concept Options:**
1. **Shield Icon**: Represents protection and consent
2. **Handshake Icon**: Represents mutual agreement
3. **Check/Verified Icon**: Represents documentation and verification
4. **Abstract "P" Lettermark**: Simple, recognizable brand mark

**Color Palette Suggestions:**
- Primary: Deep blue (#1e3a8a) - trust and security
- Accent: Teal/cyan (#06b6d4) - modern and clean
- Alternative: Purple (#7c3aed) - sophisticated and unique

---

## Splash Screen Requirements

### Launch Screen
- **Purpose:** Shown briefly while app loads
- **Recommendation:** Simple, minimal design
- **Best Practice:** Use app icon or logo on solid background
- **No text:** Launch screens should not include text (Apple guideline)

### Capacitor Splash Configuration
Capacitor handles splash screens automatically. Add configuration to `capacitor.config.ts`:

```typescript
{
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e3a8a", // Match primary color
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff"
    }
  }
}
```

---

## How to Generate Icons

### Option 1: Use a Design Tool (Recommended)
1. **Figma** (free): Design 1024×1024 icon, export as PNG
2. **Canva** (free): Use "App Icon" template
3. **Adobe Illustrator**: Professional vector design
4. **Sketch**: macOS-native design tool

### Option 2: Use Icon Generator Services
1. **AppIcon.co** (https://appicon.co/)
   - Upload 1024×1024 PNG
   - Generates all iOS sizes automatically
   - Download asset catalog

2. **IconKitchen** (https://icon.kitchen/)
   - Free icon generator
   - Supports iOS and Android
   - Exports ready-to-use asset catalog

3. **Capacitor Assets** (CLI tool)
   ```bash
   npm install -g @capacitor/assets
   # Place your 1024×1024 icon as resources/icon.png
   # Place your splash screen as resources/splash.png
   npx capacitor-assets generate
   ```

### Option 3: AI Image Generation (Quick Prototype)
For rapid prototyping, generate an icon concept:
1. Use AI image generation (DALL-E, Midjourney, Stable Diffusion)
2. Prompt example: "App icon for consent documentation app, shield symbol, blue gradient, modern minimalist, 1024x1024, no text"
3. Export as 1024×1024 PNG
4. Use icon generator service to create all sizes

---

## How to Add Icons to iOS Project

### Step 1: Generate iOS Project
```bash
npx cap add ios
```

### Step 2: Add Icons to Asset Catalog
1. **Using Xcode** (Recommended):
   ```bash
   npx cap open ios
   ```
   - Navigate to `App/App/Assets.xcassets/AppIcon.appiconset`
   - Drag and drop your 1024×1024 icon
   - Xcode generates all other sizes automatically

2. **Manual Method**:
   - Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Update `Contents.json` with correct file references

### Step 3: Sync Capacitor
```bash
npx cap sync ios
```

### Step 4: Verify Icons
1. Build app in Xcode
2. Check Home Screen icon appears correctly
3. Verify icon in Settings app
4. Test on both iPhone and iPad simulators

---

## Splash Screen Setup

### Step 1: Create Splash Assets
**Simple Approach:**
- Solid color background (match primary brand color)
- Centered app icon or logo
- Size: 2732×2732 pixels (largest iOS size)

**Design Specs:**
- Keep important content within "safe area" (center 1170×2532)
- Avoid edges (notch/home indicator areas)
- Test on different device sizes

### Step 2: Add to iOS Project
1. Place splash image in `ios/App/App/Assets.xcassets/Splash.imageset/`
2. Or use Capacitor's automated splash generation:
   ```bash
   # Place splash image as resources/splash.png
   npx capacitor-assets generate --splash
   ```

### Step 3: Configure in Xcode
1. Open project: `npx cap open ios`
2. Navigate to Launch Screen storyboard
3. Configure splash screen settings
4. Test on simulators and devices

---

## Testing Icons & Splash

### Test Checklist
- [ ] Icon appears on iPhone Home Screen (all sizes)
- [ ] Icon appears on iPad Home Screen
- [ ] Icon visible in Settings app
- [ ] Icon displays in App Switcher
- [ ] Splash screen shows during launch
- [ ] Splash screen matches brand colors
- [ ] No pixelation or distortion on any device

### Test on Real Devices
```bash
# Build for device
npx cap copy ios
npx cap open ios
# In Xcode: Select device > Build & Run
```

---

## App Store Connect Requirements

### Icon Validation
Before uploading to App Store Connect:
1. **1024×1024 icon required** - Without this, upload fails
2. **No alpha channel** - Must be fully opaque
3. **sRGB color space** - Ensure correct color profile
4. **File size < 1MB** - Optimize if needed

### Submission Checklist
- [ ] 1024×1024 PNG icon (no transparency)
- [ ] All iOS icon sizes generated
- [ ] Splash screen configured
- [ ] Icons tested on real devices
- [ ] Screenshot on multiple device sizes
- [ ] App Store listing includes icon

---

## Design Resources

### Icon Design Inspiration
- **Dribbble**: https://dribbble.com/tags/app-icon
- **Behance**: Search "iOS app icons"
- **Apple Design Resources**: https://developer.apple.com/design/resources/

### Design Guidelines
- **Apple Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/app-icons
- **iOS Icon Template**: Download from Apple

### Tools
- **Figma Templates**: Search "iOS app icon template"
- **SF Symbols**: Apple's icon library for consistent design
- **Color Palette Generators**: coolors.co, adobe.com/colors

---

## PMY-Specific Recommendations

### Brand Identity
Given PMY's focus on consent documentation and Title IX compliance:
- **Professional aesthetic**: Clean, trustworthy design
- **Security visual**: Shield, lock, or check mark
- **Educational feel**: Book, document, or diploma elements
- **Accessible colors**: High contrast, colorblind-friendly

### Suggested Icon Concepts
1. **Shield with Check**: Blue shield with white checkmark
2. **Mutual Handshake**: Stylized handshake in circular frame
3. **Document Badge**: Document/contract with verification badge
4. **Abstract "PMY"**: Modern lettermark with gradient

### Color Scheme
```css
Primary: #1e3a8a (Deep Blue) - Trust & Authority
Accent: #06b6d4 (Cyan) - Modern & Clean
Success: #10b981 (Green) - Verified/Confirmed
Background: #ffffff (White) - Clean & Clear
```

---

## Quick Start Guide

### Fastest Path to App Store Ready Icons

1. **Design Phase** (30 minutes):
   - Use Canva or Figma
   - Create 1024×1024 icon with shield + check concept
   - Use PMY blue (#1e3a8a) background
   - Export PNG (no transparency)

2. **Generate Assets** (5 minutes):
   - Upload to appicon.co
   - Download asset catalog
   - Download splash images

3. **Add to Project** (10 minutes):
   ```bash
   npx cap add ios
   npx cap open ios
   # Drag icon into AppIcon.appiconset
   # Add splash to Splash.imageset
   npx cap sync ios
   ```

4. **Test** (15 minutes):
   - Build in Xcode
   - Run on iPhone simulator
   - Run on iPad simulator
   - Verify icons and splash

**Total Time: ~1 hour from start to App Store ready**

---

## Common Issues & Solutions

### Issue: "Missing App Icon"
**Solution:** Ensure 1024×1024 icon is in AppIcon.appiconset and named correctly

### Issue: "Icon has alpha channel"
**Solution:** Re-export PNG without transparency in your design tool

### Issue: "Wrong color space"
**Solution:** Convert to sRGB in Photoshop/Preview/ImageMagick

### Issue: "Splash not showing"
**Solution:** Check SplashScreen plugin configuration in capacitor.config.ts

### Issue: "Icons blurry on device"
**Solution:** Ensure source is 1024×1024, not upscaled from smaller size

---

## Next Steps

1. **Create icon design** (or use icon generator with concept)
2. **Generate all iOS sizes** (using automated tool)
3. **Run `npx cap add ios`** (if not done already)
4. **Add icons to Xcode project**
5. **Test on real iOS device**
6. **Prepare for App Store submission**

For questions about icon design or implementation, refer to Apple's Human Interface Guidelines or iOS developer documentation.
