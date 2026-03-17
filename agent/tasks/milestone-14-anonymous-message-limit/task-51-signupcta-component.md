# Task 51: Create SignupCta Component

**Milestone**: M14 - Anonymous Message Limit
**Estimated Hours**: 2
**Status**: Not Started

---

## Objective

Create a reusable SignupCta component that displays a sign-up prompt with a redirect-back link. This component replaces the MessageCompose input when anonymous users reach the 10-message limit. Port the proven pattern from agentbase.me with theme-aware styling.

---

## Context

agentbase.me uses a SignupCta component to prompt anonymous users for account creation after hitting message limits. memorycloud.chat needs the same component but styled with the memorycloud.chat theme system (`useTheme()` hook) instead of hardcoded Tailwind classes.

**Reference**: agentbase.me implementation at `src/components/auth/SignupCta.tsx` (see audit-22)

---

## Steps

### 1. Create SignupCta Component File

**File**: `src/components/auth/SignupCta.tsx`

```typescript
import { useTheme } from '@/lib/theming'

interface SignupCtaProps {
  message?: string
}

export function SignupCta({ message = 'Sign up to continue' }: SignupCtaProps) {
  const t = useTheme()

  const redirectUrl = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/'

  return (
    <div className={`px-4 py-3 ${t.border} border-t text-center`}>
      <p className={`text-sm ${t.textSecondary} mb-2`}>{message}</p>
      <a
        href={`/auth?mode=signup&redirect_url=${encodeURIComponent(redirectUrl)}`}
        className={`inline-block px-4 py-2 ${t.buttonPrimary} font-medium rounded-lg transition-all text-sm`}
      >
        Sign Up
      </a>
    </div>
  )
}
```

### 2. Add Component Export

**File**: `src/components/auth/index.ts` (create if doesn't exist)

```typescript
export { SignupCta } from './SignupCta'
```

### 3. Create Unit Test (Optional but Recommended)

**File**: `src/components/auth/SignupCta.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SignupCta } from './SignupCta'

describe('SignupCta', () => {
  it('renders with default message', () => {
    render(<SignupCta />)
    expect(screen.getByText('Sign up to continue')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<SignupCta message="You've sent 10 messages!" />)
    expect(screen.getByText("You've sent 10 messages!")).toBeInTheDocument()
  })

  it('generates correct redirect URL', () => {
    render(<SignupCta />)
    const link = screen.getByRole('link', { name: /sign up/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('/auth?mode=signup'))
    expect(link).toHaveAttribute('href', expect.stringContaining('redirect_url='))
  })
})
```

### 4. Test Component in Storybook (Optional)

If project has Storybook configured, add a story:

**File**: `src/components/auth/SignupCta.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { SignupCta } from './SignupCta'

const meta: Meta<typeof SignupCta> = {
  title: 'Auth/SignupCta',
  component: SignupCta,
}

export default meta
type Story = StoryObj<typeof SignupCta>

export const Default: Story = {}

export const CustomMessage: Story = {
  args: {
    message: "You've sent 10 messages! Sign up to continue the conversation.",
  },
}
```

---

## Verification Checklist

- [ ] SignupCta.tsx created in `src/components/auth/`
- [ ] Component accepts optional `message` prop
- [ ] Redirect URL captures current path + query params
- [ ] Sign-up link points to `/auth?mode=signup&redirect_url=...`
- [ ] Component uses `useTheme()` for theme-aware styling
- [ ] Border, text colors, and button styling match theme system
- [ ] Component renders correctly in dark and light themes
- [ ] (Optional) Unit tests pass
- [ ] (Optional) Storybook story renders correctly
- [ ] No TypeScript errors
- [ ] Component exported from index file

---

## Dependencies

- `useTheme()` hook from `@/lib/theming`
- `/auth` route with `mode=signup` and `redirect_url` query param support (already exists)

---

## Notes

- Use `t.buttonPrimary` for the sign-up button (matches primary CTA styling)
- Use `t.textSecondary` for the message text (subtle, non-alarming tone)
- Use `t.border` for top border (separates from chat area)
- Keep component simple — no state, no side effects
- Message prop allows customization per use case (e.g., different messages for different limits)

---

## Design Reference

From design document `local.anonymous-message-limit.md` (Section: Code Changes > SignupCta Component)
