# Testing

Last verification: 5 November 2026.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run check` | Passed |
| `npm run build` | Passed (10.11s) |
| `npm test` | 17 tests passed |
| Fresh dependency installation, migrations and seed | Passed |
| Compiled frontend and asset HTTP checks | 200 responses with expected MIME types |
| `npm audit --omit=dev` | No known vulnerabilities reported |

The backend suite runs against a temporary SQLite database and media directory. It covers:

- Calculation examples, boundaries and invalid/non-finite inputs (waste, energy, water, and carbon footprint).
- Session authentication, CSRF and registration permissions.
- Pending report and image visibility.
- Moderation transitions, assignment and rejection requirements.
- Image validation, re-encoding and metadata removal.
- Reward uniqueness and saved-scenario ownership.
- Coordinate validation (boundary limits, non-finite values and coordinate pair requirements).
- Reported GPS coordinate privacy (visible to author and moderators; suppressed from other users and anonymous responses).
- Challenge evidence, expiration and review.
- Support-vote toggling.
- Meter reading import idempotency, zero resets, rollbacks, and report analytics visibility.

The installation and backend tests were repeated in a clean checkout with fresh dependencies. Bootstrap returned 81 seeded zones and 30 campus facts. Django system checks passed.

## Browser coverage

| Area | Verified behavior |
| --- | --- |
| Reports | Photo submission, moderator image access and complete status history |
| Rewards | Verified report awarded 10 points |
| Challenges | Participation, evidence submission and approval |
| Community | Post creation and support voting |
| Scenarios | Calculation, save, reload and campus-wide area-weighted pro-rata breakdown |
| Campus explorer | Geographic/historical selection, 2D/3D switching, camera presets, walking route calculator, department directory and infrastructure markers |
| Environmental modes | Solar rooftop potential hotspot layer, pedestrian walkway highlighting, environmental infrastructure pins |
| Offline queue | LocalStorage queuing of photo reports on network disconnection and batch server synchronization |
| Appearance | Light/dark toggle, accents, density, text size and saved preferences |
| Dialogs | Keyboard focus, Escape dismissal and mobile scrolling |
| Responsive layout | 375, 768, 1024 and 1440 px widths |

The waste scenario returned 70 kg/day for a 100 kg/day baseline and 30% reduction. Saved preferences were retained after reload. Larger text and the settings dialog were checked at 375 × 812 px without horizontal document overflow.

The compiled application was checked through Django, including route navigation. No new console errors were recorded in the final display verification sequence.

## Rendering measurements

| Metric | Observed value |
| --- | --- |
| Draw calls | 125 |
| Triangles | 67,841 |
| Three.js dependency chunk | Approximately 1.13 MB before gzip |
| Idle rendering | Frame counter remained unchanged after settling |

These measurements come from one browser session. Sustained frame rate, GPU memory usage and physical low-end-device performance have not been measured.

## Remaining coverage

- Full screen-reader and WCAG evaluation.
- System-theme changes during an active session.
- Physical-device GPS denial and WebGL context loss.
- Concurrent workloads and shared-cache throttling.
- Production PostgreSQL/PostGIS.
- Hosted deployment and backup restoration.

## Screenshots

[Light theme](qa/desktop-explorer.jpg) · [Dark theme](qa/dark-explorer.jpg)

## Reproduce

Follow the development setup in the README, then run:

```powershell
npm run check
npm run build
npm test
```

## 6 November 2026 — fieldwork and UI verification

- Added repair photographs, author confirmation and follow-up history, plus reviewed survey submissions and protected photos. Migration 0004 adds the required records. Backend regression tests cover permissions, repeated confirmation, follow-up, survey review and invalid height submissions.
- Added network routing on mapped path edges, approximate connections to building centroids, mapped-step avoidance, directions and matching 2D/3D lines. Three common destinations from CSE passed routing checks. With step segments excluded, 51 of 55 building destinations were reachable from CSE.
- Added selected-roof rainwater calculation with editable rainfall, connected roof fraction and efficiency, including zero input.
- Retained the previous Debug Mode menu and persona buttons. Its reports, map counts, history and saved scenarios use an isolated browser-tab sample session. Numeric report IDs no longer determine whether a record is synthetic.
- Fixed profile statistic surfaces in dark mode and contrast in badges, reward labels and selected controls.
- UI checks covered seven main pages in light and dark modes at 375, 767 and 1440 px (42 route/viewport checks), with no horizontal overflow. Automated WCAG A/AA checks on those pages found no violations in the final reviewed run. This is bounded automated coverage, not a complete manual accessibility certification.
- Browser tests using temporary real accounts completed survey submission/approval, after-repair upload and reporter confirmation. Temporary accounts, reports, survey records and images were removed after verification. Sample-mode tests covered scenario save/reload, zero rainfall, route switching and returning to campus records.

## 6 November 2026 — 3D tools and copy review

- Production build and all 20 backend tests passed. The new map-pin test covers private/public coordinates, pending-report visibility, staff access and campus bounds.
- `npm run test:studio` passed coordinate round trips, model distance/area, walking collision/start points, proposal import validation and sun positions. `npm run test:routes` passed.
- Browser interaction checks passed proposal placement/save, two-point distance, three-point area, date/time shadow controls, floor clipping, WASD movement, map-pin report selection and local panorama validation/viewpoint linking. Leaving panorama mode restored the overview camera. Temporary real-account tests completed pin submission, moderation and opt-in public visibility; test records and uploads were removed.
- All eight tools fit light/dark layouts at 375, 767 and 1440 px (48 combinations). Automated WCAG A/AA checks in edit, measure and panorama modes at 767 px found no violations after correcting the scene group's ARIA role and the light-theme location label contrast.
- The seven main pages also fit both themes at those three widths (42 combinations). Profile checks found no automated WCAG A/AA violations. No browser exceptions occurred in these reviewed flows.
- The three bundled campus photographs loaded and retained visible source/year/license credits. Synthetic flat-color panorama fixtures were used only for local interaction tests and are not bundled as campus imagery.
- Removed repeated slogans and page eyebrows. Source notes, height assumptions and advanced object controls are expandable. The existing debug drawer and persona buttons are unchanged.

Physical-device walking controls, a genuine campus panorama, surveyed floor plans, current facade accuracy and a complete manual accessibility review remain outside this verification.
