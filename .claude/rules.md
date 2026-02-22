# Project-Specific Rules & Principles

Aligned with the main CLAUDE.md principles, with Glaze Graph specific guidance.

## Architecture Principles

### SOLID in Glaze Graph
- **Single Responsibility**: ItemCard component displays one item; GlazeDisplay shows glaze info
- **Open/Closed**: Add new component types without modifying existing ones
- **Liskov Substitution**: Any component rendering glaze data works the same way
- **Interface Segregation**: Small, focused props interfaces (GlazeProps, ItemProps, etc.)
- **Dependency Inversion**: App.tsx fetches data, passes down as props (not direct API calls in child components)

### DRY (Don't Repeat Yourself)
- Image URL generation logic → utility function `getItemImageUrl()`, `getGlazeImageUrl()`
- Shared types in `src/types/data.ts`
- Reusable styling patterns in `index.css`

### KISS (Keep It Simple)
- Don't add routing until needed (currently SPA, single view)
- Don't add state management (currently props-based is sufficient)
- Keep React components focused on UI, not business logic

### YAGNI (You Aren't Gonna Need It)
- No database layer (data.json only)
- No authentication (public app)
- No advanced image processing (served as-is)
- No pagination (add if list grows large)

## Code Quality Standards

### TypeScript
- All files in `frontend/src/` must be TypeScript (`.ts` or `.tsx`)
- No `any` types without explicit justification
- Interface names should clearly indicate their purpose (e.g., `GlazeItem` not `Item`)

### React Components
- Prefer composition over props drilling (pass components as props if nesting gets deep)
- Use React.memo() only if performance is measured and documented
- Error boundaries: wrap data-loading sections to prevent full app crashes

### Error Handling
- At boundaries: loading state, error message, fallback UI
- Not for internal code paths that can't fail (e.g., formatting glaze name)
- User-facing errors should be clear, not technical

### Comments
- Only when "why" isn't obvious from code
- Remove console.log() before committing (except in error paths)
- JSDoc for exported functions/components

## File Organization

```
frontend/src/
├── App.tsx                 # Root component, data loading
├── index.css              # Global styles only
├── main.tsx               # Vite entry point
├── types/
│   └── data.ts           # All type definitions
└── components/
    ├── ItemCard.tsx       # Displays single item with glazes
    ├── GlazeDisplay.tsx   # Displays single glaze + image
    └── HealthCheck.tsx    # Shows app health status
```

## Image Handling

### Convention
- Item images: `/data/images/items/{itemId}.jpg`
- Glaze images: `/data/images/glazes/{glazeName with underscores}.jpg`
- Space-to-underscore conversion happens in utility functions, not in component code

### Implementation
```typescript
// src/utils/images.ts (add if it grows)
export const getItemImageUrl = (itemId: string) =>
  `/data/images/items/${itemId}.jpg`

export const getGlazeImageUrl = (glazeName: string) =>
  `/data/images/glazes/${glazeName.replace(/\s+/g, '_')}.jpg`
```

## Docker & DevOps

### Dockerfile Rules
- Multi-stage builds for minimal final image
- Alpine base images where appropriate
- Never include secrets, .env files, or node_modules in final image
- Health check: React app's ability to load data.json

### Volume Mounting
- `/app/data` is read-only (mounted from TrueNAS)
- `data.json` is validated at app startup
- Image files don't need validation (404 if missing is acceptable)

## Git & Commits

### When to Commit
- Each logical change: features, fixes, refactors get own commits
- Don't mix multiple features in one commit
- Don't commit generated files (dist/, node_modules)

### Commit Message Format
- Conventional commits: `type: description`
- Focus on "why", not "what"
- No force pushes to main

### Branch Strategy
- Develop on feature branches
- PR to main triggers CI
- Main branch is deployment-ready

## Dependencies

### Pinning Strategy
- Latest stable versions on initial setup (green field)
- Lock file (package-lock.json) prevents version drift
- Minor/patch updates are OK, major versions discussed first

### Current Versions
- Node: 24.13.1 LTS
- React: 19.2.4
- Vite: 7.3.1
- TypeScript: 5.9.3
- ESLint: 10.0.1 (flat config)

## Security

### Input Validation
- Validate data.json structure on load (malformed file should show error)
- Don't trust file paths from data.json (no path traversal)
- Image 404s are OK (user responsibility to add images)

### Secrets
- Never commit `.env` files
- GitHub Actions use GITHUB_TOKEN (automatically managed)
- No API keys in code (none needed yet)

## Testing Strategy

### Current Approach
- Manual testing in browser (edit data, refresh)
- CI builds and type-checks (catches breaking changes)
- Visual regression: screenshots before/after major UI changes

### Future Testing
- When app grows: integration tests for data loading
- Component snapshot tests if complex UI logic added
- E2E tests if TrueNAS deployment validation needed

## Performance

### Current Considerations
- Vite dev server is fast enough locally
- Docker build caching via GitHub Actions
- Images served with correct MIME types (Caddy auto-detects)

### Optimization (if needed)
- Lazy load images only if list grows beyond 100 items
- Image optimization: pre-compress .jpg files on TrueNAS
- Caddy gzip compression for data.json (automatic)

## Future Extensibility

### Adding a Python Backend
1. Create `backend/` directory with FastAPI app
2. Backend reads from `/app/data` same volume
3. React can fetch from `/api/*` endpoints via Caddy proxying
4. Update Caddyfile to route `/api/*` to backend service
5. Docker compose adds backend service

### Adding More Features
1. Keep each feature in its own component/file
2. If components share logic, extract to custom hook or utility
3. Update types in `src/types/data.ts` as needed
4. Document new features in README.md

## Questions to Ask Before Implementation

Ask before making changes if:
- Architectural decisions affect multiple components
- Adding new dependencies
- Changing data.json schema (impacts TrueNAS users)
- Significant refactors that touch multiple files

Proceed independently for:
- Bug fixes
- Component styling/UI improvements
- Documentation updates
- Small feature additions within existing architecture
