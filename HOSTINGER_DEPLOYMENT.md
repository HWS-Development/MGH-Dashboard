# Hostinger Deployment Guide

This project can run on Hostinger shared hosting more easily than on Vercel because it keeps the Laravel backend, MySQL, Sanctum auth, and the React frontend on one site.

This guide assumes your production domain is:

- `hospitalitywebservices.com`
- optionally `www.hospitalitywebservices.com`

## What You Need In Hostinger

- A hosting plan with PHP 8.2+ support
- MySQL database access
- File Manager or SFTP access
- SSH access if available
- The ability to point the website document root to Laravel's `public/` folder, or a way to copy `public/` contents into `public_html/`

## Recommended Deployment Shape

Use one domain for the whole app:

- Frontend: `https://hospitalitywebservices.com`
- Backend API: same domain, under `/api`
- Sanctum CSRF endpoint: same domain, under `/sanctum/csrf-cookie`

This is the easiest setup for the current code because the frontend already uses relative URLs like `/api` and `/sanctum/csrf-cookie`.

## Step 1 - Prepare The Production Environment File

Create a production `.env` based on `.env.example`.

Use values like these:

```env
APP_NAME="MGH-Dashboard"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://hospitalitywebservices.com

APP_KEY=

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=YOUR_HOSTINGER_DB_NAME
DB_USERNAME=YOUR_HOSTINGER_DB_USER
DB_PASSWORD=YOUR_HOSTINGER_DB_PASSWORD

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

SANCTUM_STATEFUL_DOMAINS=hospitalitywebservices.com,www.hospitalitywebservices.com
SESSION_DOMAIN=.hospitalitywebservices.com
SESSION_SECURE_COOKIE=true

FRONTEND_URL=https://hospitalitywebservices.com
FRONTEND_URLS=https://hospitalitywebservices.com,https://www.hospitalitywebservices.com

MAIL_MAILER=smtp
MAIL_HOST=YOUR_SMTP_HOST
MAIL_PORT=587
MAIL_USERNAME=YOUR_SMTP_USERNAME
MAIL_PASSWORD=YOUR_SMTP_PASSWORD
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="mgh-dashboard@hospitalitywebservices.com"
MAIL_FROM_NAME="${APP_NAME}"
```

If you use the external partner integration, also set:

```env
CENTRA_API_BASE_URL=https://api.centra.global/api
PARTNER_APP_CLIENT_ID=YOUR_CLIENT_ID
PARTNER_APP_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

Important:

- Run `php artisan key:generate` once after uploading if `APP_KEY` is empty.
- Do not commit your real `.env` file.

## Step 2 - Build The Frontend

Build the React app before or after upload:

```bash
npm install
npm run build
```

If Hostinger shared hosting does not provide Node access, build locally and upload the generated assets with the app.

## Step 3 - Install PHP Dependencies

If SSH is available on Hostinger:

```bash
composer install --no-dev --optimize-autoloader
```

If SSH is not available, build `vendor/` locally with the same PHP/composer compatibility and upload it.

## Step 4 - Upload The Project

Upload the project files to the server.

Do not upload unnecessary local artifacts like:

- `.git/`
- `node_modules/`
- `graphify-out/`
- local logs or temporary files

You should upload at least:

- `app/`
- `bootstrap/`
- `config/`
- `database/`
- `dist/`
- `public/`
- `resources/` if used by Laravel views
- `routes/`
- `src/` only if your deployment process still needs it
- `storage/`
- `vendor/`
- `artisan`
- `composer.json`
- `composer.lock`
- `package.json`
- `package-lock.json`
- `.env`

## Step 5 - Point The Web Root Correctly

Best option:

- Set the domain document root to this project's `public/` folder.

If Hostinger shared hosting only lets you use `public_html/` as the web root, then do this carefully:

1. Put the Laravel project one level above `public_html/` if possible.
2. Move or copy the contents of Laravel `public/` into `public_html/`.
3. Update `index.php` paths inside `public_html/index.php` so they point to the real `vendor/` and `bootstrap/` locations.

Example if app files live in a sibling folder named `mgh-dashboard`:

```php
require __DIR__.'/../mgh-dashboard/vendor/autoload.php';

(require_once __DIR__.'/../mgh-dashboard/bootstrap/app.php')
    ->handleRequest(Illuminate\Http\Request::capture());
```

Do not leave the full Laravel app directly web-accessible inside `public_html/`.

## Step 6 - Create The Database

In Hostinger hPanel:

1. Create a MySQL database.
2. Create a database user.
3. Assign the user to the database.
4. Copy the real DB name, username, password into `.env`.

Then run migrations:

```bash
php artisan migrate --force
```

If you want the default seeded data:

```bash
php artisan db:seed --force
```

## Step 7 - Generate App Key And Optimize Laravel

Run these commands once on the server:

```bash
php artisan key:generate
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If `route:cache` ever fails because of route closures, skip that one until the routes are cache-safe.

## Step 8 - Fix Permissions

Make sure these directories are writable by PHP:

- `storage/`
- `bootstrap/cache/`

If permissions are wrong, Laravel will fail to write logs, cache files, sessions, or uploaded files.

## Step 9 - Check Sanctum And CORS

This project uses cookie-based Sanctum auth. These values must be correct:

- `APP_URL=https://hospitalitywebservices.com`
- `FRONTEND_URLS=https://hospitalitywebservices.com,https://www.hospitalitywebservices.com`
- `SANCTUM_STATEFUL_DOMAINS=hospitalitywebservices.com,www.hospitalitywebservices.com`
- `SESSION_DOMAIN=.hospitalitywebservices.com`
- `SESSION_SECURE_COOKIE=true`

If login fails in production, these settings are the first thing to verify.

## Step 10 - Verify The App

After deployment, test these in order:

1. Open `https://hospitalitywebservices.com`
2. Open browser devtools and confirm assets load without 404s
3. Confirm `GET /sanctum/csrf-cookie` returns successfully
4. Confirm login works
5. Confirm authenticated API calls to `/api/...` work
6. Confirm image uploads work
7. Confirm storage-backed images are publicly visible

## Common Problems

### Blank page or asset 404s

- Frontend build files were not uploaded
- document root is wrong
- `dist/` or public assets are missing

### 419 CSRF errors

- wrong `APP_URL`
- wrong `SESSION_DOMAIN`
- wrong `SANCTUM_STATEFUL_DOMAINS`
- site is not using HTTPS

### 401 after login

- session cookie not being set correctly
- domain mismatch between `www` and non-`www`
- `FRONTEND_URLS` missing the real active hostname

### 500 server error

- missing `vendor/`
- wrong `.env`
- bad DB credentials
- storage or cache not writable

### Uploaded images do not appear

- `php artisan storage:link` not run
- `storage/` not writable
- web root or symlink rules are wrong

## Deployment Checklist

- Build frontend with `npm run build`
- Install PHP dependencies with `composer install --no-dev --optimize-autoloader`
- Upload project files
- Set production `.env`
- Generate `APP_KEY`
- Create DB and run migrations
- Run `php artisan storage:link`
- Cache config/routes/views
- Confirm document root points to Laravel `public/`
- Test login, API, and uploads on `https://hospitalitywebservices.com`
