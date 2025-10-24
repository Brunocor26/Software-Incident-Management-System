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
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            msg.textContent = 'Autenticado!';
            msg.className = 'success';
            console.log('Usuário:', data.user);

            window.location.href = '../Dashboard/dashboard.html'; // HTML de destino
        } else {
            msg.textContent = data.error;
            msg.className = 'error';
        }
    } catch (err) {
        msg.textContent = 'Erro ao conectar com o servidor.';
        msg.className = 'error';
        console.error(err);
    }
});
