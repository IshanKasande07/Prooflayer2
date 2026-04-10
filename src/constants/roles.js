// User role constants
export const USER_ROLES = {
  USER: 'user',
  PRIVILEGED_USER: 'privileged_user',
  ADMIN: 'admin'
};

// Role display names
export const ROLE_LABELS = {
  [USER_ROLES.USER]: 'User',
  [USER_ROLES.PRIVILEGED_USER]: 'Privileged User',
  [USER_ROLES.ADMIN]: 'Admin'
};

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: {
    canViewTestimonials: true,
    canCreateTestimonials: true,
    canEditOwnTestimonials: true,
    canDeleteOwnTestimonials: false,
    canImportTestimonials: true,
    canManageUsers: false,
    canAccessDashboard: true,
    canAccessSettings: false,
  },
  [USER_ROLES.PRIVILEGED_USER]: {
    canViewTestimonials: true,
    canCreateTestimonials: true,
    canEditOwnTestimonials: true,
    canDeleteOwnTestimonials: true,
    canImportTestimonials: true,
    canManageUsers: false,
    canAccessDashboard: true,
    canAccessSettings: true,
  },
  [USER_ROLES.ADMIN]: {
    canViewTestimonials: true,
    canCreateTestimonials: true,
    canEditOwnTestimonials: true,
    canDeleteOwnTestimonials: true,
    canImportTestimonials: true,
    canManageUsers: true,
    canAccessDashboard: true,
    canAccessSettings: true,
  }
};

// Helper function to check if user has permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) {
    return false;
  }
  return ROLE_PERMISSIONS[userRole][permission] || false;
};

// Helper function to check if role is valid
export const isValidRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};
