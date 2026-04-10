# 🔧 Troubleshooting Guide

## ✅ Issue Fixed: Import Path Error

**Error**: `Failed to resolve import "../contexts/AuthContext"`

**Solution**: ✅ Fixed! Updated import paths in `ProtectedRoute.jsx` to use `../../` instead of `../`

---

## 🚀 Ready to Run

The app should now start successfully! Run:

```bash
npm run dev
```

---

## 🐛 Common Issues & Solutions

### 1. **Module Not Found Errors**

**Error**: `Cannot find module 'firebase/auth'`

**Solution**: 
```bash
npm install
```

---

### 2. **Environment Variables Not Loading**

**Error**: Firebase config shows `undefined`

**Solution**: 
1. Verify `.env` file exists in project root
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Check `.env` variables start with `VITE_`

---

### 3. **Firebase Auth Not Enabled**

**Error**: `auth/operation-not-allowed`

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select: `prooflayer-3cc7b`
3. Authentication → Sign-in method
4. Enable: Email/Password
5. Save

---

### 4. **Firestore Permission Denied**

**Error**: `Missing or insufficient permissions`

**Solution**:
1. Go to Firestore Database → Rules
2. Copy rules from `AUTH_SETUP.md` (lines 76-106)
3. Click Publish

---

### 5. **Redirect Loop on Login**

**Error**: Page keeps redirecting

**Solution**:
```javascript
// Clear browser storage
localStorage.clear();
sessionStorage.clear();
// Refresh page
```

---

### 6. **Can't Access Import Features**

**Error**: Redirected to /unauthorized

**Solution**:
- Verify your account has "Privileged User" or "Admin" role
- Check role in Firestore: `users/{uid}` → `role` field
- Re-signup with correct role if needed

---

### 7. **Sidebar Not Showing User Info**

**Error**: Sidebar shows "User" instead of name

**Solution**:
- Check Firestore `users/{uid}` document exists
- Verify `displayName` field is set
- Logout and login again

---

### 8. **Build Errors**

**Error**: Various TypeScript/ESLint errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or on Windows:
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

### 9. **Port Already in Use**

**Error**: `Port 5173 is already in use`

**Solution**:
```bash
# Kill the process on port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port:
npm run dev -- --port 3000
```

---

### 10. **Email Verification Not Sending**

**Error**: No verification email received

**Solution**:
1. Check spam folder
2. Verify email in Firebase Console → Authentication
3. Check Firebase email templates are configured
4. Ensure sender email is verified in Firebase

---

## 🔍 Debugging Tips

### Check Firebase Connection
```javascript
// Add to src/firebase/firebase.js temporarily
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
});
```

### Check Auth State
```javascript
// Add to any component
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { currentUser, userRole, userProfile } = useAuth();
  console.log('Auth State:', { currentUser, userRole, userProfile });
  // ...
}
```

### Check Route Protection
```javascript
// In browser console
console.log('Current Path:', window.location.pathname);
console.log('User Logged In:', !!localStorage.getItem('firebase:authUser'));
```

---

## 📋 Verification Checklist

Before reporting an issue, verify:

- [ ] `.env` file exists in project root
- [ ] `.env` has all 6 Firebase variables
- [ ] `npm install` completed successfully
- [ ] Dev server restarted after creating `.env`
- [ ] Firebase Email/Password auth is enabled
- [ ] Firestore security rules are published
- [ ] Browser cache cleared
- [ ] No console errors in browser DevTools
- [ ] Firebase project is active (not deleted)

---

## 🆘 Still Having Issues?

### Check These Files

1. **`.env`** - Should have 6 variables starting with `VITE_`
2. **`src/firebase/firebase.js`** - Should import `getAuth`
3. **`src/contexts/AuthContext.jsx`** - Should exist
4. **`src/constants/roles.js`** - Should exist
5. **`src/components/ProtectedRoute/ProtectedRoute.jsx`** - Import paths fixed ✅

### Verify File Structure

```
src/
├── constants/
│   └── roles.js ✅
├── contexts/
│   └── AuthContext.jsx ✅
├── components/
│   └── ProtectedRoute/
│       └── ProtectedRoute.jsx ✅
├── pages/
│   ├── Login/ ✅
│   ├── Signup/ ✅
│   └── Unauthorized/ ✅
└── firebase/
    └── firebase.js ✅
```

---

## 🔄 Fresh Start (Nuclear Option)

If nothing works, try a complete reset:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Remove node_modules
rm -rf node_modules package-lock.json

# 3. Clear npm cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. Verify .env exists
cat .env  # or type .env on Windows

# 6. Restart dev server
npm run dev
```

---

## 📞 Getting Help

If you're still stuck:

1. **Check Browser Console** - Press F12 → Console tab
2. **Check Terminal Output** - Look for error messages
3. **Check Firebase Console** - Verify project settings
4. **Review Documentation** - Check `AUTH_SETUP.md`

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Dev server starts without errors
2. ✅ App loads at `http://localhost:5173`
3. ✅ Redirects to `/login` page
4. ✅ Can create account at `/signup`
5. ✅ Can login with credentials
6. ✅ Redirects to `/dashboard` after login
7. ✅ Sidebar shows your name and role
8. ✅ Logout button works
9. ✅ Role-based access works correctly

---

**Last Updated**: January 24, 2026  
**Status**: Import path issue FIXED ✅
