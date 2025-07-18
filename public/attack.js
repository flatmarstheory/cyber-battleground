document.getElementById('sqli-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const res = await fetch('/attack/sqli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: form.username.value,
            password: form.password.value
        })
    });
    document.getElementById('sqli-result').innerText = await res.text();
};

document.getElementById('brute-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const res = await fetch('/attack/brute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: form.username.value,
            passwords: form.passwords.value
        })
    });
    document.getElementById('brute-result').innerText = await res.text();
};

document.getElementById('xss-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const res = await fetch('/attack/xss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: form.username.value,
            payload: form.payload.value
        })
    });
    document.getElementById('xss-result').innerText = await res.text();
};

document.getElementById('upload-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const res = await fetch('/attack/upload', {
        method: 'POST',
        body: data
    });
    document.getElementById('upload-result').innerText = await res.text();
};

document.getElementById('cmd-form').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const res = await fetch('/attack/cmd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: form.input.value
        })
    });
    document.getElementById('cmd-result').innerText = await res.text();
}; 