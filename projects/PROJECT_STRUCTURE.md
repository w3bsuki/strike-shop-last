# Project Organization Structure

## Directory Structure

```
/projects/
├── current/          # Active project(s) - agents work here
│   └── [project-name]/
├── pending/          # Queued projects waiting to start
│   └── [project-name]/
├── completed/        # Finished projects for reference
│   └── [project-name]/
└── archive/          # Old projects (compressed/cleaned)
```

## Rules

### 1. Current Projects
- **Maximum 1-2 projects** in current at once (focus!)
- Each project gets dedicated agent worktrees
- Clear CLAUDE.md for project-specific instructions
- Active monitoring and daily progress

### 2. Pending Projects
- Projects waiting to start
- Should include:
  - PROJECT_BRIEF.md
  - Initial requirements
  - Priority level
  - Estimated timeline

### 3. Completed Projects
- Move here when deployed/finished
- Keep for 30 days for reference
- Include COMPLETION_REPORT.md
- Document lessons learned

### 4. Archive
- Projects older than 30 days
- Compressed to save space
- Minimal documentation retained

## Project Structure Template

```
[project-name]/
├── CLAUDE.md              # Project-specific agent instructions
├── PROJECT_BRIEF.md       # Requirements and goals
├── README.md              # Project documentation
├── .gitignore            
├── src/                   # Source code
├── tests/                 # Test files
├── docs/                  # Documentation
└── .agent-workspaces/     # Agent worktrees (Git)
    ├── frontend/
    ├── backend/
    ├── testing/
    └── devops/
```

## Workflow

1. **New Project**: Create in `pending/` with PROJECT_BRIEF.md
2. **Start Project**: Move to `current/` when ready
3. **Active Work**: Agents focus only on `current/` projects
4. **Completion**: Move to `completed/` with report
5. **Archive**: After 30 days, compress and move to `archive/`

## Benefits

- **Clear Focus**: Agents only work on current projects
- **No Confusion**: Prevents cross-project contamination  
- **Easy Tracking**: Visual project status
- **Clean History**: Completed work preserved
- **Efficient**: Reduced cognitive load

## Agent Configuration

When starting a new project:

```bash
# 1. Move project to current
mv projects/pending/ecommerce projects/current/

# 2. Initialize agent worktrees
cd projects/current/ecommerce
./scripts/setup-project-agents.sh

# 3. Update master CLAUDE.md
echo "CURRENT_PROJECT: ecommerce" >> /home/w3bsuki/MATRIX/CLAUDE.md
```