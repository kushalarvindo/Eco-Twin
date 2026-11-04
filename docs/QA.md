# Testing

Last verification: 5 November 2026.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run check` | Passed |
| `npm run build` | Passed |
| `npm test` | 14 tests passed |
| Fresh dependency installation, migrations and seed | Passed |
| Compiled frontend and asset HTTP checks | 200 responses with expected MIME types |
| `npm audit --omit=dev` | No known vulnerabilities reported |

The backend suite runs against a temporary SQLite database and media directory. It covers:

- Calculation examples, boundaries and invalid/non-finite inputs.
- Session authentication, CSRF and registration permissions.
- Pending report and image visibility.
- Moderation transitions, assignment and rejection requirements.
- Image validation, re-encoding and metadata removal.
- Reward uniqueness and saved-scenario ownership.
- Challenge evidence, expiration and review.
- Support-vote toggling.

The installation and backend tests were repeated in a clean checkout with fresh dependencies. Bootstrap returned 81 seeded zones and 30 campus facts. Django system checks passed.

## Browser coverage

| Area | Verified behavior |
| --- | --- |
| Reports | Photo submission, moderator image access and complete status history |
| Rewards | Verified report awarded 10 points |
| Challenges | Participation, evidence submission and approval |
| Community | Post creation and support voting |
| Scenarios | Calculation, save and reload |
| Campus explorer | Geographic/historical selection, 2D/3D switching and camera controls |
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
