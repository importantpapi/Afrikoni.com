# Generate Favicon Files from SVG

## Required Files (Generate from `favicon.svg`)

The following favicon files need to be generated from `public/favicon.svg` and placed in the `public/` directory:

1. **favicon.ico** - Multi-size ICO file (16x16, 32x32, 48x48)
2. **favicon-16x16.png** - 16x16 PNG
3. **favicon-32x32.png** - 32x32 PNG
4. **apple-touch-icon.png** - 180x180 PNG (iOS home screen)
5. **android-chrome-512x512.png** - 512x512 PNG (Android)

## Quick Generation Method (Recommended)

### Option 1: Use RealFaviconGenerator (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `public/favicon.svg`
3. Configure:
   - **iOS**: Use "none" for padding (180x180)
   - **Android**: 512x512
   - **Favicon for desktop browsers**: Generate 16x16, 32x32, and multi-size ICO
4. Download the generated package
5. Extract all files to `public/` directory
6. Replace any existing files

### Option 2: Use favicon.io
1. Go to https://favicon.io/favicon-converter/
2. Upload `public/favicon.svg`
3. Download the generated package
4. Extract to `public/` directory

### Option 3: Manual Conversion (Using ImageMagick)
```bash
# Install ImageMagick if needed: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)

# Convert to PNG files
convert -background none -resize 16x16 public/favicon.svg public/favicon-16x16.png
convert -background none -resize 32x32 public/favicon.svg public/favicon-32x32.png
convert -background none -resize 180x180 public/favicon.svg public/apple-touch-icon.png
convert -background none -resize 512x512 public/favicon.svg public/android-chrome-512x512.png

# Generate multi-size ICO file
convert -background none public/favicon-16x16.png public/favicon-32x32.png public/favicon.ico
```

## Design Requirements

✅ **Square format** - All favicons must be square (same width and height)
✅ **High contrast** - Logo must be clearly visible on browser tab backgrounds
✅ **Readable at small sizes** - 16x16 should still show recognizable logo elements
✅ **Official Afrikoni logo** - Use the logo symbol only (roof + circular pattern), not text

## Verification Checklist

After generating files, verify:
- [ ] All files exist in `public/` directory
- [ ] Browser tab shows Afrikoni logo (hard refresh: Cmd+Shift+R)
- [ ] No fallback/default icons appear
- [ ] iOS home screen icon works (test on iPhone/iPad)
- [ ] Android icon works (test on Android device)
- [ ] Google search results show correct icon (after indexing)

## File Checklist

- [ ] `favicon.ico` (multi-size: 16x16, 32x32, 48x48)
- [ ] `favicon-16x16.png` (16x16)
- [ ] `favicon-32x32.png` (32x32)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `android-chrome-512x512.png` (512x512)
- [ ] `favicon.svg` (already exists ✅)

## Current Status

- ✅ `favicon.svg` - Created and ready
- ✅ `index.html` - Updated with correct favicon links
- ✅ `site.webmanifest` - Updated with all icon sizes
- ⚠️ PNG/ICO files - **Need to be generated** (see methods above)

## Notes

- The SVG file (`favicon.svg`) is the source of truth
- All PNG/ICO files should match the SVG design
- Use transparent backgrounds where appropriate
- Ensure logo is centered in all sizes
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)

