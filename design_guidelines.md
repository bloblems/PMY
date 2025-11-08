# Design Guidelines: Title IX Consent Documentation App

## Design Approach

**Selected Approach**: Apple Human Interface Guidelines (HIG) with influences from professional legal-tech applications (DocuSign, Adobe Sign)

**Rationale**: This application handles sensitive legal documentation requiring maximum trust, clarity, and professionalism. The clean, minimal iOS aesthetic combined with legal-tech precision creates the "modern and classy" experience for the target demographic while ensuring usability in potentially stressful situations.

**Core Principles**:
- Trustworthy & Professional: Every interaction reinforces legal validity and security
- Clarity Over Decoration: Information hierarchy guides users through critical legal processes
- Mobile-First Precision: Optimized for single-hand iPhone usage
- Respectful Restraint: Minimal animations, serious tone throughout

---

## Typography

**Font System**: System fonts (San Francisco for iOS, -apple-system fallback)

**Hierarchy**:
- **Headlines (H1)**: text-3xl (30px), font-bold, tracking-tight
- **Section Headers (H2)**: text-2xl (24px), font-semibold
- **Subsections (H3)**: text-xl (20px), font-semibold
- **Body Text**: text-base (16px), font-normal, leading-relaxed
- **Legal/Fine Print**: text-sm (14px), font-normal, leading-relaxed
- **Labels**: text-sm (14px), font-medium, uppercase tracking-wide for input labels
- **Button Text**: text-base (16px), font-semibold

**Key Principle**: Legibility is paramount for legal content. Never sacrifice readability for style.

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Micro spacing (icons, tight elements): 2
- Standard gaps (form fields, cards): 4, 6
- Section padding: 8, 12
- Major sections: 16

**Container Structure**:
- Primary container: `max-w-md mx-auto` (448px max-width, mobile-optimized)
- Full-bleed sections: `w-full` with inner padding px-6
- Content padding: px-6 (mobile), maintains comfortable reading margins

**Vertical Rhythm**:
- Screen sections: py-8 to py-12
- Component spacing: space-y-6 for related elements
- Form groups: space-y-4
- List items: space-y-3

---

## Core Components

### Navigation
**Bottom Tab Bar** (iOS style):
- Fixed bottom navigation with 3-4 primary sections
- Icons + labels centered in each tab
- Active state indicated by bold text weight, not color
- Sections: "Info", "Record", "Contract", "Files"

### University Selection
- Search/dropdown combo interface
- Large touch targets (min h-12)
- Clear visual feedback on selection
- Current selection displayed prominently in header

### Title IX Information Display
- Card-based layout with clear section headers
- Collapsible accordions for detailed requirements
- Critical information highlighted with subtle border treatment
- "Last Updated" timestamp for credibility

### Audio Recording Interface
**Recording Screen**:
- Large, centered record button (min 80px diameter)
- Waveform visualization during recording
- Timer display (text-2xl, tabular-nums)
- Clear pause/stop controls with distinct shapes
- Playback controls: standard media player pattern
- Save button: prominent, full-width at bottom

**File Management**:
- List view with filename, date, duration
- Swipe actions for delete (iOS pattern)
- Download/share icons clearly visible

### Digital Contract
**Contract Display**:
- Full-screen scrollable contract text
- Fixed header with contract title
- Sticky "Proceed to Sign" button at bottom
- Serif font for contract body (Georgia) for legal gravitas

**Signature Capture**:
- Two signature areas stacked vertically
- Clear labels: "Your Signature" and "Partner's Signature"
- Canvas with light border, placeholder text "Sign here"
- Thin signature line beneath each area
- Clear/reset button per signature field
- Date/timestamp automatically added
- "Complete & Save" button only enabled when both signed

### Forms & Inputs
- Floating labels pattern (label moves up when focused)
- Clear input borders (border-2 for visibility)
- Minimum touch target: h-12
- Validation messages below inputs
- Required field indicators (asterisk)

### Buttons
**Primary Actions**:
- Full-width (w-full) for major actions
- Rounded corners (rounded-lg)
- Substantial height (h-12 to h-14)
- Font-semibold text

**Secondary Actions**:
- Outlined style with border-2
- Same sizing as primary for consistency

**Destructive Actions**:
- Text-only style, no background
- Clearly separated from primary actions

### Cards & Containers
- Subtle borders (border-2) rather than shadows
- Rounded corners: rounded-xl for major cards, rounded-lg for minor
- Consistent padding: p-6 for content areas
- Clear separation between cards: space-y-6

---

## Screens & Flows

### Home/Dashboard
- Quick access cards to primary functions
- Current university displayed prominently
- Recent activity/saved files preview
- Educational content cards about consent

### Information Screen
- University selector at top
- Tabbed or accordion sections for different Title IX aspects
- "Understanding Consent" educational content
- "Legal Resources" section

### Recording Flow
1. Pre-recording screen: explanation, best practices
2. Recording interface: prominent controls, live feedback
3. Review/playback: edit filename, preview, save
4. Confirmation: saved location, next steps

### Contract Flow
1. Contract selection/customization
2. Full contract review (scrollable)
3. Dual signature capture
4. Review signed document
5. Save confirmation

### File Management
- List/grid toggle
- Filter by type (audio/contract)
- Sort options (date, name)
- Individual file detail view
- Share/export options

---

## Images

**Hero Image**: None - this is a utility app, not marketing
**Supporting Images**: 
- Educational illustrations for consent scenarios (simple, respectful line drawings)
- University logos (if displaying institution info)
- Icon-based imagery only, no decorative photography

---

## Interaction Patterns

**Animations**: Minimal, functional only
- Screen transitions: subtle slide/fade (150ms)
- Button press: slight scale feedback
- Loading states: simple spinner, no elaborate animations
- Recording pulse: subtle glow on record button

**Touch Interactions**:
- All interactive elements minimum 44x44pt (iOS standard)
- Clear pressed states (slight opacity change)
- No hover states (mobile-only)
- Haptic feedback for critical actions (recording start/stop)

**Accessibility**:
- High contrast text throughout
- Form labels always visible
- Clear focus indicators
- Logical tab order
- Alternative text for all icons
- VoiceOver optimized labels

---

## Content Strategy

**Tone**: Professional, educational, respectful
**Language**: Clear, direct, legally precise but approachable
**Educational Priority**: Emphasize understanding consent over just documenting it
**Transparency**: Clear about what's recorded, stored, how long