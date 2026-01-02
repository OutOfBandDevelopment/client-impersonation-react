# Impersonation Integration Guide

## Overview

This guide walks through integrating the role impersonation feature into your React application.

## Prerequisites

- React 18+
- TypeScript (recommended)
- Your own authentication system
- Backend support for impersonation headers

## Step 1: Install Files

Copy the template files to your project:

```bash
# From your project root
cp -r client-impersonation-react/types/* src/types/
cp -r client-impersonation-react/hooks/* src/hooks/
cp -r client-impersonation-react/contexts/* src/contexts/
cp -r client-impersonation-react/components/* src/components/
```

## Step 2: Configure Roles

Edit `src/types/impersonation.ts` to define your role hierarchy:

```typescript
export const ROLES: Record<string, RoleDefinition> = {
  SUPER_ADMIN: {
    id: 1,
    name: 'Super Admin',
    canImpersonate: true,
    level: 0,
  },
  ADMIN: {
    id: 2,
    name: 'Admin',
    canImpersonate: false,
    level: 1,
    entityType: 'Organization',  // Admin needs an organization
  },
  USER: {
    id: 3,
    name: 'User',
    canImpersonate: false,
    level: 2,
    entityType: 'Organization',
  },
};
```

### Role Properties

| Property | Description |
|----------|-------------|
| `id` | Unique numeric identifier |
| `name` | Display name |
| `canImpersonate` | Whether this role can impersonate others |
| `level` | Hierarchy level (0 = highest privilege) |
| `entityType` | Entity type required for this role (optional) |

## Step 3: Add Provider

Wrap your app with `ImpersonationProvider`:

```typescript
// src/App.tsx
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { useAuth } from '@/hooks/useAuth'; // Your auth hook

function App() {
  const { user } = useAuth();

  return (
    <ImpersonationProvider
      currentRoleId={user?.roleId ?? null}
      currentRoleName={user?.roleName ?? null}
    >
      <ImpersonationBanner currentRoleId={user?.roleId ?? 0} />
      <MainApp />
    </ImpersonationProvider>
  );
}
```

## Step 4: Configure API Client

Add impersonation headers to API requests:

### Option A: Fetch Wrapper

```typescript
import { getImpersonationHeaders } from '@/hooks/useImpersonation';

async function apiFetch(url: string, options: RequestInit = {}) {
  const impersonationHeaders = getImpersonationHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...impersonationHeaders,
      'Content-Type': 'application/json',
    },
  });

  return response;
}
```

### Option B: Axios Interceptor

```typescript
import axios from 'axios';
import { getImpersonationHeaders } from '@/hooks/useImpersonation';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(config => {
  const impersonationHeaders = getImpersonationHeaders();
  config.headers = {
    ...config.headers,
    ...impersonationHeaders,
  };
  return config;
});
```

## Step 5: Use Effective Role for Permissions

Replace direct role checks with effective role:

```typescript
// Before (doesn't respect impersonation)
function AdminPanel() {
  const { user } = useAuth();
  if (user.roleName !== 'Admin') return null;
  return <AdminContent />;
}

// After (respects impersonation)
function AdminPanel() {
  const { effectiveRoleName } = useImpersonationContext();
  if (effectiveRoleName !== 'Admin') return null;
  return <AdminContent />;
}
```

## Step 6: Custom Selectors (Optional)

Replace default selectors with your UI framework components:

```typescript
import { Dropdown } from 'primereact/dropdown';
import { ImpersonationBanner, RoleSelectorProps } from '@/components/ImpersonationBanner';

// Custom role selector using PrimeReact
function PrimeRoleSelector({ roles, value, onChange, disabled }: RoleSelectorProps) {
  return (
    <Dropdown
      value={value}
      options={roles}
      optionLabel="name"
      optionValue="id"
      onChange={e => {
        const role = roles.find(r => r.id === e.value);
        onChange(e.value, role?.name);
      }}
      disabled={disabled}
      placeholder="Select Role..."
    />
  );
}

// Use in banner
<ImpersonationBanner
  currentRoleId={user.roleId}
  RoleSelector={PrimeRoleSelector}
/>
```

## Step 7: Handle Logout

Clear impersonation on logout:

```typescript
import { clearImpersonation } from '@/hooks/useImpersonation';

function handleLogout() {
  // Clear impersonation before logout
  clearImpersonation();

  // Your normal logout logic
  auth.logout();
}
```

## Usage Patterns

### Check If Impersonating

```typescript
const { isImpersonating, state } = useImpersonationContext();

if (isImpersonating) {
  console.log(`Impersonating: ${state.roleName}`);
}
```

### Get Effective Permissions

```typescript
const { effectiveRoleId, effectiveRoleName } = useImpersonationContext();

// Use effective role for permission checks
const canEdit = hasPermission(effectiveRoleId, 'edit');
```

### Conditional Rendering

```typescript
function DebugPanel() {
  const { isImpersonating, canImpersonate } = useImpersonationContext();

  // Only show to Super Admins, even when impersonating
  // canImpersonate checks the ACTUAL role, not effective
  if (!canImpersonate) return null;

  return <div>Debug info here</div>;
}
```

## Configuration Options

Pass custom config to the provider:

```typescript
<ImpersonationProvider
  currentRoleId={roleId}
  currentRoleName={roleName}
  config={{
    storageKeyPrefix: 'MyApp-Impersonate',
    allowedImpersonators: [1, 2], // Role IDs that can impersonate
    reloadOnChange: true,
    onApply: (state) => {
      analytics.track('impersonation_started', state);
    },
    onClear: () => {
      analytics.track('impersonation_ended');
    },
  }}
>
```

## Troubleshooting

### Impersonation not persisting

Check that localStorage is available and not blocked.

### Headers not being sent

Ensure `getImpersonationHeaders()` is called in your API client.

### Role selector empty

Verify role configuration has `canImpersonate: true` for the current role.

### Page doesn't update after apply

Check `reloadOnChange` config option (default: true).
