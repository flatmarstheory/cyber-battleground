const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = path.join(__dirname, 'db', 'database.sqlite');
const { exec } = require('child_process');
const { PythonShell } = require('python-shell');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite DB
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) throw err;
  console.log('Connected to SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
  db.run(`INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'password123')`);
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    comment TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    method TEXT,
    endpoint TEXT,
    headers TEXT,
    body TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS blocked_ips (
    ip TEXT PRIMARY KEY
  )`);
  // Load blocked IPs from DB
  db.all('SELECT ip FROM blocked_ips', (err, rows) => {
    if (!err && rows) {
      rows.forEach(row => blockedIPs.add(row.ip));
    }
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const method = req.method;
  const endpoint = req.originalUrl;
  const headers = JSON.stringify(req.headers);
  let body = '';
  if (req.method === 'POST' || req.method === 'PUT') {
    body = JSON.stringify(req.body);
  }
  console.log(`[LOG] ${method} ${endpoint} | body: ${body}`);
  db.run(
    'INSERT INTO logs (ip, method, endpoint, headers, body) VALUES (?, ?, ?, ?, ?)',
    [ip, method, endpoint, headers, body],
    () => {}
  );
  next();
});

// Vulnerable login endpoint (SQL Injection!)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Intentionally vulnerable SQL (no parameterization)
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  db.get(query, (err, row) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    if (row) {
      res.send(`<h2>Welcome, ${row.username}!</h2>`);
    } else {
      res.send('<h2>Login failed</h2>');
    }
  });
});

// Serve comments page with all comments rendered as raw HTML (XSS!)
app.get('/comments.html', (req, res) => {
  db.all('SELECT username, comment FROM comments ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).send('DB error');
    let commentsHtml = rows.map(row => `<b>${row.username}:</b> ${row.comment}<br><br>`).join('');
    // Inject comments into the page
    const fs = require('fs');
    const page = fs.readFileSync(path.join(__dirname, 'public', 'comments.html'), 'utf8');
    const rendered = page.replace('<!-- Comments will be rendered here by the server as raw HTML -->', commentsHtml);
    res.send(rendered);
  });
});

// Handle new comment submission (no sanitization)
app.post('/comment', (req, res) => {
  const { username, comment } = req.body;
  db.run('INSERT INTO comments (username, comment) VALUES (?, ?)', [username, comment], (err) => {
    if (err) return res.status(500).send('DB error');
    res.redirect('/comments.html');
  });
});

const fs = require('fs');
const multer = require('multer');
const uploadDir = path.join(__dirname, 'db', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// Serve upload page with list of files
app.get('/upload.html', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) files = [];
    let filesHtml = files.map(f => `<a href="/uploads/${f}" target="_blank">${f}</a><br>`).join('');
    const page = fs.readFileSync(path.join(__dirname, 'public', 'upload.html'), 'utf8');
    const rendered = page.replace('<!-- Uploaded files will be listed here by the server -->', filesHtml);
    res.send(rendered);
  });
});

// Vulnerable file upload (no validation)
app.post('/upload', upload.single('file'), (req, res) => {
  // No validation, just save
  res.redirect('/upload.html');
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Serve command injection page
app.get('/cmd.html', (req, res) => {
  const fs = require('fs');
  const page = fs.readFileSync(path.join(__dirname, 'public', 'cmd.html'), 'utf8');
  res.send(page);
});

// Vulnerable command injection endpoint
app.post('/cmd', (req, res) => {
  const userInput = req.body.input;
  // Intentionally vulnerable: user input is passed directly to shell
  exec('echo ' + userInput, (err, stdout, stderr) => {
    let output = '';
    if (err) output = stderr;
    else output = stdout;
    const fs = require('fs');
    let page = fs.readFileSync(path.join(__dirname, 'public', 'cmd.html'), 'utf8');
    page = page.replace('<!-- Command output will be rendered here by the server -->', `<pre>${output}</pre>`);
    res.send(page);
  });
});

// Attack dashboard endpoints
app.post('/attack/sqli', (req, res) => {
  PythonShell.run('sqli.py', { scriptPath: './scripts', args: [req.body.username, req.body.password] }, (err, results) => {
    if (err) return res.status(500).send(err.toString());
    res.send(results ? results.join('\n') : 'No output');
  });
});

app.post('/attack/brute', (req, res) => {
  PythonShell.run('brute.py', { scriptPath: './scripts', args: [req.body.username, req.body.passwords] }, (err, results) => {
    if (err) return res.status(500).send(err.toString());
    res.send(results ? results.join('\n') : 'No output');
  });
});

app.post('/attack/xss', (req, res) => {
  PythonShell.run('xss.py', { scriptPath: './scripts', args: [req.body.username, req.body.payload] }, (err, results) => {
    if (err) return res.status(500).send(err.toString());
    res.send(results ? results.join('\n') : 'No output');
  });
});

app.post('/attack/upload', (req, res) => {
  // Save file to temp, pass path to script
  const multer = require('multer');
  const upload = multer({ dest: './db/tmp' });
  upload.single('file')(req, res, function(err) {
    if (err) return res.status(500).send('Upload error');
    const filePath = req.file ? req.file.path : '';
    PythonShell.run('upload.py', { scriptPath: './scripts', args: [filePath, req.file ? req.file.originalname : ''] }, (err, results) => {
      if (err) return res.status(500).send(err.toString());
      res.send(results ? results.join('\n') : 'No output');
    });
  });
});

app.post('/attack/cmd', (req, res) => {
  PythonShell.run('cmd.py', { scriptPath: './scripts', args: [req.body.input] }, (err, results) => {
    if (err) return res.status(500).send(err.toString());
    res.send(results ? results.join('\n') : 'No output');
  });
});

// In-memory blocked IPs
const blockedIPs = new Set();

// Rule-based detection helpers
function detectAttack(log) {
  const { endpoint, body, method } = log;
  let attacks = [];
  let bodyStr = body;
  let parsed = {};
  try {
    parsed = JSON.parse(body);
    bodyStr = Object.values(parsed).join(' ');
  } catch (e) {
    // Not JSON, use as is
  }
  // SQLi detection
  const sqliMatch = /('|--|;|\bOR\b|\bAND\b)/i.test(bodyStr) && endpoint.includes('login');
  if (sqliMatch) attacks.push('SQL Injection');
  // XSS detection
  const xssMatch = /<script|onerror=|onload=|<img|<svg/i.test(bodyStr) && endpoint.includes('comment');
  if (xssMatch) attacks.push('XSS');
  // Brute-force detection: failed login (login endpoint, POST, and response is 'Login failed')
  if (endpoint.includes('login') && method === 'POST' && bodyStr && !sqliMatch) {
    // If not a successful login (no SQLi), treat as brute-force attempt
    attacks.push('Brute-force Attempt');
  }
  // Malicious file upload detection
  if (endpoint.includes('upload') && method === 'POST') {
    const fileMatch = /\.(php|js|exe|sh|bat|py|pl|rb|jsp|asp|aspx|dll|bin|cmd|com|vbs|wsf|cpl|scr|jar|ps1|psm1|msi|reg|hta|pif|gadget|msh|msh1|msh2|mshxml|msh1xml|msh2xml)$/i;
    if (fileMatch.test(bodyStr)) {
      attacks.push('Malicious File Upload');
    }
  }
  // Command injection detection
  if (endpoint.includes('cmd') && method === 'POST') {
    if (/[;&|`$><]/.test(bodyStr)) {
      attacks.push('Command Injection');
    }
  }
  return attacks;
}

// Enhanced brute-force detection: 5+ failed logins from same IP in 5 min
function detectBruteForce(logs) {
  const now = Date.now();
  const byIP = {};
  logs.forEach(log => {
    if (log.endpoint.includes('login') && log.method === 'POST' && log.body && log.body.includes('Login failed')) {
      const ip = log.ip;
      const ts = new Date(log.timestamp).getTime();
      if (!byIP[ip]) byIP[ip] = [];
      byIP[ip].push(ts);
    }
  });
  const bruteIPs = [];
  for (const ip in byIP) {
    // Count failed logins in last 5 min
    const recent = byIP[ip].filter(ts => now - ts < 5 * 60 * 1000);
    if (recent.length >= 5) {
      bruteIPs.push(ip);
      blockedIPs.add(ip);
    }
  }
  return bruteIPs;
}

const KNOWN_ENDPOINTS = ['/login', '/login.html', '/comments.html', '/comment', '/upload', '/upload.html', '/cmd', '/cmd.html', '/attack.html', '/defense.html', '/api/logs', '/api/stats', '/api/attacks', '/api/blocked', '/api/unblock'];

function detectAnomalies(logs) {
  const now = Date.now();
  const byIP = {};
  logs.forEach(log => {
    const ip = log.ip;
    if (!byIP[ip]) byIP[ip] = [];
    byIP[ip].push(log);
  });
  const anomalies = [];
  for (const ip in byIP) {
    // 1. High request rate
    const recent = byIP[ip].filter(l => now - new Date(l.timestamp).getTime() < 60 * 1000);
    if (recent.length > 20) {
      anomalies.push({ ip, reason: 'High request rate', count: recent.length });
    }
    // 2. Unknown endpoints
    byIP[ip].forEach(l => {
      if (!KNOWN_ENDPOINTS.includes(l.endpoint.split('?')[0])) {
        anomalies.push({ ip, reason: 'Unknown endpoint', endpoint: l.endpoint });
      }
      // 3. Large payload
      if (l.body && l.body.length > 2000) {
        anomalies.push({ ip, reason: 'Large payload', size: l.body.length });
      }
    });
  }
  return anomalies;
}

function persistBlockIP(ip) {
  blockedIPs.add(ip);
  db.run('INSERT OR IGNORE INTO blocked_ips (ip) VALUES (?)', [ip]);
}
function persistUnblockIP(ip) {
  blockedIPs.delete(ip);
  db.run('DELETE FROM blocked_ips WHERE ip = ?', [ip]);
}

// Block IP middleware
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const safeEndpoints = ['/api/attacks', '/api/logs', '/api/stats', '/api/blocked', '/api/unblock', '/debug/attacks'];
  if (blockedIPs.has(ip) && !safeEndpoints.some(e => req.originalUrl.startsWith(e))) {
    return res.status(403).send('Your IP is blocked.');
  }
  next();
});

// API: Get recent logs
app.get('/api/logs', (req, res) => {
  db.all('SELECT * FROM logs ORDER BY id DESC LIMIT 50', (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows);
  });
});

// API: Get requests per minute (last 60 min)
app.get('/api/stats', (req, res) => {
  db.all("SELECT strftime('%H:%M', timestamp) as minute, COUNT(*) as count FROM logs WHERE timestamp >= datetime('now', '-60 minutes') GROUP BY minute ORDER BY minute", (err, rows) => {
    if (err) return res.status(500).send('DB error');
    res.json(rows);
  });
});

// API: Get detected attacks (last 100 logs)
app.get('/api/attacks', (req, res) => {
  db.all('SELECT * FROM logs ORDER BY id DESC LIMIT 100', (err, rows) => {
    if (err) return res.status(500).send('DB error');
    const attacks = [];
    rows.forEach(log => {
      const detected = detectAttack(log);
      if (detected.length) {
        attacks.push({
          time: log.timestamp,
          ip: log.ip,
          endpoint: log.endpoint,
          type: detected.join(', ')
        });
      }
    });
    // Brute-force detection
    const bruteIPs = detectBruteForce(rows);
    bruteIPs.forEach(ip => {
      attacks.push({
        time: new Date().toISOString(),
        ip,
        endpoint: '/login',
        type: 'Brute-force'
      });
    });
    // Anomaly detection
    const anomalies = detectAnomalies(rows);
    anomalies.forEach(a => {
      attacks.push({
        time: new Date().toISOString(),
        ip: a.ip,
        endpoint: a.endpoint || '',
        type: `Anomaly (${a.reason}${a.count ? ': ' + a.count : ''}${a.size ? ', size: ' + a.size : ''})`
      });
    });
    // Deduplicate by ip, endpoint, type, and minute
    const seen = new Set();
    const unique = [];
    attacks.forEach(a => {
      // Round time to minute for deduplication
      const minute = a.time ? a.time.slice(0, 16) : '';
      const key = `${a.ip}|${a.endpoint}|${a.type}|${minute}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(a);
      }
    });
    // Restore auto-blocking for SQLi, XSS, Brute-force
    unique.forEach(a => {
      if (a.type.includes('SQL Injection') || a.type.includes('XSS') || a.type.includes('Brute-force')) {
        persistBlockIP(a.ip);
      }
    });
    res.json(unique);
  });
});

// Debug endpoint to print detected attacks to terminal
app.get('/debug/attacks', (req, res) => {
  db.all('SELECT * FROM logs ORDER BY id DESC LIMIT 100', (err, rows) => {
    if (err) return res.status(500).send('DB error');
    const attacks = [];
    rows.forEach(log => {
      const detected = detectAttack(log);
      if (detected.length) {
        console.log(`[DEBUG-ATTACK]`, log, 'Detected:', detected);
        attacks.push({
          time: log.timestamp,
          ip: log.ip,
          endpoint: log.endpoint,
          type: detected.join(', ')
        });
      }
    });
    console.log(`[DEBUG-ATTACK] Total detected: ${attacks.length}`);
    res.send(`Printed ${attacks.length} detected attacks to terminal.`);
  });
});

// API: Get blocked IPs
app.get('/api/blocked', (req, res) => {
  // Always return the in-memory set, which is used for blocking
  res.json(Array.from(blockedIPs));
});

// API: Unblock IP
app.post('/api/unblock', (req, res) => {
  const ip = req.body.ip;
  persistUnblockIP(ip);
  res.json({ success: true });
});

// API: Clear all detected attacks/logs
app.post('/api/clear-attacks', (req, res) => {
  db.run('DELETE FROM logs', [], (err) => {
    if (err) return res.status(500).send('DB error');
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 