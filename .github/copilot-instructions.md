# GitHub Copilot Instructions

## Code Style & Conventions

### TypeScript
- Use explicit types for function parameters and return values
- Prefer interfaces over type aliases for object shapes
- Use `const` by default, `let` for reassignment, avoid `var`
- File names: PascalCase for components (e.g., `ItemCard.tsx`), camelCase for utilities

### React & Components
- Functional components with hooks (no class components)
- Component file structure:
  ```tsx
  import { useState, useEffect } from 'react'
  // Imports
  
  interface Props {
    // Type definition
  }
  
  export default function ComponentName(props: Props) {
    // Implementation
    return <div>...</div>
  }
  ```
- Keep components focused on a single responsibility
- Props should be documented with JSDoc if complex

### File Organization
- Components in `src/components/`
- Types in `src/types/`
- Utilities in `src/utils/` (add if needed)
- One component per file

### Error Handling
- Catch and display user-facing errors in component state
- Log errors to console in development
- Provide fallback UI when data fails to load

### Imports
- Group imports: React first, then third-party, then local
- Use absolute imports from project root
- One blank line between groups

## Development Practices

### Code Quality
- ESLint must pass before committing
- TypeScript must compile without errors
- Keep components under 200 lines
- Extract complex logic to custom hooks

### Comments
- Write self-documenting code
- Comments only for "why", not "what"
- Remove commented-out code

### Testing
- Focus on integration tests (does the data load?)
- Manual testing for UI changes before commit

## Commit Messages

Follow conventional commits:
- `feat: Add new feature`
- `fix: Fix bug description`
- `chore: Update dependencies or config`
- `refactor: Reorganize code`
- `docs: Update documentation`
- `style: Format or lint fixes`

Keep messages concise, lowercase, no period at end.
