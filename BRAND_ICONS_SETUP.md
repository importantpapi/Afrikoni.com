# 🎨 Brand Icons Setup Guide

## Required Icon Files

Place the following files in the `/public` folder:

### Required Files:
- ✅ `favicon.ico` (16x16, 32x32, 48x48 multi-size ICO file)
- ✅ `favicon-32x32.png` (32x32 PNG)
- ✅ `favicon-16x16.png` (16x16 PNG)
- ✅ `apple-touch-icon.png` (180x180 PNG for iOS)
- ✅ `android-chrome-192x192.png` (192x192 PNG)
- ✅ `android-chrome-512x512.png` (512x512 PNG)
- ✅ `site.webmanifest` (✅ Already created)

## Icon Specifications

### favicon.ico
- **Size**: Multi-size ICO (16x16, 32x32, 48x48)
- **Format**: ICO
- **Usage**: Browser tabs, bookmarks

### favicon-32x32.png
- **Size**: 32x32 pixels
- **Format**: PNG
- **Usage**: Desktop browsers

### favicon-16x16.png
- **Size**: 16x16 pixels
- **Format**: PNG
- **Usage**: Browser tabs (small)

### apple-touch-icon.png
- **Size**: 180x180 pixels
- **Format**: PNG
- **Usage**: iOS home screen, Safari

### android-chrome-192x192.png
- **Size**: 192x192 pixels
- **Format**: PNG
- **Usage**: Android home screen, Chrome

### android-chrome-512x512.png
- **Size**: 512x512 pixels
- **Format**: PNG
- **Usage**: Android splash screen, high-res displays

## Design Guidelines

All icons should:
- Use the Afrikoni logo (stylized hut/emblem)
- Maintain brand colors: Gold (#D4A937) on Brown (#603813)
- Be clear and recognizable at small sizes
- Have transparent backgrounds (except favicon.ico)
- Match the brand identity shown in the logo

## Current Status

✅ `index.html` - Updated with proper favicon links
✅ `site.webmanifest` - Created with correct paths
✅ Old `favicon.svg` - Removed
✅ Theme color set to `#603813` (Afrikoni chestnut brown)

## Next Steps

1. Generate/obtain the icon files listed above
2. Place them in the `/public` folder
3. Run `npm run build` to verify
4. Test in browsers (Chrome, Safari, Firefox)
5. Test on mobile devices (iOS, Android)

## Testing Checklist

- [ ] Favicon appears in browser tab
- [ ] Favicon appears in bookmarks
- [ ] iOS home screen icon works
- [ ] Android home screen icon works
- [ ] No fallback icons (heart, etc.) appear
- [ ] Manifest loads correctly
- [ ] Theme color applies correctly

