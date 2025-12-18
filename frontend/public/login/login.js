const API_BASE = globalThis.location.hostname === 'localhost' || globalThis.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:3000' 
    : '';

const form = document.getElementById('login-form');
const msg = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        msg.textContent = 'Por favor preencha ambos os campos.';
        msg.className = 'error';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Unexpected response format: ${text.substring(0, 100)}`);
        }

        if (response.ok) {
            msg.textContent = 'Autenticado!';
            msg.className = 'success';
            console.log('Usuário:', data.user);

            // Guardar o token no localStorage
            localStorage.setItem('token', data.token);

            // Redirecionar para o dashboard
            globalThis.location.href = '../Dashboard/dashboard.html';
        }
        else {
            msg.textContent = data.error;
            msg.className = 'error';
        }
    } catch (err) {
        msg.textContent = 'Erro ao conectar com o servidor.';
        msg.className = 'error';
        console.error(err);
    }
});
