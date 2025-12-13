const express = require('express');
const { createClient } = require('@libsql/client');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Database Setup (Turso)
const db = createClient({
    url: process.env.TURSO_URL || 'file:local.db',
    authToken: process.env.TURSO_TOKEN,
});

// Initialize DB
(async () => {
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

// Serve React App for any other route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Only listen if running locally (Vercel handles this automatically)
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;

