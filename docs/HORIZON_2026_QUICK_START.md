# Horizon 2026 Quick Start Guide

## 🚀 Using the New Design System

### Glassmorphic Cards

```tsx
import { Surface } from '@/components/system/Surface';

// Basic glass panel
<Surface variant="glass">
  <h3>Premium Card</h3>
  <p>Content with auto blur</p>
</Surface>

// With glow effect
<Surface variant="glass" glow>
  <div className="p-6">
    High-impact content
  </div>
</Surface>

// With hover animation
<Surface variant="glass" glow hover>
  Interactive card that lifts on hover
</Surface>

// Custom glow intensity
<Surface variant="glass" glow="strong">
  Hero section or critical alert
</Surface>

// Themed glow
<Surface variant="glass" glow="sapphire">
  Info or verification content
</Surface>
```

### Ambient Orbs (Background Decoration)

```tsx
// Basic golden orb
<div className="relative">
  <div className="os-ambient-orb" style={{ top: '10%', right: '20%', opacity: 0.4 }} />
  <Surface variant="glass">
    Content appears above orb
  </Surface>
</div>

// Sapphire theme orb
<div className="relative">
  <div className="os-ambient-orb os-ambient-orb-sapphire" 
       style={{ top: '-30%', left: '70%' }} />
  <Surface variant="glass" glow="sapphire">
    Info card with matching glow
  </Surface>
</div>

// Custom color orb
<div className="os-ambient-orb" style={{ 
  top: '-20%', 
  right: '-10%',
  background: 'radial-gradient(circle, hsl(var(--success) / 0.3), transparent 70%)'
}} />
```

### Bento Grid Layouts

```tsx
// Auto-responsive grid
<div className="grid-bento">
  <Surface variant="glass" glow>Card 1</Surface>
  <Surface variant="glass" glow>Card 2</Surface>
  <Surface variant="glass" glow>Card 3</Surface>
</div>

// With size modifiers
<div className="grid-bento">
  {/* Hero card - 2×2 */}
  <div className="grid-bento-hero">
    <Surface variant="glass" glow="strong">
      Featured Metric
    </Surface>
  </div>
  
  {/* Wide chart - 2×1 */}
  <div className="grid-bento-wide">
    <Surface variant="glass">
      Analytics Chart
    </Surface>
  </div>
  
  {/* Tall sidebar - 1×2 */}
  <div className="grid-bento-tall">
    <Surface variant="glass">
      Activity Feed
    </Surface>
  </div>
  
  {/* Regular cards */}
  <Surface variant="glass">Metric</Surface>
  <Surface variant="glass">Metric</Surface>
</div>
```

### Glow Utilities (Direct CSS)

```tsx
// Manual glow application
<div className="os-panel-glass os-glow">
  Glass panel with normal glow
</div>

<div className="os-panel-glass os-glow-strong">
  Glass panel with strong glow (60px blur)
</div>

<div className="os-panel-glass os-glow-subtle">
  Glass panel with subtle glow (24px blur)
</div>

// Hover-activated glow
<div className="os-panel-glass os-glow-hover">
  Glow appears on hover
</div>
```

### Surface Variants

```tsx
// Panel - Solid card with shadow
<Surface variant="panel">
  Standard card
</Surface>

// Soft - Lighter card, softer shadow
<Surface variant="soft">
  Secondary content
</Surface>

// Glass - Glassmorphic with heavy blur
<Surface variant="glass">
  Premium surface
</Surface>

// Flat - Minimal styling
<Surface variant="flat">
  Simple container
</Surface>
```

### Page Layout Pattern

```tsx
function MyPage() {
  return (
    <div className="os-page p-6">
      {/* Background ambient orb */}
      <div className="os-ambient-orb" style={{ top: '5%', right: '15%', opacity: 0.3 }} />
      
      {/* Page header */}
      <div className="mb-8">
        <h1 className="os-title">Page Title</h1>
        <p className="os-label mt-2">Metadata or subtitle</p>
      </div>
      
      {/* Content grid */}
      <div className="grid-bento">
        <div className="grid-bento-hero">
          <Surface variant="glass" glow="strong" hover>
            <div className="p-8">
              <div className="metric-value">$2.4M</div>
              <div className="metric-label">Total Volume</div>
            </div>
          </Surface>
        </div>
        
        <Surface variant="glass" glow hover>
          <div className="p-6">
            Standard metric card
          </div>
        </Surface>
        
        {/* More cards... */}
      </div>
    </div>
  );
}
```

### Metric Cards (Bloomberg Style)

```tsx
// Basic metric
<div className="metric-card">
  <div className="metric-value">$1.2M</div>
  <div className="metric-label">Revenue</div>
</div>

// Gold theme
<div className="metric-card metric-card-gold">
  <div className="metric-value">342</div>
  <div className="metric-label">Active Trades</div>
</div>

// Success theme
<div className="metric-card metric-card-success">
  <div className="metric-value">98.5%</div>
  <div className="metric-label">Success Rate</div>
</div>
```

### Status Badges

```tsx
<span className="status-badge status-verified">Verified</span>
<span className="status-badge status-pending">Pending</span>
<span className="status-badge status-in-progress">In Progress</span>
<span className="status-badge status-inactive">Inactive</span>
<span className="status-badge status-rejected">Rejected</span>
```

### Premium Buttons

```tsx
// Gold gradient button
<button className="btn-gold px-6 py-3 rounded-xl">
  Take Action
</button>

// Glass button
<button className="btn-glass px-6 py-3 rounded-xl">
  Secondary Action
</button>
```

### Command Palette Style Inputs

```tsx
<input 
  type="text" 
  className="os-input w-full px-4 py-3"
  placeholder="Search trades..."
/>

<textarea 
  className="os-input w-full px-4 py-3"
  placeholder="Enter description..."
/>
```

### Zone Layout (Grouped Content)

```tsx
<div className="os-zone">
  <div className="os-zone-header">
    <h3 className="os-zone-title">Section Title</h3>
    <button>Action</button>
  </div>
  
  <div className="space-y-3">
    {/* Zone content */}
  </div>
</div>
```

### Timeline (Trade Pipeline)

```tsx
<div className="os-timeline">
  <div className="os-timeline-node is-complete">
    <div className="os-timeline-step is-complete">✓</div>
    <div>
      <h4>Step Complete</h4>
      <p className="text-xs text-muted-foreground">2 hours ago</p>
    </div>
  </div>
  
  <div className="os-timeline-node is-active">
    <div className="os-timeline-step is-active">2</div>
    <div>
      <h4>Current Step</h4>
      <p className="text-xs text-muted-foreground">In progress</p>
    </div>
  </div>
  
  <div className="os-timeline-node is-next">
    <div className="os-timeline-step">3</div>
    <div>
      <h4>Next Step</h4>
      <p className="text-xs text-muted-foreground">Upcoming</p>
    </div>
  </div>
  
  <div className="os-timeline-node is-locked">
    <div className="os-timeline-step">4</div>
    <div>
      <h4>Locked Step</h4>
      <p className="text-xs text-muted-foreground">Complete step 3 first</p>
    </div>
  </div>
</div>
```

---

## 🎨 Color Semantic Tokens

Always use semantic tokens instead of hardcoded values:

```tsx
// ❌ Don't do this
<div className="bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white">

// ✅ Do this
<div className="bg-card text-foreground">

// ❌ Don't
<div className="bg-blue-500 text-white">

// ✅ Do
<div className="bg-info text-info-foreground">

// ❌ Don't
<div className="border-gray-200 dark:border-gray-800">

// ✅ Do
<div className="border-border">
```

### Available Semantic Colors

```tsx
// Surfaces
bg-background      // Page background
bg-card           // Card background
bg-popover        // Popover background

// Text
text-foreground         // Primary text
text-muted-foreground  // Secondary text
text-card-foreground   // Text on card

// Interactive
bg-primary              // Main brand color
bg-secondary            // Secondary actions
bg-accent              // Highlights

// Status
bg-success / text-success
bg-warning / text-warning
bg-destructive / text-destructive
bg-info / text-info

// Borders
border-border          // Standard border
border-input          // Input borders
ring-ring             // Focus rings
```

---

## 📱 Responsive Behavior

The design system is mobile-first:

```tsx
// Bento grid automatically adapts
<div className="grid-bento">
  {/* Mobile: 1 column */}
  {/* Tablet: 3 columns */}
  {/* Desktop: 4 columns */}
</div>

// Manual responsive
<div className="p-4 md:p-6 lg:p-8">
  <Surface variant="glass" className="h-full">
    Content
  </Surface>
</div>
```

---

## ⚡ Performance

### OS Lite Mode
For devices with limited GPU:
```tsx
<div className="os-lite-mode">
  {/* All blur effects disabled */}
</div>
```

### Reduced Motion
Automatically respects user preferences:
```tsx
<div className="os-reduced-motion">
  {/* All animations instant */}
</div>
```

---

## 🔍 Examples in Codebase

Check these files for real-world usage:
- `OSShell.jsx` - PWA/Push prompts with glass + orbs
- `WorkspaceDashboard.jsx` - Ambient orb placement
- `Surface.tsx` - Component implementation
- `afrikoni-os.css` - All utility definitions
