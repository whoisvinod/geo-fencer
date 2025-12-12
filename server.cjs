const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Database Setup
const db = new sqlite3.Database('./history.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zoneName TEXT,
            startTime TEXT,
            endTime TEXT,
            duration INTEGER,
            date TEXT
        )`);
    }
});

// API Routes
app.get('/api/history', (req, res) => {
    const sql = "SELECT * FROM history ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

app.post('/api/history', (req, res) => {
    const { zoneName, startTime, endTime, duration, date } = req.body;
    const sql = 'INSERT INTO history (zoneName, startTime, endTime, duration, date) VALUES (?,?,?,?,?)';
    const params = [zoneName, startTime, endTime, duration, date];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": req.body,
            "id": this.lastID
        });
    });
});

// Serve React App for any other route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
