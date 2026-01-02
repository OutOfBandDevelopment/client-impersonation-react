# Client Impersonation React Maintenance Protocol

This document provides guidance for maintaining and evolving the role impersonation template project.

## Overview

The client impersonation template provides a reusable pattern for implementing role-based impersonation in React applications. It allows privileged users (like Super Admins) to temporarily assume other roles for testing and support purposes.

---

## Directory Structure

```
client-impersonation-react/
├── components/           # React UI components
│   ├── ImpersonationBanner.tsx
│   └── ImpersonationBanner.scss
├── hooks/                # React hooks
│   └── useImpersonation.ts
├── contexts/             # React context providers
│   └── ImpersonationContext.tsx
├── types/                # TypeScript type definitions
│   └── impersonation.ts
├── docs/                 # Integration documentation
│   └── INTEGRATION.md
└── README.md             # Project overview
```

---

## Core Concepts

### Role Hierarchy

Roles are defined in `types/impersonation.ts`:

```typescript
export const ROLES: Record<string, RoleDefinition> = {
  SUPER_ADMIN: { id: 1, level: 0, canImpersonate: true },
  ADMIN: { id: 2, level: 1, canImpersonate: false },
  USER: { id: 3, level: 2, canImpersonate: false },
};
```

**Key properties**:
- `id`: Unique numeric identifier (matches backend)
- `level`: Hierarchy level (0 = highest privilege)
- `canImpersonate`: Whether role can impersonate others
- `entityType`: Optional entity required for this role

### Storage Mechanism

Impersonation state is persisted in localStorage:
- `X-Impersonate-Role-ID`
- `X-Impersonate-District-ID`
- `X-Impersonate-Coop-ID`
- `X-Impersonate-Manufacturer-ID`
- `X-Impersonate-Entity-Name`

### API Headers

When impersonating, headers are added to API requests:
```
X-Impersonate-Role-ID: 3
X-Impersonate-District-ID: 42
```

---

## Maintenance Tasks

### 1. Adding New Roles

#### Steps

1. **Update role definitions** in `types/impersonation.ts`:
   ```typescript
   export const ROLES: Record<string, RoleDefinition> = {
     // existing roles...
     NEW_ROLE: {
       id: 10,
       name: 'New Role',
       canImpersonate: false,
       level: 3,
       entityType: 'Organization', // if applicable
     },
   };
   ```

2. **Update impersonation rules** if needed:
   - Which roles can impersonate the new role?
   - Does the new role require an entity?

3. **Update documentation**:
   - README.md role table
   - INTEGRATION.md if integration steps change

4. **Verify backend alignment**:
   - Role ID matches backend
   - Entity type requirements match

#### Checklist

- [ ] Role ID is unique and matches backend
- [ ] Level is correctly positioned in hierarchy
- [ ] Entity type is correct (if applicable)
- [ ] `getImpersonatableRoles()` returns correct roles
- [ ] Documentation updated

### 2. Adding New Entity Types

#### Steps

1. **Add to EntityType** in `types/impersonation.ts`:
   ```typescript
   export type EntityType =
     | 'District'
     | 'Coop'
     | 'Manufacturer'
     | 'NewEntity'; // Add new type
   ```

2. **Update storage keys**:
   ```typescript
   export function getStorageKeys(prefix: string) {
     return {
       // existing keys...
       NEW_ENTITY_ID: `${prefix}-NewEntity-ID`,
     };
   }
   ```

3. **Update useImpersonation hook**:
   - Add loading for new entity type
   - Add saving for new entity type
   - Update header generation

4. **Update backend** to accept new header

#### Checklist

- [ ] EntityType union updated
- [ ] Storage key added
- [ ] Hook loads/saves correctly
- [ ] Header generated correctly
- [ ] Backend accepts header

### 3. Modifying UI Components

#### ImpersonationBanner

**Customization points**:
- `RoleSelector` prop for custom dropdown
- `EntitySelector` prop for custom entity picker
- `className` prop for styling

**When modifying**:
1. Maintain prop interface compatibility
2. Test with default selectors
3. Test with custom selectors
4. Verify mobile responsiveness
5. Update SCSS variables if adding new elements

#### Adding New Controls

1. Add new state to component
2. Update form submission logic
3. Add new prop types if needed
4. Update default selector if applicable
5. Document new props

### 4. Security Considerations

#### Review Checklist

When modifying impersonation logic:

- [ ] Only authorized roles can impersonate
- [ ] Users cannot impersonate higher-privilege roles
- [ ] Impersonation state cannot be spoofed client-side
- [ ] Backend validates impersonation headers
- [ ] Sensitive operations still require actual auth
- [ ] Audit logging captures impersonation events

#### Security Testing

1. Verify role hierarchy enforcement
2. Test unauthorized impersonation attempts
3. Verify backend header validation
4. Test session isolation
5. Review localStorage for sensitive data

---

## Testing Guidelines

### Unit Tests

```typescript
// Hook testing
describe('useImpersonation', () => {
  it('should not allow impersonation by non-privileged roles', () => {});
  it('should persist state to localStorage', () => {});
  it('should generate correct headers', () => {});
  it('should clear state properly', () => {});
});

// Context testing
describe('ImpersonationProvider', () => {
  it('should provide effective role when impersonating', () => {});
  it('should return actual role when not impersonating', () => {});
});
```

### Integration Tests

1. Full impersonation flow
2. API calls with impersonation headers
3. Permission checking with effective role
4. Logout clearing impersonation

### Manual Testing

- [ ] Apply impersonation as Super Admin
- [ ] Verify banner shows impersonated role
- [ ] Verify API calls include headers
- [ ] Verify permission changes take effect
- [ ] Clear impersonation
- [ ] Verify original permissions restored
- [ ] Test page reload persistence

---

## Configuration

### Config Options

```typescript
interface ImpersonationConfig {
  storageKeyPrefix: string;      // localStorage key prefix
  allowedImpersonators: number[]; // Role IDs that can impersonate
  reloadOnChange: boolean;        // Reload page on apply/clear
  onApply: (state) => void;       // Callback on apply
  onClear: () => void;            // Callback on clear
}
```

### Adding Config Options

1. Add to `ImpersonationConfig` interface
2. Add default value in `DEFAULT_CONFIG`
3. Use in hook/context as needed
4. Document in INTEGRATION.md

---

## Styling

### CSS Variables

The SCSS file uses standard values that can be customized:

```scss
// Colors
.not-impersonating { background-color: #f0f9ff; }
.impersonating { background-color: #fef3c7; }

// Customize these in your app's styles
```

### Theming

To support themes:

1. Replace hardcoded colors with CSS variables
2. Define variables in both light/dark themes
3. Use `prefers-color-scheme` for automatic switching

---

## Troubleshooting

### Common Issues

#### Impersonation not persisting

**Causes**:
- localStorage blocked
- Storage quota exceeded
- Incorrect storage key prefix

**Debug**:
```javascript
console.log(localStorage.getItem('X-Impersonate-Role-ID'));
```

#### Headers not being sent

**Causes**:
- API client not using `getImpersonationHeaders()`
- Interceptor not configured
- Wrong storage key prefix

**Debug**:
- Check network tab for headers
- Verify interceptor is registered
- Log header values before request

#### Role not in selector

**Causes**:
- Role not in ROLES definition
- Role level restricts access
- `canImpersonate` check failing

**Debug**:
```javascript
console.log(getImpersonatableRoles(currentRoleId));
```

---

## Backend Integration

### Required API Support

Backend must:

1. **Validate headers** - Check impersonation headers are present
2. **Authorize impersonation** - Verify user can impersonate target role
3. **Apply effective permissions** - Use impersonated role for authorization
4. **Audit log** - Record impersonation events

### Header Contract

```
X-Impersonate-Role-ID: number (required when impersonating)
X-Impersonate-District-ID: number (optional, entity-specific)
X-Impersonate-Coop-ID: number (optional, entity-specific)
X-Impersonate-Manufacturer-ID: number (optional, entity-specific)
```

### Backend Changes

When backend changes:

1. Verify header names match
2. Update TypeScript types if needed
3. Test header validation
4. Update documentation

---

## Migration Guide

### Upgrading from Earlier Versions

#### Breaking Changes

Document any breaking changes here with migration steps.

#### Deprecations

List deprecated features and their replacements.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Initial | Initial release with core functionality |

---

## Contacts and Resources

### Internal Documentation

- INTEGRATION.md: Step-by-step integration
- docs/SECURITY.md: Security considerations
- docs/BACKEND_API.md: Backend API specifications

### Related Template Projects (Siblings)

These are sibling projects in the same directory:

| Project | Description |
|---------|-------------|
| `template-project/` | TypeScript code generator templates |
| `client-design-guide/` | UX patterns and architectural guidance |

Each project is standalone and can be used independently.

### Backend Documentation

Reference your backend API documentation for:
- Impersonation endpoint specifications
- Header validation requirements
- Audit logging details
