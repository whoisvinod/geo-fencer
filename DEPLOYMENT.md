# Deployment Guide for GeoFencer

## Option 1: Replit (Best "No Credit Card" Option)
**Best for:** Persistent Database + No Credit Card.
**Pros:** Your `history.db` will be saved!
**Cons:** App sleeps when inactive.

1.  **Create Account**: Go to [replit.com](https://replit.com/) and sign up.
2.  **Create Repl**:
    -   Click **+ Create Repl**.
    -   Choose **Import from GitHub**.
    -   Paste your repository URL.
3.  **Run**:
    -   Replit will detect `package.json`.
    -   Click **Run**.
    -   It will install dependencies and start the server.
4.  **Done**: You will see a web view with your app URL.

---

## Option 2: Vercel (Requires Database Change)
**Best for:** Professional, fast, free.
**Pros:** Never sleeps, scales well.
**Cons:** **Cannot use SQLite file**. You MUST switch to a cloud database (like Turso or Neon).

1.  **Refactor**: We would need to change `server.cjs` to use a cloud DB connection string instead of a local file.
2.  **Deploy**: Connect GitHub repo to Vercel.

---

## Option 3: Local Tunnel (ngrok)
**Best for:** Hosting from your own computer.
**Pros:** You control the data.
**Cons:** Computer must stay on.

1.  Run `ngrok http 3000`.
