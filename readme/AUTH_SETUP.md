# ProofLayer - Role-Based Authentication Setup

## 🎯 Overview

ProofLayer now includes a comprehensive role-based authentication system with three user roles:
- **User** - Basic access (view and create testimonials)
- **Privileged User** - Import and manage testimonials
- **Admin** - Full system control including user management

## 🔐 Authentication Features

### Implemented Features
✅ Email/Password authentication with Firebase Auth  
✅ Role-based access control (User, Privileged User, Admin)  
✅ Protected routes based on user roles  
✅ User profile management in Firestore  
✅ Secure environment variable configuration  
✅ Login/Signup pages with validation  
✅ Password visibility toggle  
✅ Email verification  
✅ Logout functionality  
✅ Unauthorized access handling  

### User Roles & Permissions

#### User (Basic)
- ✅ View testimonials
- ✅ Create testimonials
- ✅ Edit own testimonials
- ✅ Access dashboard
- ❌ Import testimonials
- ❌ Delete testimonials
- ❌ Manage users

#### Privileged User
- ✅ All User permissions
- ✅ Import testimonials (CSV/Excel)
- ✅ Delete own testimonials
- ✅ Access settings
- ❌ Manage users

#### Admin
- ✅ All Privileged User permissions
- ✅ Manage users
- ✅ Update user roles
- ✅ Full system access

## 🚀 Setup Instructions

### 1. Install Dependencies

The project already has all necessary dependencies. If you need to reinstall:

```bash
npm install
```

### 2. Configure Environment Variables

The `.env` file has been created with your Firebase credentials. **Keep this file secure and never commit it to Git!**

Your `.env` file is already configured with:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Configure Firebase Console

#### Enable Email/Password Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `prooflayer-3cc7b`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

#### Set Up Firestore Security Rules

Go to **Firestore Database** → **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read their own data, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      allow create: if request.auth != null && request.auth.uid == userId;
      
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Testimonials collection
    match /testimonials/{testimonialId} {
      // Anyone authenticated can read
      allow read: if request.auth != null;
      
      // Anyone authenticated can create
      allow create: if request.auth != null;
      
      // Privileged users and admins can update/delete
      allow update, delete: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'privileged_user' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### 4. Run the Application

```bash
npm run dev
```

The app will start at `http://localhost:5173`

## 📱 User Flow

### New User Registration
1. Navigate to `/signup`
2. Fill in:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Select Role (User/Privileged User/Admin)
3. Click "Create Account"
4. Verification email sent
5. Redirected to dashboard

### Login
1. Navigate to `/login`
2. Enter email and password
3. Click "Sign In"
4. Redirected to dashboard

### Role-Based Access
- **All Users**: Can access Dashboard, New Proof, Review Details
- **Privileged Users & Admins**: Can access Import, Upload Spreadsheet, Map Columns, Manual Import
- **Admins**: Can manage users and update roles

## 🗂️ New File Structure

```
src/
├── constants/
│   └── roles.js              # Role definitions and permissions
├── contexts/
│   └── AuthContext.jsx       # Authentication context provider
├── components/
│   └── ProtectedRoute/
│       └── ProtectedRoute.jsx # Route protection components
├── pages/
│   ├── Login/
│   │   ├── Login.jsx
│   │   └── Login.css
│   ├── Signup/
│   │   ├── Signup.jsx
│   │   └── Signup.css
│   └── Unauthorized/
│       ├── Unauthorized.jsx
│       └── Unauthorized.css
└── firebase/
    └── firebase.js           # Updated with auth
```

## 🔒 Security Features

### Implemented
✅ Environment variables for sensitive data  
✅ Firebase Auth for secure authentication  
✅ Firestore security rules  
✅ Password validation (min 6 characters)  
✅ Email verification  
✅ Protected routes  
✅ Role-based access control  
✅ `.env` added to `.gitignore`  

### Best Practices
- Never commit `.env` file
- Use strong passwords
- Enable email verification
- Implement Firestore security rules
- Regular security audits

## 🎨 UI Components

### Login Page
- Email/password input
- Password visibility toggle
- Forgot password link
- Sign up link
- Error handling
- Loading states

### Signup Page
- Full name input
- Email input
- Password with confirmation
- Role selection dropdown
- Password strength hint
- Success animation
- Auto-redirect after signup

### Sidebar
- User profile display
- Role badge
- Logout button
- Dynamic user info

## 🧪 Testing the System

### Test User Roles

Create test accounts with different roles:

1. **User Account**
   - Email: `user@test.com`
   - Role: User
   - Test: Cannot access import features

2. **Privileged User Account**
   - Email: `privileged@test.com`
   - Role: Privileged User
   - Test: Can access import features

3. **Admin Account**
   - Email: `admin@test.com`
   - Role: Admin
   - Test: Full access to all features

### Testing Checklist
- [ ] Sign up with each role
- [ ] Login with each account
- [ ] Verify role-based access restrictions
- [ ] Test logout functionality
- [ ] Verify protected routes redirect to login
- [ ] Test unauthorized access handling
- [ ] Verify user profile displays correctly
- [ ] Test password validation
- [ ] Verify email verification sent

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Firebase: Error (auth/operation-not-allowed)"
- **Solution**: Enable Email/Password authentication in Firebase Console

**Issue**: Environment variables not loading
- **Solution**: Restart the dev server after creating `.env`

**Issue**: "Permission denied" errors in Firestore
- **Solution**: Update Firestore security rules as shown above

**Issue**: Can't access import features
- **Solution**: Ensure user has "Privileged User" or "Admin" role

**Issue**: Redirect loop on login
- **Solution**: Clear browser cache and localStorage

## 📚 API Reference

### AuthContext Hook

```javascript
import { useAuth } from './contexts/AuthContext';

const {
  currentUser,      // Current Firebase user object
  userRole,         // User's role (user/privileged_user/admin)
  userProfile,      // Full user profile from Firestore
  loading,          // Loading state
  error,            // Error message
  signup,           // (email, password, displayName, role) => Promise
  login,            // (email, password) => Promise
  logout,           // () => Promise
  resetPassword,    // (email) => Promise
  updateUserRole,   // (uid, newRole) => Promise (Admin only)
  updateUserProfile // (updates) => Promise
} = useAuth();
```

### Protected Route Components

```javascript
import { 
  ProtectedRoute,      // Requires authentication
  PublicRoute,         // Only when NOT authenticated
  RoleProtectedRoute,  // Requires specific roles
  AdminRoute,          // Admin only
  PrivilegedRoute      // Privileged users and admins
} from './components/ProtectedRoute/ProtectedRoute';
```

### Role Constants

```javascript
import { 
  USER_ROLES,          // { USER, PRIVILEGED_USER, ADMIN }
  ROLE_LABELS,         // Display names
  ROLE_PERMISSIONS,    // Permission definitions
  hasPermission,       // (userRole, permission) => boolean
  isValidRole          // (role) => boolean
} from './constants/roles';
```

## 🚀 Next Steps

### Recommended Enhancements
1. **Password Reset Page** - Create dedicated forgot password flow
2. **Email Verification Reminder** - Prompt unverified users
3. **User Management Dashboard** - Admin panel for managing users
4. **Profile Settings Page** - Allow users to update their profile
5. **Two-Factor Authentication** - Add extra security layer
6. **Social Login** - Google, GitHub, etc.
7. **Session Management** - Remember me functionality
8. **Activity Logs** - Track user actions
9. **Role Change Notifications** - Email when role is updated
10. **Account Deletion** - Allow users to delete their account

### Production Checklist
- [ ] Set up production Firebase project
- [ ] Configure production environment variables
- [ ] Enable email verification requirement
- [ ] Set up custom email templates
- [ ] Configure password reset emails
- [ ] Add rate limiting
- [ ] Set up monitoring and alerts
- [ ] Implement backup strategy
- [ ] Add CAPTCHA for signup
- [ ] Configure CORS properly

## 📞 Support

For issues or questions:
1. Check Firebase Console for auth errors
2. Review browser console for client errors
3. Check Firestore rules are properly configured
4. Verify environment variables are set correctly

---

**Last Updated**: January 24, 2026  
**Version**: 1.0.0  
**Authentication**: Firebase Auth  
**Database**: Cloud Firestore
