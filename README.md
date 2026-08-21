# Jeslin J. P. — Portfolio

A galaxy-themed portfolio site: animated starfield background, an orbiting
"constellation" skills diagram, and a working file-upload + contact form
backed by an Express API and a SQLite database.

## Folder structure

```
jeslin-portfolio/
├── backend/
│   ├── server.js          # Express API: serves the frontend + /api routes
│   ├── package.json
│   ├── db/
│   │   ├── database.js    # SQLite connection + schema (files, messages)
│   │   └── portfolio.db   # created automatically on first run
│   └── uploads/           # uploaded files land here on disk
│
├── frontend/
│   ├── index.html         # all page content/sections
│   ├── css/
│   │   └── style.css      # design tokens, layout, animations
│   ├── js/
│   │   ├── galaxy.js         # animated starfield background (canvas)
│   │   ├── constellation.js  # orbiting skills node-link diagram (canvas)
│   │   └── main.js           # nav, typing effect, reveals, upload/contact logic
│   └── assets/             # put a resume PDF / headshot here if you want
│
├── .gitignore
└── README.md
```

## Run it

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
cd backend
npm install
npm start
```

Then open **http://localhost:3000** — the Express server serves the
`frontend/` folder directly, so there's nothing else to start.

On first run, `backend/db/portfolio.db` is created automatically with two
tables:

- `files` — original filename, stored filename, mime type, size, timestamp
- `messages` — name, email, message, timestamp, from the contact form

Uploaded files themselves are saved to `backend/uploads/`.

## API endpoints

| Method | Route              | What it does                          |
|--------|---------------------|----------------------------------------|
| POST   | `/api/upload`        | Multipart upload (`file` field), stores file + logs metadata in SQLite |
| GET    | `/api/files`          | List all uploaded files (newest first) |
| DELETE | `/api/files/:id`      | Delete a file from disk + database    |
| POST   | `/api/contact`        | Store a contact-form message           |

## Customizing

- **Colors / fonts**: edit the `:root` variables at the top of `frontend/css/style.css`.
- **Content**: all section copy lives in `frontend/index.html` — experience,
  projects, certifications, and skills (`SKILLS` array in `constellation.js`).
- **Upload limit**: change `MAX_FILE_SIZE_MB` in `backend/server.js` (and the
  matching check in `frontend/js/main.js`).
- **Deploying**: this is a single Node process serving both the API and the
  static frontend, so it deploys anywhere Node runs (Render, Railway, a
  Ubuntu VM over SSH, etc.) — just run `npm install && npm start` on the server.

## Notes

- `better-sqlite3` is a native module — `npm install` compiles it for your
  platform automatically. If it fails, make sure you have build tools
  installed (on Ubuntu: `sudo apt install build-essential python3`).
- Reduced-motion is respected: the galaxy background and constellation
  animation fall back to a static frame if the user has "reduce motion"
  enabled at the OS level.
