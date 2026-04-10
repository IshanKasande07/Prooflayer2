# ProofLayer Authentication Flow

## 🔄 Complete Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER VISITS APP                              │
│                   http://localhost:5173                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Is User Logged In?  │
              └──────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼ NO                            ▼ YES
┌─────────────────┐              ┌──────────────────┐
│  Redirect to    │              │  Load User       │
│  /login         │              │  Profile from    │
│                 │              │  Firestore       │
└────────┬────────┘              └────────┬─────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌──────────────────┐
│  LOGIN PAGE     │              │  Check User Role │
│  - Email        │              │  - user          │
│  - Password     │              │  - privileged    │
│  - Sign Up Link │              │  - admin         │
└────────┬────────┘              └────────┬─────────┘
         │                                │
         │ Click "Sign Up"                │
         ▼                                ▼
┌─────────────────┐              ┌──────────────────┐
│  SIGNUP PAGE    │              │  DASHBOARD       │
│  - Name         │              │  (Protected)     │
│  - Email        │              │                  │
│  - Password     │              │  Sidebar shows:  │
│  - Role Select  │              │  - User Name     │
│  - Confirm Pass │              │  - Role Badge    │
└────────┬────────┘              │  - Logout Btn    │
         │                       └────────┬─────────┘
         │ Submit                         │
         ▼                                │
┌─────────────────┐                       │
│  Create Account │                       │
│  in Firebase    │                       │
│  Auth           │                       │
└────────┬────────┘                       │
         │                                │
         ▼                                │
┌─────────────────┐                       │
│  Save Profile   │                       │
│  to Firestore   │                       │
│  with Role      │                       │
└────────┬────────┘                       │
         │                                │
         ▼                                │
┌─────────────────┐                       │
│  Send Email     │                       │
│  Verification   │                       │
└────────┬────────┘                       │
         │                                │
         ▼                                │
┌─────────────────┐                       │
│  SUCCESS!       │                       │
│  Redirect to    │                       │
│  Dashboard      │                       │
└────────┬────────┘                       │
         │                                │
         └────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    USER NAVIGATES TO ROUTE    │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐              ┌──────────────────┐
│  PUBLIC ROUTES  │              │ PROTECTED ROUTES │
│  - /login       │              │  Check Auth      │
│  - /signup      │              └────────┬─────────┘
│                 │                       │
│  If logged in:  │              ┌────────┴────────┐
│  → Dashboard    │              │                 │
└─────────────────┘              ▼ YES             ▼ NO
                         ┌──────────────┐  ┌──────────────┐
                         │ Check Role   │  │ Redirect to  │
                         │ Permissions  │  │ /login       │
                         └──────┬───────┘  └──────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼ Allowed                       ▼ Not Allowed
        ┌──────────────┐              ┌──────────────────┐
        │ Show Page    │              │ Redirect to      │
        │              │              │ /unauthorized    │
        └──────────────┘              └──────────────────┘
```

## 🎭 Role-Based Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROUTE ACCESS                              │
└─────────────────────────────────────────────────────────────────┘

USER ROLE: "user"
├── ✅ /dashboard
├── ✅ /new-proof
├── ✅ /review/:id
├── ❌ /import          → Redirects to /unauthorized
├── ❌ /upload-spreadsheet → Redirects to /unauthorized
├── ❌ /map-columns     → Redirects to /unauthorized
└── ❌ /manual-import   → Redirects to /unauthorized

PRIVILEGED USER ROLE: "privileged_user"
├── ✅ /dashboard
├── ✅ /new-proof
├── ✅ /review/:id
├── ✅ /import
├── ✅ /upload-spreadsheet
├── ✅ /map-columns
├── ✅ /manual-import
└── ❌ /admin (future)  → Redirects to /unauthorized

ADMIN ROLE: "admin"
├── ✅ /dashboard
├── ✅ /new-proof
├── ✅ /review/:id
├── ✅ /import
├── ✅ /upload-spreadsheet
├── ✅ /map-columns
├── ✅ /manual-import
└── ✅ /admin (future)  → Full Access
```

## 🔐 Authentication State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    AuthContext Provider                          │
│                                                                   │
│  State:                                                           │
│  ├── currentUser      (Firebase Auth User)                       │
│  ├── userRole         (user/privileged_user/admin)               │
│  ├── userProfile      (Firestore User Document)                  │
│  ├── loading          (boolean)                                  │
│  └── error            (string)                                   │
│                                                                   │
│  Methods:                                                         │
│  ├── signup(email, password, name, role)                         │
│  ├── login(email, password)                                      │
│  ├── logout()                                                    │
│  ├── resetPassword(email)                                        │
│  ├── updateUserRole(uid, newRole)  [Admin Only]                 │
│  └── updateUserProfile(updates)                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Provides to all children
                              ▼
        ┌─────────────────────────────────────┐
        │         All App Components          │
        │                                     │
        │  Can access via:                    │
        │  const { currentUser, userRole,     │
        │          login, logout } = useAuth()│
        └─────────────────────────────────────┘
```

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SIGNUP FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

User fills form → Validation → Firebase Auth
                                     │
                                     ▼
                              Create User Account
                                     │
                                     ▼
                              Update Display Name
                                     │
                                     ▼
                              Send Email Verification
                                     │
                                     ▼
                              Create Firestore Document
                                     │
                              /users/{uid}
                              {
                                uid: "...",
                                email: "user@example.com",
                                displayName: "John Doe",
                                role: "privileged_user",
                                createdAt: "2026-01-24...",
                                updatedAt: "2026-01-24...",
                                emailVerified: false,
                                isActive: true
                              }
                                     │
                                     ▼
                              Set Local State
                                     │
                                     ▼
                              Redirect to Dashboard

┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

User enters credentials → Firebase Auth Login
                                     │
                                     ▼
                              Get User Object
                                     │
                                     ▼
                              Fetch Firestore Profile
                                     │
                              /users/{uid}
                                     │
                                     ▼
                              Extract Role
                                     │
                                     ▼
                              Set Local State
                              - currentUser
                              - userRole
                              - userProfile
                                     │
                                     ▼
                              Redirect to Dashboard
```

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Environment Variables
├── Firebase credentials in .env
├── Not committed to Git
└── Loaded at runtime

Layer 2: Firebase Authentication
├── Email/Password validation
├── Email verification
├── Password strength requirements
└── Session management

Layer 3: Client-Side Route Protection
├── ProtectedRoute component
├── RoleProtectedRoute component
├── Redirect unauthorized users
└── Loading states

Layer 4: Firestore Security Rules
├── Read: Own data or Admin
├── Create: Authenticated users
├── Update: Own data or Admin
├── Delete: Admin only
└── Role-based permissions

Layer 5: Context-Level Checks
├── useAuth hook
├── hasPermission() helper
├── Role validation
└── Error handling
```

## 🔄 Component Hierarchy

```
App (Router + AuthProvider)
│
├── Public Routes
│   ├── Login
│   └── Signup
│
└── Protected Routes (ProtectedRoute wrapper)
    │
    └── AppLayout
        │
        ├── Sidebar
        │   ├── User Profile
        │   ├── Role Badge
        │   ├── Navigation
        │   └── Logout Button
        │
        └── Main Content
            │
            ├── Dashboard (All users)
            ├── NewProof (All users)
            ├── ReviewDetails (All users)
            │
            └── Privileged Routes (PrivilegedRoute wrapper)
                ├── Import
                ├── UploadSpreadsheet
                ├── MapColumns
                └── ManualImport
```

## 📱 User Experience Flow

```
First Time User:
1. Visit app → Redirected to /login
2. Click "Sign Up"
3. Fill form with role selection
4. Submit → Account created
5. Email verification sent
6. Redirected to dashboard
7. See personalized sidebar with role badge

Returning User:
1. Visit app → Redirected to /login
2. Enter credentials
3. Submit → Authenticated
4. Profile loaded from Firestore
5. Redirected to dashboard
6. Role-based access enforced

Logout:
1. Click logout button in sidebar
2. Firebase signOut() called
3. Local state cleared
4. Redirected to /login
```

---

**This diagram shows the complete authentication and authorization flow in your ProofLayer application!**
