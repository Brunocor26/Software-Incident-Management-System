const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authenticateToken = require('./authMiddleware');
require('dotenv').config();

const app = express();

// Middleware para JSON
app.use(express.json());

//Configurar CORS
app.use(cors({
  credentials: true
}));


// Conectar ao MongoDB
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('❌ ERRO: A variável MONGO_URI não está definida no ficheiro .env');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB conectado com sucesso!'))
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  });

// Importar rotas
const loginRoutes = require('./login/login');
const incidentRoutes = require('./routes/incidents');

// Usar rotas
app.use('/login', loginRoutes);
app.use('/api/incidents', incidentRoutes);

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Token válido', user: req.user });
});
// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Servidor a correr na porta ${PORT}`));
