# MGH-Dashboard

A full-stack Laravel 11 + React 18 (Vite) dashboard application with end-to-end authentication, role-based access control, and a modern UI built with Tailwind CSS.

## Tech Stack

- **Backend:** Laravel 11, PHP 8.2+, Laravel Sanctum (SPA auth)
- **Frontend:** React 18, Vite 5, React Router 6, Tailwind CSS 3
- **Database:** MySQL 8
- **Auth:** Cookie-based SPA authentication via Sanctum with CSRF protection

## Project Structure

```
MGH-Dashboard/
├── app/
│   ├── Http/
│   │   ├── Controllers/Auth/    # Authentication controllers
│   │   ├── Middleware/          # Custom middleware (admin guard)
│   │   └── Requests/Auth/      # Form request validation
│   ├── Models/                  # Eloquent models
│   └── Providers/               # Service providers
├── bootstrap/                   # App bootstrapping
├── config/                      # Laravel configuration
├── database/
│   ├── migrations/              # Database migrations
│   ├── seeders/                 # AdminSeeder + DatabaseSeeder
│   └── factories/               # Model factories
├── resources/js/                # React frontend (Vite root)
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── auth/            # ProtectedRoute, GuestRoute
│   │   │   └── layout/          # Sidebar, DashboardLayout
│   │   ├── context/             # AuthContext (global auth state)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer
│   │   ├── styles/              # Tailwind CSS entry
│   │   └── utils/               # Helper functions
│   └── index.html               # Vite entry HTML
├── routes/                      # Laravel route definitions
├── public/                      # Public assets + Laravel entry
├── .env.example                 # Environment template
├── composer.json                # PHP dependencies
├── package.json                 # Node dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
└── postcss.config.js            # PostCSS configuration
```

## Prerequisites

- PHP 8.2+
- Composer 2+
- Node.js 18+ & npm
- MySQL 8+

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
cd MGH-Dashboard

# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

Edit `.env` to match your MySQL credentials:
```
DB_DATABASE=mgh_dashboard
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 3. Database Setup

```bash
# Create the database in MySQL
mysql -u root -p -e "CREATE DATABASE mgh_dashboard;"

# Run migrations
php artisan migrate

# Seed the admin account
php artisan db:seed
```

### 4. Run the Application

Open **two terminals**:

```bash
# Terminal 1: Laravel backend (port 8000)
php artisan serve

# Terminal 2: Vite dev server (port 5173)
npm run dev
```

Visit: **http://localhost:5173**

## Default Admin Credentials

| Field    | Value                      |
|----------|----------------------------|
| Email    | admin@mgh-dashboard.com    |
| Password | password                   |

> **Important:** Change the default password after first login.

## API Endpoints

### Guest Routes (unauthenticated)
| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| POST   | /api/register       | Register new user     |
| POST   | /api/login          | Login                 |
| POST   | /api/forgot-password| Send reset link       |
| POST   | /api/reset-password | Reset password        |

### Authenticated Routes
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/user                       | Get current user         |
| POST   | /api/logout                     | Logout                   |
| POST   | /api/email/verification-notification | Resend verification |
| GET    | /api/verify-email/{id}/{hash}   | Verify email             |

### Admin Routes (requires admin role)
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | /api/admin/users          | List all users       |
| GET    | /api/admin/dashboard-stats| Dashboard statistics |

## Authentication Flow

1. Frontend calls `GET /sanctum/csrf-cookie` to obtain CSRF token
2. Login via `POST /api/login` with credentials
3. Sanctum creates a session cookie for subsequent requests
4. All API calls include the session cookie automatically (withCredentials)
5. Protected routes check `auth:sanctum` middleware

## Build for Production

```bash
# Build frontend assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Experiences Module

### Overview

The Experiences module allows administrators to manage tourist experiences (e.g. "Gastronomy", "Culture & Heritage", "Nature & Wellness") in **3 languages** (French, English, Spanish). Each experience is a rich content entity with multilingual text, image galleries, activity lists, practical tips, and SEO metadata.

### Architecture

```
Backend                                    Frontend
─────────────────────────────────────      ─────────────────────────────────────
database/migrations/                       src/pages/
  2026_05_07_100000_create_mgh_              Experiences.jsx      (list page)
  experiences_table.php                      ExperienceForm.jsx   (multi-step form)

app/Http/Controllers/                      src/lib/
  DataController.php                         supabase.js          (API helpers)
  (whitelist: mgh_experiences)
                                           src/components/layout/
routes/api.php                               Sidebar.jsx          (nav entry)
  POST /api/data/query
  (generic CRUD endpoint)                  src/App.jsx            (routes)
```

### Database Schema (`mgh_experiences`)

The table is created by migration `2026_05_07_100000_create_mgh_experiences_table.php`.

| Column                 | Type         | Required | Multilingual | Description                                         |
|------------------------|--------------|----------|--------------|-----------------------------------------------------|
| `id`                   | UUID         | Yes      | No           | Primary key, auto-generated on insert               |
| `slug`                 | VARCHAR      | Yes      | No           | URL-safe unique identifier (e.g. `gastronomy`)      |
| `hero_image_url`       | TEXT         | No       | No           | Main banner image URL                               |
| `gallery_urls`         | JSON         | No       | No           | Array of gallery image URLs                         |
| `map_embed_url`        | TEXT         | No       | No           | Google Maps embed URL                               |
| `recommended_season`   | VARCHAR      | No       | No           | Best time to visit (e.g. "Printemps, Automne")      |
| `duration_hint`        | VARCHAR      | No       | No           | Estimated duration (e.g. "2-3 heures")              |
| `accessibility_notes`  | TEXT         | No       | No           | Accessibility information                           |
| `approx_budget_hint`   | VARCHAR      | No       | No           | Budget range (e.g. "200-500 MAD")                   |
| `related_riads`        | JSON         | No       | No           | Array of related riad IDs                           |
| `is_published`         | BOOLEAN      | Yes      | No           | Publication status (default: `false`)               |
| `sort_order`           | INTEGER      | Yes      | No           | Display order (default: `0`)                        |
| `title_tr`             | JSON         | Yes      | Yes          | `{ fr, en, es }` - Experience title                 |
| `subtitle_tr`          | JSON         | No       | Yes          | `{ fr, en, es }` - Subtitle                        |
| `destination_tr`       | JSON         | No       | Yes          | `{ fr, en, es }` - Destination name                |
| `short_intro_tr`       | JSON         | No       | Yes          | `{ fr, en, es }` - Short intro paragraph           |
| `description_rich_tr`  | JSON         | No       | Yes          | `{ fr, en, es }` - Rich description (Markdown)     |
| `what_to_do_tr`        | JSON         | No       | Yes          | `{ fr: [{title, blurb}], en: [...], es: [...] }`   |
| `good_to_know_tr`      | JSON         | No       | Yes          | `{ fr: [{title, tip}], en: [...], es: [...] }`     |
| `booking_cta_label_tr` | JSON         | No       | Yes          | `{ fr, en, es }` - Booking button label            |
| `seo_title_tr`         | JSON         | No       | Yes          | `{ fr, en, es }` - SEO page title                  |
| `seo_description_tr`   | JSON         | No       | Yes          | `{ fr, en, es }` - SEO meta description            |
| `seo_keywords_tr`      | JSON         | No       | Yes          | `{ fr, en, es }` - SEO keywords                    |
| `created_at`           | TIMESTAMP    | Auto     | No           | Creation timestamp                                  |
| `updated_at`           | TIMESTAMP    | Auto     | No           | Last update timestamp                               |

**Multilingual convention:** All `*_tr` columns store a JSON object with keys `fr`, `en`, `es`. Array-type fields (`what_to_do_tr`, `good_to_know_tr`) store one array per language, each containing objects with consistent sub-keys.

### Running the Migration

```bash
php artisan migrate
```

To rollback:

```bash
php artisan migrate:rollback --step=1
```

### API Layer

All CRUD operations go through the generic `POST /api/data/query` endpoint (same as all other MGH tables). The `DataController` handles `mgh_experiences` with UUID auto-generation on insert.

| Action   | Payload                                                            | Response                           |
|----------|--------------------------------------------------------------------|------------------------------------|
| **List** | `{ action: "list", table: "mgh_experiences", params: { order: "sort_order.asc" } }` | `{ data: [ ...experiences ] }`     |
| **Get**  | `{ action: "get", table: "mgh_experiences", id: "<uuid>" }`       | `{ data: [ experience ] }`         |
| **Create** | `{ action: "insert", table: "mgh_experiences", data: { ... } }` | `{ data: { id: "<uuid>" }, message: "..." }` |
| **Update** | `{ action: "update", table: "mgh_experiences", id: "<uuid>", data: { ... } }` | `{ data: { affected: 1 }, message: "..." }` |
| **Delete** | `{ action: "delete", table: "mgh_experiences", id: "<uuid>" }`  | `{ data: { affected: 1 }, message: "..." }` |

Frontend helpers in `src/lib/supabase.js`:

```js
import {
  listExperiences,   // (params?) => Promise  — list all, with optional filters/order
  getExperience,     // (id) => Promise        — get single by UUID
  insertExperience,  // (data) => Promise      — create new
  updateExperience,  // (id, data) => Promise  — update by UUID
  deleteExperience,  // (id) => Promise        — delete by UUID
} from '@/lib/supabase';
```

### Frontend Routes

| Route               | Page              | Description                |
|----------------------|-------------------|----------------------------|
| `/experiences`       | `Experiences.jsx`  | List all experiences       |
| `/experiences/new`   | `ExperienceForm.jsx` | Create new experience    |
| `/experiences/:id`   | `ExperienceForm.jsx` | Edit existing experience |

The sidebar entry "Experiences" appears after "Membres MGH", using the `Sparkles` icon.

---

### End-to-End: Managing Experiences

#### 1. List Page (`/experiences`)

When you navigate to **Experiences** in the sidebar:

1. The page loads and fetches all experiences from the API via `listExperiences()` (React Query caches the result).
2. A **gradient header** shows aggregate stats: total count, published count, draft count.
3. Each experience is displayed as a card row showing:
   - Thumbnail (hero image or placeholder)
   - Sort order badge
   - Title (in the current dashboard language, FR by default)
   - Slug (monospace, prefixed with `/`)
   - Destination
   - Publication status badge (`Publiee` green / `Brouillon` amber)
   - Language completeness indicators (3 colored dots: green = title filled, red = missing)
4. **Search**: Type in the search bar to filter by title (any language), slug, or destination.
5. **Sort**: Click the "Ordre" column header to toggle sort direction.

**Error states:**
- If the API call fails, a red error banner is displayed with the error message.
- If no experiences exist, an empty state with a "Creer une experience" CTA button appears.
- If search yields no results, a dedicated "Aucun resultat" message is shown.

#### 2. Creating a New Experience

1. Click **"Nouvelle experience"** (header button) or the CTA in the empty state.
2. You are redirected to `/experiences/new`.
3. The **7-step wizard** opens at Step 1.

#### 3. Multi-Step Form (7 Steps)

The form is divided into 7 sequential sections. Each step validates its own fields before allowing navigation to the next step.

##### Step 1 -- Identite (Identity & Status)

| Field           | Type              | Required | Validation                                              |
|-----------------|-------------------|----------|---------------------------------------------------------|
| Titre           | Multilingual text | Yes (x3) | All 3 languages (FR, EN, ES) must be filled             |
| Slug            | Text input        | Yes      | Min 2 chars, lowercase alphanumeric + hyphens only, regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/` |
| Sous-titre      | Multilingual text | No       | -                                                       |
| Destination     | Multilingual text | No       | -                                                       |
| Ordre d'affichage | Number          | Yes      | Must be >= 0                                            |
| Publication     | Toggle switch     | Yes      | Boolean (default: off = Brouillon)                      |

- The **"Auto"** button next to the slug field generates a slug from the French title (lowercased, accents stripped, spaces to hyphens).
- The slug field only accepts lowercase letters, numbers, and hyphens (other characters are stripped on input).

##### Step 2 -- Contenu (Content)

| Field                 | Type                  | Required | Validation                             |
|-----------------------|-----------------------|----------|----------------------------------------|
| Introduction courte   | Multilingual textarea | Yes (FR) | French version is required             |
| Description detaillee | Multilingual textarea | No       | Supports Markdown (`## headings`, `**bold**`, etc.) |

##### Step 3 -- Activites (Activities)

| Field                   | Type                           | Required       | Validation                                        |
|-------------------------|--------------------------------|----------------|---------------------------------------------------|
| Activites / Choses a faire | Multilingual dynamic array   | Yes (FR, min 1) | At least 1 activity in French. Each item needs both `title` and `blurb` filled. |

Each activity item has:
- **Titre** (text input) -- Name of the place or activity.
- **Description** (textarea) -- Short blurb about the activity.

Activities are managed **per language**: switch the language tab (FR / EN / ES) to add/edit/remove items for that language independently.

##### Step 4 -- Conseils (Tips & Advice)

| Field                  | Type                         | Required | Validation                                                   |
|------------------------|------------------------------|----------|--------------------------------------------------------------|
| Bon a savoir / Conseils | Multilingual dynamic array  | No       | If items exist in FR, each must have both `title` and `tip` filled. |

Each tip item has:
- **Titre** (text input) -- Tip heading.
- **Conseil** (textarea) -- Tip content.

Same per-language management as activities.

##### Step 5 -- Medias (Media)

| Field            | Type       | Required | Validation                          |
|------------------|------------|----------|-------------------------------------|
| Image principale | URL input  | No       | Must be a valid URL if provided     |
| Galerie d'images | URL list   | No       | Each non-empty URL must be valid    |

- The hero image URL shows a **live preview** with a gradient overlay and badge when a valid URL is entered.
- Gallery URLs show small thumbnail previews next to each input.
- Invalid URLs (broken format) are flagged with a red border and error message.
- Click **"Ajouter une image"** to add a new gallery URL slot. Click the trash icon to remove one.

##### Step 6 -- Details (Practical Info)

| Field                     | Type              | Required | Validation                      |
|---------------------------|-------------------|----------|---------------------------------|
| URL de la carte (embed)   | URL input         | No       | Must be a valid URL if provided |
| Saison recommandee        | Text input        | No       | -                               |
| Duree estimee             | Text input        | No       | -                               |
| Budget approximatif       | Text input        | No       | -                               |
| Notes d'accessibilite     | Text input        | No       | -                               |
| Libelle bouton de reservation | Multilingual text | No   | -                               |

##### Step 7 -- SEO (Search Engine Optimization)

| Field           | Type              | Required | Validation |
|-----------------|-------------------|----------|------------|
| Titre SEO       | Multilingual text | No       | -          |
| Description SEO | Multilingual textarea | No   | -          |
| Mots-cles SEO   | Multilingual text | No       | -          |

Help text guides the admin on optimal character lengths (60 chars for title, 155 for description).

#### 4. Multilingual Input System

Every `*_tr` field uses a **language tab switcher** component:

1. Three tabs: **FR** / **EN** / **ES**, each showing the flag and language code.
2. Tab colors indicate status:
   - **Active tab**: Dark red (`#8B1A1A`) background.
   - **Filled**: Green background -- content exists for this language.
   - **Empty**: Neutral gray -- no content yet.
   - **Error**: Red background -- validation error on this language.
3. Below the input, **completeness dots** show `X/3 langues` filled at a glance.
4. Switching tabs animates the input field with a horizontal slide transition.

#### 5. Step Navigation & Validation

- **"Suivant" button**: Validates the current step. If errors exist, a destructive toast notification lists the issue and the form stays on the current step. Error fields are highlighted with red borders.
- **"Precedent" button**: Goes back without validation.
- **Step indicator bar**: Each step shows an icon button at the top. Status per step:
  - **Pending** (gray): Not visited yet.
  - **Complete** (green checkmark): All validations pass.
  - **Error** (red): Validation errors exist.
  - **Active** (dark red): Currently displayed step.
- **Clickable step buttons**: You can jump to any step. Jumping forward validates the current step first. Jumping backward is always allowed.
- **Dot navigation**: A row of small dots at the bottom mirrors step status and is also clickable.
- **Progress line**: An animated bar connects the step indicators, filling up to the current step.

#### 6. Saving (Create / Update)

- **"Enregistrer" (or "Creer")** button is always visible in the top-right header.
- Clicking it runs **full validation across all 7 steps at once**.
- If any step has errors:
  1. The form jumps to the **first step with errors**.
  2. Error fields are highlighted.
  3. A destructive toast says "Formulaire incomplet".
- If all validations pass:
  1. The button shows a loading spinner.
  2. The API call is made (`insertExperience` or `updateExperience`).
  3. On success: a success toast appears, React Query cache is invalidated, and the user is redirected to `/experiences`.
  4. On error: a destructive toast displays the server error message (e.g. duplicate slug, database error).
- On the **last step (SEO)**, the "Suivant" button is replaced by a green **"Creer l'experience"** (or "Enregistrer") button.

#### 7. Editing an Existing Experience

1. From the list page, click any experience row (or click **"Modifier"** in the dropdown menu).
2. The form loads at `/experiences/<uuid>`.
3. A loading skeleton is shown while the API fetches the experience data.
4. All fields are pre-populated with existing values. Multilingual fields restore their `{fr, en, es}` content. Dynamic arrays (activities, tips) restore all items per language.
5. Edit any step, then click **"Enregistrer"** to save changes.
6. The API sends only the modified fields via `updateExperience(id, data)`.

#### 8. Deleting an Experience

1. From the list page, hover over an experience row to reveal the **"..."** (more) button.
2. Click **"Supprimer"** in the dropdown.
3. A **confirmation dialog** appears:
   - Title: "Supprimer cette experience ?"
   - Description shows the experience name.
   - Warns that the action is irreversible.
4. Click **"Supprimer"** to confirm. The button shows a spinner during the API call.
5. On success: the experience is removed from the list with an exit animation, and a toast confirms deletion.
6. On error: a destructive toast shows the error.
7. Click **"Annuler"** to close the dialog without deleting.

#### 9. Quick Publish / Unpublish

1. From the list page dropdown menu, click **"Publier"** or **"Depublier"**.
2. The API updates `is_published` immediately (no form needed).
3. The list refreshes and the status badge updates from `Brouillon` to `Publiee` (or vice versa).
4. A success toast confirms the change.

#### 10. Error Handling Summary

| Scenario                          | Behavior                                                              |
|-----------------------------------|-----------------------------------------------------------------------|
| **API fetch fails (list)**        | Red error banner with message, no table shown                         |
| **API fetch fails (single)**      | Skeleton shown indefinitely; React Query retries 3 times              |
| **Step validation fails**         | Red borders on invalid fields, destructive toast, navigation blocked  |
| **Full save validation fails**    | Form jumps to first errored step, destructive toast                   |
| **Server error on save**          | Destructive toast with server message (e.g. duplicate slug)           |
| **Server error on delete**        | Destructive toast with error, dialog stays open                       |
| **Invalid URL entered**           | Inline error below the field, red border                              |
| **Missing required language**     | Language tab turns red, error below input                             |
| **Empty activity title/blurb**    | Inline error per item, cannot proceed to next step                    |
| **Network error / 419 CSRF**     | Axios interceptor auto-reloads the page to refresh CSRF token         |

#### 11. Toast Notifications

All user feedback uses toast notifications (bottom-right):

- **Auto-dismiss**: Toasts disappear after 5 seconds.
- **Manual dismiss**: Click the **X** button to close immediately.
- **Variants**: Default (neutral border) for success, Destructive (red) for errors.
- **Max visible**: 5 toasts at a time; older ones are removed.

## License

MIT

---

## Internationalization (i18n)

### Overview

The entire dashboard UI supports **3 languages**: English (default), French, and Spanish. All user-facing strings are extracted into JSON translation files and loaded via a custom React context + hook system.

### Architecture

```
src/i18n/
  index.jsx        # I18nProvider, useTranslation hook, context
  en.json          # English translations (default / fallback)
  fr.json          # French translations
  es.json          # Spanish translations

public/flags/
  en.svg           # English flag icon
  fr.svg           # French flag icon
  es.svg           # Spanish flag icon
```

### How It Works

1. **I18nProvider** wraps the entire app in `App.jsx`. It stores the selected language in `localStorage` under `mgh-lang`.
2. **useTranslation()** hook returns `{ t, lang, setLang, supportedLangs }`.
3. **t(key, params?)** resolves a dot-separated key (e.g. `sidebar.dashboard`) from the current language's JSON file. Falls back to English if the key is missing.
4. **Interpolation**: `t('dashboard.outOfContacts', { count: 42 })` replaces `{count}` in the string.
5. **Language Selector**: A 3-way toggle in the top bar (AppLayout) lets users switch between EN/FR/ES with flag icons.

### Adding a New Language

1. Create `src/i18n/xx.json` (copy structure from `en.json`).
2. Add the language code to `SUPPORTED_LANGS` in `src/i18n/index.jsx`.
3. Import the file in `src/i18n/index.jsx` and add to the `translations` object.
4. Add a flag SVG to `public/flags/xx.svg`.
5. Add the flag entry in `AppLayout.jsx`'s `FLAG_ITEMS` array.

### Translated Pages

All pages and components use `useTranslation()`:
- Sidebar, AppLayout, Dashboard, Login, Experiences, ExperienceForm, Members, Settings, AddRiad, PendingUpdates, PageNotFound, UserNotRegisteredError

---

## Experience Image Upload

### Overview

Experience images (hero + gallery) are uploaded to Laravel storage via a dedicated endpoint, replacing the old URL-input approach.

### Backend

**Controller:** `app/Http/Controllers/ExperienceImageController.php`

| Endpoint | Method | Description |
|---|---|---|
| `/api/experiences/upload-image` | POST | Upload an image (multipart/form-data) |
| `/api/experiences/delete-image` | DELETE | Delete an image by filename |

**Upload validation:**
- File must be present and valid
- Max size: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Double-validated with `getimagesize()` to ensure the file is truly an image
- Files stored in `storage/app/public/ExperiencesImages/` with unique filenames

**Response:**
```json
{
  "url": "/storage/ExperiencesImages/hero_1715000000_Ab3xY9Zk.jpg",
  "filename": "hero_1715000000_Ab3xY9Zk.jpg",
  "size": 245678,
  "mime": "image/jpeg",
  "width": 1920,
  "height": 1080
}
```

### Frontend

**API helpers** in `src/lib/supabase.js`:
- `uploadExperienceImage(file, type)` - Upload via FormData
- `deleteExperienceImage(filename)` - Delete by filename

**ExperienceForm Step 5 (Media):**
- **Hero image**: Drag-and-drop / click-to-upload dropzone. Shows a preview with remove button after upload.
- **Gallery**: Grid of uploaded images with remove buttons. Add more via a dropzone at the bottom.
- Client-side validation (file type + size) before server upload.
- Upload progress indicator (spinner).

### Storage Setup

```bash
# Create the storage symlink (already done)
php artisan storage:link

# The directory structure:
storage/app/public/ExperiencesImages/   # Actual files
public/storage/                          # Symlink to storage/app/public
```

---

## Validation: All-3-Languages Rule

When editing multilingual fields in the ExperienceForm, if the user fills in **any one language** for a required multilingual field, **all 3 languages must be filled**. This is enforced in:
- Step 1 (Identity): `title_tr` - all 3 titles required
- Step 2 (Content): `short_intro_tr` - if any language is filled, all 3 must be

---

## Destinations Module

### Overview

The Destinations module allows administrators to manage travel destinations (e.g. "Marrakech", "Essaouira", "Fes") in **3 languages** (French, English, Spanish). Each destination is a rich content entity with multilingual text, transport information, activity lists, FAQ, image galleries, a best-months calendar, and SEO metadata. It follows the exact same architecture and UX patterns as the Experiences module.

### Sidebar Location

The **"Destinations"** tab appears in the sidebar immediately after **"Experiences"**, using the `MapPin` icon from Lucide.

### Architecture

```
Backend                                    Frontend
-------------------------------------      -------------------------------------
app/Http/Controllers/                      src/pages/
  DestinationImageController.php             Destinations.jsx      (list page)
  DestinationOrderController.php             DestinationForm.jsx   (7-step form)
  DataController.php (whitelist entry)
                                           src/lib/
routes/api.php                               api.js               (API helpers)
  POST /api/data/query
  POST /api/destinations/upload-image      src/components/layout/
  DELETE /api/destinations/delete-image       Sidebar.jsx          (nav entry)
  GET /api/destinations/next-order
  POST /api/destinations/reorder           src/App.jsx            (routes)
  POST /api/destinations/move
```

### Database Schema (`mgh_destinations`)

| Column                 | Type         | Required | Multilingual | Description                                         |
|------------------------|--------------|----------|--------------|-----------------------------------------------------|
| `id`                   | UUID         | Yes      | No           | Primary key, auto-generated on insert               |
| `slug`                 | VARCHAR      | Yes      | No           | URL-safe unique identifier (e.g. `marrakech`)       |
| `name`                 | JSON         | Yes      | Yes          | `{ fr, en, es }` - Destination name                 |
| `subtitle`             | JSON         | No       | Yes          | `{ fr, en, es }` - Subtitle                        |
| `intro_rich`           | JSON         | No       | Yes          | `{ fr, en, es }` - Detailed introduction (Markdown) |
| `getting_here`         | JSON         | No       | Yes          | `{ fr: [{mode, description}], en: [...], es: [...] }` - Transport options |
| `what_to_do`           | JSON         | No       | Yes          | `{ fr: [{title, blurb}], en: [...], es: [...] }` - Activities |
| `good_to_know`         | JSON         | No       | Yes          | `{ fr: [{title, tip}], en: [...], es: [...] }` - Tips |
| `when_to_visit`        | JSON         | No       | Yes          | `{ fr, en, es }` - When to visit text              |
| `faq`                  | JSON         | No       | Yes          | `{ fr: [{question, answer}], en: [...], es: [...] }` - FAQ |
| `hero_image_urls`      | JSON         | No       | No           | Array of hero image URLs                            |
| `best_months`          | JSON         | No       | No           | Array of month numbers (1-12)                       |
| `gallery_urls`         | JSON         | No       | No           | Array of gallery image URLs                         |
| `map_embed_url`        | TEXT         | No       | No           | Google Maps embed URL                               |
| `related_experiences`  | JSON         | No       | No           | Array of related experience IDs                     |
| `related_collections`  | JSON         | No       | No           | Array of related collection IDs                     |
| `cta_label`            | JSON         | No       | Yes          | `{ fr, en, es }` - Call-to-action button label      |
| `cta_url`              | TEXT         | No       | No           | CTA button link URL                                 |
| `seo_title`            | JSON         | No       | Yes          | `{ fr, en, es }` - SEO page title                  |
| `seo_description`      | JSON         | No       | Yes          | `{ fr, en, es }` - SEO meta description            |
| `seo_keywords`         | JSON         | No       | Yes          | `{ fr, en, es }` - SEO keywords                    |
| `is_published`         | BOOLEAN      | Yes      | No           | Publication status (default: `false`)               |
| `sort_order`           | INTEGER      | Yes      | No           | Display order, auto-assigned sequentially           |
| `created_at`           | TIMESTAMP    | Auto     | No           | Creation timestamp                                  |
| `updated_at`           | TIMESTAMP    | Auto     | No           | Last update timestamp                               |

### API Endpoints (Destinations)

| Method | Endpoint                         | Description                          |
|--------|----------------------------------|--------------------------------------|
| POST   | `/api/data/query`                | Generic CRUD (table: `mgh_destinations`) |
| POST   | `/api/destinations/upload-image` | Upload image (multipart, quality=60) |
| DELETE | `/api/destinations/delete-image` | Delete image by filename             |
| GET    | `/api/destinations/next-order`   | Get next sort_order value            |
| POST   | `/api/destinations/reorder`      | Reorder to specific position         |
| POST   | `/api/destinations/move`         | Move up/down by one position         |

### Frontend API Functions (`src/lib/api.js`)

```js
import {
  listDestinations,        // (params?) => list all destinations
  getDestination,          // (id) => get single by UUID
  insertDestination,       // (data) => create new
  updateDestination,       // (id, data) => update by UUID
  deleteDestination,       // (id) => delete by UUID
  getNextDestinationOrder, // () => get next available sort_order
  reorderDestination,      // (id, newPosition) => reorder to position
  moveDestination,         // (id, direction) => move up/down
  uploadDestinationImage,  // (file, type) => upload with quality=60
  deleteDestinationImage,  // (filename) => delete from storage
} from '@/lib/api';
```

### Frontend Routes

| Route                | Page                 | Description                 |
|----------------------|----------------------|-----------------------------|
| `/destinations`      | `Destinations.jsx`   | List all destinations       |
| `/destinations/new`  | `DestinationForm.jsx`| Create new destination      |
| `/destinations/:id`  | `DestinationForm.jsx`| Edit existing destination   |

### Multi-Step Form (7 Steps)

#### Step 1 -- Identity

| Field       | Type              | Required | Validation                                              |
|-------------|-------------------|----------|---------------------------------------------------------|
| Name        | Multilingual text | Yes (x3) | All 3 languages (FR, EN, ES) must be filled             |
| Slug        | Text input        | Yes      | Min 2 chars, lowercase + hyphens, auto-generated from FR name |
| Subtitle    | Multilingual text | No       | -                                                       |
| Sort order  | Number/Picker     | Yes      | Auto-assigned on create; position picker on edit        |
| Publication | Toggle switch     | Yes      | Boolean (default: off = Brouillon)                      |

#### Step 2 -- Content

| Field               | Type                  | Required | Description                             |
|---------------------|-----------------------|----------|-----------------------------------------|
| Introduction        | Multilingual textarea | Yes (FR) | Detailed Markdown introduction          |
| When to visit       | Multilingual textarea | No       | Best time/season information            |

#### Step 3 -- Getting Here

| Field         | Type                         | Required       | Description                                |
|---------------|------------------------------|----------------|--------------------------------------------|
| Transport     | Multilingual dynamic array   | Yes (FR, min 1)| Each item: `mode` + `description`          |

Transport mode examples: "By plane", "By train", "By car", "By bus".

#### Step 4 -- Activities

| Field      | Type                         | Required       | Description                                |
|------------|------------------------------|----------------|--------------------------------------------|
| Activities | Multilingual dynamic array   | Yes (FR, min 1)| Each item: `title` + `blurb`               |

#### Step 5 -- Tips & FAQ

| Field | Type                         | Required | Description                                      |
|-------|------------------------------|----------|--------------------------------------------------|
| Tips  | Multilingual dynamic array   | No       | Each item: `title` + `tip`                       |
| FAQ   | Multilingual dynamic array   | No       | Each item: `question` + `answer`                 |

#### Step 6 -- Media

| Field        | Type             | Required | Description                                   |
|--------------|------------------|----------|-----------------------------------------------|
| Hero images  | Image upload(s)  | No       | Multiple hero images (drag-and-drop)          |
| Gallery      | Image upload(s)  | No       | Grid of gallery images                        |
| Map URL      | URL input        | No       | Google Maps embed URL                         |
| Best months  | Month picker     | No       | 12-button grid (Jan-Dec), toggle selection    |

#### Step 7 -- SEO & CTA

| Field            | Type              | Required | Description                              |
|------------------|-------------------|----------|------------------------------------------|
| SEO Title        | Multilingual text | No       | ~60 chars recommended                    |
| SEO Description  | Multilingual text | No       | ~155 chars recommended                   |
| SEO Keywords     | Multilingual text | No       | Comma-separated keywords                 |
| CTA Label        | Multilingual text | No       | Button text (e.g. "Explore")             |
| CTA URL          | URL input         | No       | Destination link for the CTA button      |

### Image Storage (Destinations)

- **Storage folder:** `storage/app/public/Destinations_Images/`
- **Public URL:** `/storage/Destinations_Images/{filename}`
- **Filename format:** `{type}_{timestamp}_{8chars}.{ext}` (e.g. `hero_1715000000_Ab3xY9Zk.jpg`)
- **Quality:** All uploaded images are compressed at **quality=60** using PHP GD library
- **Supported formats:** JPEG, PNG, GIF, WebP
- **Max size:** 5 MB per file
- **Symlink required:** `php artisan storage:link`

### Image Quality (Site-Wide)

All image uploads across the entire application (Experiences AND Destinations) now use **quality=60** compression:
- JPEG: compressed with `imagejpeg($img, $path, 60)`
- PNG: compressed with PNG quality level derived from 60% (approx level 4)
- WebP: compressed with `imagewebp($img, $path, 60)`
- GIF: copied as-is (GIF doesn't support lossy compression)

This significantly reduces storage usage and bandwidth while maintaining acceptable visual quality.

### Ordering System

Destinations use the same ordering system as Experiences:

1. **Auto-assignment on create:** New destinations automatically get `sort_order = MAX + 1`
2. **Move up/down:** Arrow buttons swap adjacent items
3. **Reorder to position:** Position picker in edit mode allows jumping to any position
4. **Re-sequence on delete:** After deletion, all `sort_order` values are re-sequenced (1, 2, 3...N) to close gaps

### Error Handling

| Scenario                          | Behavior                                                              |
|-----------------------------------|-----------------------------------------------------------------------|
| API fetch fails (list)            | Red error banner with message, no table shown                         |
| Step validation fails             | Red borders on invalid fields, destructive toast, navigation blocked  |
| Full save validation fails        | Form jumps to first errored step, destructive toast                   |
| Server error on save              | Destructive toast with server message (e.g. duplicate slug)           |
| Server error on delete            | Destructive toast with error, dialog stays open                       |
| Image upload fails                | Inline error below dropzone                                           |
| Image too large (>5MB)            | Client-side rejection before upload                                   |
| Invalid file type                 | Client-side rejection with error message                              |
| Network error / 419 CSRF          | Axios interceptor auto-reloads the page                               |

### Translations

All destination UI strings are fully translated in 3 languages:
- `src/i18n/en.json` - English (keys: `destinations.*`, `destinationForm.*`)
- `src/i18n/fr.json` - French
- `src/i18n/es.json` - Spanish

Translation key structure:
```
destinations.title          -> Page title
destinations.subtitle       -> Page subtitle
destinations.newDestination -> "New destination" button
destinations.searchPlaceholder -> Search input placeholder
...

destinationForm.steps.identity      -> Step 1 label
destinationForm.steps.identityDesc  -> Step 1 description
destinationForm.fields.name         -> "Destination name" label
destinationForm.validation.slugRequired -> Validation message
destinationForm.media.dropzone      -> Dropzone label
destinationForm.months.1            -> "January"
...
```

---
