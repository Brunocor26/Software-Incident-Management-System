const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

// POST /login
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  // Verificar se ambos foram enviados
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    // Procurar o usuário pelo email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verificar a senha (simples por enquanto)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    // Se chegou aqui, está autenticado
    return res.json({
      message: 'Login bem-sucedido!',
      user: {
        id: user.id,
        name: user.name,
        papel: user.papel,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
});

module.exports = router;
