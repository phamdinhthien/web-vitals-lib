---
name: "speckit-autopilot"
description: "Orchestrate the full speckit flow (spec → clarify → plan → tasks → implement) using multi-agent discussions at each phase: PM+BA for spec/clarify, SA+SA Reviewer for plan, and domain-specific agents (FE/BE/DB) for implementation."
argument-hint: "Feature description to process through the full speckit pipeline"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "custom"
  source: "custom orchestrator"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This skill orchestrates the **entire speckit pipeline** automatically, using specialized agent pairs at each phase to produce higher-quality artifacts through discussion and review.

### Pipeline Phases

```
Phase 1: SPEC + CLARIFY  →  PM Agent + BA Agent discuss → spec.md
Phase 2: PLAN            →  SA Agent + SA Reviewer Agent discuss → plan.md + artifacts
Phase 3: TASKS           →  Generate tasks with domain tags (FE/BE/DB/...) → tasks.md
Phase 4: IMPLEMENT       →  Domain-specific agents (FE/BE/DB) execute in parallel
```

---

## Execution Flow

### Phase 0: Initialization

1. Validate that the user provided a feature description in `$ARGUMENTS`. If empty, ask the user.

2. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` to detect if a feature branch already exists.
   - If a feature branch exists with spec.md, ask user: "Feature branch already exists. Resume from which phase? (spec/clarify/plan/tasks/implement)"
   - If no feature branch, proceed from Phase 1.

3. Display the pipeline overview to the user:
   ```
   ## Speckit Autopilot Pipeline

   Feature: [extracted feature name]

   | Phase | Agents | Output | Status |
   |-------|--------|--------|--------|
   | 1. Spec & Clarify | PM + BA | spec.md | Pending |
   | 2. Plan | SA + SA Reviewer | plan.md, research.md, data-model.md | Pending |
   | 3. Tasks | Task Generator | tasks.md (with domain tags) | Pending |
   | 4. Implement | FE + BE + DB Agents | Source code | Pending |

   Starting Phase 1...
   ```

---

### Phase 1: SPEC & CLARIFY (PM Agent + BA Agent)

**Goal**: Produce a complete, unambiguous spec.md through structured discussion between a PM perspective and BA perspective.

#### Step 1.1: Create Feature Branch

Run the speckit-specify branch creation script:
```bash
.specify/scripts/bash/create-new-feature.sh "$ARGUMENTS" --json --short-name "<generated-short-name>" "<feature description>"
```
Parse JSON output for BRANCH_NAME, SPEC_FILE, FEATURE_DIR.

#### Step 1.2: PM Agent — Draft Initial Spec

Launch an agent with this role:

```
You are a **Product Manager (PM)** agent. Your job is to create the initial feature specification.

Given the feature description: "$ARGUMENTS"

Produce a comprehensive spec following these guidelines:
- Focus on WHAT users need and WHY (business value)
- Define clear user scenarios with priorities (P1, P2, P3)
- Write functional requirements that are testable and unambiguous
- Define measurable success criteria (technology-agnostic)
- Identify key entities and their relationships
- List assumptions and constraints
- Mark maximum 3 items as [NEEDS CLARIFICATION] only for truly critical decisions

Use the spec template from .specify/templates/spec-template.md.
Write the output as a structured markdown document.
Do NOT include implementation details (no tech stack, frameworks, APIs).
```

Save the PM's draft to SPEC_FILE.

#### Step 1.3: BA Agent — Review & Clarify

Launch an agent with this role:

```
You are a **Business Analyst (BA)** agent. Your job is to review and strengthen the PM's spec draft.

Read the current spec at: [SPEC_FILE]

Perform these tasks:
1. **Ambiguity Scan**: Identify vague terms, missing edge cases, unclear acceptance criteria
2. **Coverage Analysis**: Check all user scenarios have complete functional requirements
3. **Consistency Check**: Ensure no contradictions between sections
4. **Clarification Resolution**: For each [NEEDS CLARIFICATION] marker:
   - Analyze the context and provide a recommended answer with reasoning
   - Choose the most practical option based on industry best practices
5. **Gap Filling**: Add missing edge cases, error states, and boundary conditions

For each issue found, directly update the spec with:
- Resolved clarifications (replace markers with concrete decisions)
- Added edge cases and error handling requirements
- Strengthened acceptance criteria with measurable targets
- Added a ## Clarifications section documenting all decisions made

Write the improved spec back to: [SPEC_FILE]
```

#### Step 1.4: PM Agent — Final Review

Launch an agent to do a final review:

```
You are the **PM Agent** performing a final review of the BA-refined spec.

Read: [SPEC_FILE]

Validate:
1. All user scenarios align with original feature intent
2. No scope creep was introduced by BA refinements
3. Success criteria are still achievable and measurable
4. Functional requirements are complete and non-overlapping
5. All [NEEDS CLARIFICATION] markers are resolved

If issues found: Fix them directly in the spec.
If spec is clean: Approve and proceed.

Also create the quality checklist at: [FEATURE_DIR]/checklists/requirements.md
Mark all items that pass. Flag any remaining issues.
```

#### Step 1.5: Report Phase 1 Completion

```
## Phase 1 Complete: Spec & Clarify

- Spec file: [SPEC_FILE path]
- Clarifications resolved: [count]
- User scenarios: [count]
- Functional requirements: [count]
- Quality checklist: [PASS/FAIL]

Proceeding to Phase 2: Planning...
```

---

### Phase 2: PLAN (SA Agent + SA Reviewer Agent)

**Goal**: Produce implementation plan, research decisions, data model, and contracts through SA collaboration.

#### Step 2.1: Setup Plan

Run: `.specify/scripts/bash/setup-plan.sh --json`
Parse JSON for IMPL_PLAN, SPECS_DIR, BRANCH.

#### Step 2.2: SA Agent — Create Implementation Plan

Launch an agent with this role:

```
You are a **Solutions Architect (SA)** agent. Create the implementation plan for this feature.

Read:
- Feature spec: [SPEC_FILE]
- Plan template: [IMPL_PLAN]
- Constitution: .specify/memory/constitution.md (if exists)

Produce these artifacts:

1. **research.md** — Technical decisions with rationale:
   - For each technology choice: Decision, Rationale, Alternatives Considered
   - Resolve all "NEEDS CLARIFICATION" items from technical perspective

2. **data-model.md** — Data structures:
   - Entity definitions with fields, types, relationships
   - Validation rules, state transitions
   - Storage format and persistence strategy

3. **contracts/** — Interface specifications:
   - API endpoints (if web service)
   - Library API (if library)
   - CLI commands (if CLI tool)
   - Include request/response formats, error codes, examples

4. **plan.md** — Implementation roadmap:
   - Technical context (stack, dependencies, constraints)
   - Project structure (directory layout)
   - Phase breakdown with dependencies
   - Complexity assessment

5. **quickstart.md** — Developer setup guide

Write all artifacts to: [SPECS_DIR]/
```

#### Step 2.3: SA Reviewer Agent — Review & Improve

Launch an agent with this role:

```
You are an **SA Reviewer** agent. Review all planning artifacts for quality and consistency.

Read all artifacts in: [SPECS_DIR]/
- plan.md, research.md, data-model.md, contracts/*, quickstart.md

Review criteria:
1. **Architecture Soundness**: Are tech choices justified? Any anti-patterns?
2. **Data Model Completeness**: All entities from spec covered? Relationships correct?
3. **Contract Consistency**: Do API contracts match data model and spec requirements?
4. **Feasibility**: Is the plan achievable? Are there missing dependencies?
5. **Security**: Any security concerns in the design?
6. **Scalability**: Does the design meet scale requirements from spec?
7. **Spec Alignment**: Does every functional requirement have a path to implementation?

For each issue found:
- CRITICAL: Fix directly in the artifact
- HIGH: Fix directly and add a note
- MEDIUM/LOW: Add a comment in the artifact for awareness

Write improved artifacts back to their files.
```

#### Step 2.4: Update Agent Context

Run: `.specify/scripts/bash/update-agent-context.sh claude`

#### Step 2.5: Report Phase 2 Completion

```
## Phase 2 Complete: Planning

- Plan: [IMPL_PLAN path]
- Research decisions: [count]
- Data model entities: [count]
- API contracts: [list]
- Quickstart: [path]

Proceeding to Phase 3: Task Generation...
```

---

### Phase 3: TASKS (Task Generator with Domain Tagging)

**Goal**: Generate tasks.md with each task tagged by domain (FE, BE, DB, INFRA, etc.) for agent routing in Phase 4.

#### Step 3.1: Load Context

Read all artifacts from SPECS_DIR: plan.md, spec.md, data-model.md, contracts/, research.md.

#### Step 3.2: Generate Tasks with Domain Tags

Generate tasks following the standard speckit-tasks format, but with an **additional domain tag** for each task:

**Extended Task Format**:
```
- [ ] [TaskID] [P?] [Story?] [Domain] Description with file path
```

**Domain Tags**:
| Tag | Description | Examples |
|-----|-------------|----------|
| `[BE]` | Backend / Server | API endpoints, middleware, services, server config |
| `[FE]` | Frontend / UI | Components, views, routes, styles, client state |
| `[DB]` | Database / Data | Models, migrations, schemas, seed data, storage |
| `[INFRA]` | Infrastructure | Build config, CI/CD, Docker, deployment |
| `[LIB]` | Library / Core | Shared libraries, utilities, core modules |
| `[TEST]` | Testing | Test files, test config, test utilities |
| `[DOCS]` | Documentation | README, API docs, guides |
| `[FULL]` | Full-stack | Tasks spanning multiple domains |

**Examples**:
```
- [ ] T001 [INFRA] Create project structure per implementation plan
- [ ] T005 [P] [BE] Implement POST /api/collect endpoint in server/routes/collect.js
- [ ] T008 [P] [FE] Create ApplicationList component in dashboard/src/views/ApplicationList.vue
- [ ] T012 [P] [US1] [DB] Define data storage schema in server/data/
- [ ] T015 [P] [US2] [FE] Create RouteDetail view in dashboard/src/views/RouteDetail.vue
```

**Task Organization Rules**:
1. Follow standard phase structure (Setup → Foundational → User Stories → Polish)
2. Within each phase, group tasks by domain when possible
3. Mark parallel opportunities with [P]
4. Every task MUST have exactly one domain tag
5. Tasks affecting multiple domains use [FULL] tag

#### Step 3.3: Generate Domain Summary

After tasks.md, append a **Domain Execution Summary** section:

```markdown
## Domain Execution Summary

| Domain | Task Count | Parallel Tasks | Dependencies |
|--------|-----------|----------------|--------------|
| BE     | 12        | 8              | DB models must exist first |
| FE     | 15        | 10             | BE API contracts required |
| DB     | 5         | 3              | None (foundational) |
| INFRA  | 3         | 2              | None (setup phase) |
| LIB    | 4         | 2              | None |

### Execution Order
1. INFRA + DB tasks (parallel, no dependencies)
2. BE + LIB tasks (after DB models ready)
3. FE tasks (after BE API endpoints ready)
4. TEST + DOCS tasks (after implementation)

### Agent Assignment
- **DB Agent**: T012, T013, T014, T020, T025
- **BE Agent**: T005, T006, T007, T015, T016, T017, T021, T022, T026, T027, T028, T029
- **FE Agent**: T008, T009, T010, T011, T018, T019, T023, T024, T030, T031, T032, T033, T034, T035, T036
```

#### Step 3.4: Report Phase 3 Completion

```
## Phase 3 Complete: Task Generation

- Tasks file: [path]
- Total tasks: [count]
- Domain breakdown: BE=[n], FE=[n], DB=[n], INFRA=[n], LIB=[n]
- Parallel opportunities: [count]
- Phases: [count]

Proceeding to Phase 4: Implementation...
```

---

### Phase 4: IMPLEMENT (Domain-Specific Agents)

**Goal**: Execute implementation using specialized agents for each domain, respecting task dependencies and parallelism.

#### Step 4.1: Pre-Implementation Checks

1. Verify all checklists pass (same as speckit-implement)
2. Load tasks.md and parse domain assignments
3. Build dependency graph from task ordering

#### Step 4.2: Setup Phase Execution

Execute INFRA and setup tasks sequentially (project structure, dependencies, config).

#### Step 4.3: Domain Agent Execution

For each execution wave (based on dependency order), launch domain agents **in parallel**:

**DB Agent**:
```
You are a **Database/Data Agent**. You specialize in data models, schemas, storage, and persistence.

Your assigned tasks from tasks.md: [list of DB-tagged tasks]

Context:
- Data model: [SPECS_DIR]/data-model.md
- Plan: [SPECS_DIR]/plan.md
- Tech stack: [from plan]

Rules:
- Implement ONLY your assigned tasks
- Follow the data model exactly
- Create proper validation and constraints
- Handle edge cases (empty data, malformed input)
- Mark each completed task as [X] in tasks.md
```

**BE Agent**:
```
You are a **Backend Agent**. You specialize in server-side logic, API endpoints, middleware, and services.

Your assigned tasks from tasks.md: [list of BE-tagged tasks]

Context:
- API contracts: [SPECS_DIR]/contracts/
- Data model: [SPECS_DIR]/data-model.md
- Plan: [SPECS_DIR]/plan.md
- Tech stack: [from plan]

Rules:
- Implement ONLY your assigned tasks
- Follow API contracts exactly (endpoints, request/response formats, status codes)
- Use the data model for all data access
- Implement proper error handling and validation
- Mark each completed task as [X] in tasks.md
```

**FE Agent**:
```
You are a **Frontend Agent**. You specialize in UI components, views, routing, and client-side state.

Your assigned tasks from tasks.md: [list of FE-tagged tasks]

Context:
- Spec: [SPEC_FILE] (for user scenarios and acceptance criteria)
- API contracts: [SPECS_DIR]/contracts/ (for API integration)
- Plan: [SPECS_DIR]/plan.md (for project structure)
- Tech stack: [from plan]

Rules:
- Implement ONLY your assigned tasks
- Follow the spec's user scenarios for UX flow
- Use API contracts for all backend communication
- Implement responsive design per spec requirements
- Handle loading, empty, and error states
- Mark each completed task as [X] in tasks.md
```

**Additional agents** (launched as needed based on domain tags in tasks):

- **LIB Agent**: For shared library/utility tasks
- **TEST Agent**: For test writing tasks
- **DOCS Agent**: For documentation tasks

#### Step 4.4: Execution Waves

Execute in dependency order:

```
Wave 1: [INFRA] + [DB] agents (parallel)
  ↓ Wait for completion
Wave 2: [BE] + [LIB] agents (parallel)
  ↓ Wait for completion
Wave 3: [FE] agents
  ↓ Wait for completion
Wave 4: [TEST] + [DOCS] agents (parallel)
  ↓ Wait for completion
Wave 5: [FULL] tasks (sequential, cross-domain integration)
```

Between waves:
- Verify previous wave's tasks are complete
- Run any available validation (linting, type checking)
- Report progress to user

#### Step 4.5: Integration & Validation

After all waves complete:
1. Run project build (if configured)
2. Run tests (if configured)
3. Verify all tasks in tasks.md are marked [X]
4. Check for any compilation/runtime errors

#### Step 4.6: Report Phase 4 Completion

```
## Phase 4 Complete: Implementation

- Tasks completed: [n/total]
- Domain results:
  - DB: [n] tasks completed
  - BE: [n] tasks completed
  - FE: [n] tasks completed
  - [other domains]
- Build status: [PASS/FAIL]
- Test status: [PASS/FAIL if tests exist]

## Pipeline Complete!

All phases finished. Review the implementation and run tests.
```

---

## Error Handling

- **Phase failure**: If any phase fails critically, stop and report. Ask user whether to retry or skip.
- **Agent failure**: If an agent fails on a task, log the error, skip that task, and continue. Report all skipped tasks at the end.
- **Dependency violation**: If a wave cannot start because previous wave has failures, ask user how to proceed.
- **User interruption**: At any phase boundary, user can say "stop", "pause", or "skip to [phase]".

## User Controls

The user can control the pipeline with these commands during execution:
- **"skip to plan"** — Skip remaining spec work, go to Phase 2
- **"skip to tasks"** — Skip to Phase 3
- **"skip to implement"** — Skip to Phase 4
- **"pause"** — Stop after current phase completes
- **"stop"** — Stop immediately
- **"status"** — Show current pipeline status
- **"retry"** — Retry the last failed operation
