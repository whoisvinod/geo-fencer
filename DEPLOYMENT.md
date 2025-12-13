# Deployment Guide for GeoFencer (Vercel + Turso)

## Prerequisites
-   **GitHub Account**: To host the code.
-   **Vercel Account**: To host the app (Free).
-   **Turso Account**: To host the database (Free).

## Step 1: Push to GitHub
1.  Open your terminal.
2.  Run these commands to push your latest changes (including the Turso setup):
    ```bash
    git add .
    git commit -m "Setup Turso and Vercel"
    git push
    ```

## Step 2: Deploy to Vercel
1.  Go to [vercel.com](https://vercel.com/) and log in with GitHub.
2.  Click **Add New...** -> **Project**.
3.  Import your `geo-fencer` repository.
4.  **IMPORTANT: Configure Environment Variables**:
    -   Expand the **Environment Variables** section.
    -   Add the following (copy from your Turso dashboard or the chat):
        -   **Key**: `TURSO_URL` | **Value**: `libsql://geo-fencer-data-db-vinodakula.aws-ap-south-1.turso.io`
        -   **Key**: `TURSO_TOKEN` | **Value**: `(Your long token starting with ey...)`
5.  Click **Deploy**.

## Step 3: Verify
-   Vercel will build your app and give you a URL (e.g., `https://geo-fencer.vercel.app`).
-   Open it, create a zone, and start the timer.
-   Check the "History" tab. It should load data from Turso!

## Troubleshooting
-   **Database Error?** Check if you added the Environment Variables correctly in Vercel Settings.
-   **Blank Screen?** Check the Vercel "Logs" tab for build errors.
