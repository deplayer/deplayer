# Deplayer Agent Guidelines

This document provides build commands and code style guidelines for agentic coding agents working in the Deplayer repository.

## Build, Lint, and Test Commands

### Core Commands
- `npm run dev` - Start development server on 127.0.0.1
- `npm run build` - Production build (runs TypeScript compiler + Vite)
- `npm run lint` - Run ESLint with zero warnings allowed
- `npm run preview` - Preview production build

### Test Commands
- `npm test` - Run all tests (Vitest with --watch=false)
- `npm run test:watch` - Run tests in watch mode
- `npm run coverage` - Run tests with coverage report

### Running Single Tests
Run a specific test file:
```bash
npm test -- path/to/file.spec.ts
```

Run tests matching a pattern:
```bash
npm test -- --grep "test name"
```

### Database Commands
- `npm run db:generate` - Generate Drizzle migrations and compile them

### Code Quality
- `npm run knip` - Detect unused files, exports, and dependencies
- `npm run roomba` - Auto-fix dead code issues

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** - All type checking rules are active
- **No unused locals/parameters** - Code must not include unused variables
- **No import React** - JSX transform handles React imports automatically
- **Target ES2020** with moduleResolution: "bundler"

### Imports and Exports
- Prefer named exports over default exports
- Group imports: external libs first, then internal modules
- Use absolute imports from `@/` alias when available
- Example:
  ```typescript
  import { useState } from 'react'
  import Media from '../entities/Media'
  import { formatTime } from '../utils/timeFormatter'
  ```

### Naming Conventions
- **Components**: PascalCase (e.g., `PlayAllButton.tsx`)
- **Functions/Variables**: camelCase (e.g., `formatDuration`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase with 'I' prefix optional (e.g., `IMedia`)
- **Classes**: PascalCase (e.g., `MediaMergerService`)

### File Organization
```
src/
├── components/        # React components
│   ├── common/       # Reusable shared components
│   └── [feature]/    # Feature-specific components
├── containers/       # Redux-connected components
├── entities/         # Domain entities/classes
├── services/         # Business logic services
├── utils/            # Utility functions
├── store/            # Redux store configuration
├── sagas/            # Redux saga effects
└── styles/           # Global styles
```

### React Component Guidelines
- Use functional components with hooks
- Define Props interface above component
- Use Tailwind CSS + DaisyUI for styling
- Use `classnames` library for conditional classes
- Add `data-testid` attributes for test selectors
- Example:
  ```typescript
  type Props = {
    onClick: () => void
    children: ReactNode
    disabled?: boolean
  }

  const Button = ({ onClick, children, disabled }: Props) => {
    const classNames = classnames({
      'btn': true,
      'disabled:opacity-50': disabled
    })
    return <button className={classNames} onClick={onClick}>{children}</button>
  }
  ```

### Testing Guidelines
- Test files must be next to implementation with `.spec.ts` or `.spec.tsx` extension
- Use Vitest with `describe`, `it`, `expect` from 'vitest'
- Use factory functions from `src/test-utils/factories.ts` for test data
- **Do not use `getByTitle` in tests** (forbidden rule)
- Mock external dependencies with `vi.mock()`
- Clean up after each test with `cleanup()` or `afterEach`
- Use test isolation: beforeEach/afterEach to reset state
- Example:
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen, fireEvent } from '@testing-library/react'

  describe('ComponentName', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render correctly', () => {
      render(<Component />)
      expect(screen.getByTestId('component')).toBeInTheDocument()
    })
  })
  ```

### Error Handling
- Use try-catch for async operations
- Return error objects or throw with descriptive messages
- Use proper TypeScript typing for error states
- Example:
  ```typescript
  const fetchData = async () => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch data:', error)
      throw error
    }
  }
  ```

### Redux Guidelines
- Use Redux Toolkit for store configuration
- Use redux-saga for async operations
- Containers connect components to Redux state
- Actions use SCREAMING_SNAKE_CASE (e.g., `PLAY_ALL`)
- Use `mapStateToProps` and `mapDispatchToProps` or hooks

### Styling Guidelines
- Use Tailwind CSS utility classes
- DaisyUI components for UI primitives
- Custom SCSS in `src/styles/` for complex styles
- Use `classnames` library for conditional styling

### Linting Rules
- **Zero warnings policy** - `--max-warnings 0`
- Run lint before committing
- Fix lint errors automatically when possible
- Never disable lint rules without team consensus
- Use `// eslint-disable-next-line` sparingly with explanations

### Type Definitions
- Prefer `interface` for object shapes
- Use `type` for unions, primitives, and utility types
- Export interfaces when used across files
- Use readonly modifiers for immutable data
- Example:
  ```typescript
  interface IMedia {
    id: string
    title: string
    duration?: number
  }

  type MediaType = 'audio' | 'video'
  ```

### LiveStore Guidelines
This project is migrating to LiveStore. When working with LiveStore:
- **Documentation lookup**: When you need to look up information about LiveStore, always use the `docs` directory shipped with `@livestore/livestore` package in `node_modules/@livestore/livestore/docs`
- LiveStore documentation is available locally in the node_modules directory

### Additional Cursor Rules
This project includes Cursor IDE rules in `.cursor/rules/`:
- **Taskmaster integration** - Task management workflow
- **Development workflow** - MCP server vs CLI interaction
- **Self improvement** - Guidelines for updating rules based on patterns

Review these rules when making architectural decisions or workflow improvements.
