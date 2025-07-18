# 🛡️ Cyber Battleground

A full-stack, hands-on cybersecurity simulation platform for learning, teaching, and demonstrating both offensive and defensive web security.  

**Built for education, demos, and real-world security awareness.**

---

### Vulnerable Web Application

<img width="1513" height="1084" alt="Screenshot 2025-07-18 134946" src="https://github.com/user-attachments/assets/58efe8fb-2b8f-4bb5-a42b-9ef95dda87b0" />

### Attack Dashboard

<img width="1622" height="1066" alt="Screenshot 2025-07-18 134953" src="https://github.com/user-attachments/assets/bd4fab10-76c3-448e-aca8-8b7918fbf978" />

### Defense Dashboard

<img width="1772" height="1087" alt="Screenshot 2025-07-18 135003" src="https://github.com/user-attachments/assets/715e6799-abb0-4c56-aabb-df48bbe8bf56" />


## 🚩 What is Cyber Battleground?

**Cyber Battleground** is an intentionally vulnerable web application and security lab. It provides a safe, interactive environment to:
- **Explore and exploit real-world web vulnerabilities** (SQL Injection, XSS, brute-force, file upload, command injection)
- **Launch and observe attacks** via a custom Attack Dashboard
- **Monitor, detect, and block attacks in real time** with a professional Defense Dashboard
- **Learn best practices and mitigation strategies** for each vulnerability, with in-app explanations

> **⚠️ WARNING:** This project is intentionally insecure.  
> **Never deploy to a public server. Use only in isolated, local, or educational environments.**

---

## ✨ Features

### Vulnerable Web Application
- Built with **Express (Node.js)** and **SQLite**
- Classic vulnerabilities:
  - **SQL Injection** (login)
  - **Cross-Site Scripting (XSS)** (comments)
  - **Brute-force** (login)
  - **Unvalidated File Upload**
  - **Command Injection**
- Each vulnerable page includes:
  - A right-side card explaining the vulnerability, example attacks, and mitigation strategies
  - A prominent warning banner

### Attack Dashboard
- Modern, card-based UI with a dark hacker theme
- Each attack (SQLi, brute-force, XSS, file upload, command injection) is an independent card
- **Manual and auto-attack** buttons (auto-attack is rate-limited)
- All attack scripts are Python-based, modular, and easy to extend

### Defense Dashboard
- Blue team theme, card-based layout
- **Live Requests Per Minute** chart (shows all real requests, smoothed, always visible)
- **Recent Requests** table (last 5, with modal for full stream, attacks highlighted)
- **Detected Attacks** (last 5 unique, deduplicated by endpoint/type/timestamp, attacks highlighted)
- **Blocked IPs** section with unblock button
- **Clear Detections** button to fully clear detection logs from both UI and backend
- Note at the top about localhost IPs
- Only real user/attack activity is shown; `/api/*`, `/attack/*`, `/favicon.ico` are filtered out

### Detection & Defense Logic
- Detects SQLi, XSS, brute-force login, malicious file upload (by extension), and command injection (by shell metacharacters)
- All detected attacks are shown in the dashboard and highlighted in the chart and tables
- Backend and frontend deduplication prevent duplicate detections from appearing
- **Auto-blocking** for SQLi, XSS, and brute-force attacks

### Other Features
- **Educational content**: Every vulnerability is explained with examples and defenses
- **Beautiful, modern UI**: Green (web), red (attack), blue (defense) themes
- **All logs, attacks, and blocks are fully synchronized** between memory and storage
- **Debug endpoints and logs** for development and demo purposes
- **Responsive, demo-ready UI/UX**

---

## 🛠️ Getting Started

### 1. **Clone the Repo**
```bash
git clone https://github.com/flatmarstheory/cyber-battleground.git
cd cyber-battleground
```

### 2. **Install Node.js Dependencies**
- **Node.js**: v18.x or later
- **Express**: ^4.18.2
- **sqlite3**: ^5.1.6
- **body-parser**: ^1.20.2
- **multer**: ^1.4.5-lts.1

```bash
npm install
```

### 3. **Install Python Requirements**
- **Python**: 3.8+
- **requests**: >=2.25.0

```bash
pip install -r requirements.txt
# or, if requirements.txt is missing:
pip install requests
```

### 4. **Run the App**
```bash
node server.js
# or for auto-reload:
npx nodemon server.js
```

### 5. **Open in Browser**
- Home: [http://localhost:3000/index.html](http://localhost:3000/index.html)
- Vulnerable Website: [http://localhost:3000/login.html](http://localhost:3000/login.html)
- Attack Dashboard: [http://localhost:3000/attack.html](http://localhost:3000/attack.html)
- Defense Dashboard: [http://localhost:3000/defense.html](http://localhost:3000/defense.html)

---

## 🧑‍💻 Usage & Educational Value

- **Try each vulnerability**: Read the right-side card for a detailed explanation and mitigation.
- **Attack**: Use the Attack Dashboard to launch SQLi, brute-force, XSS, file upload, and command injection attacks (manual or auto).
- **Defend**: Watch the Defense Dashboard detect, log, and block attacks in real time. Block/unblock IPs, see live stats, and learn how blue teams operate.
- **Learn**: Every page is a mini-lesson in web security, with real code and real consequences.

---

## 🔍 Details of Each Component

### Vulnerable Web App
- **/login.html**: SQL Injection and brute-force vulnerable login form
- **/comments.html**: XSS-vulnerable comment section
- **/upload.html**: Unvalidated file upload
- **/cmd.html**: Command injection via shell input
- **Educational cards**: Each page explains the vulnerability, how to exploit it, and how to defend

### Attack Dashboard
- **SQL Injection**: Manual and auto attack forms, Python script for automated exploitation
- **Brute-force**: Password list attack, Python script
- **XSS**: Payload injection, Python script
- **File Upload**: Malicious file upload, Python script
- **Command Injection**: Shell metacharacter injection, Python script
- **Auto-attack**: Each auto-attack is rate-limited and requires explicit user action

### Defense Dashboard
- **Live Requests Per Minute**: All real requests, not just attacks, graphed for situational awareness
- **Recent Requests**: Last 5 real requests, attacks highlighted, modal for full stream
- **Detected Attacks**: Last 5 unique attacks, deduplicated, attacks highlighted
- **Blocked IPs**: List of blocked IPs, with unblock button
- **Clear Detections**: Button to clear all logs and detections
- **Filtering**: Only real user/attack activity is shown; `/api/*`, `/attack/*`, `/favicon.ico` are filtered out

### Detection Logic
- **SQL Injection**: Detected by common SQLi patterns in login requests
- **XSS**: Detected by script tags and event handlers in comments
- **Brute-force**: Detected by repeated failed logins from the same IP
- **Malicious File Upload**: Detected by dangerous file extensions
- **Command Injection**: Detected by shell metacharacters in command input
- **Deduplication**: Both backend and frontend deduplicate attacks by endpoint/type/timestamp
- **Auto-blocking**: Offending IPs are blocked for SQLi, XSS, and brute-force

---

## 🤝 How to Contribute

**This project is a work in progress and a community learning tool.**

- **Feature ideas?** Open an issue or pull request!
- **Found a bug?** File an issue with steps to reproduce.
- **Want to add new vulnerabilities, attacks, or defenses?** Fork and PR!
- **Educators:** Suggest content, labs, or integrations.
- **Designers:** Help us make it even more beautiful and accessible.
- **Security pros:** Review, test, and help us keep the project realistic and up-to-date.

> **We welcome all contributions, feedback, and collaborators!**

---

## 📚 License & Credits

- MIT License
- Inspired by OWASP Juice Shop, DVWA, and the broader security community

---

## 💡 Contact & Community

- [GitHub Issues](https://github.com/flatmarstheory/cyber-battleground/issues)
- [Buy Me a Coffee (BMAC)](https://www.buymeacoffee.com/flatmarstheory)
- [GitHub: flatmarstheory](https://github.com/flatmarstheory)

---

**Let’s build the best open-source cybersecurity battleground together!** 
