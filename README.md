# Study Hub

A study app for school (Klasse 11): your own HTML study pages, an exam tracker,
a grade tracker, practice tests with flashcards, and leaderboards to compare
with others. The interface is in **English, German and Arabic** (Arabic
right-to-left), works on phones first, and has a dark mode.

Built with Next.js (App Router, TypeScript, Tailwind) and Supabase (Postgres,
Auth, Row Level Security). No extra libraries beyond the Supabase starter.

The app is exported as a **static website** (no server of its own): the pages
run in the browser and talk to Supabase directly, and all data is protected by
Supabase's Row Level Security. It's published on **GitHub Pages** at
https://houdamechanical.github.io/Studyhub/.

## Features

| Area | Page | What it does |
|---|---|---|
| Name | first start | New users pick the name shown on leaderboards and in "Welcome back, …". |
| Home | `/` | "Welcome back, NAME", four big tiles (Grade 11, Grade 12, Grades & Exams, Leaderboard), the next exam and flashcards due. |
| Subjects | `/grade/11` → `/grade/11/1` → `/grade/11/1/bio` | Pick a grade, then a half-year, then a subject. Every subject has the same page: study pages, mini tests, mock exams, flashcards and upcoming exams. Study pages run in a sandboxed iframe, so their own styles and scripts work but they can't touch your login. Grade 12 is locked until it's added to `OPEN_GRADES` in `lib/school.ts`. |
| Grades & Exams | `/grades`, `/grades?tab=exams` | Grades as Note 1–6, Punkte 0–15 or %, with weights, averages and a chart; exams with countdown. |
| Practice | from a subject | Mock exams (optional timer), mini tests (10 random questions per attempt) and flashcards with spaced repetition (SM-2). Tests and decks have no half-year in the database yet, so they show up in the current one (`CURRENT_SEMESTER` in `lib/grades.ts`). |
| Leaderboard | `/compare` | Per subject: mock-exam ranking or grade ranking (podium + list), your name, and per-subject grade sharing (off by default). Mini tests show their own leaderboard in a popup when you finish one. |
| Admin | `/admin` | Add questions, build tests, add flashcards, or import everything from JSON. Admins only. |

## Run it locally

You need **Node.js 20.9 or newer** and a free [Supabase](https://supabase.com) project.

### 1. Install

```bash
npm install
```

### 2. Connect Supabase

Copy `.env.example` to `.env.local` and fill in the values from your Supabase
dashboard (**Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your publishable or anon key>
```

### 3. Create the database tables

The schema is in `supabase/migrations/`. Apply the files **in name order**:

| File | Creates |
|---|---|
| `20261126120000_exams_and_grades.sql` | exams, grades |
| `20261126150000_practice.sql` | admins, questions, solutions, tests, flashcards, attempts, grading functions |
| `20261126180000_compare.sql` | nicknames, grade sharing, leaderboard functions |

**Option A – dashboard:** open **SQL Editor → New query**, paste a file, click
**Run**, then do the same with the next file.

**Option B – Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 4. Allow sign-up links

In **Authentication → URL Configuration**, set **Site URL** to
`http://localhost:3000` and add `http://localhost:3000/**` under
**Redirect URLs**. Sign-up confirmation emails link back to these addresses.

### 5. Start

```bash
npm run dev
```

Open http://localhost:3000 and sign up. Every new account gets a nickname like
`Student-k3f9a`, which you can change on the Compare page.

### 6. Make yourself admin (once)

Run this in the SQL Editor with your own login email:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

Reload the app. **Admin** now appears in the account menu (top right).

### 7. Import the Bio questions (optional)

Go to **Admin → Import JSON → Choose file**, pick
`content/imports/bio-11.1-quiz.json`, then click **Import**. That adds
107 questions, 2 mock exams, 13 mini tests and 43 flashcards. Importing again
updates the existing items instead of creating duplicates.

## Publish on GitHub Pages

The workflow `.github/workflows/deploy-pages.yml` builds the site and publishes
it on every push to `main`.

**One-time setup:**

1. **Repository visibility.** On a free GitHub account, Pages only works for
   **public** repositories (with GitHub Pro – free for students via the
   [GitHub Student Developer Pack](https://education.github.com/pack) – it
   also works for private ones). Change it under **Settings → General → Danger
   Zone → Change visibility**.
2. **Turn on Pages:** **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. **Supabase → Authentication → URL Configuration:** set **Site URL** to
   `https://houdamechanical.github.io/Studyhub/` and add
   `https://houdamechanical.github.io/Studyhub/**` to **Redirect URLs** (keep
   `http://localhost:3000/**` for local development).
4. Optional: **Authentication → Sign In / Providers → Email → Confirm email:
   off**, so new users can start right away without a confirmation email.

**Publishing:** push to `main` (`git push`). Progress is shown under the
repository's **Actions** tab; after 1–2 minutes the site is updated.

The two Supabase values in the workflow are public by design – they are sent to
every visitor's browser anyway. Never put the database password
(`SUPABASE_DB_URL`) into the repository.

The same `out/` folder also works on any other static host (Netlify, Vercel,
Cloudflare Pages, …): build with `npm run build` and upload `out/`.

## Install as an app (iPhone, iPad, Android)

Study Hub can be added to the home screen and then opens full-screen with its
own icon, like a normal app:

- **iPhone / iPad (Safari):** Share button → **Add to Home Screen**.
- **Android (Chrome):** menu ⋮ → **Install app** (or **Add to Home screen**).
- **Computer (Chrome / Edge):** the install icon at the right of the address bar.

On phones and iPads in portrait the tabs sit at the bottom of the screen; on
iPads in landscape and on computers they're in the top bar. The fullscreen
button on study pages also works on iPhone, where it fills the window.

The app's name, colours and icons are in `app/manifest.ts`, `app/apple-icon.png`
and `public/icons/` (the PNGs are rendered from the two SVGs there).

## Adding study pages

1. Put the HTML file in `content/{subject}/{half-year}/`, e.g.
   `content/chemie/11.1/redoxreaktionen.html`. Use lowercase names without
   spaces. (`content/raw/` is an inbox for files that haven't been sorted yet.)
2. Add an entry to `content/index.json`:

   ```json
   {
     "id": "redoxreaktionen",
     "title": "Redoxreaktionen – Lernseite",
     "subject": "chemie",
     "semester": "11.1",
     "topic": "Redoxreaktionen",
     "kind": "notes",
     "tags": ["Oxidation", "Reduktion", "Elektronenübergang"],
     "file": "chemie/11.1/redoxreaktionen.html"
   }
   ```

   `subject` is one of `math`, `deutsch`, `englisch`, `chemie`, `physik`,
   `bio`, `geschichte`, `religion`. `kind` is `notes`, `quiz` or `interactive`.
3. Commit and push. The build copies the pages to `public/content/` and
   publishes them with the site.

Pages run in a sandbox without access to the app's storage, so things a page
saves in `localStorage` (e.g. a quiz high score) are not kept.

## Adding questions with JSON

**Admin → Import JSON → Show example** shows the complete format. In short:

```json
{
  "questions": [
    { "key": "math-abl-1", "subject": "math", "topic": "Ableitungen", "type": "numeric",
      "prompt": "f(x) = x². Wie groß ist f'(3)?", "answer": 6,
      "explanation": ["f'(x) = 2x", "f'(3) = 2 · 3 = 6"] }
  ],
  "quizzes": [
    { "key": "math-mini-1", "kind": "mini", "subject": "math", "title": "Mini-Test Ableitungen",
      "duration_minutes": 10, "questions": ["math-abl-1", "…4 to 9 more keys…"] }
  ],
  "decks": [
    { "key": "math-begriffe", "subject": "math", "title": "Analysis – Begriffe",
      "cards": [{ "front": "Ableitung", "back": "Steigung der Tangente" }] }
  ]
}
```

Question types and their `answer`:

| `type` | `answer` |
|---|---|
| `single` | index of the right option (`0` = first) |
| `multi` | list of indexes, e.g. `[0, 2]` |
| `numeric` | a number, or `{ "value": 2.5, "tolerance": 0.05 }` |
| `text` | accepted text, or a list of them (capitalisation is ignored) |

A mini test needs 5–10 questions. A mock exam needs `duration_minutes`.

`scripts/convert-bio-quiz.mjs` shows how the Bio quiz page was turned into this
format (`node scripts/convert-bio-quiz.mjs`).


**Random mini tests:** give a mini test `"draw_count": 10` and list a larger pool
of question keys (at least 10). Every attempt then draws 10 random questions from
the pool, so each try is different. Biology's three mini tests (Block 1, Block 2,
Transfer) work this way. This needs the database update
`supabase/migrations/20261127090000_random_mini_tests.sql` (run it once in
Supabase → SQL Editor).

Mini tests have no ranking on the Leaderboard page; their leaderboard pops up when
you finish one. The Leaderboard page ranks mock exams and (shared) grades.

## Privacy and security

All tables use Supabase **Row Level Security**:

- Exams, grades, flashcard progress and test attempts can only be read and
  changed by their owner.
- Answers and explanations are only readable by admins. Students see them in
  their results after submitting.
- Tests are graded inside the database (`submit_attempt`), so a score can't be
  faked. Submissions more than 30 s after the time limit are marked late and
  left out of leaderboards.
- Other people only ever see a **nickname**, never a name or email.
- Test results are visible on leaderboards.
- **Grades are private** unless you share a subject. Sharing is off by default
  and chosen per subject. Grades of subjects you don't share are never used for
  anything others see, not even averages.
- Leaderboards and averages come from database functions that return only the
  data above. Other users' rows can't be queried directly.
- The site itself is static, so the login check in the browser only decides
  what is shown – the actual protection is Row Level Security in the database.
- **Study pages are public files.** Anyone who knows their address
  (`…/Studyhub/content/…`) can open them without logging in. Inside the app
  they run in a sandboxed frame without access to your login.

## Grade calculation

- **Subject average:** weighted average of that subject's grades.
- **Half-year average:** every subject counts equally, as on a report card.
- **Mixed scales** are converted linearly: 1.0 = 15 points = 100 %, and
  6.0 = 0 points = 0 %. This is a simplification, not an official conversion
  table.

## Project structure

```
app/(app)/            pages: library, exams, grades, practice, compare, admin
components/           UI, one folder per feature
content/              study pages, index.json, imports/
lib/                  logic: grades, SM-2, import validation, i18n, subjects
lib/mutations/        saving data (runs in the browser, checked by RLS)
lib/i18n/             translations (en, de, ar)
supabase/migrations/  database schema, policies and functions
scripts/              build helpers (copy study pages, fix prefetch files)
.github/workflows/    GitHub Pages deployment
```

## Scripts

| Command | |
|---|---|
| `npm run dev` | development server on http://localhost:3000 |
| `npm run build` | static export into `out/` |
| `npm run lint` | ESLint |
