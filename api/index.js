import express from 'express';
import { createClient } from '@libsql/client';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Setup (Turso)
if (!process.env.TURSO_URL) {
    console.error("CRITICAL: TURSO_URL is missing in environment variables!");
    // We don't throw here to allow the /api/health route to work, but DB calls will fail.
}

const db = createClient({
    url: process.env.TURSO_URL || 'libsql://unknown-db.turso.io', // Prevent file: protocol crash
    authToken: process.env.TURSO_TOKEN,
});


// Initialize DB
(async () => {
    if (!process.env.TURSO_URL) return;
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zoneName TEXT,
                startTime TEXT,
                endTime TEXT,
                duration INTEGER,
                date TEXT
            )
        `);
        console.log('Connected to Turso/LibSQL database.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
})();

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        env: {
            hasUrl: !!process.env.TURSO_URL,
            hasToken: !!process.env.TURSO_TOKEN
        }
    });
});

app.get('/api/history', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM history ORDER BY id DESC");
        res.json({
            "message": "success",
            "data": result.rows
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.post('/api/history', async (req, res) => {
    const { zoneName, startTime, endTime, duration, date } = req.body;
    const sql = 'INSERT INTO history (zoneName, startTime, endTime, duration, date) VALUES (?,?,?,?,?)';
    const args = [zoneName, startTime, endTime, duration, date];

    try {
        const result = await db.execute({ sql, args });
        res.json({
            "message": "success",
            "data": req.body,
            "id": result.lastInsertRowid
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Only listen if running locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

export default app;




// Only listen if running locally (Vercel handles this automatically)
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;

