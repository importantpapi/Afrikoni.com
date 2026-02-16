# 🎨 Afrikoni Mobile Design System
## Apple iOS + Hermès Luxury Standard

**Quick Reference Card**

---

## 🎯 Core Principles

### 1. **Calm, Not Loud**
- Luxury through restraint (less UI, not more)
- Soft colors, no harsh contrasts
- Warm ivory (#F8F4ED), not stark white
- Muted gold (#D99C55), not bright yellow

### 2. **Soft, Not Clicky**
- Every tap: 0.97 scale, 140ms duration
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Apple standard)
- Shadows: 2-8px blur, 6-8% opacity (never harsh)
- Rounded corners: 16px (comfortable), 24px (generous)

### 3. **Intentional, Not Accidental**
- Touch targets: Minimum 48px (Apple HIG)
- Nav items: 64px × 56px (thumb-friendly)
- Form inputs: 44px min-height (iOS standard)
- Font size: 16px on inputs (prevents iOS zoom)

---

## 📐 Spacing Scale

```
4px  - Tight (icon padding)
8px  - Compact (between related items)
16px - Comfortable (default spacing)
24px - Generous (between sections)
32px - Spacious (major sections)
48px - Airy (hero sections)
```

**Usage:**
```jsx
<div className="space-y-6"> {/* 24px between items */}
<div className="p-4"> {/* 16px padding */}
<div className="gap-4"> {/* 16px gap in grid */}
```

---

## 🎨 Color Palette

### **Primary**
```css
--os-accent: #D99C55 /* Muted gold (Hermès) */
--afrikoni-ivory: #F8F4ED /* Warm ivory background */
--afrikoni-deep: #1A1A1A /* Near black (not pure) */
```

### **Semantic**
```css
--success: #10B981 /* Soft green (not bright) */
--error: #EF4444 /* Soft red (not alarming) */
--warning: #F59E0B /* Amber (not orange) */
--info: #3B82F6 /* Soft blue */
```

### **Neutrals**
```css
--gray-50: #FAFAFA
--gray-100: #F5F5F5
--gray-200: #E5E5E5
--gray-300: #D4D4D4
--gray-600: #525252
--gray-900: #1A1A1A
```

### **Opacity Layers (Glass Morphism)**
```css
bg-white/95 backdrop-blur-xl /* Nav, modals */
bg-white/90 backdrop-blur-lg /* Cards */
bg-black/60 backdrop-blur-md /* Overlays */
```

---

## 🔤 Typography

### **Font Stack**
```css
font-family: -apple-system, BlinkMacSystemFont, 
             'SF Pro Display', 'SF Pro Text', 
             system-ui, sans-serif;
```

### **Type Scale**
```css
/* Headings */
h1: 2rem / 1.2, -0.02em tracking, font-bold
h2: 1.5rem / 1.3, -0.01em tracking, font-semibold
h3: 1.125rem / 1.4, font-semibold

/* Body */
p: 1rem / 1.6, font-normal
small: 0.875rem / 1.5, font-normal

/* Fine print */
caption: 0.75rem / 1.4, text-gray-600
```

### **Font Weights**
```css
font-normal: 400 /* Body text */
font-medium: 500 /* Subtle emphasis */
font-semibold: 600 /* Buttons, headings */
font-bold: 700 /* Hero headlines only */
```

---

## 🎭 Shadows & Depth

### **Card Shadows**
```css
/* Default (subtle) */
shadow-[0_2px_12px_rgba(0,0,0,0.06)]

/* Hover (lifted) */
shadow-[0_8px_32px_rgba(0,0,0,0.08)]

/* Elevated (modal, bottom nav) */
shadow-[0_-4px_24px_rgba(0,0,0,0.08)]
```

### **Focus Glow (Gold)**
```css
/* Input focus */
shadow-[0_0_0_4px_rgba(217,156,85,0.12)]
border-os-accent/40

/* Never use blue browser default */
```

---

## 🎬 Micro-Interactions

### **Button Press**
```jsx
<button className="active:scale-95 transition-transform duration-[140ms]">
  Tap me
</button>
```

### **Card Press**
```jsx
<motion.div
  whileHover={{ y: -2 }} // Lift 2px on hover
  whileTap={{ scale: 0.98 }} // Shrink to 98% on tap
>
  Card content
</motion.div>
```

### **Navigation Active State**
```jsx
{active && (
  <motion.div
    layoutId="navHighlight" // Smooth transition between items
    className="absolute inset-0 bg-os-accent/12 rounded-2xl"
  />
)}
```

### **Loading Spinner**
```jsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
>
  <Loader2 className="w-5 h-5" />
</motion.div>
```

---

## 📱 Touch Targets

### **Minimum Sizes (Apple HIG)**
```css
/* Buttons */
.btn { min-width: 48px; min-height: 48px; }

/* Nav icons */
.nav-item { min-width: 64px; min-height: 56px; }

/* Form inputs */
.input { min-height: 44px; font-size: 16px; }
```

### **Why 16px font on inputs?**
iOS Safari zooms page if input font < 16px. Bad UX.

---

## 🧱 Layout Patterns

### **Safe Areas (iPhone Notch)**
```jsx
<header className="pt-safe"> {/* Top notch */}
<nav className="pb-safe"> {/* Bottom home indicator */}
```

### **Scroll Behavior**
```css
/* Smooth momentum scrolling */
.scroll-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Hide scrollbar (but keep function) */
.scroll-container::-webkit-scrollbar {
  display: none;
}
```

### **Z-Index Hierarchy**
```css
/* Fixed elements */
.mobile-header { z-index: 100; } /* UnifiedMobileHeader */
.search-suggestions { z-index: 50; } /* Below header */
.bottom-nav { z-index: 40; } /* PremiumBottomNav */
.modal-overlay { z-index: 1000; } /* Modals */
.toast { z-index: 9999; } /* Notifications */
```

---

## 🎨 Component Variants

### **Buttons**

#### **Primary** (Call to action)
```jsx
<button className="
  bg-os-accent text-white
  px-6 py-3 rounded-2xl
  font-semibold
  active:scale-95
  transition-all duration-[140ms]
  shadow-[0_2px_12px_rgba(217,156,85,0.24)]
">
  Request Quote
</button>
```

#### **Secondary** (Less emphasis)
```jsx
<button className="
  bg-white text-afrikoni-deep
  border-2 border-afrikoni-deep/10
  px-6 py-3 rounded-2xl
  font-semibold
  active:scale-95
  transition-all duration-[140ms]
">
  Learn More
</button>
```

#### **Ghost** (Minimal)
```jsx
<button className="
  text-os-accent
  px-4 py-2 rounded-xl
  font-medium
  active:scale-95
  hover:bg-os-accent/8
">
  View Details
</button>
```

---

### **Cards**

#### **Product Card** (Hermès catalog)
```jsx
<div className="
  bg-white rounded-3xl
  overflow-hidden
  shadow-[0_2px_12px_rgba(0,0,0,0.06)]
  hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]
  transition-all duration-[140ms]
">
  <img className="aspect-[4/3] object-cover" />
  <div className="p-4">
    <h3 className="font-semibold">Product Name</h3>
    <p className="text-sm text-gray-600">Country</p>
  </div>
</div>
```

#### **Info Card** (Soft background)
```jsx
<div className="
  bg-afrikoni-ivory/50
  rounded-2xl p-6
  border-2 border-afrikoni-ivory
">
  Content
</div>
```

---

### **Inputs**

#### **Text Input** (Soft focus)
```jsx
<input
  type="text"
  className="
    w-full px-4 py-3
    bg-white
    border-2 border-gray-200
    rounded-2xl
    font-medium
    focus:border-os-accent/40
    focus:shadow-[0_0_0_4px_rgba(217,156,85,0.12)]
    transition-all duration-[140ms]
  "
  style={{ fontSize: '16px' }} // Prevents iOS zoom
/>
```

---

### **Navigation**

#### **Bottom Nav Item**
```jsx
<Link className="
  relative flex flex-col items-center justify-center
  min-w-[64px] min-h-[56px]
  rounded-2xl
  active:scale-95
  transition-transform duration-[140ms]
">
  {active && (
    <motion.div
      layoutId="navHighlight"
      className="absolute inset-0 bg-os-accent/12 rounded-2xl"
    />
  )}
  <Icon className={active ? "text-os-accent" : "text-gray-600"} />
  <span className="text-xs mt-1">Label</span>
</Link>
```

---

## 🎯 Mobile-First Breakpoints

```css
/* Mobile (default) */
@media (min-width: 0px) { /* 320px - 767px */ }

/* Tablet */
@media (min-width: 768px) { /* 768px - 1023px */ }

/* Desktop */
@media (min-width: 1024px) { /* 1024px+ */ }
```

**Usage in Tailwind:**
```jsx
<div className="
  w-full          /* Mobile: 100% width */
  md:w-1/2        /* Tablet: 50% width */
  lg:w-1/3        /* Desktop: 33% width */
">
```

---

## 🚨 Don'ts (Anti-Patterns)

### ❌ **Don't Use:**
- Pure white backgrounds (`#FFFFFF`) → Use warm ivory (`#F8F4ED`)
- Pure black text (`#000000`) → Use near black (`#1A1A1A`)
- Harsh shadows (50%+ opacity) → Max 8% opacity
- Blue browser focus rings → Use gold glow
- Font size < 16px on inputs → Causes iOS zoom
- `scale: 0.9` on tap → Too dramatic, use 0.95-0.98
- Bright yellow (`#FFFF00`) → Use muted gold (`#D99C55`)
- Dark gradients on auth → Use calm ivory gradients

### ✅ **Always Use:**
- Soft, warm colors
- 140ms transitions (Apple standard)
- Gold accents (`#D99C55`)
- 48px+ touch targets
- Safe area padding on iPhone
- Glass morphism (backdrop-blur)
- Rounded corners (16px-24px)

---

## 📏 Component Checklist

**Before shipping any mobile component, verify:**

- [ ] Touch target ≥ 48px (Apple HIG)
- [ ] Font size ≥ 16px on inputs (prevents zoom)
- [ ] Active state: `scale-95` or `scale-97`
- [ ] Transition: `140ms` duration
- [ ] Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- [ ] Shadow: `0_2px_12px_rgba(0,0,0,0.06)` (max 8%)
- [ ] Focus: Gold glow, not blue ring
- [ ] Rounded: `rounded-2xl` (16px) or `rounded-3xl` (24px)
- [ ] Safe areas: `pt-safe` / `pb-safe` on iPhone
- [ ] Glass blur: `backdrop-blur-xl` on nav/modals

---

## 🎨 Example: Premium Button

**Full implementation:**

```jsx
<motion.button
  whileTap={{ scale: 0.97 }}
  className="
    /* Layout */
    min-w-[48px] min-h-[48px]
    px-6 py-3
    
    /* Appearance */
    bg-os-accent
    text-white
    rounded-2xl
    
    /* Typography */
    font-semibold text-base
    
    /* Shadow */
    shadow-[0_2px_12px_rgba(217,156,85,0.24)]
    
    /* Hover/Focus */
    hover:shadow-[0_4px_20px_rgba(217,156,85,0.32)]
    focus:outline-none
    focus:ring-4
    focus:ring-os-accent/12
    
    /* Transition */
    transition-all
    duration-[140ms]
    ease-[cubic-bezier(0.4,0,0.2,1)]
    
    /* Disabled */
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
>
  Request Quote
</motion.button>
```

---

## 🔗 Quick Links

- [Full Implementation Guide](./MOBILE_INTEGRATION_GUIDE.md)
- [Component API Reference](./MOBILE_INTEGRATION_GUIDE.md#-component-api-reference)
- [Testing Protocol](./MOBILE_UX_TEST_CHECKLIST.md)
- [Before/After Comparison](./PREMIUM_MOBILE_UX_IMPLEMENTATION.md)

---

## 💎 Remember

**"Luxury is restraint, not excess."**

Every tap should feel soft, warm, and intentional—like using a $2000 device, not a generic website.

**The goal:** "The Apple iOS of African Trade" 🌍✨

---

**Print this page and keep it at your desk while building.** ✅
