# Navigation System Documentation

## Overview
The Travel Itinerary Management app features a sophisticated bottom navigation system with smooth transitions, haptic feedback, and full responsiveness.

## Architecture

### Components

1. **BottomNav** (`/components/BottomNav.tsx`)
   - Main navigation component with 5 tabs
   - Glassmorphism design with backdrop blur
   - Haptic feedback on navigation
   - Ripple effect animations
   - Badge notification support

2. **PageTransition** (`/components/PageTransition.tsx`)
   - Smooth fade and slide transitions between screens
   - Coordinated with BottomNav animations
   - 300ms transition duration

3. **App.tsx**
   - Central state management
   - Screen routing logic
   - Tab change handlers

## Navigation Flow

```
User taps nav button
    ↓
Haptic feedback (10ms vibration)
    ↓
Ripple animation starts
    ↓
onTabChange callback (100ms delay)
    ↓
activeTab state updates
    ↓
currentScreen changes
    ↓
PageTransition animation (300ms)
    ↓
New screen renders
```

## Features

### 1. Responsive Design
- Viewport support: 320px - 768px
- Constrained to max-w-md (448px) for tablet
- Touch targets: minimum 60px height
- Flexible layout with proper spacing

### 2. Glassmorphism Effects
- Backdrop blur: 24px with 180% saturation
- Semi-transparent backgrounds
- Border gradients
- Shadow layers

### 3. Haptic Feedback
- Native vibration API integration
- 10ms pulse on tap
- Graceful fallback if not supported

### 4. Animations
- **Ripple Effect**: Radial gradient expanding from tap point
- **Active Indicator**: Animated dots with pulse
- **Icon Glow**: Blur effect on active state
- **Scale Transitions**: Subtle zoom on interaction
- **Top Bar**: Sliding gradient indicator

### 5. Safe Area Support
- iOS notch compatibility
- Home indicator spacing
- `env(safe-area-inset-bottom)` implementation

### 6. Accessibility
- ARIA labels on all buttons
- `aria-current="page"` for active tab
- Keyboard navigation ready
- Disabled state for current tab (prevents redundant clicks)
- Proper semantic HTML

### 7. Badge Notifications
- Red badge with count (1-9+)
- Bounce animation
- Positioned at top-right of icon
- Ready for integration with notification system

## Tab Configuration

```typescript
const tabs = [
  { id: 'home', icon: Home, label: 'Home', badge: 0 },
  { id: 'itinerary', icon: Calendar, label: 'Trips', badge: 0 },
  { id: 'destinations', icon: MapPin, label: 'Places', badge: 0 },
  { id: 'gallery', icon: Image, label: 'Photos', badge: 0 },
  { id: 'profile', icon: User, label: 'Profile', badge: 0 },
];
```

## Customization

### Dark Mode
- Automatic theme switching
- Conditional styling throughout
- Proper contrast ratios

### Color Scheme
- Primary: Teal (400) to Cyan (500) gradient
- Active: White text on gradient background
- Inactive (Dark): Slate 300/400
- Inactive (Light): White with 70-80% opacity

### Spacing
- Vertical: 60px minimum touch target
- Horizontal: Dynamic flex layout
- Safe area: Automatic iOS support
- Container: 2px padding, max-w-md constraint

## Performance

- Uses `requestAnimationFrame` for smooth animations
- Debounced tab changes to prevent rapid switching
- CSS transforms for hardware acceleration
- Minimal re-renders with proper state management

## Integration Points

### Adding a New Tab
1. Add to `tabs` array in BottomNav
2. Add screen case in `renderScreen()` (App.tsx)
3. Update `tabScreenMap` in `handleTabChange()`
4. Create corresponding screen component

### Badge Updates
Update the `badge` property in the tabs array. Future enhancement: connect to notification context.

### Theme Changes
Pass `darkMode` prop from App state. Automatically applies throughout component.

## Browser Support

- Modern browsers (Chrome, Safari, Firefox, Edge)
- iOS Safari 12+
- Android Chrome 80+
- Vibration API: Progressive enhancement
- Backdrop filter: Fallback to solid background

## Mobile Optimizations

- Touch action: manipulation (prevents double-tap zoom)
- Tap highlight: transparent
- User select: none (prevents text selection)
- Safe area insets for modern iOS devices
- Optimized for thumb reach zones
