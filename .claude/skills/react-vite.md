# React + Vite Patterns for Glaze Graph

## Vite Configuration

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    port: 5173,
    open: true,
  },
})
```

**Key settings:**
- `outDir: 'dist'` - Output location (mounted to Caddy as /app/www)
- `sourcemap: false` - Production mode, no debug files
- `minify: 'terser'` - Smallest possible bundle

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForModule": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "moduleResolution": "bundler",
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## React Component Patterns

### Functional Components
```typescript
interface Props {
  title: string
  count?: number
}

export default function MyComponent({ title, count = 0 }: Props) {
  return <div>{title}: {count}</div>
}
```

**Always use:**
- Functional components (not class components)
- TypeScript interfaces for props
- Default values in destructure or separate logic
- Export default at bottom of file

### Hooks Best Practices

#### useState
```typescript
const [data, setData] = useState<DataConfig | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

**Pattern:**
- Separate state for data, loading, error
- Use null for "not loaded", not undefined
- Provide type annotation immediately

#### useEffect
```typescript
useEffect(() => {
  let isMounted = true
  
  const fetchData = async () => {
    try {
      const res = await fetch('/data/data.json')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      if (isMounted) setData(json)
    } catch (err) {
      if (isMounted) setError(err instanceof Error ? err.message : 'Unknown')
    } finally {
      if (isMounted) setLoading(false)
    }
  }
  
  fetchData()
  return () => { isMounted = false }
}, [])
```

**Pattern:**
- Use cleanup function to prevent state updates on unmounted component
- Separate fetch logic into async function
- Always provide error handling
- Empty dependency array `[]` = run once on mount

### Conditional Rendering
```typescript
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error}</div>
if (!data) return <div>No data</div>

return <div>{/* render data */}</div>
```

**Pattern:**
- Check states in order: loading → error → empty → render
- Early return for cleaner component body
- Don't render content until all states resolved

### Composition Over Props Drilling
```typescript
// ❌ Bad: Props drilling multiple levels
<Parent>
  <Child item={item} onSelect={onSelect} theme={theme} locale={locale} />
</Parent>

// ✅ Good: Pass children directly
<Parent item={item} onSelect={onSelect}>
  <CustomChild theme={theme} locale={locale} />
</Parent>
```

### Custom Hooks
```typescript
function useDataLoader(url: string) {
  const [data, setData] = useState<DataConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [url])
  
  return { data, error, loading }
}

// Usage in component:
const { data, error, loading } = useDataLoader('/data/data.json')
```

**Pattern:**
- Extract complex logic into custom hooks
- Returns object with data, error, loading states
- Reusable across components

## TypeScript in React

### Props Interface
```typescript
interface ItemCardProps {
  item: GlazeItem
  onSelect?: (itemId: string) => void
}

export default function ItemCard({ item, onSelect }: ItemCardProps) {
  // ...
}
```

### Event Handlers
```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault()
  // Handle click
}

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.currentTarget.value
  // Handle change
}
```

### Generic Components
```typescript
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

export default function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>
}
```

## Styling Patterns

### CSS Module Approach
```typescript
// styles.module.css
.container {
  display: grid;
  gap: 1rem;
}

// Component.tsx
import styles from './Component.module.css'

export default function Component() {
  return <div className={styles.container}>...</div>
}
```

### Global Styles
```css
/* index.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}
```

### Inline Styles (Minimal)
```typescript
const styles = {
  container: { display: 'flex', gap: '1rem' },
  button: { padding: '0.5rem 1rem' },
} as const

export default function Component() {
  return <div style={styles.container}>...</div>
}
```

## Error Handling in Components

### Error Boundary (Future)
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>
    }
    return this.props.children
  }
}
```

### Validation Helper
```typescript
function validateData(data: unknown): data is DataConfig {
  return (
    typeof data === 'object' &&
    data !== null &&
    'links' in data &&
    Array.isArray(data.links)
  )
}

// Usage:
try {
  const json = await res.json()
  if (!validateData(json)) throw new Error('Invalid data format')
} catch (err) {
  setError('Data format error')
}
```

## Image Handling

### Utility Functions
```typescript
// src/utils/images.ts
export const getItemImageUrl = (itemId: string): string =>
  `/data/images/items/${itemId}.jpg`

export const getGlazeImageUrl = (glazeName: string): string => {
  const normalized = glazeName.replace(/\s+/g, '_')
  return `/data/images/glazes/${normalized}.jpg`
}
```

### Image Component with Fallback
```typescript
interface ImageProps {
  src: string
  alt: string
  className?: string
}

export default function Image({ src, alt, className }: ImageProps) {
  const [error, setError] = useState(false)
  
  if (error) {
    return <div className={className}>Image not found</div>
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}
```

## Data Fetching Patterns

### Simple Fetch
```typescript
useEffect(() => {
  const controller = new AbortController()
  
  fetch('/data/data.json', { signal: controller.signal })
    .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false))
  
  return () => controller.abort()
}, [])
```

### With Timeout
```typescript
const fetchWithTimeout = (url: string, timeout = 5000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ])
}
```

## Testing Patterns

### Component Test Example (Vitest)
```typescript
import { render, screen } from '@testing-library/react'
import ItemCard from './ItemCard'
import { GlazeItem } from '../types/data'

const mockItem: GlazeItem = {
  itemId: '1',
  item: 'Test Item',
  description: 'Test',
  temperature: 'Cone 6',
  glaze: ['Test Glaze'],
}

test('renders item title', () => {
  render(<ItemCard item={mockItem} />)
  expect(screen.getByText('Test Item')).toBeInTheDocument()
})
```

## Build & Deploy

### Local Build
```bash
npm run build
# Creates frontend/dist/ with optimized files
```

### Docker Build
```bash
docker build -f frontend/Dockerfile -t glaze-graph .
# Multi-stage: builds React, serves with Caddy
```

### Development Mode
```bash
npm run dev
# Vite dev server with HMR on localhost:5173
```

## Performance Tips

### Bundle Analysis
```bash
npm install -D @vitejs/plugin-visualize
# Then check dist/ size
```

### Lazy Loading
```typescript
const ItemDetails = lazy(() => import('./ItemDetails'))

<Suspense fallback={<div>Loading...</div>}>
  <ItemDetails />
</Suspense>
```

### Memoization (Use Sparingly)
```typescript
const MemoizedItemCard = memo(ItemCard, (prev, next) => {
  return prev.item.itemId === next.item.itemId
})
```

**Only use if:**
- Parent re-renders frequently
- Performance is measured and documented
- Props comparison is simple
