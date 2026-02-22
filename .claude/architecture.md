# Glaze Graph - System Architecture

## Overview

Glaze Graph is a web application that displays ceramic glaze combinations and items. The app is designed to run on TrueNAS via Docker, with a React frontend served by Caddy HTTP server.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                  (loads & displays app)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                    GET / (index.html)
                    GET /data/data.json
                    GET /data/images/...
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Caddy (Port 80)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /            → /app/www/index.html (React app)       │ │
│  │  /data/*      → /app/data/* (mounted volume)          │ │
│  │  SPA fallback → 404s rewrite to index.html            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                           │
         │                           │
    /app/www                     /app/data
    (built React)            (TrueNAS mounted)
         │                           │
    ├─ index.html          ├─ data.json
    ├─ main.js             └─ images/
    ├─ index.css               ├─ items/
    └─ ...                      │   ├─ 1.jpg
                                │   ├─ 2.jpg
                                │   └─ ...
                                └─ glazes/
                                    ├─ Chun_Plum.jpg
                                    ├─ Honey_Flux.jpg
                                    └─ ...
```

## Data Flow

### 1. App Initialization
```
Browser loads /
    ↓
Caddy serves index.html from /app/www
    ↓
React app mounts (App.tsx)
    ↓
useEffect fetches /data/data.json
    ↓
data.json loaded from /app/data volume
    ↓
App renders ItemCard components for each item in links
```

### 2. Rendering Items & Glazes
```
For each item in data.json:
    ↓
ItemCard receives item props
    ↓
Reads itemId, generates image URL: /data/images/items/{itemId}.jpg
    ↓
For each glaze in item.glaze array:
        ↓
        GlazeDisplay component
        ↓
        Converts "Honey Flux" → "Honey_Flux"
        ↓
        Generates URL: /data/images/glazes/Honey_Flux.jpg
        ↓
        Serves from Caddy (mounted /app/data)
```

### 3. Content Updates (Live)
```
User edits /mnt/tank/glaze-graph/data.json on TrueNAS
    ↓
User refreshes browser
    ↓
Browser fetches /data/data.json again
    ↓
New data loads, app re-renders
    ↓
No container reload needed
```

## Component Structure

```
App.tsx (root)
├─ header
│  ├─ h1 "Glaze Graph"
│  └─ HealthCheck
│      └─ Shows "✓ Healthy" or error
│
└─ main
   └─ ItemCard[] (for each item in data.json)
      ├─ item title & description
      ├─ temperature
      └─ GlazeDisplay[] (for each glaze in item)
         ├─ glaze name
         └─ glaze image
```

## Volume Mount Strategy

### Single Mount Point: `/app/data`

**Advantages:**
- Simple TrueNAS configuration
- Single mount point for all data
- Easy to backup entire app state
- Scalable for future backend integration

**Structure:**
```
/app/data/
├── data.json              # Item & glaze metadata
└── images/
    ├── items/             # Item images (e.g., 1.jpg, 2.jpg)
    └── glazes/            # Glaze images (e.g., Honey_Flux.jpg)
```

**On TrueNAS:**
```
/mnt/tank/glaze-graph/
├── data.json
└── images/
    ├── items/
    └── glazes/
```

**In Docker:**
```bash
docker run -v /mnt/tank/glaze-graph:/app/data ...
```

## Image Handling Convention

### Naming Rules
- **Item images**: Filename = `{itemId}.jpg`
  - Example: Item with `itemId: "1"` → `/data/images/items/1.jpg`
  
- **Glaze images**: Filename = `{glaze name with spaces replaced by underscores}.jpg`
  - Example: "Honey Flux" → `/data/images/glazes/Honey_Flux.jpg`
  - Example: "Blue Rutile" → `/data/images/glazes/Blue_Rutile.jpg`

### No Manifest Required
- React app derives image URLs from data.json
- Missing images result in 404 (acceptable, user responsibility)
- All files must be `.jpg` format

## Docker Build Strategy

### Multi-Stage Build

**Stage 1: Build (Node)**
- Base: `node:24-lts-alpine`
- Install dependencies: `npm ci`
- Build Vite app: `npm run build`
- Output: `/app/dist` (React build artifacts)

**Stage 2: Runtime (Caddy)**
- Base: `caddy:2.10.2`
- Copy built app: `/app/dist` → `/app/www`
- Copy Caddyfile: serves `/app/www` and `/app/data`
- Expose: port 80
- Volume: `/app/data` (mounted from TrueNAS)

### Benefits
- Final image: ~30MB (lightweight)
- Build dependencies not included in final image
- Caddy handles all HTTP serving (no Node runtime overhead)
- Auto MIME types, gzip, 404 fallback

## HTTP Server Configuration (Caddy)

### Routes

```caddy
:80 {
    # Serve React app (static files from /app/www)
    root /app/www
    file_server
    
    # Serve mounted data (data.json, images)
    handle /data/* {
        root /app/data
        file_server
    }
    
    # SPA fallback: rewrite 404s to index.html
    handle_errors {
        rewrite 404.html
        file_server
    }
}
```

### Key Features
- **Static file serving**: Vite build output (index.html, main.js, etc.)
- **Mounted volume serving**: data.json and images from `/app/data`
- **SPA routing**: Non-existent routes → index.html (React Router can handle them)
- **MIME types**: Auto-detected (text/html, application/json, image/jpeg, etc.)
- **Gzip compression**: Automatic for text files

## Local Development vs. Production

### Local (docker-compose.yml)
```yaml
volumes:
  - ./data:/app/data:ro          # Local ./data folder
  - ./frontend/dist:/app/www:ro  # Vite build output
```

**Workflow:**
1. `npm run build` (creates ./frontend/dist)
2. Edit ./data/data.json or add images
3. `docker compose up`
4. Refresh browser to see changes

### Production (TrueNAS)
```bash
docker run -v /mnt/tank/glaze-graph:/app/data ...
```

**Workflow:**
1. Pull image: `docker pull ghcr.io/furuknappen/glaze-graph:latest`
2. Edit `/mnt/tank/glaze-graph/data.json` or add images
3. Refresh browser to see changes
4. New deployments: pull new image, restart container

## CI/CD Pipeline

### Continuous Integration (ci.yml)
**Triggers:** Every push (all branches)

1. Checkout code
2. Setup Node 24
3. Install dependencies
4. Lint (ESLint)
5. Type-check (TypeScript)
6. Build (Vite)
7. Report: ✓ pass or ✗ fail

### Docker Build & Push (docker-build.yml)
**Triggers:** Push to main only

1. Build multi-stage Docker image
2. Tag with:
   - `ghcr.io/furuknappen/glaze-graph:latest`
   - `ghcr.io/furuknappen/glaze-graph:{commit-sha}`
3. Push to GitHub Container Registry (GHCR)

**Result:** TrueNAS can pull and run immediately

## Data Format

### data.json

```json
{
  "links": [
    {
      "itemId": "1",
      "item": "Chun Plum under oatmeal",
      "description": "Beautiful combination...",
      "temperature": "Cone 6",
      "glaze": ["Chun Plum", "Oatmeal"]
    }
  ]
}
```

### TypeScript Types

```typescript
// src/types/data.ts

export interface GlazeItem {
  itemId: string
  item: string
  description: string
  temperature: string
  glaze: string[]
}

export interface DataConfig {
  links: GlazeItem[]
}
```

## Error Handling

### App-Level Errors
- Failed to load data.json → Show error message, suggest refresh
- Invalid JSON → Show parsing error
- Missing images → Show placeholder (404 is OK)

### Component-Level Errors
- ItemCard rendering errors → Caught by error boundary (future)
- GlazeDisplay image load failures → Show alt text

### No Recovery Logic Needed
- Images are optional (nice to have)
- data.json structure is user's responsibility
- App gracefully degrades if images missing

## Future Extensibility

### Adding Python FastAPI Backend
1. Create `backend/` directory with FastAPI app
2. Backend service in docker-compose.yml
3. Backend reads `/app/data` (same mount point)
4. Update Caddyfile to proxy `/api/*` to backend
5. React app calls `/api/*` endpoints

**Benefits:**
- No container reload for data changes
- Backend can perform calculations, transformations
- Same data.json + images used by both frontend and backend

### Adding Database
1. Keep mounted volume for user files (data.json, images)
2. Add database service (PostgreSQL) for derived data
3. Backend syncs from mounted files to DB if needed
4. Frontend still reads from API (backend)

### Scaling Images
1. Add image optimization in backend (compress, convert formats)
2. Add pagination in React (load items on scroll)
3. Add caching headers in Caddy (browser + CDN cache)

## Security Considerations

### Current Implementation
- App is read-only from browser perspective
- No authentication (public, internal network assumed)
- No user input processing

### If Adding Backend
- Validate data.json schema on load
- Sanitize file paths (no `../` traversal)
- Rate limit API endpoints
- Add HTTPS via Caddy (auto with Let's Encrypt if needed)

### Secrets Management
- GitHub Actions: GITHUB_TOKEN (built-in, no setup needed)
- TrueNAS: No secrets needed (public image, no API keys)

## Performance

### Current State
- Vite build: ~2-3 seconds
- Docker build: ~20-30 seconds (includes Node layer)
- App load: ~500ms (fetch data.json + render)
- Image load: ~1-3 seconds each (depends on image size)

### Optimization (if needed)
- Lazy load images (Intersection Observer API)
- Pre-compress images on TrueNAS
- Add HTTP caching headers in Caddy
- Code splitting with Vite (automatic)

## Monitoring & Health Checks

### Current Health Check
- React app successfully loads `/data/data.json`
- Displayed in HealthCheck component
- Manual: Visit app URL, look for content

### TrueNAS Monitoring (future)
- Caddy exposes `/health` endpoint (200 OK if serving)
- Docker health check: `curl http://localhost/`
- Monitor `/var/log/container/glaze-graph` for errors

## Deployment Checklist

### Local Development
- [ ] Clone repo
- [ ] `npm install && npm run build` in `frontend/`
- [ ] Create `./data/` folder with data.json and images
- [ ] `docker compose up`
- [ ] Visit http://localhost
- [ ] Verify images and data display

### Production (TrueNAS)
- [ ] Pull latest image: `docker pull ghcr.io/furuknappen/glaze-graph:latest`
- [ ] Create `/mnt/tank/glaze-graph/` with data.json and images
- [ ] Run container with volume mount
- [ ] Verify app loads at container IP
- [ ] Setup auto-pull on GitHub release (future)
