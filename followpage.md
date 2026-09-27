# Follow / X

## Mission
Create implementation-ready, token-driven UI guidance for Follow / X that is optimized for consistency, accessibility, and fast delivery across e-commerce storefront.

## Brand
- Product/brand: Follow / X
- URL: https://x.com/i/connect_people
- Audience: online shoppers and consumers
- Product surface: e-commerce storefront

## Style Foundations
- Visual style: structured, tokenized, content-first
- Main font style: `font.family.primary=serif`, `font.family.stack=serif`, `font.size.base=15px`, `font.weight.base=400`, `font.lineHeight.base=normal`
- Typography scale: `font.size.xs=11px`, `font.size.sm=14px`, `font.size.md=15px`, `font.size.lg=20px`, `font.size.xl=22.5px`, `font.size.2xl=30px`
- Color palette: `color.text.primary=#e7e9ea`, `color.text.secondary=#00cadb`, `color.text.tertiary=#1d9bf0`, `color.text.inverse=#71767b`, `color.border.default=#000000`, `color.surface.muted=#eff3f4`, `color.surface.raised=#0f1419`, `color.border.muted=#4b4e52`, `color.border.strong=#536471`
- Spacing scale: `space.1=2px`, `space.2=4px`, `space.3=8px`, `space.4=12px`, `space.5=16px`, `space.6=32px`
- Radius/shadow/motion tokens: `radius.xs=16px`, `radius.sm=9999px` | `shadow.1=rgba(255, 255, 255, 0.2) 0px 0px 15px 0px, rgba(255, 255, 255, 0.15) 0px 0px 3px 1px`, `shadow.2=rgba(217, 217, 217, 0.2) 0px 0px 5px 0px, rgba(217, 217, 217, 0.25) 0px 1px 4px 1px` | `motion.duration.instant=200ms`

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
- Include known page component density: links (91), buttons (52), navigation (4), inputs (1), lists (1).

- Extraction diagnostics: Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
