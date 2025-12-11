const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// Pegar todos os usuários (opcionalmente filtrados por papel)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) {
            filter.papel = req.query.role;
        }
        const users = await User.find(filter);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Criar um usuário
router.post('/', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({ ...req.body, password: hashedPassword });
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Deletar um usuário por email (para testes)
router.delete('/:email', async (req, res) => {
    try {
        const deletedUser = await User.findOneAndDelete({ email: req.params.email });
        if (!deletedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
