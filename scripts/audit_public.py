"""Review tracked (or staged) Git blobs without printing potential secret values.

This is a targeted guard, not a guarantee that every possible secret is detectable.
Run: python scripts/audit_public.py [--staged]
"""
import re
import subprocess
import sys
from pathlib import PurePosixPath


def git(*args):
    return subprocess.check_output(['git', *args])


staged = '--staged' in sys.argv
names = git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z') if staged else git('ls-files', '-z')
paths = [p.decode('utf-8') for p in names.split(b'\0') if p]
rules = {
    'key material': r'-----BEGIN (?:[A-Z ]*PRIVATE KEY|PUBLIC KEY|CERTIFICATE)-----|ssh-(?:rsa|ed25519)\s+[A-Za-z0-9+/]{30,}',
    'GitHub token': r'\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b',
    'cloud access token': r'\b(?:AKIA[A-Z0-9]{16}|AIza[\w-]{30,}|xox[baprs]-[\w-]{20,})\b',
    'JWT': r'\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b',
    'personal Windows path': r'(?i)[A-Z]:[\\/]+(?:Users|OPERATION GDG)[\\/]',
    'credential URL': r'https?://[^\s/:@]+:[^\s/@]+@',
    'fixed password/secret assignment': r'''(?i)\b(?:password|secret_key|api_key|access_token)\s*[:=]\s*['"](?!replace[- ]|your[- ]|example|\{)[^'"\n]{8,}['"]''',
}
failures = []
binary_count = 0
for path in paths:
    p = PurePosixPath(path)
    parts = set(p.parts)
    if (parts & {'.local', '.venv', 'node_modules', '.agent', '.publish', 'media', '__pycache__', 'staticfiles', 'dist'}
        or p.name in {'.env', '.dev-secret', 'sync.md'}
        or (p.name.startswith('.env.') and p.name != '.env.example')
        or p.suffix.lower() in {'.pem', '.key', '.pub', '.p12', '.pfx', '.sqlite3', '.db', '.log', '.pdf', '.docx', '.osm'}
        or ('RVCE Research' in parts and path != 'RVCE Research/data/facts.json')):
        failures.append((path, 'excluded file type or directory'))
    blob = git('show', ':' + path) if staged else git('show', 'HEAD:' + path)
    try:
        text = blob.decode('utf-8-sig')
    except UnicodeDecodeError:
        binary_count += 1
        if path not in {'docs/qa/desktop-explorer.jpg', 'docs/qa/dark-explorer.jpg', 'public/campus/admin.jpg', 'public/campus/mechanical.jpg', 'public/campus/sir-m-v-hostel.jpg'}:
            failures.append((path, 'unreviewed binary'))
        continue
    # The scanner's own regex definitions are detection rules, not credentials.
    if path != 'scripts/audit_public.py':
        for label, pattern in rules.items():
            if re.search(pattern, text):
                failures.append((path, label))
    for address in re.findall(r'(?<![\w.-])[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', text):
        domain = address.rsplit('@', 1)[1].lower()
        if domain not in {'example.test', 'example.com', 'users.noreply.github.com'}:
            failures.append((path, 'non-placeholder email address'))

for path, reason in failures:
    print(f'REVIEW: {path}: {reason}')
print(f'Checked {len(paths)} {"staged" if staged else "tracked"} files; {binary_count} reviewed image files; {len(failures)} flags.')
sys.exit(bool(failures))
