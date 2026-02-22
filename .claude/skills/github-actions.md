# GitHub Actions Patterns for Glaze Graph

## Workflow Structure

### Basic Workflow File
```yaml
name: Workflow Name

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: action/name@version
        with:
          param: value
```

**Key Sections:**
- `name`: Displayed in GitHub UI
- `on`: When to trigger (push, PR, schedule, manual)
- `jobs`: Define work to do
- `steps`: Individual tasks in a job

## Glaze Graph Workflows

### CI Workflow (ci.yml)

**Purpose:** Lint, type-check, build on every push

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: npm ci
        working-directory: frontend
      
      - name: Lint
        run: npm run lint
        working-directory: frontend
      
      - name: Type check
        run: npx tsc --noEmit
        working-directory: frontend
      
      - name: Build
        run: npm run build
        working-directory: frontend
```

**Key Features:**
- Runs on every push and PR
- Uses Node cache for faster installs
- `working-directory`: Runs in frontend/ folder
- `npm ci`: Cleaner installs than npm install (for CI)

### Docker Build Workflow (docker-build.yml)

**Purpose:** Build and push Docker image on main branch

```yaml
name: Docker Build & Push

on:
  push:
    branches:
      - main

jobs:
  docker:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./frontend/Dockerfile
          push: true
          tags: |
            ghcr.io/furuknappen/glaze-graph:latest
            ghcr.io/furuknappen/glaze-graph:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Key Features:**
- Only runs on main branch (production builds)
- Uses GITHUB_TOKEN (automatic, no setup needed)
- GitHub Actions cache for faster Docker builds
- Multiple tags: latest and commit SHA
- `permissions`: Grants necessary access

## Common Workflow Patterns

### Conditional Steps
```yaml
- name: Publish
  if: github.ref == 'refs/heads/main'
  run: npm publish
```

### Matrix Builds (Multiple Configs)
```yaml
strategy:
  matrix:
    node-version: [20, 22]
    os: [ubuntu-latest, macos-latest]

runs-on: ${{ matrix.os }}

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

### Caching Dependencies
```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Artifacts (Upload Build Output)
```yaml
- name: Upload dist
  uses: actions/upload-artifact@v4
  with:
    name: frontend-build
    path: frontend/dist/

- name: Download dist
  uses: actions/download-artifact@v4
  with:
    name: frontend-build
```

### Environment Variables
```yaml
env:
  NODE_ENV: production
  LOG_LEVEL: info

steps:
  - run: echo $NODE_ENV  # Can access in scripts
```

### Outputs (Pass Data Between Steps)
```yaml
- name: Version
  id: version
  run: echo "version=1.0.0" >> $GITHUB_OUTPUT

- name: Use version
  run: echo ${{ steps.version.outputs.version }}
```

## Secret Management

### Using Secrets in Workflows

**Setting Secret in GitHub:**
1. Go to Settings → Secrets and variables → Actions
2. New repository secret: `MY_SECRET` = `value`

**Using in Workflow:**
```yaml
- name: Deploy
  env:
    API_KEY: ${{ secrets.MY_SECRET }}
  run: deploy.sh
```

**For Glaze Graph:**
- No secrets needed (public image, public registry)
- GITHUB_TOKEN is automatic (don't define)

### Protecting Secrets
```yaml
# ✅ Good: Secret masked in logs
- run: curl -H "Authorization: Bearer ${{ secrets.TOKEN }}" ...

# ❌ Bad: Secret might be visible
- run: echo ${{ secrets.TOKEN }}
```

## Docker Build Best Practices in CI

### Cache Layers
```yaml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha              # Load from Actions cache
    cache-to: type=gha,mode=max       # Save to Actions cache
```

**Result:** Subsequent builds reuse layers, 10-100x faster

### Build Context
```yaml
- uses: docker/build-push-action@v6
  with:
    context: .                         # Build context
    file: ./frontend/Dockerfile        # Dockerfile path
    push: ${{ github.ref == 'refs/heads/main' }}  # Only push to main
```

### Buildx for Multi-Platform
```yaml
- uses: docker/setup-buildx-action@v3
  with:
    driver-options: network=host       # Faster builds

- uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64 # Build for multiple platforms
```

## Testing in CI

### Running Tests
```yaml
- name: Test
  run: npm test
  working-directory: frontend
```

### Coverage Reports
```yaml
- name: Coverage
  run: npm run test:coverage
  working-directory: frontend

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./frontend/coverage/lcov.info
```

## Status Badges

### Add to README
```markdown
![CI](https://github.com/furuknappen/glaze-graph/workflows/CI/badge.svg)
![Docker](https://github.com/furuknappen/glaze-graph/workflows/Docker%20Build%20&%20Push/badge.svg)
```

**URL Format:**
```
https://github.com/{owner}/{repo}/workflows/{workflow-name}/badge.svg
```

## Debugging Workflows

### View Workflow Runs
1. Go to Actions tab in GitHub
2. Click workflow to see runs
3. Click run to see logs
4. Click step to expand details

### Add Debug Output
```yaml
- name: Debug
  run: |
    echo "Ref: ${{ github.ref }}"
    echo "Actor: ${{ github.actor }}"
    echo "SHA: ${{ github.sha }}"
```

### Enable Debug Logging
```yaml
- name: Enable debug
  run: |
    echo "RUNNER_DEBUG=1" >> $GITHUB_ENV
```

## Common Issues & Fixes

### Node Modules Cache Not Working
**Problem:** Dependencies reinstall every time

**Solution:**
```yaml
- uses: actions/setup-node@v4
  with:
    cache: npm
    cache-dependency-path: frontend/package-lock.json
```

### Docker Build Fails
**Problem:** "Cannot find Dockerfile"

**Solution:**
```yaml
- uses: docker/build-push-action@v6
  with:
    context: .
    file: ./frontend/Dockerfile  # Explicit path
```

### Secrets Not Available
**Problem:** `secrets.MY_SECRET` is empty

**Solution:**
1. Check secret name (case-sensitive)
2. Secret must exist in Settings → Secrets
3. Re-run workflow after creating secret

### Timeout in Steps
**Problem:** Step takes too long

**Solution:**
```yaml
- name: Long step
  run: npm run build
  timeout-minutes: 30  # Default is 360 (6 hours)
```

## GitHub Actions Expressions

### Context Variables
```yaml
${{ github.ref }}           # Branch name
${{ github.sha }}           # Commit hash
${{ github.actor }}         # Username
${{ github.event_name }}    # What triggered (push, pull_request)
${{ github.workspace }}     # Work directory
```

### Conditionals
```yaml
if: github.ref == 'refs/heads/main'
if: github.event_name == 'pull_request'
if: contains(github.event.head_commit.message, 'skip ci')
if: success()  # Previous step succeeded
if: always()   # Always run, even if previous failed
```

### String Functions
```yaml
startsWith('hello', 'he')    # true
endsWith('hello', 'lo')      # true
contains('hello', 'ell')     # true
format('{0}-{1}', 'a', 'b')  # a-b
```

## Useful Actions

### Official Actions
- `actions/checkout@v4` - Clone repo
- `actions/setup-node@v4` - Setup Node.js
- `actions/upload-artifact@v4` - Upload files
- `actions/download-artifact@v4` - Download files
- `actions/cache@v4` - Cache directories

### Docker Actions
- `docker/setup-buildx-action@v3` - Setup Buildx
- `docker/login-action@v3` - Login to registry
- `docker/build-push-action@v6` - Build & push image

### Popular Third-Party
- `codecov/codecov-action@v3` - Upload coverage
- `actions/create-release@v1` - Create release
- `softprops/action-gh-release@v1` - GitHub release

## Workflow Scheduling

### Scheduled Workflows
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Manual Workflow Dispatch
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options:
          - production
          - staging
```

**Usage:** Click "Run workflow" button in Actions tab

## Performance Optimization

### Quick Tips
1. **Cache Node modules** - Setup node with cache enabled
2. **Docker layer cache** - Use `cache-from: type=gha`
3. **Parallel jobs** - Run independent jobs simultaneously
4. **Skip CI** - Include `[skip ci]` in commit message

### Example Optimized Workflow
```yaml
name: Fast CI

on: [push]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci && npm run lint
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci && npm test
  
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]  # Runs after lint & test
    if: success()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci && npm run build
```

**Result:** lint and test run in parallel, build waits for both
