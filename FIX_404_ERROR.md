# Fix: HTTP ERROR 404 on localhost

## The Problem

You see:
```
Cette page du site localhost est introuvable
HTTP ERROR 404
http://localhost:5174/
```

## Quick Fixes (Try in Order)

### Fix 1: Hard Refresh Browser (90% success rate)

**Windows/Linux:**
```
Ctrl + Shift + R
or
Ctrl + F5
```

**Mac:**
```
Cmd + Shift + R
```

### Fix 2: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Or:**

1. Go to browser settings
2. Clear browsing data
3. Check "Cached images and files"
4. Clear data

### Fix 3: Restart Dev Server

```bash
# Stop the server (Ctrl + C)
# Then restart:
npm run dev
```

### Fix 4: Delete .vite Cache

```bash
# Stop server first (Ctrl + C)
rm -rf node_modules/.vite
npm run dev
```

**Windows:**
```cmd
# Stop server (Ctrl + C)
rmdir /s node_modules\.vite
npm run dev
```

### Fix 5: Try Different Port

Edit `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,  // Change from 5174 to 3000
  },
  // ... rest of config
});
```

Then:
```bash
npm run dev
```

Access at: `http://localhost:3000`

### Fix 6: Try Incognito/Private Window

1. Open incognito window (Ctrl + Shift + N)
2. Go to `http://localhost:5174`

If it works in incognito = cache issue

### Fix 7: Check if Server is Actually Running

Look for this in terminal:
```
✓ VITE v5.4.8  ready in 305 ms
➜  Local:   http://localhost:5174/
```

If you see errors instead, server didn't start properly.

### Fix 8: Reinstall Dependencies

```bash
# Stop server
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

**Windows:**
```cmd
rmdir /s node_modules
del package-lock.json
npm install
npm run dev
```

## Most Common Causes

### 1. Browser Cache (80% of cases)
**Solution:** Hard refresh (Ctrl + Shift + R)

### 2. Old Service Worker
**Solution:** 
1. Open DevTools → Application tab
2. Click "Service Workers"
3. Click "Unregister" for localhost
4. Refresh

### 3. Port Already in Use
Check terminal - if you see:
```
Port 5173 is in use, trying another one...
Port 5174 is in use, trying another one...
```

**Solution:** Close other Vite instances or use different port

### 4. Wrong Directory
Make sure you're in the project folder:
```bash
pwd  # Linux/Mac
cd   # Windows

# Should show: /path/to/demenageur_app_WITH_CODE_VERIFICATION
```

### 5. Node Modules Issues
**Solution:** Delete and reinstall (Fix 8)

## Verify Server is Running Correctly

1. **Check Terminal** - Should show:
   ```
   VITE v5.4.8  ready in 305 ms
   ➜  Local:   http://localhost:5174/
   ```

2. **Check Network** - In DevTools Network tab:
   - Should see requests to `main.tsx`
   - Should see 200 status codes

3. **Check Console** - Should NOT see:
   - Failed to fetch
   - Module not found
   - Import errors

## Test if App Works

Try these URLs directly:

1. `http://localhost:5174/` → Should show landing page
2. `http://localhost:5174/mover/signup` → Should show signup form
3. `http://localhost:5174/about` → Should show about page

If ANY of these work, the app is fine - just cached home page issue.

## Nuclear Option: Fresh Start

If nothing works:

```bash
# 1. Stop server (Ctrl + C)

# 2. Delete everything
rm -rf node_modules
rm -rf .vite
rm -rf dist
rm package-lock.json

# 3. Reinstall
npm install

# 4. Clear browser completely
# - Close ALL browser tabs
# - Clear all browsing data
# - Restart browser

# 5. Start server
npm run dev

# 6. Open in INCOGNITO
# Ctrl + Shift + N (Chrome)
# Go to http://localhost:5174
```

## Still Not Working?

### Check for Errors in Terminal

Look for:
```
✗ [ERROR] ...
```

Common errors:
- **Module not found** → Missing dependency, run `npm install`
- **Parse error** → Syntax error in code
- **Port in use** → Change port in vite.config.ts

### Check Browser Console (F12)

Look for red errors:
- **Failed to fetch** → Server not running
- **404 on .js file** → Build issue, restart server
- **CORS error** → Check Supabase URL

## Prevention

To avoid this in future:

1. **Always use hard refresh** when making changes
2. **Disable cache in DevTools** (Network tab → Disable cache checkbox)
3. **Use incognito for testing**
4. **Restart server** after major changes

---

## Quick Checklist

- [ ] Hard refresh (Ctrl + Shift + R)
- [ ] Clear browser cache
- [ ] Restart dev server
- [ ] Try incognito window
- [ ] Check terminal for errors
- [ ] Verify correct directory
- [ ] Delete .vite folder
- [ ] Reinstall node_modules

**99% of the time: Ctrl + Shift + R fixes it!** 🎯
