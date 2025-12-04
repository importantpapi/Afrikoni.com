# Afrikoni Image Assets

This directory contains all image assets for the Afrikoni.com marketplace.

## Directory Structure

```
assets/images/
├── koniai/          # KoniAI-specific images and illustrations
├── marketing/       # Marketing and promotional images
└── branding/        # Brand assets, logos, and identity images
```

## Image Usage Guide

### KoniAI Images (`koniai/`)
These images should be used for:
- KoniAI Hub page hero section
- AI feature illustrations
- Product pages showcasing AI capabilities
- Marketing materials for KoniAI features

**Recommended images:**
- `koniai-hero.jpg` - Woman working with holographic Africa display (perfect for KoniAI Hub)
- `koniai-savanna-tech.jpg` - African savanna with digital overlays (background/hero)
- `koniai-products-data.jpg` - Products with data visualizations (marketplace theme)

### Marketing Images (`marketing/`)
These images should be used for:
- Homepage hero sections
- Landing pages
- Email campaigns
- Social media assets

**Recommended images:**
- `marketplace-digital.jpg` - Traditional market with digital overlays
- `trade-connections.jpg` - African trade connections map
- `africa-network.jpg` - Glowing African continent with network lines

### Branding Images (`branding/`)
These images should be used for:
- About pages
- Trust and verification sections
- Supplier showcase pages

**Recommended images:**
- `verified-suppliers.jpg` - People with certification badges
- `collaborative-workspace.jpg` - Team working with AI displays

## Image Optimization

All images should be:
- **Format**: WebP (with JPG fallback)
- **Max width**: 1920px for hero images
- **Compressed**: Use tools like TinyPNG or ImageOptim
- **Lazy loaded**: Use the `OptimizedImage` component

## Usage in Components

```jsx
import OptimizedImage from '@/components/OptimizedImage';

// Example usage
<OptimizedImage
  src="/assets/images/koniai/koniai-hero.jpg"
  alt="KoniAI - The Intelligence Behind African Trade"
  className="w-full h-64 object-cover rounded-lg"
/>
```

## Adding New Images

1. Place the image in the appropriate subdirectory
2. Optimize the image (compress, resize if needed)
3. Update this README if adding a new category
4. Reference the image path in your component

