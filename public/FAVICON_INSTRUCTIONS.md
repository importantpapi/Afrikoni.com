# Favicon Generation Instructions

## Current Setup
- ✅ `favicon.svg` - Created (SVG format, works in modern browsers)
- ✅ `index.html` - Updated to reference `/favicon.png`
- ⚠️ `favicon.png` - **NEEDS TO BE CREATED**

## To Create favicon.png

### Option 1: Convert SVG to PNG (Recommended)
1. Open `public/favicon.svg` in a design tool (Figma, Illustrator, Inkscape)
2. Export as PNG at 32x32 pixels
3. Save as `public/favicon.png`
4. Also create 180x180 version for `apple-touch-icon.png`

### Option 2: Use Online Converter
1. Go to https://realfavicongenerator.net/ or https://favicon.io/
2. Upload the `favicon.svg` file
3. Generate all sizes:
   - 32x32 PNG (for favicon.png)
   - 180x180 PNG (for apple-touch-icon.png)
   - 16x16, 32x32, 48x48 ICO (for favicon.ico - optional)
4. Download and place in `/public` folder

### Option 3: Use ImageMagick (Command Line)
```bash
# Convert SVG to 32x32 PNG
convert -background none -resize 32x32 public/favicon.svg public/favicon.png

# Convert SVG to 180x180 PNG for Apple
convert -background none -resize 180x180 public/favicon.svg public/apple-touch-icon.png

# Convert SVG to ICO (multi-size)
convert -background none -resize 16x16 public/favicon.svg favicon-16.ico
convert -background none -resize 32x32 public/favicon.svg favicon-32.ico
convert -background none -resize 48x48 public/favicon.svg favicon-48.ico
convert favicon-16.ico favicon-32.ico favicon-48.ico public/favicon.ico
```

## Files Needed
- `favicon.png` (32x32) - **REQUIRED**
- `apple-touch-icon.png` (180x180) - **REQUIRED for iOS**
- `favicon.ico` (multi-size) - **OPTIONAL** (modern browsers use PNG/SVG)

## Testing
After adding files:
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache if needed
3. Check browser tab shows Afrikoni logo
4. Test on mobile devices

## Current Status
- ✅ SVG favicon created and working
- ⚠️ PNG favicon needs to be generated from SVG
- ✅ HTML references updated
- ✅ Theme color set to #3F2B1A
