/**
 * Impersonation Context
 *
 * Provides impersonation state throughout the application.
 * Wrap your app with ImpersonationProvider to enable impersonation.
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import {
  useImpersonation,
  UseImpersonationResult,
} from '../hooks/useImpersonation';
import {
  ImpersonationConfig,
  ImpersonationState,
  EMPTY_IMPERSONATION,
} from '../types/impersonation';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export interface ImpersonationContextValue extends UseImpersonationResult {
  /** Effective role ID (impersonated if active, otherwise actual) */
  effectiveRoleId: number | null;
  /** Effective role name */
  effectiveRoleName: string | null;
}

// =============================================================================
// CONTEXT
// =============================================================================

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

// =============================================================================
// PROVIDER PROPS
// =============================================================================

export interface ImpersonationProviderProps {
  children: ReactNode;
  /** Current user's actual role ID */
  currentRoleId: number | null;
  /** Current user's actual role name */
  currentRoleName: string | null;
  /** Optional configuration overrides */
  config?: Partial<ImpersonationConfig>;
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * Provider component for impersonation context
 *
 * @example
 * ```tsx
 * import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
 *
 * function App() {
 *   const { roleId, roleName } = useAuth(); // Your auth hook
 *
 *   return (
 *     <ImpersonationProvider
 *       currentRoleId={roleId}
 *       currentRoleName={roleName}
 *     >
 *       <ImpersonationBanner />
 *       <YourApp />
 *     </ImpersonationProvider>
 *   );
 * }
 * ```
 */
export function ImpersonationProvider({
  children,
  currentRoleId,
  currentRoleName,
  config,
}: ImpersonationProviderProps) {
  const impersonation = useImpersonation({
    currentRoleId,
    config,
  });

  // Calculate effective role (impersonated or actual)
  const effectiveRoleId = useMemo(() => {
    if (impersonation.isImpersonating && impersonation.state.roleId) {
      return impersonation.state.roleId;
    }
    return currentRoleId;
  }, [impersonation.isImpersonating, impersonation.state.roleId, currentRoleId]);

  const effectiveRoleName = useMemo(() => {
    if (impersonation.isImpersonating && impersonation.state.roleName) {
      return impersonation.state.roleName;
    }
    return currentRoleName;
  }, [impersonation.isImpersonating, impersonation.state.roleName, currentRoleName]);

  const value: ImpersonationContextValue = useMemo(
    () => ({
      ...impersonation,
      effectiveRoleId,
      effectiveRoleName,
    }),
    [impersonation, effectiveRoleId, effectiveRoleName]
  );

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to access impersonation context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isImpersonating,
 *     effectiveRoleId,
 *     effectiveRoleName,
 *     clear,
 *   } = useImpersonationContext();
 *
 *   return (
 *     <div>
 *       {isImpersonating && (
 *         <span>Viewing as: {effectiveRoleName}</span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useImpersonationContext(): ImpersonationContextValue {
  const context = useContext(ImpersonationContext);

  if (!context) {
    // Return a default value if used outside provider
    // This allows components to work even without the provider
    return {
      state: EMPTY_IMPERSONATION,
      isImpersonating: false,
      apply: () => console.warn('ImpersonationProvider not found'),
      clear: () => console.warn('ImpersonationProvider not found'),
      getHeaders: () => ({}),
      canImpersonate: false,
      effectiveRoleId: null,
      effectiveRoleName: null,
    };
  }

  return context;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ImpersonationContext;
