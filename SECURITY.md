# Security and local data

This is a local pilot. No external API key is required. Development mode creates a secret in `backend/.dev-secret`; optional demo accounts use a generated password stored in `.local/demo-password.txt`. Both are ignored by Git. Environment variables are read from the process; `.env.example` contains placeholders only.

Do not commit runtime databases, uploads, logs, account exports, credentials or key files. The initial public checkout was assembled from an explicit source-file allowlist, then its staged blobs were inspected. `python scripts/audit_public.py --staged` repeats targeted checks before a commit; `python scripts/audit_public.py` checks the committed tracked files. These checks cannot recognise every possible sensitive value, so review the changed files too.

The backend uses session authentication, CSRF protection, server-side moderation permissions, protected pending evidence, image decoding/re-encoding and unique reward events. These controls are covered by automated tests. Approved public contributions are visible in the app; authors should avoid submitting personal details in photos or text.

Before hosting, use production settings, a new host-managed secret, HTTPS, private persistent media, a production WSGI server, a shared cache/throttling strategy and tested backups. Account recovery, monitoring and data retention need a deployment plan. Do not expose the DEBUG server or demo accounts publicly.

For an issue, use GitHub's private vulnerability reporting if enabled on this repository. Do not paste working credentials, personal evidence or exploit-sensitive information into a public issue. Ordinary reproducible bugs can be reported with synthetic data.
