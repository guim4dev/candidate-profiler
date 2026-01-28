# PRD: Candidate Profiler

## Introduction

A browser-only tool for solo recruiters/hiring managers to organize candidate evaluations across multiple interviews. Captures raw human judgment via structured scoring on 5 axes, assigns candidate profiles (archetypes), and enables AI-assisted reflection by generating copyable prompts for external LLMs—without making any API calls or automated decisions.

**Tech Stack:** React + TypeScript, Tailwind CSS, IndexedDB

## Goals

- Capture multiple interview perspectives per candidate with independent scoring
- Preserve raw notes alongside structured 1–5 axis scores
- Enable AI-assisted reflection via copyable prompts (no API calls)
- Work entirely offline in the browser
- Support data portability via JSON import/export

## User Stories

### US-001: Initialize IndexedDB schema
**Description:** As a developer, I need persistent storage so data survives browser sessions.

**Acceptance Criteria:**
- [ ] IndexedDB database `candidate-profiler` with stores: `candidates`, `interviews`, `profiles`, `settings`
- [ ] Schema matches data model (see Technical Considerations)
- [ ] Graceful fallback/error messaging if IndexedDB unavailable
- [ ] npm run typecheck passes

---

### US-002: Manage profiles (CRUD)
**Description:** As a user, I want to create and edit candidate profiles (archetypes) so I can categorize candidates consistently.

**Acceptance Criteria:**
- [ ] List all profiles with name and description
- [ ] Create new profile with name (required) and description (optional)
- [ ] Edit existing profile
- [ ] Delete profile (with confirmation, warn if in use)
- [ ] Seed 5 default profiles on first run (e.g., "Builder", "Specialist", "Leader", "Generalist", "Learner")
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Create candidate
**Description:** As a user, I want to add a new candidate so I can start tracking their interviews.

**Acceptance Criteria:**
- [ ] Form with fields: name (required), tags (optional, comma-separated)
- [ ] Candidate created with unique UUID, timestamps
- [ ] Redirect to candidate detail after creation
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: List candidates
**Description:** As a user, I want to see all candidates so I can navigate to their details.

**Acceptance Criteria:**
- [ ] Table/list showing: name, tags, interview count, overall hire signal, primary profile
- [ ] Sort by name or updated_at
- [ ] Filter by tag
- [ ] Search by name
- [ ] Click row to open candidate detail
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: View candidate detail
**Description:** As a user, I want to see a candidate's summary and all their interviews.

**Acceptance Criteria:**
- [ ] Header: name, tags (editable inline)
- [ ] Summary section: overall_hire_signal dropdown, primary_profile selector, secondary_profiles multi-select
- [ ] Interview timeline: chronological list of interviews with interviewer, date, type, hire_signal badge
- [ ] "Add Interview" button
- [ ] "Copy AI Prompt (All Interviews)" button
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Add interview to candidate
**Description:** As a user, I want to log a new interview so I can capture my evaluation.

**Acceptance Criteria:**
- [ ] Form fields: interviewer_name, interview_date, interview_type (dropdown: Technical, System Design, Culture, Manager, Founder, Other)
- [ ] Free-text notes_raw (large textarea)
- [ ] 5 axis scores (1–5 radio/slider each): Technical Depth, Learning & Growth, Business/Product Awareness, Autonomy & Ownership, Collaboration & Communication
- [ ] Optional axis-specific notes (collapsible per axis)
- [ ] Primary profile selector, secondary profiles multi-select
- [ ] Hire signal (Strong No, No, Neutral, Yes, Strong Yes)
- [ ] Save creates interview linked to candidate
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Edit interview
**Description:** As a user, I want to update an existing interview.

**Acceptance Criteria:**
- [ ] All fields editable
- [ ] Save updates interview, updates candidate's updated_at
- [ ] Delete interview (with confirmation)
- [ ] Cannot delete last interview of a candidate (candidate must have ≥1 interview)
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Compare interviews side-by-side
**Description:** As a user, I want to compare axis scores across interviews to see disagreements.

**Acceptance Criteria:**
- [ ] Comparison view accessible from candidate detail
- [ ] Select 2–4 interviews to compare
- [ ] Table: rows = axes, columns = interviews
- [ ] Highlight cells with variance ≥2 (visual indicator)
- [ ] Show hire_signal row for quick comparison
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Generate single-interview AI prompt
**Description:** As a user, I want to copy a prompt for one interview to get an external AI's opinion.

**Acceptance Criteria:**
- [ ] "Copy AI Prompt" button on interview detail
- [ ] Prompt includes: interview notes, axis definitions, axis scores, profile definitions
- [ ] Prompt preview modal (read-only)
- [ ] Character count displayed
- [ ] One-click copy to clipboard (Clipboard API)
- [ ] Toast confirmation on copy
- [ ] Disclaimer text: "AI output is advisory, not authoritative."
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Generate candidate summary AI prompt
**Description:** As a user, I want to copy a prompt synthesizing all interviews for a candidate.

**Acceptance Criteria:**
- [ ] "Copy AI Prompt (All Interviews)" button on candidate detail
- [ ] Prompt includes: all interview notes with interviewer attribution, dates, axis scores per interview, conflicting signals highlighted, profile definitions
- [ ] Prompt asks AI to synthesize, suggest profiles, highlight risks—not make hire decision
- [ ] Prompt preview modal with scope indicator
- [ ] Character count displayed
- [ ] One-click copy
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Export data to JSON
**Description:** As a user, I want to export all data so I can back it up or transfer it.

**Acceptance Criteria:**
- [ ] "Export" button in settings/nav
- [ ] Downloads JSON file with all candidates, interviews, profiles
- [ ] Filename includes date: `candidate-profiler-export-YYYY-MM-DD.json`
- [ ] npm run typecheck passes

---

### US-012: Import data from JSON
**Description:** As a user, I want to import previously exported data.

**Acceptance Criteria:**
- [ ] "Import" button with file picker
- [ ] Validate JSON structure before import
- [ ] Option: merge with existing data or replace all
- [ ] Show summary of what will be imported
- [ ] Confirmation before applying
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Edit prompt templates (advanced)
**Description:** As a user, I want to customize the AI prompt templates.

**Acceptance Criteria:**
- [ ] Settings page with editable templates (single interview, candidate summary)
- [ ] Template uses placeholders: `{{notes}}`, `{{axes}}`, `{{profiles}}`, `{{scores}}`
- [ ] Reset to default button
- [ ] Templates saved to IndexedDB settings store
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: All data persisted in IndexedDB; app works fully offline
- FR-2: Candidate requires at least one interview; cannot exist empty
- FR-3: Interviews belong to exactly one candidate (cascade delete with candidate)
- FR-4: Axis scores are integers 1–5; all 5 axes required per interview
- FR-5: Profiles are user-editable; system seeds defaults on first run
- FR-6: Hire signal options: Strong No, No, Neutral, Yes, Strong Yes (stored as enum)
- FR-7: AI prompts generated deterministically from current data; no network calls
- FR-8: Prompt generation includes character count; warns if >10,000 chars
- FR-9: Clipboard copy uses Clipboard API with fallback for older browsers
- FR-10: Import validates schema; rejects malformed JSON with error message
- FR-11: All timestamps stored as ISO 8601 strings
- FR-12: UUIDs generated client-side (crypto.randomUUID or fallback)

## Non-Goals

- ❌ No backend/server
- ❌ No real-time collaboration or multi-user sync
- ❌ No AI API calls from the app
- ❌ No automated hire/no-hire decisions
- ❌ No pasting AI output back into the app (deferred)
- ❌ No role-specific prompt tuning (deferred)
- ❌ No visualization of interview disagreement charts (deferred)

## Design Considerations

- **Layout:** Sidebar navigation (Candidates, Profiles, Settings) + main content area
- **Candidate List:** Table with sortable columns, filter chips for tags
- **Candidate Detail:** Two-column layout—summary on left, interview timeline on right
- **Interview Form:** Accordion sections for notes, scores, profiles
- **Axis Scores:** Horizontal radio group or slider with numeric labels
- **Prompt Preview:** Modal with monospace text, copy button, character count badge
- **Color Coding:** Hire signal badges (green=Yes, red=No, gray=Neutral)
- **Tailwind:** Use `@tailwindcss/forms` for form styling; leverage `prose` for notes display

## Technical Considerations

### Data Model (IndexedDB)

```typescript
interface Candidate {
  id: string; // UUID
  name: string;
  tags: string[];
  overall_hire_signal?: HireSignal;
  primary_profile?: string; // profile id
  secondary_profiles: string[]; // profile ids
  created_at: string; // ISO 8601
  updated_at: string;
}

interface Interview {
  id: string;
  candidate_id: string;
  interviewer_name: string;
  interview_date: string; // ISO 8601 date
  interview_type: InterviewType;
  notes_raw: string;
  axis_scores: Record<Axis, number>; // 1-5
  axis_notes: Record<Axis, string>; // optional per-axis notes
  primary_profile?: string;
  secondary_profiles: string[];
  hire_signal: HireSignal;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

type Axis = 
  | 'technical_depth'
  | 'learning_growth'
  | 'business_awareness'
  | 'autonomy_ownership'
  | 'collaboration_communication';

type HireSignal = 'strong_no' | 'no' | 'neutral' | 'yes' | 'strong_yes';

type InterviewType = 'technical' | 'system_design' | 'culture' | 'manager' | 'founder' | 'other';
```

### Libraries

- **Dexie.js** (recommended) or idb for IndexedDB wrapper
- **React Router** for navigation
- **date-fns** for date formatting
- **uuid** or native `crypto.randomUUID()`

### Prompt Template (Default)

```
You are helping evaluate a job candidate.

Below are:
1. Interview notes
2. Evaluation axes with definitions
3. Available candidate profiles

Your task:
- Suggest 1–2 best-fit profiles
- Highlight strengths and risks
- Call out uncertainty or conflicting signals
- Do NOT make a hire/no-hire decision

---

Interview Notes:
{{notes}}

---

Axes Definitions:
- Technical Depth: Mastery of relevant technical skills, depth of knowledge
- Learning & Growth: Curiosity, adaptability, willingness to improve
- Business/Product Awareness: Understanding of user needs, business context
- Autonomy & Ownership: Self-direction, accountability, initiative
- Collaboration & Communication: Teamwork, clarity, listening

Scores:
{{scores}}

---

Available Profiles:
{{profiles}}
```

## Success Metrics

- User captures ≥3 interviews per candidate on average
- AI prompts copied at least once per candidate
- Hiring discussions reference axes and profiles (qualitative)
- Zero data loss (IndexedDB persistence reliable)
- App loads and works offline after first visit

## Open Questions

- Should axis weights be configurable per role/position?
- Should we add keyboard shortcuts for common actions (save, next field)?
- Should deleted candidates be soft-deleted for recovery?
