# LUXUM website

## Run locally
Requires Node.js 18+.

```bash
npm start
```
Open http://localhost:3000. The first visit plays the supplied LUXUM intro video; visitors can skip it. The intro automatically closes when the video ends. The video-derived LUXUM wordmark is used as the browser favicon.

## Admin panel
Visit http://localhost:3000/admin.

- Username: `rihan`
- Password: `rfluxum123`

The admin panel is server-authenticated and lets you edit the full website HTML, CSS and JavaScript, including package/product descriptions and prices, plus a dedicated WhatsApp number field. Changes are written to the project files.

## Important before publishing
- Change the admin credentials by setting `ADMIN_USER` and `ADMIN_PASSWORD` environment variables on the server. The supplied credentials are defaults for initial setup only.
- Deploy this as a Node.js app (not a static-only host), with persistent writable storage. The admin editor writes to the app's files.
- Use HTTPS in production. Add a persistent session store and a stronger production login policy if running multiple server instances.
- Keep regular backups of the project files.
- The contact form sends a pre-filled enquiry to WhatsApp; it does not store customer submissions.
