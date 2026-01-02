# Role Impersonation React Template

A portable template for implementing role impersonation functionality in React applications. Allows administrators to temporarily assume another user's role for testing and support purposes.

## Overview

Role impersonation enables privileged users (typically Super Admins) to view the application as if they were logged in with a different role. This is useful for:

- **Support**: Seeing exactly what a user with a specific role sees
- **Testing**: Verifying role-based permissions work correctly
- **Development**: Testing features across different permission levels
- **Debugging**: Reproducing issues reported by users with specific roles

## Features

- **Role Selection**: Dropdown to select which role to impersonate
- **Entity Binding**: Select associated entity (e.g., specific District, Manufacturer)
- **Visual Indicator**: Banner showing current impersonation state
- **One-Click Clear**: Easily end impersonation session
- **Persisted State**: Survives page reload via localStorage
- **API Header Integration**: Passes impersonation headers to backend

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ App                                                         │
├─────────────────────────────────────────────────────────────┤
│ ImpersonationBanner (visible to Super Admin only)           │
│ ├── Role Selector                                           │
│ ├── Entity Selector (context-dependent)                     │
│ └── Apply/Clear buttons                                     │
├─────────────────────────────────────────────────────────────┤
│ useImpersonation Hook                                       │
│ ├── isImpersonating: boolean                                │
│ ├── impersonatedRole: Role                                  │
│ ├── effectiveRole: Role (impersonated or actual)            │
│ └── clear(): void                                           │
├─────────────────────────────────────────────────────────────┤
│ ImpersonationContext                                        │
│ └── Provides impersonation state to all components          │
├─────────────────────────────────────────────────────────────┤
│ API Client (adds headers)                                   │
│ ├── X-Impersonate-Role-ID: roleId                           │
│ └── X-Impersonate-Entity-ID: entityId                       │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Copy Template Files

```bash
cp -r client-impersonation-react/components/* src/components/
cp -r client-impersonation-react/hooks/* src/hooks/
cp -r client-impersonation-react/contexts/* src/contexts/
cp -r client-impersonation-react/types/* src/types/
```

### 2. Configure Roles

Edit `types/impersonation.ts` to define your role hierarchy:

```typescript
export const ROLES = {
  SUPER_ADMIN: { id: 1, name: 'Super Admin', canImpersonate: true },
  ADMIN: { id: 2, name: 'Admin', canImpersonate: false },
  USER: { id: 3, name: 'User', canImpersonate: false },
} as const;
```

### 3. Add Provider

Wrap your app with the impersonation provider:

```typescript
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';

function App() {
  return (
    <ImpersonationProvider>
      <ImpersonationBanner />
      <YourApp />
    </ImpersonationProvider>
  );
}
```

### 4. Configure API Client

Add impersonation headers to your API client:

```typescript
import { getImpersonationHeaders } from '@/hooks/useImpersonation';

// In your fetch wrapper or axios interceptor
const headers = {
  ...getImpersonationHeaders(),
  'Authorization': `Bearer ${token}`,
};
```

### 5. Use Effective Role for Permissions

```typescript
import { useImpersonation } from '@/hooks/useImpersonation';

function MyComponent() {
  const { effectiveRole, isImpersonating } = useImpersonation();

  // Use effectiveRole for permission checks
  if (effectiveRole !== 'Admin') {
    return <AccessDenied />;
  }

  return <AdminContent />;
}
```

## File Structure

```
client-impersonation-react/
├── README.md                           # This file
├── components/
│   ├── ImpersonationBanner.tsx         # Main banner component
│   ├── ImpersonationBanner.scss        # Styles
│   └── RoleSelector.tsx                # Role dropdown
├── hooks/
│   ├── useImpersonation.ts             # Core impersonation hook
│   └── useEffectiveRole.ts             # Role resolution hook
├── contexts/
│   └── ImpersonationContext.tsx        # React context
├── types/
│   └── impersonation.ts                # TypeScript interfaces
├── docs/
│   ├── INTEGRATION.md                  # Integration guide
│   ├── BACKEND_API.md                  # Backend requirements
│   └── SECURITY.md                     # Security considerations
└── examples/
    └── basic-usage.tsx                 # Example implementation
```

## Integration with template-project

If using with the `template-project` code generator:

1. Role and entity selectors can use generated ComboBox components
2. Permission checking integrates with `usePermissions` hook
3. API headers work with generated clients

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `storageKey` | string | localStorage key prefix (default: 'X-Impersonate') |
| `allowedRoles` | string[] | Roles that can impersonate |
| `entityTypes` | object | Map of roles to entity types |
| `onApply` | callback | Called when impersonation applied |
| `onClear` | callback | Called when impersonation cleared |

## Security Considerations

1. **Backend Validation**: Server must validate impersonation headers
2. **Audit Logging**: Log all impersonation sessions
3. **Role Restrictions**: Only allow specific roles to impersonate
4. **Session Limits**: Consider timeout for impersonation sessions
5. **No Escalation**: Cannot impersonate higher roles

See `docs/SECURITY.md` for detailed security guidance.

## Backend Requirements

The backend must:

1. **Accept Headers**: Parse `X-Impersonate-*` headers
2. **Validate Permission**: Verify caller can impersonate
3. **Apply Context**: Use impersonated role for authorization
4. **Audit**: Log impersonation in audit trail

See `docs/BACKEND_API.md` for API specifications.

## Maintenance

See **MAINTENANCE.md** for:
- Adding new roles and entity types
- Modifying UI components
- Security review checklist
- Testing guidelines
- Backend integration requirements

## Related Projects

This impersonation template is part of a suite of reusable project templates:

| Project | Description |
|---------|-------------|
| `template-project/` | TypeScript code generator templates |
| `client-design-guide/` | UX patterns and architectural guidance |
| `client-impersonation-react/` | This template - role impersonation |

Each project is standalone and can be used independently.
