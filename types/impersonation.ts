/**
 * Role Impersonation Types
 *
 * Define your role hierarchy and impersonation configuration.
 */

// =============================================================================
// ROLE DEFINITIONS
// =============================================================================

/**
 * Role definition interface
 */
export interface RoleDefinition {
  id: number;
  name: string;
  /** Whether this role can impersonate others */
  canImpersonate: boolean;
  /** Role level for hierarchy (lower = more privileged) */
  level: number;
  /** Entity type required for this role (if any) */
  entityType?: EntityType;
}

/**
 * Entity types that can be associated with a role
 */
export type EntityType = 'District' | 'Coop' | 'Manufacturer' | 'Organization' | string;

/**
 * Define your roles here - customize for your application
 */
export const ROLES: Record<string, RoleDefinition> = {
  SUPER_ADMIN: {
    id: 1,
    name: 'Super Admin',
    canImpersonate: true,
    level: 0,
  },
  COOP_ADMIN: {
    id: 2,
    name: 'Coop Admin',
    canImpersonate: false,
    level: 1,
    entityType: 'Coop',
  },
  DISTRICT_ADMIN: {
    id: 3,
    name: 'District Admin',
    canImpersonate: false,
    level: 2,
    entityType: 'District',
  },
  DISTRICT_USER: {
    id: 4,
    name: 'District User',
    canImpersonate: false,
    level: 3,
    entityType: 'District',
  },
  COOP_USER: {
    id: 5,
    name: 'Coop User',
    canImpersonate: false,
    level: 2,
    entityType: 'Coop',
  },
  MANUFACTURER: {
    id: 6,
    name: 'Manufacturer',
    canImpersonate: false,
    level: 2,
    entityType: 'Manufacturer',
  },
};

// =============================================================================
// IMPERSONATION STATE
// =============================================================================

/**
 * Current impersonation state
 */
export interface ImpersonationState {
  /** Whether impersonation is active */
  isActive: boolean;
  /** ID of the impersonated role */
  roleId: number | null;
  /** Name of the impersonated role */
  roleName: string | null;
  /** ID of the associated entity */
  entityId: number | null;
  /** Type of entity (District, Coop, Manufacturer, etc.) */
  entityType: EntityType | null;
  /** Display name of the entity */
  entityName: string | null;
}

/**
 * Empty impersonation state
 */
export const EMPTY_IMPERSONATION: ImpersonationState = {
  isActive: false,
  roleId: null,
  roleName: null,
  entityId: null,
  entityType: null,
  entityName: null,
};

// =============================================================================
// IMPERSONATION CONFIG
// =============================================================================

/**
 * Configuration for impersonation behavior
 */
export interface ImpersonationConfig {
  /** localStorage key prefix */
  storageKeyPrefix: string;
  /** Roles that are allowed to impersonate */
  allowedImpersonators: number[];
  /** Whether to reload page on impersonation change */
  reloadOnChange: boolean;
  /** Callback when impersonation is applied */
  onApply?: (state: ImpersonationState) => void;
  /** Callback when impersonation is cleared */
  onClear?: () => void;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: ImpersonationConfig = {
  storageKeyPrefix: 'X-Impersonate',
  allowedImpersonators: [1], // Super Admin by default
  reloadOnChange: true,
};

// =============================================================================
// STORAGE KEYS
// =============================================================================

/**
 * Generate storage keys based on prefix
 */
export function getStorageKeys(prefix: string = 'X-Impersonate') {
  return {
    ROLE_ID: `${prefix}-Role-ID`,
    DISTRICT_ID: `${prefix}-District-ID`,
    COOP_ID: `${prefix}-Coop-ID`,
    MANUFACTURER_ID: `${prefix}-Manufacturer-ID`,
    ENTITY_NAME: `${prefix}-Entity-Name`,
  } as const;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get role definition by ID
 */
export function getRoleById(roleId: number): RoleDefinition | undefined {
  return Object.values(ROLES).find(role => role.id === roleId);
}

/**
 * Get role definition by name
 */
export function getRoleByName(name: string): RoleDefinition | undefined {
  return Object.values(ROLES).find(role => role.name === name);
}

/**
 * Check if a role can impersonate others
 */
export function canRoleImpersonate(roleId: number): boolean {
  const role = getRoleById(roleId);
  return role?.canImpersonate ?? false;
}

/**
 * Check if role A can impersonate role B (must be higher level)
 */
export function canImpersonateRole(impersonatorRoleId: number, targetRoleId: number): boolean {
  const impersonator = getRoleById(impersonatorRoleId);
  const target = getRoleById(targetRoleId);

  if (!impersonator || !target) return false;
  if (!impersonator.canImpersonate) return false;

  // Can only impersonate lower privilege roles
  return impersonator.level < target.level;
}

/**
 * Get roles available for impersonation
 */
export function getImpersonatableRoles(currentRoleId: number): RoleDefinition[] {
  const currentRole = getRoleById(currentRoleId);
  if (!currentRole?.canImpersonate) return [];

  return Object.values(ROLES).filter(role =>
    role.id !== currentRoleId && currentRole.level < role.level
  );
}

/**
 * Get entity type required for a role
 */
export function getRequiredEntityType(roleId: number): EntityType | null {
  const role = getRoleById(roleId);
  return role?.entityType ?? null;
}
