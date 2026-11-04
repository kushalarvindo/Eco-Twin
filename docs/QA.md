# Verification record

Checked locally on 4–5 November 2026. This records the tested scope, not a production-readiness certification.

## Automated checks

- TypeScript checking and the production Vite build pass.
- A separate clean publication checkout completed `npm ci`, a fresh Python virtual-environment install, migrations, local demo seeding and its production frontend build.
- **14 Django tests pass** in both the development workspace and the clean checkout. Tests use a temporary SQLite database and temporary media storage.
- Coverage includes calculation examples and boundaries; invalid/non-finite inputs; unauthorised writes; CSRF and registration; ignored privilege escalation; pending report/image privacy; validated moderation transitions and rejection reasons; upload decoding, re-encoding and metadata removal; unique rewards; saved-scenario ownership; challenge verification and expiration; and vote toggling.
- Fresh demo passwords were checked against both newly created local accounts without displaying the password. Runtime credentials remain outside the source package.
- `npm audit --omit=dev` reported zero known vulnerabilities in the checked dependency set. The clean `npm ci` audit also reported zero. This is a point-in-time advisory check.
- The clean checkout served the compiled page and its JavaScript/CSS assets with HTTP 200 and correct MIME types. Bootstrap returned 81 seeded zones and 30 curated facts, with contact records absent.
- Django system checks reported no errors. Test runs may warn that the optional collected-static directory has not been created; this did not prevent tests or built-asset HTTP checks.

## Browser checks

The actual application was exercised through the browser, including its compiled frontend served by Django.

Earlier workflow checks used clearly synthetic evidence: member report creation, moderator image inspection and Pending → Verified → Assigned → In Progress → Resolved history; one 10-point reward; challenge evidence approval; a community suggestion and support vote; saving and reloading a waste scenario; and geographic/historical 2D/3D selection. Synthetic contributions were removed from the development database after the walkthrough.

The display-customization pass checked:

1. All seven preference controls, plus reset: appearance, accent, density, text size, default campus view, rendering quality and reduced motion.
2. Persistence after page reload, confirmed through selected controls and rendered document attributes.
3. A saved default 2D view opening after reload; switching back to 3D; light/dark quick toggling; ocean and clay accents.
4. Dark-mode navigation through explorer, reports, environment, scenarios, challenges and community; sign-in and customization dialogs.
5. A waste calculation of 100 kg/day with a 30% reduction returning 70 kg/day, with readable comparison/chart labels.
6. The 375 × 812 phone layout, customization-dialog scrolling, and larger text without horizontal document overflow. Earlier responsive checks covered 375, 768, 1024 and 1440 px widths.
7. Escape closing the settings dialog and returning focus to its trigger. Earlier sign-in-dialog checks confirmed focus containment and Escape dismissal.
8. Rendered text-color inspection and visual review. Faint map, scenario and challenge labels were corrected. This was a focused inspection, not a complete accessibility audit.
9. The clean publication copy loading its real compiled explorer. No new browser console errors were captured during this display-verification sequence.

The app responds to system color-scheme changes in code; an OS-theme change was not manually exercised during this pass. Low-power mode reduces the pixel-ratio limit; no battery-life improvement is claimed.

## Graphics and accuracy

A previous geographic-scene sample measured 125 draw calls and 67,841 triangles. A settled frame counter remained unchanged across observations, consistent with demand rendering. These are single-session diagnostics, not a sustained FPS, GPU-memory or low-end-phone benchmark.

The renderer uses merged paths and instanced windows. A previous production-navigation DOM teardown error involving in-canvas HTML labels was repaired by keeping labels/details in the ordinary React interface. The 2D SVG view remains available independently of WebGL.

The model has public mapped footprints and explicitly estimated heights/materials. The calculator is a linear hypothetical scenario model. Neither is presented as a surveyed replica, calibrated forecast or connected live sensor system.

## Public evidence

- [Light explorer](qa/desktop-explorer.jpg)
- [Dark explorer](qa/dark-explorer.jpg)

Both screenshots are signed out and show no submitted evidence or private account information. Detailed local logs, raw archives, synthetic report screenshots and runtime databases are excluded from the public repository.

## Limits and reproduction

Follow the README, then run `npm run check`, `npm run build` and `npm test`. Repeat browser contributions only with synthetic data and test-only local accounts.

A complete screen-reader/WCAG audit, physical GPS denial, real institutional uploads, forced WebGL context loss on physical low-end devices, prolonged concurrency, production PostgreSQL/PostGIS, hosted deployment, account recovery and backup restoration were not verified. The sizeable Three.js dependency chunk remains documented in the README.
