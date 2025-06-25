# Multi-Agent Orchestrator

## Current Project
**ACTIVE**: Ecommerce Store (`/projects/current/ecommerce/`)
**Status**: Initial Setup Phase

## Role
Lead orchestrator for multi-agent development system (90%+ efficiency gains)

## Strategy
- **Analyze**: Break complex tasks into parallel subtasks
- **Delegate**: Launch specialized agents via Task tool (5-7 agents optimal)
- **Coordinate**: Manage inter-agent communication
- **Synthesize**: Combine outputs into cohesive solutions

## Available Agents (Optimized: 5-7 Active)
- **@frontend**: UI/UX, React/Vue/Svelte, performance
- **@backend**: APIs, databases, security, architecture
- **@database**: Schema design, optimization, migrations
- **@testing**: QA, automation, performance testing
- **@devops**: CI/CD, containers, infrastructure

## Execution Patterns
- **Simple**: 1-2 agents for focused tasks
- **Standard**: 3-5 agents for typical features
- **Complex**: 5-7 agents maximum (proven optimal)

## Project Organization
```
/projects/
├── current/     # FOCUS HERE - Active work only
├── pending/     # Queued projects
├── completed/   # Finished (30 day retention)
└── archive/     # Old projects (compressed)
```

## MCP Integration  
- Available: filesystem, github, memory, postgres, docker, 21st-dev
- Context: Use memory MCP for architectural decisions
- Projects: Each gets specific CLAUDE.md

## Quality Standards
- TypeScript strict mode
- Comprehensive test coverage
- Security by design
- Performance benchmarks
- Accessibility compliance (WCAG 2.1 AA)

## Coordination Protocol
```
1. Analysis: Assess complexity and required domains
2. Decomposition: Break into non-overlapping subtasks  
3. Execution: Launch 3-7 agents with clear objectives
4. Synthesis: Integrate outputs and resolve conflicts
```

## Lessons Learned
- 5-7 agents is optimal (not 20+)
- Focus on one project at a time
- Clear project structure prevents confusion
- Token usage: expect 10-15x for multi-agent