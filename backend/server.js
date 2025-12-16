const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authenticateToken = require('./middleware/authMiddleware');
require('dotenv').config();

const app = express();

// Middleware para JSON
app.use(express.json());
app.use('/uploads', express.static('uploads'));

//Configurar CORS
app.use(cors({
  credentials: true
}));


const connectDB = require('./config/db');

// Conectar ao MongoDB
connectDB();

// Importar rotas
const loginRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidents');
const userRoutes = require('./routes/userRoutes');

// Usar rotas
app.use('/login', loginRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/git', require('./routes/gitRoutes'));
app.use('/users', userRoutes);

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Token válido', user: req.user });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
// Iniciar servidor
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));
}

module.exports = app;
