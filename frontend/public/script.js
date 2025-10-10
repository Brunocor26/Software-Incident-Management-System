const form = document.getElementById('login-form');
        const msg = document.getElementById('message');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            // placeholder (aceita tudo)
            if (!username || !password) {
                msg.textContent = 'Por favor preencha ambos os campos.';
                msg.className = 'error';
                return;
            }

            msg.textContent = 'Autenticado!';
            msg.className = '';

            
        });