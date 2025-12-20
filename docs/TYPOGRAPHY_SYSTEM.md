# AFRIKONI TYPOGRAPHY SYSTEM

## Overview
Institutional, trust-driven, enterprise-grade typography system using Inter font family exclusively.

## Font Family
**Inter** (fallback: system-ui, sans-serif)
- No serif fonts
- No decorative fonts
- No editorial flourishes

## Typographic Roles

### H1 - Hero / Page Title
- **Desktop**: 60px
- **Mobile**: 40px
- **Font Weight**: 700
- **Line Height**: 1.1
- **Letter Spacing**: -0.02em

**Usage:**
```jsx
<h1 className="text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em]">
  Trade. Trust. Thrive.
</h1>
```

### H2 - Section Titles
- **Desktop**: 40px
- **Mobile**: 28px
- **Font Weight**: 600
- **Line Height**: 1.2

**Usage:**
```jsx
<h2 className="text-h2-mobile md:text-h2 font-semibold leading-[1.2]">
  Section Title
</h2>
```

### H3 - Subsections / Card Titles
- **Size**: 22px
- **Font Weight**: 600
- **Line Height**: 1.3

**Usage:**
```jsx
<h3 className="text-h3 font-semibold leading-[1.3]">
  Card Title
</h3>
```

### Body - Primary Text
- **Size**: 18px
- **Font Weight**: 400
- **Line Height**: 1.6

**Usage:**
```jsx
<p className="text-body font-normal leading-[1.6]">
  Primary text content
</p>
```

### Meta / Labels / Badges
- **Size**: 14px
- **Font Weight**: 500
- **Letter Spacing**: 0.02em

**Usage:**
```jsx
<span className="text-meta font-medium tracking-[0.02em]">
  Label text
</span>
```

## Design System Constants

Use the constants from `src/design-system/afrikoni-design.js`:

```javascript
import { TYPOGRAPHY } from '@/design-system/afrikoni-design';

// H1
<h1 className={TYPOGRAPHY.h1}>Title</h1>

// H2
<h2 className={TYPOGRAPHY.h2}>Section</h2>

// H3
<h3 className={TYPOGRAPHY.h3}>Card Title</h3>

// Body
<p className={TYPOGRAPHY.body}>Content</p>

// Meta
<span className={TYPOGRAPHY.meta}>Label</span>
```

## Typography Component

Use the Typography component for semantic HTML:

```jsx
import { H1, H2, H3, Body, Meta } from '@/components/ui/Typography';

<H1>Trade. Trust. Thrive.</H1>
<H2>Section Title</H2>
<H3>Card Title</H3>
<Body>Primary text content</Body>
<Meta>Label text</Meta>
```

## Rules

1. **NO inline font sizing** - Use typography classes only
2. **NO ad-hoc classes** - Stick to the defined roles
3. **NO decorative fonts** - Inter only
4. **NO serif styles** - Institutional design only
5. **Clear hierarchy** - Headings always heavier than body
6. **Consistent spacing** - Use defined line-heights

## Homepage Hero Structure

1. **H1**: "Trade. Trust. Thrive." - Single dominant heading
2. **Body**: Subheading paragraph - Lower contrast
3. **Search Bar**: Primary action - More vertical spacing
4. **Meta**: "Active across 54 African countries" - Tertiary

## Card Components

All cards follow the same structure:
- **Title**: H3 (22px, 600 weight)
- **Description**: Body (18px, 400 weight)
- **Icons**: Same size and color
- **Equal padding and spacing**
- **Reduced contrast** - Cards support, not dominate

## Dashboard Pages

Apply the same typography system to:
- Page titles: H1
- Section titles: H2
- Card titles: H3
- Table headers: H3
- Form labels: Meta
- Body text: Body
- Badges/Labels: Meta

## Migration Checklist

- [x] Global typography system in Tailwind config
- [x] Base typography styles in index.css
- [x] Design system constants updated
- [x] Typography component created
- [x] Homepage hero refactored
- [x] Why Afrikoni cards normalized
- [x] Explore African Supply section fixed
- [x] Dashboard pages updated (examples)
- [ ] All remaining pages updated
- [ ] Forms and modals updated
- [ ] Tables updated
- [ ] Notifications updated
- [ ] Tooltips updated

