/**
 * useImpersonation Hook
 *
 * Core hook for managing role impersonation state.
 * Provides methods to apply, clear, and check impersonation status.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ImpersonationState,
  ImpersonationConfig,
  EMPTY_IMPERSONATION,
  DEFAULT_CONFIG,
  getStorageKeys,
  getRoleById,
  getRequiredEntityType,
  EntityType,
} from '../types/impersonation';

// =============================================================================
// TYPES
// =============================================================================

export interface UseImpersonationResult {
  /** Current impersonation state */
  state: ImpersonationState;

  /** Whether impersonation is currently active */
  isImpersonating: boolean;

  /** Apply new impersonation */
  apply: (roleId: number, entityId?: number, entityName?: string) => void;

  /** Clear current impersonation */
  clear: () => void;

  /** Get HTTP headers to send with API requests */
  getHeaders: () => Record<string, string>;

  /** Check if current user can impersonate (based on their actual role) */
  canImpersonate: boolean;
}

export interface UseImpersonationOptions {
  /** Current user's actual role ID */
  currentRoleId: number | null;
  /** Configuration options */
  config?: Partial<ImpersonationConfig>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for managing role impersonation
 */
export function useImpersonation(options: UseImpersonationOptions): UseImpersonationResult {
  const { currentRoleId, config: configOverrides } = options;

  const config: ImpersonationConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...configOverrides }),
    [configOverrides]
  );

  const storageKeys = useMemo(
    () => getStorageKeys(config.storageKeyPrefix),
    [config.storageKeyPrefix]
  );

  const [state, setState] = useState<ImpersonationState>(EMPTY_IMPERSONATION);

  // Load impersonation state from localStorage on mount
  useEffect(() => {
    const loadState = () => {
      if (typeof window === 'undefined') return;

      const roleIdStr = localStorage.getItem(storageKeys.ROLE_ID);
      if (!roleIdStr) {
        setState(EMPTY_IMPERSONATION);
        return;
      }

      const roleId = parseInt(roleIdStr, 10);
      if (isNaN(roleId)) {
        setState(EMPTY_IMPERSONATION);
        return;
      }

      const role = getRoleById(roleId);
      if (!role) {
        setState(EMPTY_IMPERSONATION);
        return;
      }

      // Determine entity type and ID
      let entityType: EntityType | null = null;
      let entityId: number | null = null;

      const districtId = localStorage.getItem(storageKeys.DISTRICT_ID);
      const coopId = localStorage.getItem(storageKeys.COOP_ID);
      const manufacturerId = localStorage.getItem(storageKeys.MANUFACTURER_ID);
      const entityName = localStorage.getItem(storageKeys.ENTITY_NAME);

      if (districtId) {
        entityType = 'District';
        entityId = parseInt(districtId, 10);
      } else if (coopId) {
        entityType = 'Coop';
        entityId = parseInt(coopId, 10);
      } else if (manufacturerId) {
        entityType = 'Manufacturer';
        entityId = parseInt(manufacturerId, 10);
      }

      setState({
        isActive: true,
        roleId,
        roleName: role.name,
        entityId,
        entityType,
        entityName,
      });
    };

    loadState();
  }, [storageKeys]);

  // Check if current user can impersonate
  const canImpersonate = useMemo(() => {
    if (!currentRoleId) return false;
    return config.allowedImpersonators.includes(currentRoleId);
  }, [currentRoleId, config.allowedImpersonators]);

  // Apply impersonation
  const apply = useCallback(
    (roleId: number, entityId?: number, entityName?: string) => {
      if (!canImpersonate) {
        console.warn('Current user cannot impersonate');
        return;
      }

      const role = getRoleById(roleId);
      if (!role) {
        console.warn(`Invalid role ID: ${roleId}`);
        return;
      }

      // Clear existing
      Object.values(storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });

      // Set role
      localStorage.setItem(storageKeys.ROLE_ID, String(roleId));

      // Set entity based on role's entity type
      const entityType = getRequiredEntityType(roleId);
      if (entityId && entityType) {
        switch (entityType) {
          case 'District':
            localStorage.setItem(storageKeys.DISTRICT_ID, String(entityId));
            break;
          case 'Coop':
            localStorage.setItem(storageKeys.COOP_ID, String(entityId));
            break;
          case 'Manufacturer':
            localStorage.setItem(storageKeys.MANUFACTURER_ID, String(entityId));
            break;
        }

        if (entityName) {
          localStorage.setItem(storageKeys.ENTITY_NAME, entityName);
        }
      }

      const newState: ImpersonationState = {
        isActive: true,
        roleId,
        roleName: role.name,
        entityId: entityId ?? null,
        entityType,
        entityName: entityName ?? null,
      };

      setState(newState);
      config.onApply?.(newState);

      if (config.reloadOnChange) {
        // Small delay to ensure localStorage is written
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    },
    [canImpersonate, storageKeys, config]
  );

  // Clear impersonation
  const clear = useCallback(() => {
    Object.values(storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });

    setState(EMPTY_IMPERSONATION);
    config.onClear?.();

    if (config.reloadOnChange) {
      window.location.reload();
    }
  }, [storageKeys, config]);

  // Get headers for API requests
  const getHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};

    if (!state.isActive) return headers;

    if (state.roleId) {
      headers['X-Impersonate-Role-ID'] = String(state.roleId);
    }

    // Add entity header based on type
    if (state.entityId && state.entityType) {
      switch (state.entityType) {
        case 'District':
          headers['X-Impersonate-District-ID'] = String(state.entityId);
          break;
        case 'Coop':
          headers['X-Impersonate-Coop-ID'] = String(state.entityId);
          break;
        case 'Manufacturer':
          headers['X-Impersonate-Manufacturer-ID'] = String(state.entityId);
          break;
        default:
          headers[`X-Impersonate-${state.entityType}-ID`] = String(state.entityId);
      }
    }

    return headers;
  }, [state]);

  return {
    state,
    isImpersonating: state.isActive,
    apply,
    clear,
    getHeaders,
    canImpersonate,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get impersonation headers for use outside of React components
 * (e.g., in API client interceptors)
 */
export function getImpersonationHeaders(
  prefix: string = 'X-Impersonate'
): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const keys = getStorageKeys(prefix);
  const headers: Record<string, string> = {};

  const roleId = localStorage.getItem(keys.ROLE_ID);
  if (roleId) {
    headers['X-Impersonate-Role-ID'] = roleId;
  }

  const districtId = localStorage.getItem(keys.DISTRICT_ID);
  if (districtId) {
    headers['X-Impersonate-District-ID'] = districtId;
  }

  const coopId = localStorage.getItem(keys.COOP_ID);
  if (coopId) {
    headers['X-Impersonate-Coop-ID'] = coopId;
  }

  const manufacturerId = localStorage.getItem(keys.MANUFACTURER_ID);
  if (manufacturerId) {
    headers['X-Impersonate-Manufacturer-ID'] = manufacturerId;
  }

  return headers;
}

/**
 * Check if impersonation is active (for use outside React)
 */
export function isImpersonationActive(prefix: string = 'X-Impersonate'): boolean {
  if (typeof window === 'undefined') return false;
  const keys = getStorageKeys(prefix);
  return localStorage.getItem(keys.ROLE_ID) !== null;
}

/**
 * Clear impersonation (for use outside React, e.g., on logout)
 */
export function clearImpersonation(prefix: string = 'X-Impersonate'): void {
  if (typeof window === 'undefined') return;
  const keys = getStorageKeys(prefix);
  Object.values(keys).forEach(key => {
    localStorage.removeItem(key);
  });
}

export default useImpersonation;
