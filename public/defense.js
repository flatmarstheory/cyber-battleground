async function fetchLogs() {
    const res = await fetch('/api/logs');
    return res.json();
}

async function fetchStats() {
    const res = await fetch('/api/stats');
    return res.json();
}

async function fetchAttacks() {
    const res = await fetch('/api/attacks');
    return res.json();
}

async function fetchBlocked() {
    const res = await fetch('/api/blocked');
    return res.json();
}

async function unblockIP(ip) {
    await fetch('/api/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
    });
    renderBlocked();
}

// Patch renderLogs and renderChart to use the same last 5 requests
window.renderLogs = async function() {
    const logs = await fetch('/api/logs').then(r => r.json());
    // Filter out /api/* and /favicon.ico, but keep all real activity (including non-attacks)
    const filtered = logs.filter(log => !log.endpoint.startsWith('/api/') && log.endpoint !== '/favicon.ico');
    const last5 = filtered.slice(0, 5);
    const tbody = document.querySelector('#req-table tbody');
    tbody.innerHTML = '';
    if (last5.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align:center;color:#888;">No recent requests</td>`;
        tbody.appendChild(tr);
    } else {
        last5.forEach(log => {
            const tr = document.createElement('tr');
            if (isAttack(log)) tr.classList.add('attack-row');
            tr.innerHTML = `<td>${log.timestamp}</td><td>${log.ip}</td><td>${log.endpoint}</td><td>${log.method}</td><td>${log.body.slice(0, 40)}</td>`;
            tbody.appendChild(tr);
        });
    }
    // Fill modal with all logs
    const modalTbody = document.querySelector('#modal-req-table tbody');
    modalTbody.innerHTML = '';
    filtered.forEach(log => {
        const tr = document.createElement('tr');
        if (isAttack(log)) tr.classList.add('attack-row');
        tr.innerHTML = `<td>${log.timestamp}</td><td>${log.ip}</td><td>${log.endpoint}</td><td>${log.method}</td><td>${log.body.slice(0, 40)}</td>`;
        modalTbody.appendChild(tr);
    });
    // Store filtered logs for chart
    window._filteredLogs = filtered;
};
window.renderChart = async function() {
    // Use the filtered logs from renderLogs
    const logs = window._filteredLogs || [];
    // Group logs by minute
    const counts = {};
    logs.forEach(log => {
        const min = log.timestamp.slice(11, 16);
        counts[min] = (counts[min] || 0) + 1;
    });
    const labels = Object.keys(counts).sort();
    const data = labels.map(l => counts[l]);
    const ctx = document.getElementById('req-chart').getContext('2d');
    if (window.reqChart) window.reqChart.destroy();
    window.reqChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                label: 'Requests/min',
                data: data.length ? data : [0],
                borderColor: '#2d3e50',
                fill: false,
                pointBackgroundColor: labels.map(l => '#1976d2'),
                pointRadius: labels.map(() => 5),
                pointStyle: labels.map(() => 'circle'),
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
};

// Patch renderAttacks to filter out /favicon.ico, /api/*, and /attack/*
const origRenderAttacks = window.renderAttacks;
window.renderAttacks = async function() {
    const attacks = await fetch('/api/attacks').then(r => r.json());
    const ul = document.getElementById('attack-list');
    ul.innerHTML = '';
    // Deduplicate by endpoint+type+timestamp
    const seen = new Set();
    const unique = [];
    attacks.forEach(a => {
        const key = (a.endpoint || '') + '|' + (a.type || '') + '|' + (a.time || '');
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(a);
        }
    });
    const last5 = unique.filter(a => a.endpoint !== '/favicon.ico' && !a.endpoint.startsWith('/api/') && !a.endpoint.startsWith('/attack/')).slice(0, 5);
    last5.forEach(a => {
        const li = document.createElement('li');
        li.textContent = `${a.time} | ${a.ip} | ${a.endpoint} | ${a.type}`;
        if (a.ip === '127.0.0.1' || a.ip === '::1') li.classList.add('localhost-ip');
        const btn = document.createElement('button');
        btn.textContent = 'Block';
        btn.className = 'block-btn';
        btn.onclick = () => blockIP(a.ip);
        li.appendChild(btn);
        ul.appendChild(li);
    });
};

async function renderBlocked() {
    const ips = await fetchBlocked();
    const ul = document.getElementById('blocked-list');
    ul.innerHTML = '';
    ips.forEach(ip => {
        const li = document.createElement('li');
        li.textContent = ip + ' ';
        const btn = document.createElement('button');
        btn.textContent = 'Unblock';
        btn.onclick = () => unblockIP(ip);
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

async function refreshAll() {
    renderLogs();
    renderChart();
    renderAttacks();
    renderBlocked();
}

setInterval(refreshAll, 3000);
refreshAll();

// Add clear detections button logic
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    const clearBtn = document.getElementById('clear-attacks-btn');
    if (clearBtn) {
      clearBtn.onclick = async function() {
        if (confirm('Are you sure you want to clear all detected attacks? This cannot be undone.')) {
          clearBtn.disabled = true;
          await fetch('/api/clear-attacks', { method: 'POST' });
          await refreshAll();
          clearBtn.disabled = false;
        }
      };
    }
  });
} 