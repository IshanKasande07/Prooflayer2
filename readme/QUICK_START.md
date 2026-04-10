# 🚀 ProofLayer Auth - Quick Start Guide

## ⚡ 3-Step Setup

### 1️⃣ Enable Firebase Authentication (2 minutes)
```
1. Open: https://console.firebase.google.com/
2. Select: prooflayer-3cc7b
3. Go to: Authentication → Sign-in method
4. Enable: Email/Password
5. Click: Save
```

### 2️⃣ Add Firestore Security Rules (1 minute)
```
1. Go to: Firestore Database → Rules
2. Copy rules from: AUTH_SETUP.md (line 76-106)
3. Click: Publish
```

### 3️⃣ Run the App
```bash
npm run dev
```

**That's it!** 🎉 Your app now has role-based authentication!

---

## 🎯 Quick Test

1. **Open**: `http://localhost:5173`
2. **Click**: "Sign Up"
3. **Create** 3 test accounts:

| Email | Role | Password |
|-------|------|----------|
| `user@test.com` | User | `test123` |
| `privileged@test.com` | Privileged User | `test123` |
| `admin@test.com` | Admin | `test123` |

4. **Test** each account to verify role-based access!

---

## 📋 Role Permissions Cheat Sheet

### 👤 User
✅ View Dashboard  
✅ Create Testimonials  
✅ View Reviews  
❌ Import Features  

### ⭐ Privileged User
✅ Everything User can do  
✅ Import CSV/Excel  
✅ Upload Spreadsheets  
✅ Map Columns  
✅ Manual Import  

### 👑 Admin
✅ Everything Privileged User can do  
✅ Manage Users  
✅ Update Roles  
✅ Full System Access  

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `.env` | Firebase credentials (NEVER commit!) |
| `src/contexts/AuthContext.jsx` | Authentication logic |
| `src/constants/roles.js` | Role definitions |
| `src/pages/Login/Login.jsx` | Login page |
| `src/pages/Signup/Signup.jsx` | Signup page |
| `src/components/ProtectedRoute/` | Route protection |

---

## 💡 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🆘 Troubleshooting

**Can't login?**
→ Check Firebase Console → Authentication to verify Email/Password is enabled

**Permission denied?**
→ Make sure Firestore security rules are published

**Environment variables not working?**
→ Restart dev server after creating .env file

**Can't access import features?**
→ Ensure your account has "Privileged User" or "Admin" role

---

## 📚 Full Documentation

- **Setup Guide**: `AUTH_SETUP.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Flow Diagrams**: `AUTH_FLOW_DIAGRAM.md`

---

## 🎨 What's New in the UI

### Login Page
- Modern gradient background
- Password visibility toggle
- Error messages
- Loading states

### Signup Page
- Role selection dropdown
- Password confirmation
- Success animation
- Auto-redirect

### Sidebar
- User profile display
- Role badge
- Logout button
- Fixed "COMPETITIVE" typo ✅

---

## 🔐 Security Features

✅ Environment variables for secrets  
✅ Firebase Authentication  
✅ Email verification  
✅ Password validation (min 6 chars)  
✅ Protected routes  
✅ Role-based access control  
✅ Firestore security rules  
✅ `.env` in `.gitignore`  

---

## 🎯 Next Features to Build

- [ ] Password reset page
- [ ] User management dashboard (Admin)
- [ ] Profile settings page
- [ ] Email verification reminder
- [ ] Two-factor authentication
- [ ] Social login (Google, GitHub)

---

## 📞 Need Help?

1. Check `AUTH_SETUP.md` for detailed docs
2. Review `AUTH_FLOW_DIAGRAM.md` for visual flows
3. Check Firebase Console for errors
4. Review browser console for client errors

---

**Made with ❤️ for ProofLayer**

*Last Updated: January 24, 2026*
