import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Incident } from "../models/incidentModel.js";

const mongoURI = process.env.MONGO_URI;
await mongoose.connect(mongoURI);
console.log("✅ Conectado ao MongoDB");

// Limpar base de dados
await Incident.deleteMany({});
console.log("🗑️  Incidentes antigos removidos");

// IDs de exemplo
const userId1 = new mongoose.Types.ObjectId();
const userId2 = new mongoose.Types.ObjectId();
const userId3 = new mongoose.Types.ObjectId();

// Dados dos incidentes
const incidentes = [
    {
        title: "Servidor de email offline",
        description: "O servidor de email principal não está a responder. Utilizadores não conseguem enviar/receber emails.",
        category: "network",
        status: "open",
        priority: "high",
        createdBy: userId1,
        assignedTo: userId2,
        tags: ["urgente", "email", "servidor"],
        timeline: [{
            action: "created",
            note: "Incidente criado automaticamente pelo sistema"
        }]
    },
    {
        title: "Bug no login do sistema",
        description: "Alguns utilizadores reportam erro ao fazer login. Aparece mensagem 'Invalid credentials' mesmo com password correta.",
        category: "software",
        status: "in-progress",
        priority: "high",
        createdBy: userId1,
        assignedTo: userId3,
        tags: ["bug", "login", "autenticação"],
        timeline: [{
            action: "created",
            note: "Reportado por 5 utilizadores"
        }]
    },
    {
        title: "Impressora do 3º andar avariada",
        description: "Impressora HP do departamento de RH não imprime. Luz vermelha a piscar.",
        category: "hardware",
        status: "open",
        priority: "low",
        createdBy: userId2,
        assignedTo: null,
        tags: ["impressora", "hardware"]
    },
    {
        title: "Lentidão no sistema de vendas",
        description: "Sistema de vendas muito lento desde hoje de manhã. Operações demoram >30 segundos.",
        category: "software",
        status: "in-progress",
        priority: "medium",
        createdBy: userId3,
        assignedTo: userId1,
        tags: ["performance", "vendas"]
    },
    {
        title: "WiFi instável no escritório",
        description: "Conexão WiFi cai constantemente. Afeta toda a equipa do 2º piso.",
        category: "network",
        status: "open",
        priority: "medium",
        createdBy: userId2,
        tags: ["wifi", "rede"]
    },
    {
        title: "Atualização de segurança aplicada",
        description: "Aplicadas patches de segurança no servidor principal.",
        category: "software",
        status: "closed",
        priority: "high",
        createdBy: userId1,
        assignedTo: userId1,
        tags: ["segurança", "manutenção"],
        sla: {
            targetHours: 24,
            breached: false,
            resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // há 2h
        },
        timeline: [{
            action: "created",
            note: "Patch de segurança disponível"
        }, {
            action: "resolved",
            note: "Patch aplicado com sucesso"
        }]
    },
    {
        title: "Backup noturno falhou",
        description: "Backup automático das 02:00 falhou. Verificar logs do servidor.",
        category: "software",
        status: "open",
        priority: "high",
        createdBy: userId3,
        assignedTo: userId1,
        tags: ["backup", "crítico"]
    },
    {
        title: "Monitor com defeito",
        description: "Monitor do posto 14 com linhas verticais. Precisa substituição.",
        category: "hardware",
        status: "closed",
        priority: "low",
        createdBy: userId2,
        assignedTo: userId2,
        tags: ["monitor", "hardware"],
        sla: {
            targetHours: 24,
            breached: false,
            resolvedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // há 5h
        }
    },
    {
        title: "Acesso VPN intermitente",
        description: "Colaboradores remotos reportam desconexões frequentes na VPN.",
        category: "network",
        status: "in-progress",
        priority: "medium",
        createdBy: userId1,
        assignedTo: userId3,
        tags: ["vpn", "remoto"]
    },
    {
        title: "Erro no relatório mensal",
        description: "Relatório de vendas mostra valores incorretos no mês de outubro.",
        category: "software",
        status: "open",
        priority: "medium",
        createdBy: userId3,
        tags: ["relatório", "bug"]
    }
];

// Guardar na BD
await Incident.insertMany(incidentes);
console.log(`\n✅ ${incidentes.length} incidentes criados com sucesso!\n`);

// Resumo
const total = await Incident.countDocuments();
const abertos = await Incident.countDocuments({ status: "open" });
const emProgresso = await Incident.countDocuments({ status: "in-progress" });
const fechados = await Incident.countDocuments({ status: "closed" });

console.log("📊 Resumo:");
console.log(`   Total: ${total}`);
console.log(`   Abertos: ${abertos}`);
console.log(`   Em progresso: ${emProgresso}`);
console.log(`   Fechados: ${fechados}`);

await mongoose.disconnect();
console.log("\n✅ Concluído!");
