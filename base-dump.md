# 📄 PRD — Candidate Profiling & Categorization Tool (v1.1)

## 1. Overview

### Product Name (working)

**Candidate Profiler**

### Problem Statement

Hiring signals are scattered across:

- Multiple interviews
- Different interviewers
- Unstructured notes

At the same time, AI can help synthesize signals — but only if the input is structured and intentional.

This tool:

- Organizes **multiple interviews per candidate**
- Preserves **raw human judgment**
- Enables **optional external AI evaluation via copyable prompts**

No automation without intent.

---

## 2. Goals (Updated)

- Capture **multiple interview perspectives**
- Preserve **raw notes + structured scoring**
- Enable **AI-assisted reflection**, not decision-making
- Keep everything **browser-only**

---

## 3. Non-Goals (Still True)

- ❌ No backend
- ❌ No real-time collaboration
- ❌ No AI calls inside the app
- ❌ No auto-hiring decisions

---

## 4. Core Concepts & Data Model (Updated)

---

## 4.1 Candidate (Updated)

A candidate is a **container for interviews**, not the evaluation itself.

**Fields**

- `id` (UUID)
- `name`
- `tags`
- `overall_hire_signal` (manual, optional)
- `primary_profile` (optional, derived or manual)
- `secondary_profiles` (0..n)
- `created_at`
- `updated_at`

> 🔑 **Important design decision**
> Profiles can be assigned at:
>
> - Interview level
> - Candidate level (summary)

---

## 4.2 Interview (NEW — Core Object)

Each interview is a **standalone evaluation event**.

**Fields**

- `id` (UUID)
- `candidate_id`
- `interviewer_name`
- `interview_date`
- `interview_type`
  - e.g. Technical, System Design, Culture, Manager, Founder

- `notes_raw` (free text)
- Axis scores (1–5)
- Axis-specific notes (optional)
- `primary_profile`
- `secondary_profiles`
- `hire_signal`
- `created_at`

This allows:

- Conflicting opinions
- Long hiring processes
- Longitudinal comparison

---

## 4.3 Evaluation Axes (Unchanged)

Applied **per interview**, not per candidate.

- Technical Depth
- Learning & Growth Orientation
- Business / Product Awareness
- Autonomy & Ownership
- Collaboration & Communication

Scale: **1–5**

---

## 4.4 Profiles (Unchanged, but More Powerful)

Profiles remain **editable archetypes**.

Profiles can be:

- Assigned manually
- Suggested by AI (external)
- Aggregated across interviews

---

## 5. AI Prompt Generation (NEW — Key Feature)

### 5.1 Purpose

Enable users to:

- Copy a **well-structured prompt**
- Paste it into ChatGPT / Claude / Gemini / etc.
- Get a **second opinion** on candidate profile fit

The app does **not**:

- Call AI APIs
- Store AI outputs unless pasted back manually

---

### 5.2 Prompt Generation Modes

#### Mode A — Single Interview Prompt

Used right after an interview.

**Includes**

- Interview notes
- Axis definitions
- Profile definitions
- Explicit instructions

#### Mode B — Candidate Summary Prompt

Used after multiple interviews.

**Includes**

- All interview notes
- Interviewer context
- Conflicting signals highlighted
- Request for synthesis

---

### 5.3 Prompt Content Structure

**Prompt Template (Conceptual)**

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

Interview Notes:
{{notes}}

Axes Definitions:
{{axes}}

Profiles:
{{profiles}}
```

---

### 5.4 UX Requirements for Prompt Generation

- “📋 Copy AI Prompt” button
- Select scope:
  - Current interview
  - All interviews

- Prompt preview (read-only)
- One-click copy to clipboard

---

## 6. User Stories (Updated)

### 6.1 Add Multiple Interviews

> As a user, I want to add multiple interviews to the same candidate.

**Acceptance Criteria**

- Interviews listed chronologically
- Each interview independently editable
- Clear interviewer attribution

---

### 6.2 Generate AI Evaluation Prompt

> As a user, I want to generate a prompt from my notes to get an external AI’s opinion.

**Acceptance Criteria**

- No data sent automatically
- Prompt includes enough context
- Copyable in one click

---

### 6.3 Compare Interviews

> As a user, I want to see how perceptions differ across interviews.

**Acceptance Criteria**

- Side-by-side axis scores
- Highlight variance
- No forced aggregation

---

## 7. Functional Requirements (Updated)

### Interview Management

- Create / edit / delete interviews
- Interviews belong to exactly one candidate
- Candidate cannot exist without at least one interview

---

### AI Prompt System

- Template-based
- User-editable templates (advanced)
- Versioned internally (future-proofing)

---

### Aggregation (Manual First)

- Candidate-level profiles and hire signal are **manual**
- System may suggest averages, never auto-apply

---

## 8. UX / UI Structure (Updated)

### Main Views

1. Candidate List
2. Candidate Detail
   - Candidate summary
   - Interview timeline

3. Interview Detail
   - Notes
   - Scores
   - Profiles
   - “Copy AI Prompt”

4. Profile Manager
5. Import / Export

---

## 9. Technical Requirements (Updated)

- IndexedDB preferred (nested data)
- Deterministic prompt generation
- Clipboard API support
- Offline-first

---

## 10. Risks & Mitigations

### Risk: Over-reliance on AI opinion

**Mitigation**

- Explicit copy text:
  _“AI output is advisory, not authoritative.”_

### Risk: Prompt bloat

**Mitigation**

- Allow prompt scope selection
- Character count indicator

---

## 11. Success Metrics (Updated)

- You consistently:
  - Capture multiple interviews
  - Use AI prompts selectively

- Hiring discussions reference **axes and profiles**
- Less “vibes-only” debate

---

## 12. Future Enhancements (Explicitly Deferred)

- Paste AI output back and tag as “external opinion”
- Prompt tuning per role
- Diff between human vs AI profile assignment
- Visualization of interview disagreement

---

## 13. Design Philosophy (Refined)

> **AI is a mirror, not a judge.**
> The system exists to structure thought — not replace it.
