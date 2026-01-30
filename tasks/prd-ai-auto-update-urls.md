# PRD: AI Auto-Update URLs

## Introduction

Add auto-update URLs to AI prompts so users can apply AI-suggested changes (profile, hire signal, axis scores, tags, notes) with a single click. When the user copies a prompt to an external AI (ChatGPT, Claude, etc.), the AI's response will include a specially formatted URL. Clicking this URL opens a preview modal showing proposed changes, which the user can confirm or cancel.

This eliminates manual data entry after AI analysis, reducing friction and ensuring AI recommendations are easily actionable.

## Goals

- Generate clickable URLs that encode AI-suggested updates for candidates/interviews
- Support updating all relevant fields: profiles, hire signal, axis scores, tags, notes
- Provide a preview modal showing a diff of proposed changes before applying
- Work with both single interview and candidate summary prompts
- Use the app's existing URL (window.location.origin) for SPA-compatible deep linking

## User Stories

### US-001: Define URL schema for auto-update actions
**Description:** As a developer, I need a URL schema that encodes update actions so the app can parse and apply AI suggestions.

**Acceptance Criteria:**
- [ ] Define URL format: `{origin}/#/apply?data={base64EncodedJSON}`
- [ ] JSON payload supports: `candidateId`, `interviewId` (optional), and update fields
- [ ] Update fields include: `primary_profile`, `secondary_profiles`, `overall_hire_signal`, `axis_scores`, `axis_notes`, `tags`
- [ ] Create TypeScript types for the payload in `src/types/index.ts`
- [ ] npm run typecheck passes

### US-002: Create URL parser utility
**Description:** As a developer, I need a utility to parse and validate auto-update URLs so the app can extract the encoded data.

**Acceptance Criteria:**
- [ ] Create `src/utils/autoUpdateUrl.ts` with `parseAutoUpdateUrl(url: string)` function
- [ ] Returns parsed payload or null if invalid
- [ ] Validates required fields (candidateId) and field types
- [ ] Handles malformed base64 or JSON gracefully
- [ ] npm run typecheck passes

### US-003: Create URL generator utility
**Description:** As a developer, I need a utility to generate auto-update URLs so AI prompts can include a template.

**Acceptance Criteria:**
- [ ] Add `generateAutoUpdateUrl(payload)` function to `src/utils/autoUpdateUrl.ts`
- [ ] Uses `window.location.origin` as base URL
- [ ] Encodes payload as base64 JSON in `data` query param
- [ ] Generates valid, parseable URLs
- [ ] npm run typecheck passes

### US-004: Add route handler for /apply path
**Description:** As a developer, I need a route that captures auto-update URLs and triggers the preview flow.

**Acceptance Criteria:**
- [ ] Add `/apply` route in `src/App.tsx` router config
- [ ] Route extracts `data` query param from URL
- [ ] Parses payload and stores in state/context for preview modal
- [ ] Redirects to candidate detail page with preview modal open
- [ ] Handles invalid URLs gracefully (shows error toast, redirects to home)
- [ ] npm run typecheck passes

### US-005: Build AutoUpdatePreviewModal component
**Description:** As a user, I want to see a preview of proposed changes before applying them so I can review what the AI suggested.

**Acceptance Criteria:**
- [ ] Create `src/components/AutoUpdatePreviewModal.tsx`
- [ ] Displays current vs proposed values for each changed field
- [ ] Uses diff-style display (red for removed, green for added)
- [ ] Shows candidate name and interview info (if applicable)
- [ ] Has "Apply Changes" and "Cancel" buttons
- [ ] npm run typecheck passes
- [ ] Verify in browser using agent-browser skill

### US-006: Implement apply changes logic
**Description:** As a user, I want to apply the previewed changes so my candidate/interview data is updated.

**Acceptance Criteria:**
- [ ] "Apply Changes" button calls appropriate db hooks (`updateCandidate`, `updateInterview`)
- [ ] Shows success toast after applying
- [ ] Closes modal and remains on candidate detail page
- [ ] Only updates fields present in payload (partial updates)
- [ ] npm run typecheck passes

### US-007: Update AIPromptModal to include URL template
**Description:** As a user, I want the single interview AI prompt to include instructions for generating an auto-update URL.

**Acceptance Criteria:**
- [ ] Modify `generatePrompt()` in `AIPromptModal.tsx` to include URL template section
- [ ] Instructions tell AI to output a clickable URL with its recommendations
- [ ] Provides example URL format with placeholder values
- [ ] Lists all supported fields AI can include
- [ ] npm run typecheck passes

### US-008: Update CandidateSummaryPromptModal to include URL template
**Description:** As a user, I want the candidate summary AI prompt to include instructions for generating an auto-update URL.

**Acceptance Criteria:**
- [ ] Modify `generateSummaryPrompt()` in `CandidateSummaryPromptModal.tsx` to include URL template section
- [ ] Instructions tell AI to output a clickable URL with its recommendations
- [ ] Provides example URL format with placeholder values
- [ ] Lists all supported fields AI can include
- [ ] npm run typecheck passes

### US-009: Handle interview-specific updates
**Description:** As a user, I want auto-update URLs to support updating individual interview data (not just candidate-level).

**Acceptance Criteria:**
- [ ] Payload supports optional `interviewId` field
- [ ] When present, updates target the specific interview (axis_scores, axis_notes, hire_signal, profiles)
- [ ] Preview modal shows interview context (interviewer name, date)
- [ ] npm run typecheck passes

### US-010: Add error handling and edge cases
**Description:** As a user, I want clear feedback when something goes wrong with auto-update URLs.

**Acceptance Criteria:**
- [ ] Invalid/malformed URL shows error toast with message
- [ ] Non-existent candidateId shows "Candidate not found" error
- [ ] Non-existent interviewId shows "Interview not found" error
- [ ] Expired or tampered URLs handled gracefully
- [ ] npm run typecheck passes

## Functional Requirements

- FR-1: Define URL schema as `{origin}/#/apply?data={base64(JSON)}` for SPA hash-based routing
- FR-2: JSON payload must include `candidateId` (required) and optional `interviewId`
- FR-3: Supported update fields: `primary_profile`, `secondary_profiles`, `overall_hire_signal`, `axis_scores`, `axis_notes`, `tags`
- FR-4: Create `parseAutoUpdateUrl()` and `generateAutoUpdateUrl()` utilities
- FR-5: Add `/apply` route that triggers preview modal flow
- FR-6: Preview modal displays side-by-side or inline diff of current vs proposed values
- FR-7: "Apply Changes" persists updates via existing db hooks
- FR-8: Both `AIPromptModal` and `CandidateSummaryPromptModal` include URL template instructions
- FR-9: AI prompt instructions include: format explanation, example URL, list of supported fields
- FR-10: Success/error feedback via toast notifications

## Non-Goals

- No direct API integration with external AI providers (remains copy-paste workflow)
- No automatic URL detection or parsing from clipboard
- No undo/history for applied changes (standard app behavior)
- No encryption or signing of URL payloads (local-only app, no security concerns)
- No batch updates for multiple candidates
- No custom field mapping or user-configurable templates (future enhancement)

## Design Considerations

### URL Format Example
```
http://localhost:5173/#/apply?data=eyJjYW5kaWRhdGVJZCI6IjEyMzQiLCJwcmltYXJ5X3Byb2ZpbGUiOiJidWlsZGVyIiwib3ZlcmFsbF9oaXJlX3NpZ25hbCI6InllcyJ9
```

Decoded payload:
```json
{
  "candidateId": "1234",
  "primary_profile": "builder",
  "overall_hire_signal": "yes",
  "axis_scores": {
    "technical_depth": 4,
    "collaboration_communication": 5
  }
}
```

### AI Prompt Template Addition
```markdown
---

## Auto-Update URL

After your analysis, generate a clickable URL to apply your recommendations:

**Format:** `{APP_URL}/#/apply?data={BASE64_JSON}`

**Supported fields in JSON:**
- `candidateId`: "{CANDIDATE_ID}" (required)
- `interviewId`: "{INTERVIEW_ID}" (for interview-specific updates)
- `primary_profile`: "builder" | "specialist" | "leader" | "generalist" | "learner"
- `secondary_profiles`: ["profile1", "profile2"]
- `overall_hire_signal`: "strong_no" | "no" | "neutral" | "yes" | "strong_yes"
- `axis_scores`: { "technical_depth": 1-5, ... }
- `tags`: ["tag1", "tag2"]

**Example:**
[Click to apply recommendations]({EXAMPLE_URL})
```

### Preview Modal UI
- Header: "Review AI Suggestions"
- Body: Table/list with Field | Current Value | Proposed Value columns
- Changed values highlighted (current in red/strikethrough, proposed in green)
- Footer: Cancel (secondary) | Apply Changes (primary)

## Technical Considerations

- Use hash-based routing (`/#/apply`) for SPA compatibility
- Base64 encode JSON to safely pass in URL query params
- Payload validation should be strict to prevent injection
- Reuse existing `updateCandidate` and `updateInterview` db hooks
- Consider URL length limits (~2000 chars safe); large payloads may need truncation warning

## Success Metrics

- User can click AI-generated URL and see preview modal in <2 seconds
- Apply changes workflow completes in 2 clicks (click URL → Apply Changes)
- Zero manual data entry required after AI analysis
- Both prompt types generate valid, parseable URLs

## Open Questions

- Should we add a "Copy URL Template" button for users to manually construct URLs?
- Should profile names be validated against existing profiles in the database?
- Should we support partial axis_scores updates (only some axes) or require all?
- Maximum URL length handling—truncate fields or show warning?
