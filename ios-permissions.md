# iOS Permissions Configuration for PMY

## ⚠️ CRITICAL: Must Complete Before App Store Submission

**The iOS project must be generated and Info.plist permissions must be added before submitting to Apple App Store.**

Without these permissions in `ios/App/App/Info.plist`, the app will:
- ❌ Crash when accessing camera, microphone, or Face ID
- ❌ Be rejected during App Store review
- ❌ Fail privacy compliance requirements

**Status:** iOS project not yet generated. Run `npx cap add ios` and add permissions below.

---

## Required Info.plist Permissions

When building the iOS app using Capacitor, add these entries to `ios/App/App/Info.plist`:

### Camera Permission
**Key:** NSCameraUsageDescription  
**Description:** "PMY needs camera access to capture photo consent documentation"

```xml
<key>NSCameraUsageDescription</key>
<string>PMY needs camera access to capture photo consent documentation</string>
```

### Microphone Permission
**Key:** NSMicrophoneUsageDescription  
**Description:** "PMY needs microphone access to record audio consent documentation"

```xml
<key>NSMicrophoneUsageDescription</key>
<string>PMY needs microphone access to record audio consent documentation</string>
```

### Face ID / Touch ID Permission
**Key:** NSFaceIDUsageDescription  
**Description:** "PMY uses biometric authentication to securely verify consent and protect your documentation"

```xml
<key>NSFaceIDUsageDescription</key>
<string>PMY uses biometric authentication to securely verify consent and protect your documentation</string>
```

### Photo Library (Read) Permission
**Key:** NSPhotoLibraryUsageDescription  
**Description:** "PMY needs access to select photos from your library for consent documentation"

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>PMY needs access to select photos from your library for consent documentation</string>
```

### Photo Library (Add/Write) Permission
**Key:** NSPhotoLibraryAddUsageDescription  
**Description:** "PMY needs access to save consent photos to your photo library"

```xml
<key>NSPhotoLibraryAddUsageDescription</key>
<string>PMY needs access to save consent photos to your photo library</string>
```

## Complete Info.plist Configuration

Add all permissions to your `ios/App/App/Info.plist` file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Existing configuration keys... -->
    
    <!-- PMY Required Permissions -->
    <key>NSCameraUsageDescription</key>
    <string>PMY needs camera access to capture photo consent documentation</string>
    
    <key>NSMicrophoneUsageDescription</key>
    <string>PMY needs microphone access to record audio consent documentation</string>
    
    <key>NSFaceIDUsageDescription</key>
    <string>PMY uses biometric authentication to securely verify consent and protect your documentation</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>PMY needs access to select photos from your library for consent documentation</string>
    
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>PMY needs access to save consent photos to your photo library</string>
</dict>
</plist>
```

## How to Apply

1. **Generate iOS project** (if not already done):
   ```bash
   npx cap add ios
   ```

2. **Open in Xcode**:
   ```bash
   npx cap open ios
   ```

3. **Edit Info.plist**:
   - Navigate to `ios/App/App/Info.plist` in Xcode
   - Add all the keys above with their descriptions
   - Or edit the file directly in a text editor

4. **Sync Capacitor**:
   ```bash
   npx cap sync ios
   ```

## Important Notes

- **All descriptions must be specific** - Apple reviews these carefully during App Store submission
- **Do not include permissions you don't use** - Only add what PMY actually needs
- **Empty strings will cause crashes** - Always provide meaningful descriptions
- **Test on real devices** - Simulator behavior differs for permissions like Face ID

## Testing Permissions

To test permissions are working:
1. Build and run on a physical iOS device
2. Navigate to each feature requiring permissions:
   - Photo capture (Camera + Photo Library)
   - Audio recording (Microphone)
   - Biometric authentication (Face ID)
3. Verify permission prompts appear with correct descriptions
4. Check iOS Settings > Privacy to see permissions granted

## App Store Submission Notes

Apple requires:
- Clear, specific permission descriptions
- Only request permissions when needed (just-in-time)
- Explain why each permission is necessary
- Provide alternative flows if permission is denied

These permission descriptions are compliant with Apple's App Store Review Guidelines and explain the legitimate need for each permission in the context of consent documentation.
