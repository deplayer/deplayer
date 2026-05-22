# Deplayer Agent Guidelines

This document provides build commands and code style guidelines for agentic coding agents working in the Deplayer repository.

## Build, Lint, and Test Commands

### Core Commands
- `npm run dev` - Start development server on 127.0.0.1
- `npm run build` - Production build (runs TypeScript compiler + Vite)
- `npm run lint` - Run ESLint with zero warnings allowed
- `npm run preview` - Preview production build

### Test Commands
- `npm test` - Run all tests (Vitest with --watch=false)
- `npm run test:watch` - Run tests in watch mode
- `npm run coverage` - Run tests with coverage report

### Running Single Tests
Run a specific test file:
```bash
npm test -- path/to/file.spec.ts
```

Run tests matching a pattern:
```bash
npm test -- --grep "test name"
```

### Database Commands
- `npm run db:generate` - Generate Drizzle migrations and compile them

### Code Quality
- `npm run knip` - Detect unused files, exports, and dependencies
- `npm run roomba` - Auto-fix dead code issues

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** - All type checking rules are active
- **No unused locals/parameters** - Code must not include unused variables
- **No import React** - JSX transform handles React imports automatically
- **Target ES2020** with moduleResolution: "bundler"

### Imports and Exports
- Prefer named exports over default exports
- Group imports: external libs first, then internal modules
- Use absolute imports from `@/` alias when available
- Example:
  ```typescript
  import { useState } from 'react'
  import Media from '../entities/Media'
  import { formatTime } from '../utils/timeFormatter'
  ```

### Naming Conventions
- **Components**: PascalCase (e.g., `PlayAllButton.tsx`)
- **Functions/Variables**: camelCase (e.g., `formatDuration`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase with 'I' prefix optional (e.g., `IMedia`)
- **Classes**: PascalCase (e.g., `MediaMergerService`)

### File Organization
```
src/
├── components/        # React components
│   ├── common/       # Reusable shared components
│   └── [feature]/    # Feature-specific components
├── containers/       # Redux-connected components
├── entities/         # Domain entities/classes
├── services/         # Business logic services
├── utils/            # Utility functions
├── store/            # Redux store configuration
├── sagas/            # Redux saga effects
└── styles/           # Global styles
```

### React Component Guidelines
- Use functional components with hooks
- Define Props interface above component
- Use Tailwind CSS + DaisyUI for styling
- Use `classnames` library for conditional classes
- Add `data-testid` attributes for test selectors
- Example:
  ```typescript
  type Props = {
    onClick: () => void
    children: ReactNode
    disabled?: boolean
  }

  const Button = ({ onClick, children, disabled }: Props) => {
    const classNames = classnames({
      'btn': true,
      'disabled:opacity-50': disabled
    })
    return <button className={classNames} onClick={onClick}>{children}</button>
  }
  ```

### Testing Guidelines
- Test files must be next to implementation with `.spec.ts` or `.spec.tsx` extension
- Use Vitest with `describe`, `it`, `expect` from 'vitest'
- Use factory functions from `src/test-utils/factories.ts` for test data
- **Do not use `getByTitle` in tests** (forbidden rule)
- Mock external dependencies with `vi.mock()`
- Clean up after each test with `cleanup()` or `afterEach`
- Use test isolation: beforeEach/afterEach to reset state
- Example:
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen, fireEvent } from '@testing-library/react'

  describe('ComponentName', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render correctly', () => {
      render(<Component />)
      expect(screen.getByTestId('component')).toBeInTheDocument()
    })
  })
  ```

### Error Handling
- Use try-catch for async operations
- Return error objects or throw with descriptive messages
- Use proper TypeScript typing for error states
- Example:
  ```typescript
  const fetchData = async () => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch data:', error)
      throw error
    }
  }
  ```

### Redux Guidelines
- Use Redux Toolkit for store configuration
- Use redux-saga for async operations
- Containers connect components to Redux state
- Actions use SCREAMING_SNAKE_CASE (e.g., `PLAY_ALL`)
- Use `mapStateToProps` and `mapDispatchToProps` or hooks

### Styling Guidelines
- Use Tailwind CSS utility classes
- DaisyUI components for UI primitives
- Custom SCSS in `src/styles/` for complex styles
- Use `classnames` library for conditional styling

### Linting Rules
- **Zero warnings policy** - `--max-warnings 0`
- Run lint before committing
- Fix lint errors automatically when possible
- Never disable lint rules without team consensus
- Use `// eslint-disable-next-line` sparingly with explanations

### Type Definitions
- Prefer `interface` for object shapes
- Use `type` for unions, primitives, and utility types
- Export interfaces when used across files
- Use readonly modifiers for immutable data
- Example:
  ```typescript
  interface IMedia {
    id: string
    title: string
    duration?: number
  }

  type MediaType = 'audio' | 'video'
  ```

### LiveStore Guidelines
This project is migrating to LiveStore. When working with LiveStore:
- **Documentation lookup**: When you need to look up information about LiveStore, always use the `docs` directory shipped with `@livestore/livestore` package in `node_modules/@livestore/livestore/docs`
- LiveStore documentation is available locally in the node_modules directory


<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>ab-test-setup</name>
<description>When the user wants to plan, design, or implement an A/B test or experiment. Also use when the user mentions "A/B test," "split test," "experiment," "test this change," "variant copy," "multivariate test," or "hypothesis." For tracking implementation, see analytics-tracking.</description>
<location>global</location>
</skill>

<skill>
<name>agent-browser</name>
<description>Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction.</description>
<location>global</location>
</skill>

<skill>
<name>analytics-tracking</name>
<description>When the user wants to set up, improve, or audit analytics tracking and measurement. Also use when the user mentions "set up tracking," "GA4," "Google Analytics," "conversion tracking," "event tracking," "UTM parameters," "tag manager," "GTM," "analytics implementation," or "tracking plan." For A/B test measurement, see ab-test-setup.</description>
<location>global</location>
</skill>

<skill>
<name>competitor-alternatives</name>
<description>"When the user wants to create competitor comparison or alternative pages for SEO and sales enablement. Also use when the user mentions 'alternative page,' 'vs page,' 'competitor comparison,' 'comparison page,' '[Product] vs [Product],' '[Product] alternative,' or 'competitive landing pages.' Covers four formats: singular alternative, plural alternatives, you vs competitor, and competitor vs competitor. Emphasizes deep research, modular content architecture, and varied section types beyond feature tables."</description>
<location>global</location>
</skill>

<skill>
<name>content-strategy</name>
<description>When the user wants to plan a content strategy, decide what content to create, or figure out what topics to cover. Also use when the user mentions "content strategy," "what should I write about," "content ideas," "blog strategy," "topic clusters," or "content planning." For writing individual pieces, see copywriting. For SEO-specific audits, see seo-audit.</description>
<location>global</location>
</skill>

<skill>
<name>copy-editing</name>
<description>"When the user wants to edit, review, or improve existing marketing copy. Also use when the user mentions 'edit this copy,' 'review my copy,' 'copy feedback,' 'proofread,' 'polish this,' 'make this better,' or 'copy sweep.' This skill provides a systematic approach to editing marketing copy through multiple focused passes."</description>
<location>global</location>
</skill>

<skill>
<name>copywriting</name>
<description>When the user wants to write, rewrite, or improve marketing copy for any page — including homepage, landing pages, pricing pages, feature pages, about pages, or product pages. Also use when the user says "write copy for," "improve this copy," "rewrite this page," "marketing copy," "headline help," or "CTA copy." For email copy, see email-sequence. For popup copy, see popup-cro.</description>
<location>global</location>
</skill>

<skill>
<name>email-sequence</name>
<description>When the user wants to create or optimize an email sequence, drip campaign, automated email flow, or lifecycle email program. Also use when the user mentions "email sequence," "drip campaign," "nurture sequence," "onboarding emails," "welcome sequence," "re-engagement emails," "email automation," or "lifecycle emails." For in-app onboarding, see onboarding-cro.</description>
<location>global</location>
</skill>

<skill>
<name>form-cro</name>
<description>When the user wants to optimize any form that is NOT signup/registration — including lead capture forms, contact forms, demo request forms, application forms, survey forms, or checkout forms. Also use when the user mentions "form optimization," "lead form conversions," "form friction," "form fields," "form completion rate," or "contact form." For signup/registration forms, see signup-flow-cro. For popups containing forms, see popup-cro.</description>
<location>global</location>
</skill>

<skill>
<name>free-tool-strategy</name>
<description>When the user wants to plan, evaluate, or build a free tool for marketing purposes — lead generation, SEO value, or brand awareness. Also use when the user mentions "engineering as marketing," "free tool," "marketing tool," "calculator," "generator," "interactive tool," "lead gen tool," "build a tool for leads," or "free resource." This skill bridges engineering and marketing — useful for founders and technical marketers.</description>
<location>global</location>
</skill>

<skill>
<name>launch-strategy</name>
<description>"When the user wants to plan a product launch, feature announcement, or release strategy. Also use when the user mentions 'launch,' 'Product Hunt,' 'feature release,' 'announcement,' 'go-to-market,' 'beta launch,' 'early access,' 'waitlist,' or 'product update.' This skill covers phased launches, channel strategy, and ongoing launch momentum."</description>
<location>global</location>
</skill>

<skill>
<name>marketing-ideas</name>
<description>"When the user needs marketing ideas, inspiration, or strategies for their SaaS or software product. Also use when the user asks for 'marketing ideas,' 'growth ideas,' 'how to market,' 'marketing strategies,' 'marketing tactics,' 'ways to promote,' or 'ideas to grow.' This skill provides 139 proven marketing approaches organized by category."</description>
<location>global</location>
</skill>

<skill>
<name>marketing-psychology</name>
<description>"When the user wants to apply psychological principles, mental models, or behavioral science to marketing. Also use when the user mentions 'psychology,' 'mental models,' 'cognitive bias,' 'persuasion,' 'behavioral science,' 'why people buy,' 'decision-making,' or 'consumer behavior.' This skill provides 70+ mental models organized for marketing application."</description>
<location>global</location>
</skill>

<skill>
<name>onboarding-cro</name>
<description>When the user wants to optimize post-signup onboarding, user activation, first-run experience, or time-to-value. Also use when the user mentions "onboarding flow," "activation rate," "user activation," "first-run experience," "empty states," "onboarding checklist," "aha moment," or "new user experience." For signup/registration optimization, see signup-flow-cro. For ongoing email sequences, see email-sequence.</description>
<location>global</location>
</skill>

<skill>
<name>page-cro</name>
<description>When the user wants to optimize, improve, or increase conversions on any marketing page — including homepage, landing pages, pricing pages, feature pages, or blog posts. Also use when the user says "CRO," "conversion rate optimization," "this page isn't converting," "improve conversions," or "why isn't this page working." For signup/registration flows, see signup-flow-cro. For post-signup activation, see onboarding-cro. For forms outside of signup, see form-cro. For popups/modals, see popup-cro.</description>
<location>global</location>
</skill>

<skill>
<name>paid-ads</name>
<description>"When the user wants help with paid advertising campaigns on Google Ads, Meta (Facebook/Instagram), LinkedIn, Twitter/X, or other ad platforms. Also use when the user mentions 'PPC,' 'paid media,' 'ad copy,' 'ad creative,' 'ROAS,' 'CPA,' 'ad campaign,' 'retargeting,' or 'audience targeting.' This skill covers campaign strategy, ad creation, audience targeting, and optimization."</description>
<location>global</location>
</skill>

<skill>
<name>paywall-upgrade-cro</name>
<description>When the user wants to create or optimize in-app paywalls, upgrade screens, upsell modals, or feature gates. Also use when the user mentions "paywall," "upgrade screen," "upgrade modal," "upsell," "feature gate," "convert free to paid," "freemium conversion," "trial expiration screen," "limit reached screen," "plan upgrade prompt," or "in-app pricing." Distinct from public pricing pages (see page-cro) — this skill focuses on in-product upgrade moments where the user has already experienced value.</description>
<location>global</location>
</skill>

<skill>
<name>popup-cro</name>
<description>When the user wants to create or optimize popups, modals, overlays, slide-ins, or banners for conversion purposes. Also use when the user mentions "exit intent," "popup conversions," "modal optimization," "lead capture popup," "email popup," "announcement banner," or "overlay." For forms outside of popups, see form-cro. For general page conversion optimization, see page-cro.</description>
<location>global</location>
</skill>

<skill>
<name>pricing-strategy</name>
<description>"When the user wants help with pricing decisions, packaging, or monetization strategy. Also use when the user mentions 'pricing,' 'pricing tiers,' 'freemium,' 'free trial,' 'packaging,' 'price increase,' 'value metric,' 'Van Westendorp,' 'willingness to pay,' or 'monetization.' This skill covers pricing research, tier structure, and packaging strategy."</description>
<location>global</location>
</skill>

<skill>
<name>product-marketing-context</name>
<description>"When the user wants to create or update their product marketing context document. Also use when the user mentions 'product context,' 'marketing context,' 'set up context,' 'positioning,' or wants to avoid repeating foundational information across marketing tasks. Creates `.claude/product-marketing-context.md` that other marketing skills reference."</description>
<location>global</location>
</skill>

<skill>
<name>programmatic-seo</name>
<description>When the user wants to create SEO-driven pages at scale using templates and data. Also use when the user mentions "programmatic SEO," "template pages," "pages at scale," "directory pages," "location pages," "[keyword] + [city] pages," "comparison pages," "integration pages," or "building many pages for SEO." For auditing existing SEO issues, see seo-audit.</description>
<location>global</location>
</skill>

<skill>
<name>referral-program</name>
<description>"When the user wants to create, optimize, or analyze a referral program, affiliate program, or word-of-mouth strategy. Also use when the user mentions 'referral,' 'affiliate,' 'ambassador,' 'word of mouth,' 'viral loop,' 'refer a friend,' or 'partner program.' This skill covers program design, incentive structure, and growth optimization."</description>
<location>global</location>
</skill>

<skill>
<name>schema-markup</name>
<description>When the user wants to add, fix, or optimize schema markup and structured data on their site. Also use when the user mentions "schema markup," "structured data," "JSON-LD," "rich snippets," "schema.org," "FAQ schema," "product schema," "review schema," or "breadcrumb schema." For broader SEO issues, see seo-audit.</description>
<location>global</location>
</skill>

<skill>
<name>seo-audit</name>
<description>When the user wants to audit, review, or diagnose SEO issues on their site. Also use when the user mentions "SEO audit," "technical SEO," "why am I not ranking," "SEO issues," "on-page SEO," "meta tags review," or "SEO health check." For building pages at scale to target keywords, see programmatic-seo. For adding structured data, see schema-markup.</description>
<location>global</location>
</skill>

<skill>
<name>signup-flow-cro</name>
<description>When the user wants to optimize signup, registration, account creation, or trial activation flows. Also use when the user mentions "signup conversions," "registration friction," "signup form optimization," "free trial signup," "reduce signup dropoff," or "account creation flow." For post-signup onboarding, see onboarding-cro. For lead capture forms (not account creation), see form-cro.</description>
<location>global</location>
</skill>

<skill>
<name>skill-creator</name>
<description>Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.</description>
<location>global</location>
</skill>

<skill>
<name>social-content</name>
<description>"When the user wants help creating, scheduling, or optimizing social media content for LinkedIn, Twitter/X, Instagram, TikTok, Facebook, or other platforms. Also use when the user mentions 'LinkedIn post,' 'Twitter thread,' 'social media,' 'content calendar,' 'social scheduling,' 'engagement,' or 'viral content.' This skill covers content creation, repurposing, and platform-specific strategies."</description>
<location>global</location>
</skill>

<skill>
<name>superdesign</name>
<description>></description>
<location>global</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
