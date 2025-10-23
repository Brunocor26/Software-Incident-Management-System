const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // 🔹 importar cors
require('dotenv').config();

const app = express();

// Middleware para JSON
app.use(express.json());

//Configurar CORS
app.use(cors({
  origin: 'http://127.0.0.1:5500',
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

// Usar rotas
app.use('/login', loginRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Servidor a correr na porta ${PORT}`));
