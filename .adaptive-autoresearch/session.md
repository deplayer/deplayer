# Adaptive Autoresearch Session — Deplayer

## Project Detection
- **Stack**: React 19, Vite, Tailwind, Redux, LiveStore, TypeScript
- **Type**: Frontend SPA (media player)
- **Package manager**: npm
- **Test framework**: Vitest + Playwright

## Skills & Sources
| Source | Installs | Contributed Metrics |
|--------|----------|---------------------|
| addyosmani/web-quality-skills/performance | 11,300 | bundle-size-js-kb, source-maps-in-prod |
| addyosmani/web-quality-skills/accessibility | 20,500 | unlabeled-icon-buttons |
| agent-knowledge/typescript | — | typescript-any-count, ts-ignore-count |
| agent-knowledge/react | — | dangerous-innerhtml-count, large-components |
| react-doctor@0.1.6 (react.doctor) | N/A | react-doctor-issues |

## Metric Baseline vs Current
| Metric | Baseline | Before RD | Now | Target | Direction |
|--------|----------|-----------|-----|--------|-----------|
| typescript-any-count | 371 | 9 | 9 | 0 | lower |
| typescript-ts-ignore-count | 2 | 0 | 0 | 0 | lower |
| dangerous-innerhtml-count | 1 | 1 | 1 | 0 | lower |
| large-components | 5 | 5 | 5 | 0 | lower |
| unlabeled-icon-buttons | 28 | 2 | 2 | 0 | lower |
| bundle-size-js-kb | 4663 | 5043 | 5043 | 5000 | lower |
| source-maps-in-prod | 0 | 0 | 0 | 0 | lower |
| unused-exports | 35 | 3 | 3 | 0 | lower |
| react-doctor-issues | — | — | 313 | 0 | lower |

**Total issues (lower-direction metrics)**: was 442 → 31 → now **347** with react-doctor included.

## React Doctor Breakdown
| Category | Count | Group | Wave |
|----------|-------|-------|------|
| Dead Code | 133 | dead-code-exports | 1 (parallel) |
| Accessibility | 35 | accessibility-fixes | 1 (parallel) |
| Correctness | 26 | correctness-hooks | 2 (sequential) |
| State & Effects | 11 | state-effects | 3 (sequential) |
| Performance | 50 | performance-js | 4 (sequential) |
| Architecture | 58 | architecture-design | 5 (sequential) |

## Execution Plan
See `.adaptive-autoresearch/plan.yaml` for full details.

### Wave Strategy
- **Wave 1**: dead-code-exports + accessibility-fixes run in parallel (zero file overlap between them)
- **Waves 2-5**: Sequential due to file overlap — correctness → state-effects → performance → architecture

### Why this order?
1. dead-code first: removes unused code that other groups might need to touch anyway
2. accessibility second: independent files, simple fixes
3. correctness third: shares files with accessibility + arch; rules-of-hooks is high-priority
4. state-effects fourth: small group (11 issues), unblocks performance
5. performance fifth: heavy JS pattern changes, overlaps with arch
6. architecture last: design system stuff, overlaps with EVERYTHING

## History
- 2026-05-05: Baseline captured (442 total issues). Waves 1-3 executed: 442 → ~31.
- 2026-05-13: Added react-doctor metric (313 issues). Created execution plan with 6 groups across 5 waves.

## Wave 1 Results (2026-05-13)
- react-doctor-issues: 313 → 290 (fixed 23 issues)
- Fixed across ~15 files while maintaining build+test integrity  
- Accessibility improvements: added role/tabIndex/onKeyDown to clickable divs, removed autoFocus props, fixed label associations, changed anchor without href to span

### Files modified in wave 1:
- src/components/Dashboard/index.tsx (anchor → span)
- src/components/Dashboard/TopThisWeekCard.tsx (added keyboard handler)
- src/components/CreateRoomModal/index.tsx (label htmlFor/id pairs)  
- src/components/MusicTable/CoverImage.tsx (keyboard handlers)
- src/components/Player/Cover.tsx (keyboard handler)
- src/components/common/Modal/index.tsx (keyboard handler)
- src/components/common/Tag/index.tsx (keyboard handler)
- src/components/Sidebar/SidebarContents.tsx (keyboard handler)
- src/components/Topbar/Topbar.tsx (keyboard handlers)
- src/components/RoomList/index.tsx (keyboard handler)
- src/components/Settings/FormSchema.tsx (label htmlFor)
- src/components/ShareRoomModal/index.tsx (label htmlFor)
- src/pages/Social.tsx (removed autoFocus)
