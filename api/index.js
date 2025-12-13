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

// Database Setup (Turso) - Lazy Initialization
let dbInstance = null;

const getDb = () => {
    if (dbInstance) return dbInstance;

    if (!process.env.TURSO_URL) {
        throw new Error("TURSO_URL is missing in environment variables");
    }

    try {
        dbInstance = createClient({
            url: process.env.TURSO_URL,
            authToken: process.env.TURSO_TOKEN,
        });
        return dbInstance;
    } catch (e) {
        console.error("Failed to create Turso client:", e);
        throw e;
    }
};

// Initialize DB Schema (Run once per container start, or lazily)
const initDb = async () => {
    try {
        const db = getDb();
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
};

// Attempt init on load, but don't crash
initDb();

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
        const db = getDb();
        const result = await db.execute("SELECT * FROM history ORDER BY id DESC");
        res.json({
            "message": "success",
            "data": result.rows
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

app.post('/api/history', async (req, res) => {
    const { zoneName, startTime, endTime, duration, date } = req.body;
    const sql = 'INSERT INTO history (zoneName, startTime, endTime, duration, date) VALUES (?,?,?,?,?)';
    const args = [zoneName, startTime, endTime, duration, date];

    try {
        const db = getDb();
        const result = await db.execute({ sql, args });
        res.json({
            "message": "success",
            "data": req.body,
            "id": result.lastInsertRowid.toString()

        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// Only listen if running locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

export default app;


