# Glaze Graph

A web application for displaying ceramic glaze combinations and items. Built with React + Vite and served by Caddy, designed to run on TrueNAS via Docker.

## Features

- **Dynamic Data Loading**: Load glaze and item data from `data.json`
- **Image Gallery**: Display item and glaze images from mounted volume
- **Live Updates**: Edit data and images without container restart
- **Health Monitoring**: Visual health status indicator
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### Prerequisites

- Node.js 24.13.1 or later
- Docker & Docker Compose (for container deployment)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/furuknappen/glaze-graph.git
   cd glaze-graph
   ```

2. **Create data folder structure**
   ```bash
   mkdir -p data/images/{items,glazes}
   ```

3. **Add sample data**
   Create `data/data.json` with your glaze and item data (see [Data Format](#data-format) below).

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Build the app**
   ```bash
   npm run build
   ```

6. **Start with Docker Compose**
   ```bash
   cd ..
   docker compose up
   ```

7. **Visit the app**
   Open http://localhost in your browser

### Local Development with Vite Dev Server (Hot Reload)

For faster iteration with hot module reloading:

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 (Vite dev server).

Edit data by placing files in `data/` folder, then refresh the browser to see changes.

## Data Format

### data.json Structure

```json
{
  "links": [
    {
      "itemId": "1",
      "item": "Chun Plum under oatmeal",
      "description": "A beautiful combination of Chun Plum glaze over an oatmeal base.",
      "temperature": "Cone 6",
      "glaze": [
        "Chun Plum",
        "Oatmeal"
      ]
    }
  ]
}
```

**Fields:**
- `itemId` (string): Unique identifier for the item (maps to image file name)
- `item` (string): Display name of the item
- `description` (string): Description of the item
- `temperature` (string): Firing temperature (can be empty)
- `glaze` (array of strings): List of glaze names used

### Image Folder Structure

```
data/
├── data.json
└── images/
    ├── items/
    │   ├── 1.jpg
    │   ├── 2.jpg
    │   └── ...
    └── glazes/
        ├── Chun_Plum.jpg
        ├── Oatmeal.jpg
        ├── Honey_Flux.jpg
        └── ...
```

**Rules:**
- Item images: Filename = `{itemId}.jpg`
- Glaze images: Filename = `{glaze name with spaces replaced by underscores}.jpg`
- All images must be `.jpg` format
- Missing images will show a placeholder (not an error)

## Docker & TrueNAS Deployment

### Building the Docker Image

```bash
docker build -f frontend/Dockerfile -t glaze-graph:latest .
```

### Running with Docker

```bash
docker run -d \
  --name glaze-graph \
  -p 80:80 \
  -v /path/to/data:/app/data:ro \
  glaze-graph:latest
```

### Deploying to TrueNAS

1. **Prepare data on NAS**
   ```bash
   mkdir -p /mnt/tank/glaze-graph/images/{items,glazes}
   cp your-data.json /mnt/tank/glaze-graph/data.json
   cp your-images/* /mnt/tank/glaze-graph/images/
   ```

2. **Pull the image from GitHub Container Registry**
   ```bash
   docker pull ghcr.io/furuknappen/glaze-graph:latest
   ```

3. **Run the container**
   ```bash
   docker run -d \
     --name glaze-graph \
     -p 80:80 \
     -v /mnt/tank/glaze-graph:/app/data:ro \
     ghcr.io/furuknappen/glaze-graph:latest
   ```

4. **Access the app**
   Visit `http://<truenas-ip>` in your browser

### Updating the App

1. **Update code and push to GitHub**
   ```bash
   git push origin main
   ```

2. **GitHub Actions will:**
   - Run CI checks (lint, type-check, build)
   - Build and push Docker image to GHCR
   - Tag with commit SHA and `latest`

3. **Pull and restart on TrueNAS**
   ```bash
   docker pull ghcr.io/furuknappen/glaze-graph:latest
   docker stop glaze-graph
   docker rm glaze-graph
   # Re-run the docker run command above
   ```

### Updating Data Without Restarting

Simply edit files in `/mnt/tank/glaze-graph/` and refresh your browser. No container restart needed!

## Project Structure

```
glaze-graph/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                # Lint, type-check, build
│   │   └── docker-build.yml      # Build and push Docker image
│   └── copilot-instructions.md   # GitHub Copilot guidelines
│
├── .claude/
│   ├── skills/                   # Reusable Claude/Copilot skills
│   │   ├── react-vite.md
│   │   ├── docker-caddy.md
│   │   └── github-actions.md
│   ├── rules.md                  # Project-specific rules
│   └── architecture.md           # System design documentation
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Vite entry point
│   │   ├── index.css            # Global styles
│   │   ├── App.css              # App-specific styles
│   │   ├── utils.ts             # Utility functions
│   │   ├── types/
│   │   │   └── data.ts          # Type definitions
│   │   └── components/
│   │       ├── ItemCard.tsx
│   │       ├── GlazeDisplay.tsx
│   │       └── HealthCheck.tsx
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── Dockerfile               # Multi-stage Docker build
│   ├── .dockerignore
│   └── package.json
│
├── data/                        # Local development data (git-ignored)
│   ├── data.json
│   └── images/
│       ├── items/
│       └── glazes/
│
├── Caddyfile                    # HTTP server configuration
├── docker-compose.yml           # Local development setup
├── README.md                    # This file
├── CONTRIBUTING.md              # Development guidelines
└── .editorconfig                # Editor configuration
```

## Development

### Available Scripts

**In `frontend/` directory:**

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Adding Components

Components go in `frontend/src/components/`. Each component should:
- Be in its own `.tsx` file
- Use functional components with hooks
- Have TypeScript prop interfaces
- Be exported as default export

Example:
```typescript
// frontend/src/components/MyComponent.tsx
interface Props {
  title: string
}

export default function MyComponent({ title }: Props) {
  return <div>{title}</div>
}
```

### Using the Data

The `App` component loads `data.json` on mount via `useEffect`. The data is passed down to `ItemCard` components via props. Child components shouldn't fetch data directly.

### Styling

- Global styles in `frontend/src/index.css`
- Component-specific styles can go in component files or a CSS module
- CSS follows mobile-first responsive design

## GitHub Actions CI/CD

### CI Workflow (on every push)
- Lint code with ESLint
- Type-check with TypeScript
- Build with Vite
- Report results as PR check

### Docker Build Workflow (on main branch only)
- Build multi-stage Docker image
- Tag with `latest` and commit SHA
- Push to GitHub Container Registry (GHCR)

## Configuration Files

- **`vite.config.ts`**: Vite build settings
- **`tsconfig.json`**: TypeScript compiler settings
- **`eslint.config.js`**: Code quality rules (ESLint 10.x flat config)
- **`Caddyfile`**: HTTP server routing and file serving
- **`.editorconfig`**: Editor formatting rules

## Troubleshooting

### App shows "Error: Failed to load data"
- Check that `/data/data.json` exists and is valid JSON
- Verify the file is readable by the container
- Check Docker logs: `docker logs glaze-graph`

### Images not showing
- Verify image files exist in the correct folder
- Check file names match the naming convention (spaces → underscores)
- All images must be `.jpg` format
- 404 errors for missing images are normal (shows placeholder)

### Docker build fails
- Ensure all files are committed to git
- Check Node version: `node --version` (should be ≥24.13.1)
- Verify Dockerfile path: should be `frontend/Dockerfile`

### Can't connect to container on TrueNAS
- Verify port 80 is not already in use
- Check container is running: `docker ps`
- Try accessing via container IP: `docker inspect glaze-graph | grep IPAddress`
- View logs: `docker logs glaze-graph`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Development workflow
- Code style and conventions
- Commit message format
- Pull request process

## AI Integration

This project is set up for AI-assisted development with:

- **GitHub Copilot**: See `.github/copilot-instructions.md`
- **Claude/OpenCode**: See `.claude/` directory for skills and rules
  - `rules.md`: Project-specific principles and conventions
  - `architecture.md`: System design and decisions
  - `skills/`: Reusable patterns for React, Docker, and GitHub Actions

## Future Features

- [ ] Add database integration (PostgreSQL)
- [ ] Add Python FastAPI backend
- [ ] Add user authentication
- [ ] Add image optimization
- [ ] Add pagination for large item lists
- [ ] Add search and filtering

## License

MIT

## Support

For issues or questions, please visit the GitHub repository and open an issue.
