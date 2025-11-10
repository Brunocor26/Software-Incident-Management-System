const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET; 

// POST /login
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  console.log("Email recebido:", email);
  console.log("Senha recebida:", password);
  console.log("JWT_SECRET:", JWT_SECRET);

  if (!email || !password) {
    console.log("Falha: campos obrigatórios não preenchidos");
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("Falha: usuário não encontrado");
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("Resultado comparação senha:", passwordMatch);

    if (!passwordMatch) {
      console.log("Falha: senha incorreta");
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    if (!JWT_SECRET) {
      console.log("Falha: JWT_SECRET não definido");
      return res.status(500).json({ error: 'Erro no servidor.' });
    }

    // Criar o token JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        papel: user.papel
      },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    console.log("Login bem-sucedido, token criado:", token);

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user: {
        id: user.id,
        name: user.name,
        papel: user.papel,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
});

module.exports = router;
