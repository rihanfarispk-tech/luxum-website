# LUXUM website — Vercel + Admin

This version is adapted for Vercel. The public site is static HTML/CSS/JS. The admin API is a Vercel serverless function and stores edits by committing them to your GitHub repository. Each save triggers a Vercel redeployment.

## What is included
- Existing LUXUM website, intro video, logo and favicon
- Intro skip button removed (the intro ends automatically)
- `/admin` login and website editor
- Serverless API at `/api/admin/*`
- GitHub-backed persistence for HTML, CSS, JavaScript and WhatsApp number

## Important: deploy this project from the ROOT of your existing GitHub repository
The files `index.html`, `styles.css`, `script.js`, `luxum-intro.mp4`, `favicon.png`, `luxum-logo.png`, `vercel.json`, `admin/` and `api/` must be at the repository root. Do not upload the outer ZIP folder itself.

## Setup

### 1. Update your existing GitHub repository
1. Extract this ZIP on your computer.
2. Open your existing `luxum-website` repository on GitHub.
3. Replace the existing `index.html`, `styles.css`, `script.js`, `favicon.png`, `luxum-logo.png`, and `luxum-intro.mp4` with the matching files from this ZIP.
4. Upload the new `vercel.json` file and the complete `admin` and `api` folders.
5. Commit the changes to the same branch connected to Vercel (usually `main`).
6. Wait for Vercel to redeploy. The public site remains at your existing Vercel domain.

### 2. Create a GitHub fine-grained access token
The admin editor uses GitHub as its persistent storage, so it can save edits even though Vercel functions do not provide persistent local file storage.

1. On GitHub, open Settings → Developer settings → Personal access tokens → Fine-grained tokens.
2. Create a token and give it a descriptive name such as `LUXUM Vercel Admin`.
3. Set resource owner to your GitHub account.
4. Under Repository access, choose **Only select repositories** and select your LUXUM website repository.
5. Under Repository permissions, set **Contents: Read and write**. Metadata read access is normally granted automatically.
6. Generate the token and copy it. Do not share it in chat or put it in website source files.

### 3. Add environment variables in Vercel
1. Open your Vercel dashboard and select the LUXUM project.
2. Go to Settings → Environment Variables.
3. Add these variables. Set them for Production (and Preview too, if you use Preview deployments).

| Name | Value |
|---|---|
| `ADMIN_USER` | `rihan` |
| `ADMIN_PASSWORD` | Choose a new, strong password (do not reuse the old example password) |
| `ADMIN_SESSION_SECRET` | A long random secret, at least 32 characters |
| `GITHUB_TOKEN` | The fine-grained GitHub token you created |
| `GITHUB_OWNER` | Your GitHub username (the account that owns the repository) |
| `GITHUB_REPO` | `luxum-website` (exact repository name) |
| `GITHUB_BRANCH` | `main` (change if your connected branch has a different name) |

Save each variable. Do not put quotes around the values.

### 4. Redeploy
After saving the environment variables, open Deployments in Vercel, open the latest deployment's menu, and choose Redeploy. Wait for it to finish.

## Admin access
Open `https://YOUR-VERCEL-DOMAIN/admin`.

Use the username and password you configured as `ADMIN_USER` and `ADMIN_PASSWORD`.

## How saving works
- The admin editor reads the current HTML, CSS and JavaScript from GitHub.
- Saving commits the edited file(s) to the connected branch.
- GitHub triggers a new Vercel deployment automatically.
- A save can take a short while to appear on the public website while the deployment completes.

## Security notes
- Use a unique, strong admin password.
- Keep `GITHUB_TOKEN` and `ADMIN_SESSION_SECRET` private. Never place them in HTML, JavaScript or GitHub commits.
- If the token is exposed, revoke it in GitHub and create a new one.
- The admin editor intentionally allows editing the site's complete HTML, CSS and JavaScript. Only give admin access to a trusted person.
- This project uses Vercel serverless functions and GitHub API; it does not use the original `server.js` runtime or local disk writes.
