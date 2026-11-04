# Public source package

Prepared 5 November 2026 for `kushalarvindo/Eco-Twin`.

The published checkout contains application source, migrations, dependency manifests, configuration placeholders, the Windows startup helper, curated public campus facts, derived campus geometry, source/accuracy notes, verification notes and two signed-out application screenshots.

It excludes local SQLite databases and journals, uploaded evidence, sessions/accounts, generated secrets, `.env` files, demo passwords, public/private keys and certificates, development logs, local handoff notes, machine paths, original PDF/Word documents, raw web/OSM archives and third-party agent skill bundles. Campus fact records with the `contact` topic are omitted; the backend also filters that topic from its public bootstrap response.

The initial target repository was empty. Publication used a separate clean Git checkout, an explicit file allowlist, review of the staged file list and text scanning of the exact staged blobs. Checks look for common provider tokens, credential URLs, key material, fixed secret assignments, personal Windows paths, non-placeholder email addresses and excluded file types. Only the reviewed signed-out screenshots are allowed as binary files. No application database or user upload is part of the package. Automated pattern checks are a guard, not proof that all possible sensitive information can be detected.

No raw research documents or photos are redistributed. The derived OSM database carries contributor attribution and the ODbL source link. The geometry conversion script is included for reference; its original local raw extracts are not required to run the app and are not bundled.

Uploading this source does not deploy a hosted Django service. The setup and production boundaries are in the README. Local browser QA uses synthetic submissions; those are not represented as real campus activity.
