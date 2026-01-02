/**
 * Impersonation Banner Component
 *
 * Displays a banner at the top of the page for managing impersonation.
 * Only visible to users with impersonation permission.
 *
 * Customize the role and entity selectors to match your application's
 * data sources and UI framework.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useImpersonationContext } from '../contexts/ImpersonationContext';
import {
  getImpersonatableRoles,
  getRequiredEntityType,
  RoleDefinition,
  EntityType,
} from '../types/impersonation';
import './ImpersonationBanner.scss';

// =============================================================================
// TYPES
// =============================================================================

export interface ImpersonationBannerProps {
  /** Current user's actual role ID */
  currentRoleId: number;
  /** Custom role selector component */
  RoleSelector?: React.ComponentType<RoleSelectorProps>;
  /** Custom entity selector component */
  EntitySelector?: React.ComponentType<EntitySelectorProps>;
  /** Custom styling class */
  className?: string;
}

export interface RoleSelectorProps {
  roles: RoleDefinition[];
  value: number | null;
  onChange: (roleId: number | null, roleName?: string) => void;
  disabled?: boolean;
}

export interface EntitySelectorProps {
  entityType: EntityType;
  value: number | null;
  onChange: (entityId: number | null, entityName?: string) => void;
  disabled?: boolean;
}

// =============================================================================
// DEFAULT SELECTORS
// =============================================================================

/**
 * Default role selector - replace with your own UI component
 */
const DefaultRoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  value,
  onChange,
  disabled,
}) => (
  <select
    value={value || ''}
    onChange={e => {
      const roleId = e.target.value ? parseInt(e.target.value, 10) : null;
      const role = roles.find(r => r.id === roleId);
      onChange(roleId, role?.name);
    }}
    disabled={disabled}
    className="impersonation-select"
  >
    <option value="">Select Role...</option>
    {roles.map(role => (
      <option key={role.id} value={role.id}>
        {role.name}
      </option>
    ))}
  </select>
);

/**
 * Default entity selector - replace with your own UI component
 * This is a placeholder; implement actual entity fetching
 */
const DefaultEntitySelector: React.FC<EntitySelectorProps> = ({
  entityType,
  value,
  onChange,
  disabled,
}) => (
  <input
    type="number"
    value={value || ''}
    onChange={e => {
      const entityId = e.target.value ? parseInt(e.target.value, 10) : null;
      onChange(entityId, `${entityType} ${entityId}`);
    }}
    placeholder={`Enter ${entityType} ID...`}
    disabled={disabled}
    className="impersonation-input"
  />
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Impersonation Banner
 *
 * Displays controls for applying/clearing impersonation.
 * Only renders for users with impersonation permission.
 *
 * @example
 * ```tsx
 * // Basic usage with default selectors
 * <ImpersonationBanner currentRoleId={user.roleId} />
 *
 * // With custom selectors (e.g., PrimeReact dropdowns)
 * <ImpersonationBanner
 *   currentRoleId={user.roleId}
 *   RoleSelector={MyRoleDropdown}
 *   EntitySelector={MyEntityDropdown}
 * />
 * ```
 */
export function ImpersonationBanner({
  currentRoleId,
  RoleSelector = DefaultRoleSelector,
  EntitySelector = DefaultEntitySelector,
  className = '',
}: ImpersonationBannerProps) {
  const {
    isImpersonating,
    state,
    apply,
    clear,
    canImpersonate,
  } = useImpersonationContext();

  // Local form state
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Get roles available for impersonation
  const availableRoles = getImpersonatableRoles(currentRoleId);

  // Get entity type required for selected role
  const requiredEntityType = selectedRoleId
    ? getRequiredEntityType(selectedRoleId)
    : null;

  // Reset entity when role changes
  useEffect(() => {
    setSelectedEntityId(null);
    setSelectedEntityName(null);
  }, [selectedRoleId]);

  // Handle role selection
  const handleRoleChange = useCallback((roleId: number | null, roleName?: string) => {
    setSelectedRoleId(roleId);
    setSelectedRoleName(roleName || null);
  }, []);

  // Handle entity selection
  const handleEntityChange = useCallback((entityId: number | null, entityName?: string) => {
    setSelectedEntityId(entityId);
    setSelectedEntityName(entityName || null);
  }, []);

  // Handle apply
  const handleApply = useCallback(() => {
    if (!selectedRoleId) return;

    setIsApplying(true);
    apply(selectedRoleId, selectedEntityId ?? undefined, selectedEntityName ?? undefined);
    // Note: page will reload if config.reloadOnChange is true
  }, [selectedRoleId, selectedEntityId, selectedEntityName, apply]);

  // Handle clear
  const handleClear = useCallback(() => {
    setSelectedRoleId(null);
    setSelectedRoleName(null);
    setSelectedEntityId(null);
    setSelectedEntityName(null);
    clear();
  }, [clear]);

  // Don't render if user can't impersonate
  if (!canImpersonate) {
    return null;
  }

  // Check if apply should be disabled
  const needsEntity = requiredEntityType !== null;
  const hasEntity = selectedEntityId !== null && selectedEntityId > 0;
  const canApply = selectedRoleId !== null && (!needsEntity || hasEntity);

  return (
    <div
      className={`impersonation-banner ${isImpersonating ? 'impersonating' : 'not-impersonating'} ${className}`}
    >
      <div className="impersonation-content">
        {isImpersonating ? (
          // Active impersonation display
          <div className="impersonation-info">
            <span className="impersonation-label">Impersonating:</span>
            <span className="impersonation-role">{state.roleName}</span>
            {state.entityId && (
              <>
                <span className="impersonation-separator">-</span>
                <span className="impersonation-entity">
                  {state.entityName
                    ? `${state.entityName} (${state.entityId})`
                    : `${state.entityType} ID: ${state.entityId}`}
                </span>
              </>
            )}
            <button className="clear-button" onClick={handleClear}>
              Clear Impersonation
            </button>
          </div>
        ) : (
          // Impersonation controls
          <div className="impersonation-controls">
            <div className="control-group">
              <label>Role:</label>
              <div className="selector-wrapper">
                <RoleSelector
                  roles={availableRoles}
                  value={selectedRoleId}
                  onChange={handleRoleChange}
                  disabled={isApplying}
                />
              </div>
            </div>

            {requiredEntityType && (
              <div className="control-group">
                <label>{requiredEntityType}:</label>
                <div className="selector-wrapper">
                  <EntitySelector
                    entityType={requiredEntityType}
                    value={selectedEntityId}
                    onChange={handleEntityChange}
                    disabled={isApplying}
                  />
                </div>
              </div>
            )}

            <button
              className="apply-button"
              onClick={handleApply}
              disabled={!canApply || isApplying}
            >
              {isApplying ? 'Applying...' : 'Apply'}
            </button>

            <button className="clear-button" onClick={handleClear}>
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImpersonationBanner;
