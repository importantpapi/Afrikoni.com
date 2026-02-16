# 🧪 MOBILE UX TESTING CHECKLIST
**Date:** February 16, 2026  
**Platform:** Mobile Only (iOS/Android)  
**Tester:** _______________

---

## 🎯 PRIMARY BUG FIX: Navbar/Search Overlap

### **Test 1: Scroll Behavior**
**Device:** iPhone / Android  
**Steps:**
1. Open Afrikoni homepage on mobile
2. Verify brown navbar is visible at top (80px height)
3. Scroll down slowly (100px+)
4. Observe search bar behavior

**Expected Result:**
- ✅ Search bar becomes "sticky" BUT sits **below** the navbar
- ✅ No visual overlap between brown navbar and white search bar
- ✅ Search bar fixed at `top-[80px]` position
- ✅ Smooth transition (no jank)

**Actual Result:** _______________

**Status:** ⬜ Pass / ⬜ Fail  
**Screenshot:** (attach if fail)

---

### **Test 2: Z-Index Stacking**
**Device:** iPhone / Android  
**Steps:**
1. Open homepage
2. Scroll to sticky search position
3. Tap search bar
4. Type query
5. Observe layer stacking

**Expected Result:**
- ✅ Navbar (brown) always on top layer (z-10000)
- ✅ Search bar sits below navbar (z-40)
- ✅ No visual collision when typing
- ✅ Suggestions dropdown appears below search

**Actual Result:** _______________

**Status:** ⬜ Pass / ⬜ Fail

---

## 🎨 PREMIUM MICRO-INTERACTIONS

### **Test 3: Search Bar Focus**
**Device:** iPhone / Android  
**Steps:**
1. Tap search bar
2. Observe focus animation

**Expected Result:**
- ✅ Gold glow appears around search (not blue)
- ✅ Search bar scales up slightly (1.01x)
- ✅ Transition smooth (160ms)
- ✅ Keyboard opens, no page zoom

**Actual Result:** _______________

**Status:** ⬜ Pass / ⬜ Fail  
**Notes:** If page zooms on iOS, font-size may not be 16px

---

### **Test 4: Button Press Feedback**
**Device:** iPhone / Android  
**Steps:**
1. Find any button (e.g., "Request Quote")
2. Tap and hold
3. Observe press animation

**Expected Result:**
- ✅ Button scales down to 97% (subtle)
- ✅ Animation duration: 140ms (feels calm)
- ✅ No jarring motion
- ✅ Returns to normal on release

**Actual Result:** _______________

**Status:** ⬜ Pass / ⬜ Fail  
**Feel:** ⬜ Too slow / ⬜ Too fast / ⬜ Perfect

---

### **Test 5: Bottom Navigation**
**Device:** iPhone / Android (especially with notch)  
**Steps:**
1. Scroll to bottom of page
2. Observe bottom nav
3. Tap each nav icon
4. Check for content clipping

**Expected Result:**
- ✅ Bottom nav has glass blur effect (semi-transparent)
- ✅ Active icon is elevated + gold
- ✅ Tap feels soft (scale 0.92)
- ✅ No content hidden behind nav (proper padding)
- ✅ Safe area respected on notched devices

**Actual Result:** _______________

**Status:** ⬜ Pass / ⬜ Fail  
**iPhone Notch Test:** ⬜ Pass / ⬜ Fail / ⬜ N/A

---

## 📐 LAYOUT PRECISION

### **Test 6: Content Clearance**
**Device:** iPhone / Android  
**Steps:**
1. Open homepage
2. Measure top spacing (use browser DevTools)
3. Measure bottom spacing
4. Verify no content is hidden

**Expected Measurements:**
- ✅ Top padding: 80px (navbar clearance)
- ✅ Bottom padding: 88px (nav + safe area)
- ✅ No content behind navbar
- ✅ No content behind bottom nav

**Actual Measurements:**
- Top: _______
- Bottom: _______

**Status:** ⬜ Pass / ⬜ Fail

---

### **Test 7: Sticky Search Position**
**Device:** iPhone / Android  
**Steps:**
1. Open homepage
2. Use DevTools "Inspect Element"
3. Scroll to trigger sticky search
4. Check computed CSS

**Expected CSS (when sticky):**
```css
position: fixed;
top: 80px; /* NOT top: 0 */
z-index: 40; /* NOT z-index: 50 */
```

**Actual CSS:** _______________

**Status:** ⬜ Pass / ⬜ Fail

---

## 🌊 SCROLL PERFORMANCE

### **Test 8: Rapid Scroll**
**Device:** iPhone / Android  
**Steps:**
1. Rapidly flick scroll up and down
2. Repeat 5 times
3. Observe smoothness

**Expected Result:**
- ✅ 60fps maintained (no stutter)
- ✅ Search bar sticks/unsticks smoothly
- ✅ No layout shift
- ✅ No white flashes

**Actual Result:** _______________

**Status:** ⬜ Pass / ⬜ Fail  
**FPS (Chrome DevTools):** _______

---

### **Test 9: Long Page Scroll**
**Device:** iPhone / Android  
**Steps:**
1. Scroll from top to bottom of homepage
2. Observe all elements

**Expected Result:**
- ✅ No elements "jump" or shift
- ✅ Images load progressively (lazy load)
- ✅ No overlap bugs anywhere
- ✅ Bottom nav always visible

**Actual Result:** _______________

**Status:** ⬜ Pass / ⬜ Fail

---

## 🎭 PREMIUM FEEL (SUBJECTIVE)

### **Test 10: Overall Polish**
**Device:** iPhone / Android  
**Instructions:**
Rate each aspect from 1-10 (10 = Hermès x Apple quality)

**Navbar feel:** _____ / 10  
**Search interaction:** _____ / 10  
**Button presses:** _____ / 10  
**Bottom nav:** _____ / 10  
**Overall smoothness:** _____ / 10  

**Does it feel "premium"?** ⬜ Yes / ⬜ No / ⬜ Almost  
**Would you use this daily?** ⬜ Yes / ⬜ No / ⬜ Maybe

**Comments:** _______________________________________________

---

## 🐛 BUG DISCOVERY

### **Test 11: Edge Cases**
**Device:** iPhone / Android  
**Test scenarios:**

#### A) Landscape Orientation
1. Rotate device to landscape
2. Check navbar/search behavior

**Status:** ⬜ Pass / ⬜ Fail  
**Issue:** _______________

#### B) Slow Network (3G)
1. Enable Chrome DevTools Network Throttling (Slow 3G)
2. Reload page
3. Test interactions

**Status:** ⬜ Pass / ⬜ Fail  
**Issue:** _______________

#### C) Zoom In/Out
1. Pinch to zoom in
2. Pinch to zoom out
3. Check layout stability

**Status:** ⬜ Pass / ⬜ Fail  
**Issue:** _______________

#### D) Keyboard Open
1. Tap search bar
2. Keyboard opens
3. Check if content adjusts properly

**Status:** ⬜ Pass / ⬜ Fail  
**Issue:** _______________

---

## 📱 DEVICE-SPECIFIC TESTS

### **iPhone 14/15 Pro (Notch)**
- [ ] Top safe area respected
- [ ] Bottom safe area respected
- [ ] No content behind notch
- [ ] No content behind home indicator

**Status:** ⬜ Pass / ⬜ Fail

---

### **Android (Samsung/Pixel)**
- [ ] Navbar glass effect works
- [ ] Bottom nav blur works
- [ ] Touch targets ≥48px
- [ ] No system UI overlap

**Status:** ⬜ Pass / ⬜ Fail

---

### **Tablet (768px-1024px)**
- [ ] Layout adapts properly
- [ ] Search bar behavior correct
- [ ] No mobile nav on tablet

**Status:** ⬜ Pass / ⬜ Fail / ⬜ N/A

---

## ✅ REGRESSION TESTS

### **Test 12: Existing Features Still Work**
**Device:** iPhone / Android  

Verify these still function after changes:
- [ ] Homepage loads completely
- [ ] Search functionality works
- [ ] Navigation links work
- [ ] Product cards clickable
- [ ] Category filters work
- [ ] Login/Signup accessible
- [ ] Footer visible and functional

**Status:** ⬜ All Pass / ⬜ Some Fail (list below)

**Failures:** _______________

---

## 📊 PERFORMANCE METRICS

### **Test 13: Chrome DevTools Analysis**
**Device:** Chrome on Android / iOS Safari  

**Metrics to capture:**
1. **Lighthouse Score (Mobile)**
   - Performance: _____ / 100
   - Accessibility: _____ / 100
   - Best Practices: _____ / 100

2. **Core Web Vitals**
   - LCP (Largest Contentful Paint): _____ ms (target: <2500ms)
   - FID (First Input Delay): _____ ms (target: <100ms)
   - CLS (Cumulative Layout Shift): _____ (target: <0.1)

3. **Page Load Time**
   - On 4G: _____ seconds
   - On 3G: _____ seconds

**Status:** ⬜ Pass / ⬜ Needs Optimization

---

## 🎯 ACCEPTANCE CRITERIA

**Minimum Requirements (Must Pass All):**
- [ ] No navbar/search overlap (Test 1)
- [ ] Search bar positioned at top-[80px] (Test 7)
- [ ] Content clearance correct (Test 6)
- [ ] 60fps scroll performance (Test 8)
- [ ] Button press feels smooth (Test 4)
- [ ] Bottom nav doesn't clip content (Test 5)
- [ ] No regressions in existing features (Test 12)

**Overall Status:** ⬜ READY FOR PRODUCTION / ⬜ NEEDS FIXES

---

## 🚨 CRITICAL ISSUES FOUND

**List any blocking issues:**

1. _________________________________________________________
   - Severity: ⬜ Critical / ⬜ High / ⬜ Medium / ⬜ Low
   - Steps to reproduce: ___________________________________
   - Expected: ___________________________________________
   - Actual: _____________________________________________

2. _________________________________________________________
   - Severity: ⬜ Critical / ⬜ High / ⬜ Medium / ⬜ Low
   - Steps to reproduce: ___________________________________

3. _________________________________________________________
   - Severity: ⬜ Critical / ⬜ High / ⬜ Medium / ⬜ Low

---

## 📸 SCREENSHOTS

**Attach screenshots for:**
- [ ] Navbar/search overlap (before/after)
- [ ] Search bar focus state
- [ ] Bottom nav active state
- [ ] Any bugs found

---

## ✍️ TESTER NOTES

**Device tested:** _______________  
**OS version:** _______________  
**Browser:** _______________  
**Screen size:** _______________  

**General feedback:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Recommendation:** ⬜ Ship It / ⬜ Fix Bugs First

---

**Tester Signature:** _______________  
**Date:** _______________  
**Time spent:** _____ minutes
