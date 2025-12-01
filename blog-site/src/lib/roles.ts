export const USER_ROLES = ["CONTRIBUTOR", "EDITOR", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

const ROLE_PRIORITY: Record<UserRole, number> = {
  CONTRIBUTOR: 0,
  EDITOR: 1,
  ADMIN: 2,
};

export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole) {
  if (!userRole) return false;
  return ROLE_PRIORITY[userRole] >= ROLE_PRIORITY[requiredRole];
}

export function isAtLeastContributor(role?: UserRole) {
  return hasRole(role, "CONTRIBUTOR");
}

export function isAtLeastEditor(role?: UserRole) {
  return hasRole(role, "EDITOR");
}

export function isAdmin(role?: UserRole) {
  return hasRole(role, "ADMIN");
}

