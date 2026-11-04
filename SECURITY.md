# Security

## Authentication and authorization

The API uses Django sessions and CSRF protection. Moderator actions and resource ownership are enforced on the server. Public registration creates member accounts.

Pending reports and their images are accessible to the author and moderators. Reviewed reports follow the application's public visibility rules. Challenge evidence requires an authenticated, authorized request.

Reward records enforce uniqueness to prevent duplicate points for the same verified action.

## Upload handling

Report and challenge uploads accept JPEG or PNG files. The backend validates file size and dimensions, decodes the image and re-encodes it as JPEG with metadata removed. Uploaded files are served through API endpoints with access checks.

## Configuration

Development mode generates a signing key in `backend/.dev-secret`. Optional demo accounts use a generated password in `.local/demo-password.txt`.

Production requires `DJANGO_SECRET_KEY` and `DJANGO_DEBUG=0`. Secure cookies, HTTPS redirection and HSTS are enabled when DEBUG is disabled. Upload storage must remain private; the application serves authorized files through the API.

## Reporting vulnerabilities

Use GitHub private vulnerability reporting when available. Include the affected version, reproduction steps and expected impact. Use synthetic accounts and files in reproduction cases.
