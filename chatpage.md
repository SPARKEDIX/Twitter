# X

## Mission
Create implementation-ready, token-driven UI guidance for X that is optimized for consistency, accessibility, and fast delivery across documentation site.

## Brand
- Product/brand: X
- URL: https://x.com/i/chat
- Audience: developers and technical teams
- Product surface: documentation site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=TwitterChirp`, `font.family.stack=TwitterChirp, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Twemoji Mozilla, sans-serif`, `font.size.base=15px`, `font.weight.base=400`, `font.lineHeight.base=20px`
- Typography scale: `font.size.xs=15px`
- Color palette: `color.text.primary=#e7e9ea`, `color.text.secondary=#ffffff`, `color.text.tertiary=#1d9bf0`, `color.surface.base=#000000`, `color.surface.raised=#eff3f4`, `color.border.muted=#2b2e31`, `color.border.strong=#536471`
- Spacing scale: `space.1=4px`, `space.2=12px`, `space.3=16px`, `space.4=40px`
- Radius/shadow/motion tokens: `radius.xs=9999px` | `shadow.1=rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px` | `motion.duration.instant=150ms`, `motion.duration.fast=200ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (13), buttons (8), navigation (3), inputs (1), lists (1).

- Extraction diagnostics: Limited typography variety detected; size scale may need manual refinement. Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
