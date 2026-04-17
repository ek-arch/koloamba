---
name: design-system-kolo-crypto-visa-card-usdt-wallet
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Kolo — Crypto Visa Card & USDT Wallet

## Mission
Deliver implementation-ready design-system guidance for Kolo — Crypto Visa Card & USDT Wallet that can be applied consistently across documentation site interfaces.

## Brand
- Product/brand: Kolo — Crypto Visa Card & USDT Wallet
- URL: https://kolo.xyz/
- Audience: developers and technical teams
- Product surface: documentation site

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=Fixelvariable`, `font.family.stack=Fixelvariable, Arial, sans-serif`, `font.size.base=16px`, `font.weight.base=300`, `font.lineHeight.base=20px`
- Typography scale: `font.size.xs=16px`, `font.size.sm=20px`, `font.size.md=22px`, `font.size.lg=58.72px`, `font.size.xl=66.06px`, `font.size.2xl=88.08px`, `font.size.3xl=161.48px`
- Color palette: `color.text.primary=#13d659`, `color.surface.muted=#ffffff`, `color.text.tertiary=#333333`, `color.surface.base=#000000`, `color.surface.raised=#f8f8f8`, `color.surface.strong=#f2f2f2`
- Spacing scale: `space.1=2px`, `space.2=8px`, `space.3=10px`, `space.4=12px`, `space.5=14px`, `space.6=20px`, `space.7=60px`, `space.8=80px`
- Radius/shadow/motion tokens: `radius.xs=8px`, `radius.sm=11px`, `radius.md=16px` | `motion.duration.instant=200ms`, `motion.duration.fast=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
