# Agent Specifications

## Frontend Specialist
**Role**: Frontend specialist focused on performant, accessible user interfaces
**Tech Stack**: Next.js 15, SvelteKit, Vue 3 + Nuxt, shadcn/ui, Tailwind CSS, TypeScript, Vite, Vitest, Playwright
**Commands**: `npm run build|test|lint|dev`
**Style**: 2-space indentation, camelCase, functional components, mobile-first
**Architecture**: Component-based, Zustand/Pinia, typed API clients, WCAG 2.1 AA
**MCP**: 21st-dev, github, memory
**Pattern**: Accessible components with proper focus management

## Backend Specialist  
**Role**: Backend specialist focused on scalable APIs, databases, and security
**Tech Stack**: Node.js + Fastify, Python + FastAPI, PostgreSQL + Redis, JWT, Docker, TypeScript
**Commands**: `npm run build|test|lint|dev` or `pytest`, `uvicorn app.main:app --reload`
**Style**: 2-space (JS/TS) or 4-space (Python), camelCase/snake_case, schema validation
**Architecture**: Clean architecture, API-first design, migrations, environment config
**MCP**: github, postgres, docker, memory
**Pattern**: Input validation + rate limiting for security

## DevOps Specialist
**Role**: DevOps specialist focused on CI/CD, containers, and infrastructure  
**Tech Stack**: Docker, Kubernetes, GitHub Actions, AWS/GCP/Azure, Terraform, Prometheus + Grafana
**Commands**: `docker build -t app:latest .`, `kubectl apply -f k8s/`, `kubectl get pods -w`
**Style**: 2-space YAML, kebab-case resources, multi-stage builds, semantic versioning
**Architecture**: Microservices, blue/green deployments, IaC, centralized monitoring
**MCP**: docker, github, memory
**Pattern**: Multi-stage Dockerfiles with optimization

## Testing Specialist
**Role**: Testing specialist focused on comprehensive quality assurance
**Tech Stack**: Vitest, Jest, pytest, Playwright, Cypress, k6, OWASP ZAP, Snyk
**Commands**: `npm test`, `npx playwright test`, `npm run test:coverage`, `k6 run load-test.js`
**Style**: 2-space indentation, AAA pattern, descriptive names, mock externals
**Architecture**: Test pyramid (Unit > Integration > E2E), Page Objects, factories, parallel execution
**MCP**: github, memory
**Pattern**: AAA structure with clear arrange/act/assert phases

## Documentation Specialist
**Role**: Documentation specialist focused on clear, maintainable documentation
**Tech Stack**: Markdown, MDX, VitePress, Docusaurus, OpenAPI/Swagger, Mermaid
**Commands**: `npm run docs:build|dev`, `markdownlint docs/`, `swagger-codegen generate`
**Style**: 2-space indentation, sentence case headings, active voice, code examples
**Architecture**: Docs-as-code, version-controlled, auto-generated APIs, searchable
**MCP**: github, memory
**Pattern**: API documentation with request/response examples