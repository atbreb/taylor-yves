# Frontend Development Guidelines

This document provides guidelines for Claude Code when working on the frontend application.

## Core Principles

### 1. Modularity First
- **Keep files under 500 lines of code**
- Break down large components into smaller, reusable pieces
- Extract complex logic into custom hooks
- Create utility functions in separate files
- Use composition over inheritance

### 2. File Organization

```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── (routes)/          # Route groups
│   └── actions.ts         # Server actions (max 500 lines)
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── features/         # Feature-specific components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── theme/                # Mantine theme configuration
└── types/                # TypeScript type definitions
```

### 3. Component Guidelines

#### Component Size Limits
- **Maximum 500 lines per file**
- If a component exceeds 300 lines, consider refactoring
- Extract sub-components into separate files
- Move complex logic to custom hooks

#### Component Structure
```typescript
// 1. Imports (grouped by category)
import { useState } from 'react'
import { Button, Card } from '@mantine/core'
import { CustomHook } from '@/hooks/useCustomHook'
import { helperFunction } from '@/lib/utils'

// 2. Types/Interfaces
interface ComponentProps {
  title: string
  onAction: () => void
}

// 3. Component Definition
export function Component({ title, onAction }: ComponentProps) {
  // 4. State and Hooks
  const [state, setState] = useState()
  const customData = CustomHook()

  // 5. Event Handlers
  const handleClick = () => {
    // Handler logic
  }

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### 4. When to Split Files

Split into separate files when:
- **File exceeds 500 lines** (hard limit)
- **File exceeds 300 lines** (recommended limit)
- Component has multiple distinct sections
- Logic can be reused elsewhere
- Testing would be easier with smaller units

#### Example: Large Form Component
```typescript
// ❌ Bad: Everything in one 800-line file
// apps/web/src/app/settings/environment/page.tsx (800 lines)

// ✅ Good: Split into modules
// apps/web/src/app/settings/environment/page.tsx (150 lines)
// apps/web/src/components/environment/GroupSidebar.tsx (100 lines)
// apps/web/src/components/environment/VariableList.tsx (120 lines)
// apps/web/src/components/environment/VariableCard.tsx (80 lines)
// apps/web/src/hooks/useEnvironmentGroups.ts (100 lines)
```

### 5. Mantine UI Standards

- **Always use Mantine components** over custom Tailwind implementations
- Use theme-aware colors: `c="dimmed"`, not hardcoded colors
- Use Mantine's responsive props: `span={{ base: 12, md: 6 }}`
- Leverage Mantine hooks: `useComputedColorScheme`, `useMantineTheme`

#### Color Usage
```typescript
// ❌ Bad: Hardcoded colors
<div className="bg-gray-900 text-gray-100">

// ✅ Good: Theme-aware
<Card withBorder>
  <Text c="dimmed">
```

### 6. State Management

- Use React hooks for local state
- Server Actions for data fetching and mutations
- No client-side state management library needed (unless complexity demands it)

### 7. Custom Hooks Guidelines

Create custom hooks when:
- Logic is reused across multiple components
- Component exceeds 200 lines due to state management
- Side effects need to be encapsulated

```typescript
// apps/web/src/hooks/useEnvironmentGroups.ts
export function useEnvironmentGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    // Loading logic
  }

  return { groups, loading, loadGroups }
}
```

### 8. Server Actions

- Keep Server Actions files under 500 lines
- Group related actions together
- One action file per feature/route
- Use TypeScript for type safety

```typescript
// apps/web/src/app/settings/environment/actions.ts
'use server'

export async function getEnvironmentGroups() { }
export async function saveEnvironmentGroups() { }
export async function deleteGroup() { }
```

### 9. Code Quality Standards

#### TypeScript
- Enable strict mode
- Define interfaces for all props
- Use type inference where possible
- No `any` types (use `unknown` if needed)

#### Naming Conventions
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with 'use' prefix (`useAuth.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

#### Imports
- Group imports: React → Third-party → Local
- Use absolute imports with `@/` alias
- Avoid circular dependencies

### 10. Performance Considerations

- Use `'use client'` directive only when necessary
- Leverage Server Components by default
- Implement code splitting for large features
- Optimize images with Next.js Image component
- Memoize expensive calculations with `useMemo`

### 11. Accessibility

- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure keyboard navigation works
- Maintain proper heading hierarchy
- Test with screen readers

### 12. Testing Strategy

- Unit tests for utilities and hooks
- Integration tests for complex components
- E2E tests for critical user flows
- Keep test files co-located with source files

## File Size Checklist

Before committing, verify:
- [ ] No file exceeds 500 lines
- [ ] Components are focused and single-responsibility
- [ ] Complex logic extracted to hooks or utilities
- [ ] Reusable code is properly abstracted
- [ ] Types are defined in separate files if shared

## Refactoring Triggers

Refactor when you notice:
1. File approaching 400 lines
2. Multiple unrelated functions in one file
3. Repeated code blocks
4. Difficult to test in isolation
5. Hard to understand at a glance

## Example: Good Modular Structure

```typescript
// ✅ apps/web/src/app/dashboard/page.tsx (120 lines)
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function DashboardPage() {
  const { stats, loading } = useDashboardData()

  if (loading) return <Loader />

  return (
    <Stack>
      <DashboardStats data={stats} />
      <DashboardChart data={stats} />
    </Stack>
  )
}

// ✅ apps/web/src/components/dashboard/DashboardStats.tsx (80 lines)
export function DashboardStats({ data }: Props) {
  return (
    <Grid>
      {data.map(stat => <StatCard key={stat.id} {...stat} />)}
    </Grid>
  )
}

// ✅ apps/web/src/hooks/useDashboardData.ts (60 lines)
export function useDashboardData() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData().then(setStats).finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
```

## Summary

- **Modularity**: Break code into small, focused files
- **500 Line Limit**: Hard limit per file
- **Mantine First**: Use Mantine components, not custom Tailwind
- **Type Safety**: Leverage TypeScript fully
- **Composition**: Build complex UIs from simple components
- **Readability**: Code should be self-documenting

Following these guidelines ensures a maintainable, scalable, and high-quality codebase.
