# Candidate Profiler - Task Breakdown

## Task Dependencies Diagram

```
T01-project-setup
    ↓
T02-indexeddb-schema
    ↓
T03-profile-crud ─────────────────────┐
    ↓                                 │
T04-candidate-crud                    │
    ↓                                 │
T05-interview-crud                    │
    ↓                                 │
T06-candidate-list-view               │
    ↓                                 │
T07-candidate-detail-view             │
    ↓                                 │
T08-interview-form ←──────────────────┘
    ↓
T09-interview-comparison
    ↓
T10-ai-prompt-single
    ↓
T11-ai-prompt-summary
    ↓
T12-prompt-templates
    ↓
T13-export-import
    ↓
T14-settings-page
```

## Tasks

### T01: Project Setup
- Initialize Vite + React + TypeScript
- Install Tailwind CSS + @tailwindcss/forms
- Install dependencies: dexie, react-router-dom, date-fns, uuid
- Create base folder structure: src/{components,pages,db,utils,types}
- Set up routing skeleton
- Create AGENTS.md with project conventions

### T02: IndexedDB Schema & Data Layer
- Define TypeScript types (Candidate, Interview, Profile, Settings)
- Set up Dexie database with all stores
- Create CRUD hooks: useProfiles, useCandidates, useInterviews
- Seed default profiles on first run
- Depends on: T01

### T03: Profile Manager UI
- Profile list page with table
- Create/Edit profile modal
- Delete confirmation (warn if in use)
- Depends on: T02

### T04: Candidate CRUD
- Create candidate form (name, tags)
- Edit candidate inline fields
- Delete candidate with cascade
- Depends on: T02

### T05: Interview CRUD
- Create interview linked to candidate
- Edit interview form
- Delete interview (prevent if last one)
- Depends on: T04

### T06: Candidate List View
- Table with columns: name, tags, interview count, hire signal, primary profile
- Sort by name/updated_at
- Filter by tag chips
- Search by name
- Depends on: T04

### T07: Candidate Detail View
- Header with name, editable tags
- Summary section: hire signal, profiles
- Interview timeline list
- "Add Interview" button
- Depends on: T05, T06

### T08: Interview Form (Full)
- Complete form with all fields
- 5 axis score inputs (1-5)
- Axis-specific notes (collapsible)
- Profile selectors
- Hire signal dropdown
- Distinctive frontend-design aesthetic
- Depends on: T05, T03

### T09: Interview Comparison View
- Select 2-4 interviews
- Side-by-side axis scores table
- Highlight variance ≥2
- Depends on: T07

### T10: AI Prompt - Single Interview
- "Copy AI Prompt" button on interview
- Prompt preview modal
- Character count
- Clipboard copy with toast
- Depends on: T08

### T11: AI Prompt - Candidate Summary
- "Copy AI Prompt (All)" button
- Multi-interview prompt generation
- Conflicting signals highlighted
- Depends on: T10

### T12: Editable Prompt Templates
- Settings page for template editing
- Placeholder documentation
- Reset to default
- Depends on: T11

### T13: Export/Import
- Export all data to JSON
- Import with validation
- Merge vs replace option
- Depends on: T12

### T14: Settings & Polish
- Settings page layout
- Navigation polish
- Empty states
- Loading states
- Error handling
- Depends on: T13
