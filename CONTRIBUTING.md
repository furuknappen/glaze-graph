# Contributing to Glaze Graph

Thank you for your interest in contributing! This document provides guidelines for developing and contributing to the project.

## Development Setup

### Prerequisites
- Node.js 24.13.1 or later
- Git
- Docker & Docker Compose (for testing Docker builds)

### Initial Setup

1. Clone the repository
   ```bash
   git clone https://github.com/furuknappen/glaze-graph.git
   cd glaze-graph
   ```

2. Install dependencies
   ```bash
   cd frontend
   npm install
   ```

3. Create local data folder for testing
   ```bash
   cd ..
   mkdir -p data/images/{items,glazes}
   ```

## Development Workflow

### 1. Create a feature branch
```bash
git checkout -b feature/my-feature
```

Branch naming convention:
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for code reorganization

### 2. Make your changes

**For React code:**
- Keep components in `frontend/src/components/`
- Add types to `frontend/src/types/data.ts` if needed
- Follow the component patterns in `.claude/skills/react-vite.md`

**For Docker/DevOps:**
- Update `Dockerfile` or `Caddyfile` as needed
- Update `docker-compose.yml` for local testing changes

**For CI/CD:**
- Update workflow files in `.github/workflows/`
- Test workflows locally if possible

### 3. Code Quality

**Run linting:**
```bash
cd frontend
npm run lint
```

**Type-check:**
```bash
npm run build
```

**Fix common issues:**
- ESLint: `npm run lint` will show issues
- TypeScript: `npm run build` will show type errors

### 4. Test Locally

**With Vite dev server (fastest):**
```bash
cd frontend
npm run dev
```

**With Docker (production-like):**
```bash
cd frontend && npm run build && cd ..
docker compose up
```

### 5. Commit your changes

Follow conventional commit format:

```
feat: Add glaze search functionality
fix: Correct image loading bug
docs: Update installation instructions
refactor: Extract image URL logic to utils
chore: Update dependencies
style: Format code with prettier
```

**Commit message guidelines:**
- Start with type: `feat`, `fix`, `docs`, `refactor`, `chore`, `style`
- Use lowercase, no period at the end
- Be concise but descriptive
- Focus on "why", not just "what"

Examples:
```
feat: add pagination for item lists
fix: prevent memory leak in data fetching
docs: document data.json schema
```

### 6. Push and create a Pull Request

```bash
git push origin feature/my-feature
```

Then open a PR on GitHub. Ensure:
- PR title follows conventional commit format
- Description explains what and why
- CI checks pass (GitHub Actions)
- Code is tested locally

## Code Style

### TypeScript/React

**File naming:**
- Components: PascalCase (e.g., `ItemCard.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Types: descriptive names (e.g., `data.ts`)

**Component structure:**
```typescript
import { useState, useEffect } from 'react'

interface Props {
  title: string
  count?: number
}

export default function MyComponent({ title, count = 0 }: Props) {
  const [state, setState] = useState(false)

  useEffect(() => {
    // Side effects
  }, [])

  return <div>{title}</div>
}
```

**Imports:**
- Group by: React → 3rd party → local
- One blank line between groups
- Alphabetical order within groups

**Error handling:**
```typescript
try {
  const response = await fetch('/data/data.json')
  if (!response.ok) throw new Error('Failed to load')
  const data = await response.json()
} catch (error) {
  console.error('Error:', error)
  setError(error instanceof Error ? error.message : 'Unknown error')
}
```

### Comments

- Write self-documenting code
- Comments only for "why", not "what"
- No commented-out code
- JSDoc for exported functions

❌ Bad:
```typescript
// Add 1 to count
setCount(count + 1)
```

✅ Good:
```typescript
// Increment to trigger data refresh
setCount(count + 1)
```

### CSS

- Use descriptive class names
- Follow mobile-first responsive design
- Use flexbox/grid for layouts
- Use CSS variables if repeating values

## Testing

### Manual Testing

1. **Test locally with Vite:**
   ```bash
   cd frontend && npm run dev
   ```
   - Edit `data/data.json`
   - Add/remove images
   - Refresh browser
   - Verify changes appear

2. **Test with Docker:**
   ```bash
   docker compose up
   ```
   - Same steps as above
   - Verify no build errors
   - Test at http://localhost

3. **Test data validation:**
   - Create invalid `data.json`
   - Verify error message displays
   - Verify app doesn't crash

### Automated Testing

CI/CD runs automatically on push:
- ESLint linting
- TypeScript type-checking
- Vite build
- Docker build (main branch only)

Fix any failures before merging:
```bash
npm run lint              # Fix linting errors
npm run build             # Fix type errors
docker compose up --build # Test Docker build
```

## Documentation

### README Updates

If adding features, update `README.md`:
- Add to Features section if user-facing
- Add to Project Structure if directory changes
- Add troubleshooting if common issues
- Add examples for new functionality

### Code Documentation

- Add JSDoc for exported functions
- Add comments for complex logic
- Update `.claude/` skills if patterns change

Example JSDoc:
```typescript
/**
 * Converts a glaze name to a URL-safe filename
 * @param glazeName - Glaze name (e.g., "Honey Flux")
 * @returns URL-safe filename (e.g., "Honey_Flux.jpg")
 */
export const getGlazeImageUrl = (glazeName: string): string => {
  // ...
}
```

## Common Tasks

### Adding a New Component

1. Create `frontend/src/components/MyComponent.tsx`
2. Add types to `frontend/src/types/data.ts` if needed
3. Import in parent component
4. Test locally with Vite dev server

### Updating Data Schema

1. Update `frontend/src/types/data.ts`
2. Update `README.md` Data Format section
3. Update `.claude/` skills if patterns change
4. Test with sample data

### Modifying Docker Build

1. Update `frontend/Dockerfile` or `Caddyfile`
2. Test with Docker Compose: `docker compose up --build`
3. Test image build: `docker build -f frontend/Dockerfile -t glaze-graph .`

### Updating CI/CD

1. Edit workflow in `.github/workflows/`
2. Commit and push
3. Check Actions tab for results
4. Fix any failures

## Git Workflow

### Before Committing

```bash
cd frontend
npm run lint      # Fix linting issues
npm run build     # Ensure TypeScript compiles
```

### Before Pushing

1. Rebase on main if needed
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Force-push only to your feature branch
   ```bash
   git push --force-with-lease origin feature/my-feature
   ```

### Merging to Main

- Only maintainers can merge PRs
- All CI checks must pass
- At least one review required
- Delete branch after merge

## Questions?

- Check `.claude/rules.md` for project principles
- Check `.claude/architecture.md` for system design
- Check `.claude/skills/` for patterns and examples
- Review existing code for conventions

## Recognition

All contributors will be recognized in the project. Thank you for helping!
