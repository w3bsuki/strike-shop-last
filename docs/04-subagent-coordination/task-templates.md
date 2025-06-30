# Task Templates for Subagent Coordination

> **Standardized templates for consistent task documentation and communication**

## 📋 Table of Contents

- [Task Creation Template](#task-creation-template)
- [Progress Update Template](#progress-update-template)
- [Code Review Template](#code-review-template)
- [Bug Report Template](#bug-report-template)
- [Feature Request Template](#feature-request-template)
- [Architecture Decision Template](#architecture-decision-template)
- [Performance Analysis Template](#performance-analysis-template)
- [Documentation Template](#documentation-template)

---

## Task Creation Template

Use this template when creating new tasks for agent assignment.

```markdown
# Task: [Task Title]

## 📋 Basic Information
- **Task ID**: TASK-YYYY-MM-DD-XXX
- **Assigned Agent**: [Agent Name/Role]
- **Created By**: [Creator Name]
- **Priority**: [High/Medium/Low] 🔴🟡🟢
- **Category**: [Architecture/Implementation/Testing/Documentation/Performance]
- **Estimated Effort**: [Hours/Days]
- **Due Date**: YYYY-MM-DD

## 🎯 Objective
[Clear, concise description of what needs to be accomplished]

## 📝 Detailed Description
[Comprehensive explanation of the task requirements, context, and constraints]

## ✅ Acceptance Criteria
- [ ] Criterion 1: [Specific, measurable requirement]
- [ ] Criterion 2: [Another specific requirement]
- [ ] Criterion 3: [Quality/performance requirement]
- [ ] Final verification: [Overall completion requirement]

## 🔗 Dependencies
### Upstream Dependencies (Required Before Starting)
- [ ] Dependency 1: [Description and status]
- [ ] Dependency 2: [Description and status]

### Downstream Dependencies (Affected by This Task)
- [ ] Impact 1: [What will be affected and how]
- [ ] Impact 2: [Another impact or dependent task]

## 📚 Resources
### Required Knowledge
- [Technology/framework knowledge needed]
- [Domain knowledge required]
- [Previous work to reference]

### Reference Materials
- [Link to relevant documentation]
- [Previous implementation examples]
- [External resources]

## 🧪 Testing Requirements
- [ ] Unit tests for new functionality
- [ ] Integration tests for system interactions
- [ ] Performance testing if applicable
- [ ] Manual testing checklist

## 📖 Documentation Requirements
- [ ] Code comments and documentation
- [ ] API documentation updates
- [ ] User guide updates if applicable
- [ ] Architecture documentation updates

## 🎯 Success Metrics
- **Quality**: [How quality will be measured]
- **Performance**: [Performance benchmarks if applicable]
- **Completeness**: [How completion will be verified]

## 💬 Communication Plan
- **Progress Updates**: [Frequency and format]
- **Review Points**: [When reviews will occur]
- **Stakeholders**: [Who needs to be kept informed]

## 🚨 Risks & Mitigation
- **Risk 1**: [Description] → **Mitigation**: [How to address]
- **Risk 2**: [Description] → **Mitigation**: [How to address]

## 📅 Timeline
- **Start Date**: YYYY-MM-DD
- **Milestone 1**: [Description] - YYYY-MM-DD
- **Milestone 2**: [Description] - YYYY-MM-DD
- **Completion Date**: YYYY-MM-DD

---
**Created**: YYYY-MM-DD HH:MM  
**Last Updated**: YYYY-MM-DD HH:MM  
**Status**: [Not Started/In Progress/Blocked/Completed]
```

---

## Progress Update Template

Use this template for regular progress updates on assigned tasks.

```markdown
# Progress Update: [Task Title]

## 📋 Basic Information
- **Task ID**: TASK-YYYY-MM-DD-XXX
- **Agent**: [Your Name/Role]
- **Update Date**: YYYY-MM-DD
- **Overall Progress**: [X]% Complete
- **Status**: [On Track/At Risk/Blocked/Completed]

## ✅ Completed This Period
- [Specific accomplishment 1]
- [Specific accomplishment 2]
- [Specific accomplishment 3]

## 🚧 In Progress
- [Current work item 1] - [Progress %]
- [Current work item 2] - [Progress %]

## 📅 Planned for Next Period
- [ ] [Planned task 1]
- [ ] [Planned task 2]
- [ ] [Planned task 3]

## 🚨 Blockers & Issues
### Current Blockers
- **Blocker 1**: [Description]
  - **Impact**: [How it affects progress]
  - **Resolution Needed**: [What needs to happen]
  - **ETA**: [When resolution is expected]

### Resolved Issues
- **Issue 1**: [Description] → **Resolution**: [How it was solved]

## 📊 Quality Metrics
- **Tests Written**: [Number] new tests
- **Code Coverage**: [Percentage] for new code
- **Performance Impact**: [Description if applicable]
- **Documentation**: [Updates made]

## 💬 Requests for Help
- **Request 1**: [What help is needed and from whom]
- **Request 2**: [Another request]

## 🔄 Dependencies Update
- **Upstream**: [Status of dependencies this task needs]
- **Downstream**: [Impact on tasks that depend on this one]

## 📈 Timeline Assessment
- **Original Estimate**: [Original completion date]
- **Current Estimate**: [Updated completion date]
- **Variance**: [Explanation if there's a change]

## 💡 Lessons Learned
- [Important learning or insight from this period]
- [Process improvement suggestion]

---
**Next Update Due**: YYYY-MM-DD
```

---

## Code Review Template

Use this template when conducting code reviews.

```markdown
# Code Review: [PR/Commit Title]

## 📋 Review Information
- **Reviewer**: [Your Name]
- **Author**: [Code Author]
- **Review Date**: YYYY-MM-DD
- **PR/Commit**: [Link to PR or commit hash]
- **Files Changed**: [Number] files, [Number] lines

## 🎯 Review Focus
- [ ] Functionality - Does the code work as intended?
- [ ] Code Quality - Is the code clean and maintainable?
- [ ] Performance - Are there any performance concerns?
- [ ] Security - Are there any security vulnerabilities?
- [ ] Testing - Is the code adequately tested?
- [ ] Documentation - Is the code properly documented?

## ✅ Positive Feedback
- [What was done well]
- [Good practices observed]
- [Clever solutions or improvements]

## 🔧 Required Changes
### Critical Issues (Must Fix)
- **Issue 1**: [Description]
  - **Location**: [File and line number]
  - **Problem**: [What's wrong]
  - **Solution**: [Suggested fix]

### Suggestions (Should Consider)
- **Suggestion 1**: [Description and reasoning]
- **Suggestion 2**: [Another improvement opportunity]

## 📊 Quality Assessment
- **Code Style**: [Follows standards/Needs improvement]
- **Test Coverage**: [Adequate/Needs more tests]
- **Performance**: [No concerns/Potential issues]
- **Security**: [Secure/Vulnerabilities found]
- **Documentation**: [Well documented/Needs improvement]

## 🧪 Testing Notes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance testing if applicable

## 🎯 Overall Recommendation
- [ ] **Approve** - Ready to merge
- [ ] **Approve with Minor Changes** - Small fixes needed
- [ ] **Request Changes** - Significant issues need resolution
- [ ] **Reject** - Major problems, needs substantial rework

## 💬 Additional Comments
[Any other feedback, questions, or discussion points]

---
**Review Completed**: YYYY-MM-DD HH:MM
```

---

## Bug Report Template

Use this template when reporting bugs or issues.

```markdown
# Bug Report: [Brief Description]

## 📋 Bug Information
- **Bug ID**: BUG-YYYY-MM-DD-XXX
- **Reported By**: [Your Name]
- **Date Reported**: YYYY-MM-DD
- **Severity**: [Critical/High/Medium/Low]
- **Priority**: [P1/P2/P3/P4]
- **Component**: [Affected component/module]

## 🎯 Summary
[Brief description of the bug]

## 🔍 Detailed Description
[Comprehensive description of the issue]

## 📱 Environment
- **Browser**: [Browser name and version]
- **OS**: [Operating system]
- **Device**: [Desktop/Mobile/Tablet]
- **Screen Size**: [If relevant]
- **Version**: [Application version]

## 🔄 Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]
4. [Continue until bug appears]

## ✅ Expected Behavior
[What should happen]

## ❌ Actual Behavior
[What actually happens]

## 📸 Evidence
- **Screenshots**: [Attach relevant screenshots]
- **Console Errors**: [Any error messages]
- **Network Issues**: [API failures, etc.]
- **Performance Data**: [If performance-related]

## 🎯 Impact
- **User Impact**: [How this affects users]
- **Business Impact**: [How this affects business goals]
- **Frequency**: [How often this occurs]

## 💡 Potential Solution
[If you have ideas for fixing the issue]

## 🔗 Related Issues
- [Link to related bugs or features]
- [Link to relevant documentation]

## 📋 Acceptance Criteria for Fix
- [ ] [Specific requirement for the fix]
- [ ] [Another requirement]
- [ ] [Verification step]

---
**Status**: [Open/In Progress/Resolved/Closed]  
**Assigned To**: [Developer name if assigned]
```

---

## Architecture Decision Template

Use this template when documenting architectural decisions.

```markdown
# Architecture Decision Record: [Decision Title]

## 📋 Decision Information
- **ADR ID**: ADR-YYYY-MM-DD-XXX
- **Date**: YYYY-MM-DD
- **Status**: [Proposed/Accepted/Deprecated/Superseded]
- **Decision Makers**: [Names of key decision makers]
- **Impact Level**: [High/Medium/Low]

## 🎯 Context
[What is the architectural challenge or opportunity?]

## 📋 Decision
[What is the architecture decision and the rationale behind it?]

## 🔍 Considered Options
### Option 1: [Option Name]
**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

### Option 2: [Option Name]
**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Disadvantage 1]
- [Disadvantage 2]

## ✅ Chosen Solution
[Detailed description of the chosen approach]

### Rationale
[Why this option was selected]

### Trade-offs
[What we're giving up to get the benefits]

## 📊 Consequences
### Positive
- [Positive outcome 1]
- [Positive outcome 2]

### Negative
- [Negative outcome 1]
- [Negative outcome 2]

### Neutral
- [Neutral change 1]
- [Neutral change 2]

## 🛠️ Implementation Plan
1. [Implementation step 1]
2. [Implementation step 2]
3. [Implementation step 3]

## 📈 Success Metrics
- [How success will be measured]
- [Key performance indicators]
- [Quality metrics]

## 🔄 Review Schedule
- **Initial Review**: [Date]
- **Follow-up Review**: [Date]
- **Success Evaluation**: [Date]

## 🔗 References
- [Link to relevant documentation]
- [External resources]
- [Related ADRs]

---
**Last Updated**: YYYY-MM-DD  
**Next Review**: YYYY-MM-DD
```

---

## Performance Analysis Template

Use this template when analyzing performance issues or improvements.

```markdown
# Performance Analysis: [Analysis Title]

## 📋 Analysis Information
- **Analysis ID**: PERF-YYYY-MM-DD-XXX
- **Analyst**: [Your Name]
- **Date**: YYYY-MM-DD
- **Scope**: [What was analyzed]
- **Environment**: [Production/Staging/Development]

## 🎯 Objective
[What performance aspect is being analyzed]

## 📊 Current Metrics
### Core Web Vitals
- **LCP (Largest Contentful Paint)**: [Current value] (Target: [Target value])
- **FID (First Input Delay)**: [Current value] (Target: [Target value])
- **CLS (Cumulative Layout Shift)**: [Current value] (Target: [Target value])

### Additional Metrics
- **Page Load Time**: [Current value]
- **Bundle Size**: [Current value]
- **Time to Interactive**: [Current value]
- **Server Response Time**: [Current value]

## 🔍 Analysis Results
### Performance Bottlenecks
1. **Bottleneck 1**: [Description]
   - **Impact**: [Performance impact]
   - **Root Cause**: [Why this is happening]
   - **Severity**: [High/Medium/Low]

2. **Bottleneck 2**: [Description]
   - **Impact**: [Performance impact]
   - **Root Cause**: [Why this is happening]
   - **Severity**: [High/Medium/Low]

### Opportunities for Improvement
1. **Opportunity 1**: [Description]
   - **Potential Gain**: [Expected improvement]
   - **Effort Required**: [Implementation effort]
   - **Priority**: [High/Medium/Low]

## 💡 Recommendations
### High Priority (Immediate Action)
- [ ] **Recommendation 1**: [Description]
  - **Expected Impact**: [Performance improvement]
  - **Implementation Effort**: [Time/complexity]
  - **Dependencies**: [What's needed]

### Medium Priority (Next Sprint)
- [ ] **Recommendation 2**: [Description]
  - **Expected Impact**: [Performance improvement]
  - **Implementation Effort**: [Time/complexity]

### Low Priority (Future Consideration)
- [ ] **Recommendation 3**: [Description]
  - **Expected Impact**: [Performance improvement]
  - **Implementation Effort**: [Time/complexity]

## 📈 Implementation Plan
### Phase 1: Quick Wins
1. [Quick fix 1] - [Expected completion]
2. [Quick fix 2] - [Expected completion]

### Phase 2: Medium-term Improvements
1. [Improvement 1] - [Expected completion]
2. [Improvement 2] - [Expected completion]

### Phase 3: Long-term Optimizations
1. [Optimization 1] - [Expected completion]
2. [Optimization 2] - [Expected completion]

## 🎯 Success Criteria
- **Target LCP**: [Target value]
- **Target FID**: [Target value]
- **Target CLS**: [Target value]
- **Bundle Size Reduction**: [Target percentage]

## 📊 Monitoring Plan
- **Metrics to Track**: [List of metrics]
- **Monitoring Frequency**: [How often to check]
- **Alert Thresholds**: [When to trigger alerts]
- **Review Schedule**: [Regular review intervals]

## 🔗 Supporting Data
- [Link to performance reports]
- [Link to test results]
- [Link to monitoring dashboards]

---
**Next Analysis**: YYYY-MM-DD
```

---

## Usage Guidelines

### **When to Use Each Template**
- **Task Creation**: For all new work assignments
- **Progress Updates**: Daily or weekly progress communication
- **Code Reviews**: For all code review activities
- **Bug Reports**: When issues are discovered
- **Architecture Decisions**: For significant technical decisions
- **Performance Analysis**: For performance optimization work

### **Template Customization**
- Add project-specific sections as needed
- Remove sections that don't apply to your task
- Maintain the overall structure for consistency
- Include all required information for effective communication

### **Quality Standards**
- Use clear, concise language
- Include specific, measurable criteria
- Provide sufficient detail for others to understand
- Update templates regularly based on lessons learned

---

*Last updated: 2024-12-30*  
*Next review: 2025-01-02*