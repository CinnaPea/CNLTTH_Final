# Frontend React

React + Vite frontend for the CNLTTH exam organization system.

At the current stage, the frontend has a React + Vite exam operations UI with a landing page, login/signup mock screens, an operations shell, and mock-backed dashboard pages. The API client files are preserved for the next phase, where these screens can be wired to Ruby and C# backend data.

## Current Stack

- React `19.2.6`
- React DOM `19.2.6`
- Vite `8.0.12`
- ESLint `10.3.0`
- Plain JavaScript and JSX
- Traditional CSS in `src/index.css`
- Native `fetch` for API calls

## Folder State

- `src/App.jsx` renders the landing page, auth mock screens, and hash-routed operations workspace.
- `src/index.css` contains the full traditional CSS translation of the sketch design. Tailwind is not used.
- `src/components/` contains the landing, auth, app shell, and reusable UI components.
- `src/pages/` contains the mock-backed dashboard and operations pages.
- `src/data/landingContent.js` contains landing page content.
- `src/data/operationsMockData.js` contains temporary UI data for the operations workspace.
- `src/api/client.js` contains the shared API request helper.
- `src/api/rubyEndpoints.js` wraps the Ruby API routes into named functions.
- `src/api/csharpEndpoints.js` is a placeholder for future C# endpoint integration.
- `src/API_Testings.jsx` is a manual browser-based integration testing component for the Ruby API.
- `.env` stores the local backend base URLs.

## Environment Variables

The frontend reads backend URLs from `.env`:

```env
VITE_RUBY_API_BASE_URL=http://localhost:3000/api/v1
VITE_CSHARP_API_BASE_url=http://localhost:5000/<replace-with-csharp-api>
```

`VITE_RUBY_API_BASE_URL` is used by the Ruby API client. The C# value is currently a placeholder and should be replaced when the C# backend endpoint is ready.

## API Client Progress

### `src/api/client.js`

This file defines a shared request helper around `fetch`.

It currently supports:

- `rubyAPI.get(path)`
- `rubyAPI.post(path, body)`
- `rubyAPI.patch(path, body)`
- `rubyAPI.delete(path)`
- `csharpAPI.get(path)`

The helper:

- Builds the final URL from a base URL and path.
- Sends JSON requests with `Content-Type: application/json`.
- Serializes request bodies with `JSON.stringify`.
- Reads response text and attempts to parse JSON.
- Throws an `Error` when the HTTP response is not successful.

### `src/api/rubyEndpoints.js`

This file provides named helper functions for Ruby API features instead of calling raw paths everywhere.

Currently covered Ruby API areas:

- Health check
- Subjects: `mon_thi`
- Students: `sinh_vien`
- Rooms: `phong_thi`
- Exams: `ky_thi`
- Exam registration: `dang_ky_thi`
- Room assignment: `phan_phong`
- Seat assignment: `xep_cho`
- Attendance: `diem_danh`
- Workflow actions:
  - publish exam
  - close exam
  - auto room assignment
  - auto seat assignment
  - open attendance

Important note: the current UI pages still read from `src/data/operationsMockData.js`. The API helpers are ready to use, but page-by-page backend integration is still a later step.

### `src/api/csharpEndpoints.js`

This file is currently only a placeholder. Its comment says it will be filled in later so React can read C# API data and the C# side can read Ruby API data where needed.

## Manual API Testing: `src/API_Testings.jsx`

`API_Testings.jsx` is the most important testing file in the current frontend state.

It is not an automated unit test file. It is a manual integration test component used to confirm that the React app can reach the Ruby Rails API from the browser.

The file header says to copy its contents into `App.jsx` when testing:

```text
Copy the contents of this file into App.jsx to test the API enabler
```

When mounted in the browser, it runs API calls inside `useEffect` and prints the results to the browser console.

### What It Tests

The first test block checks that the frontend can call important Ruby API routes:

- `GET /health`
- `GET /ky_thi`
- `GET /sinh_vien`
- `GET /phong_thi`

It logs successful responses to the console and prints an error message if any request fails.

It also tests a workflow call:

```http
PATCH /ky_thi/3/publish
```

This checks whether the frontend can send a `PATCH` request to the Ruby backend. Because it uses a fixed exam ID, it depends on exam `3` existing and being in a publishable state.

It intentionally calls a bad endpoint:

```http
GET /not_real_endpoint
```

This is used to confirm that the shared API client catches failed HTTP responses and throws readable errors.

Then it loops through the main Ruby API list endpoints:

- `/health`
- `/mon_thi`
- `/sinh_vien`
- `/phong_thi`
- `/ky_thi`
- `/dang_ky_thi`
- `/phan_phong`
- `/xep_cho`
- `/diem_danh`

Each endpoint logs either `OK` with returned data or `FAILED` with the error message.

The second test block creates a new subject:

```http
POST /mon_thi
```

It sends a subject payload with a generated `MaMon` value based on `Date.now()`, then fetches `/mon_thi` again to verify the new subject appears in the list.

### Why This File Matters

This component proves several integration points before the real UI is built:

- The Vite frontend can read the Ruby API base URL.
- The browser can reach the Rails server.
- The shared `rubyAPI` client supports GET, POST, and PATCH.
- JSON request and response handling works.
- Backend errors are surfaced through JavaScript exceptions.
- Main Ruby API endpoints can be smoke-tested quickly from one place.

Because it creates real data through `POST /mon_thi` and can change exam state through `PATCH /ky_thi/3/publish`, it should be used carefully against a demo/test database.

## Running The Frontend

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Preview a production build:

```bash
npm run preview
```

## Current Limitations

- Login and signup screens are visual mocks. They do not authenticate yet.
- Operations pages currently use mock data instead of live API responses.
- `API_Testings.jsx` must be copied into `App.jsx` manually to run the browser tests.
- There is no automated frontend test runner configured yet.
- The C# API endpoint file is still a placeholder.
- The C# environment variable name currently uses `VITE_CSHARP_API_BASE_url`; keeping environment variable casing consistent later would make the setup cleaner.
