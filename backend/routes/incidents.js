const { Router } = require("express");
const mongoose = require("mongoose");
const { Incident } = require("../models/incidentModel");
const User = require("../models/userModel");
const PDFDocument = require("pdfkit");
const notificationService = require("../services/notificationService");
const authenticateToken = require("../middleware/authMiddleware");

const r = Router();

/* helpers de normalização (alinhado com o HTML) */
const norm = {
    status: v => ({ "open": "open", "in-progress": "in-progress", "in_progress": "in-progress", "closed": "closed" }[String(v || "").toLowerCase()]),
    priority: v => ({ "low": "low", "medium": "medium", "high": "high" }[String(v || "").toLowerCase()]),
    category: v => ({
        "software": "software", "network": "network", "hardware": "hardware",
        "aplicacao": "software", "rede": "network", "infra": "hardware"
    }[String(v || "").toLowerCase()])
};

/* helpers de higienização (prevenção NoSQL Injection) */
const clean = {
    str: v => (typeof v === "string" ? v : ""),
    id: v => (mongoose.Types.ObjectId.isValid(v) ? v : null),
    tags: v => (Array.isArray(v) ? v.filter(t => typeof t === "string").map(t => t.trim()) : [])
};

/* --- Helpers Internos para Refatoração --- */

const validateAssignment = async (reqUser, bodyAssignedTo) => {
    const assignedToId = clean.id(bodyAssignedTo);
    if (!assignedToId) throw new Error("ID de usuário inválido.");

    if (reqUser.papel !== "gestorSistemas") {
        throw new Error("Apenas 'gestorSistemas' pode atribuir incidentes.");
    }

    const assignee = await User.findById(assignedToId);
    if (!assignee) throw new Error("Usuário atribuído não encontrado.");
    if (assignee.papel !== "Programador") {
        throw new Error("Incidentes só podem ser atribuídos a usuários com papel 'Programador'.");
    }
    return assignedToId;
};

const buildTimelineUpdate = (currentStatus, newStatus) => {
    if (newStatus && currentStatus !== newStatus) {
        return {
            $push: { timeline: { at: new Date(), action: "status_change", note: newStatus } }
        };
    }
    return {};
};

const handleAssignmentNotification = async (bodyAssignedTo, previousAssignedTo, doc) => {
    if (bodyAssignedTo && String(bodyAssignedTo) !== previousAssignedTo) {
        const assignedUser = await User.findById(bodyAssignedTo);
        if (assignedUser) {
            notificationService.queueNotification(assignedUser, doc, "Incidente atribuído a si");
        }
    }
};

const preprocessPatchBody = (reqBody) => {
    const allowed = new Set(["title", "description", "category", "priority", "assignedTo", "tags", "status"]);
    const body = Object.fromEntries(
        Object.entries(reqBody).filter(([k]) => allowed.has(k))
    );

    if (body.title) body.title = clean.str(body.title);
    if (body.description) body.description = clean.str(body.description);
    if (body.category) body.category = norm.category(body.category);
    if (body.priority) body.priority = norm.priority(body.priority);
    if (body.tags) body.tags = clean.tags(body.tags);

    if (body.status) {
        body.status = norm.status(body.status);
        if (body.status === "closed") body["sla.resolvedAt"] = new Date();
    }
    return body;
};

const handleUpdateNotifications = async (doc, body) => {
    if (body.status || body.priority) {
        const users = await notificationService.getRelevantUsers(doc);
        for (const u of users) {
            if (!notificationService.alreadySent(u._id, doc._id, "update")) {
                notificationService.queueNotification(u, doc, "Atualização de incidente");
            }
        }
    }
};

/* summary (cards + timeline) */
r.get("/summary", async (_req, res) => {
    const [open, closed, total, closedIncidents] = await Promise.all([
        Incident.countDocuments({ status: "open" }),
        Incident.countDocuments({ status: "closed" }),
        Incident.countDocuments({}),
        Incident.find({ status: "closed", "sla.resolvedAt": { $exists: true } }).select("createdAt sla.resolvedAt")
    ]);

    let totalResolutionTime = 0;
    let countWithResolutionTime = 0;

    closedIncidents.forEach(inc => {
        if (inc.createdAt && inc.sla?.resolvedAt) {
            const diff = new Date(inc.sla.resolvedAt) - new Date(inc.createdAt);
            if (diff > 0) {
                totalResolutionTime += diff;
                countWithResolutionTime++;
            }
        }
    });

    const averageResolutionTime = countWithResolutionTime > 0
        ? Math.round((totalResolutionTime / countWithResolutionTime) / (1000 * 60))
        : 0;

    const timeline = await Incident.find().sort({ createdAt: -1 }).limit(10)
        .select("title category priority status createdAt");

    res.json({ open, closed, total, averageResolutionTime, timeline });
});

/* create */
r.post("/", authenticateToken, async (req, res) => {
    try {
        const b = req.body;
        if (!b.priority) {
            try {
                const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-8b-instant",
                        messages: [
                            {
                                role: "system",
                                content: "És um assistente de gestão de incidentes de TI. Analisa o título e a descrição do incidente e atribui uma prioridade: 'low', 'medium' ou 'high'. Retorna APENAS a palavra da prioridade em minúsculas, sem pontuação ou explicação."
                            },
                            {
                                role: "user",
                                content: `Título: ${b.title}\nDescrição: ${b.description || "Sem descrição fornecida."}`
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 10
                    })
                });

                if (groqResponse.ok) {
                    const data = await groqResponse.json();
                    const aiPriority = data.choices[0]?.message?.content?.trim().toLowerCase();
                    if (["low", "medium", "high"].includes(aiPriority)) {
                        b.priority = aiPriority;
                    } else {
                        b.priority = "low";
                    }
                } else {
                    b.priority = "low";
                }
            } catch (error) {
                console.error("Error calling Groq AI:", error);
                b.priority = "low";
            }
        }

        const doc = await Incident.create({
            title: clean.str(b.title),
            description: clean.str(b.description),
            category: norm.category(b.category),
            status: norm.status(b.status ?? "open"),
            priority: norm.priority(b.priority ?? "low"),
            assignedTo: clean.id(b.assignedTo),
            createdBy: req.user._id,
            tags: clean.tags(b.tags)
        });

        try {
            const users = await notificationService.getRelevantUsers(doc);
            for (const u of users) {
                if (!notificationService.alreadySent(u._id, doc._id, "created")) {
                    notificationService.queueNotification(u, doc, "Novo incidente");
                }
            }
        } catch (err) {
            console.error("Notification error:", err);
        }

        res.status(201).json(doc);
    } catch (e) {
        console.error("Error creating incident:", e);
        res.status(400).json({ error: e.message });
    }
});

/* list + filtros + paginação */
r.get("/", async (req, res) => {
    const q = {};
    if (req.query.status) q.status = norm.status(req.query.status);
    if (req.query.priority) q.priority = norm.priority(req.query.priority);
    if (req.query.category) q.category = norm.category(req.query.category);
    if (req.query.assignedTo) q.assignedTo = clean.id(req.query.assignedTo);
    if (req.query.search) q.$text = { $search: clean.str(req.query.search) };
    if (req.query.startDate || req.query.endDate) {
        q.createdAt = {};
        if (req.query.startDate) q.createdAt.$gte = new Date(req.query.startDate);
        if (req.query.endDate) {
            const end = new Date(req.query.endDate);
            end.setHours(23, 59, 59, 999);
            q.createdAt.$lte = end;
        }
    }

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Incident.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('assignedTo', 'name'),
        Incident.countDocuments(q)
    ]);
    res.json({ page, limit, total, items });
});

/* report pdf */
r.get("/report/pdf", async (req, res) => {
    try {
        const q = {};
        if (req.query.status) q.status = norm.status(req.query.status);
        if (req.query.priority) q.priority = norm.priority(req.query.priority);
        if (req.query.category) q.category = norm.category(req.query.category);
        if (req.query.assignedTo) q.assignedTo = clean.id(req.query.assignedTo);
        if (req.query.search) q.$text = { $search: clean.str(req.query.search) };
        if (req.query.startDate || req.query.endDate) {
            q.createdAt = {};
            if (req.query.startDate) q.createdAt.$gte = new Date(req.query.startDate);
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                q.createdAt.$lte = end;
            }
        }

        const items = await Incident.find(q).sort({ createdAt: -1 }).populate("assignedTo", "name email");

        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=report.pdf");

        doc.pipe(res);
        doc.fontSize(20).text("Relatório de Incidentes", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString()}`);
        doc.text(`Filtros: ${JSON.stringify(req.query)}`);
        doc.moveDown();

        items.forEach((item, i) => {
            doc.fontSize(14).text(`#${i + 1} - ${item.title}`, { underline: true });
            doc.fontSize(10).text(`Status: ${item.status} | Prioridade: ${item.priority} | Categoria: ${item.category}`);
            doc.text(`Criado em: ${new Date(item.createdAt).toLocaleString()}`);
            if (item.assignedTo) doc.text(`Atribuído a: ${item.assignedTo.name} (${item.assignedTo.email})`);
            doc.text(`Descrição: ${item.description}`);
            doc.moveDown();
        });

        doc.end();
    } catch (e) {
        console.error("Error generating PDF:", e);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
});

/* get by id */
r.get("/:id", async (req, res) => {
    const doc = await Incident.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
});

/* AI Suggestion */
r.get("/:id/ai-suggestion", authenticateToken, async (req, res) => {
    try {
        const doc = await Incident.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        if (!["open", "in-progress"].includes(doc.status)) {
            return res.status(400).json({ error: "Incident is not open or in-progress" });
        }

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "És um especialista em suporte técnico de TI. Com base no título e descrição do incidente, fornece uma lista concisa de 3 a 5 passos recomendados para resolver o problema. Responde em Português. Formata a resposta como uma lista HTML (<ul><li>...</li></ul>) sem tags de markdown ou texto extra."
                    },
                    {
                        role: "user",
                        content: `Título: ${doc.title}\nDescrição: ${doc.description || "Sem descrição."}\nCategoria: ${doc.category}\nPrioridade: ${doc.priority}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 300
            })
        });

        if (!groqResponse.ok) throw new Error(await groqResponse.text());

        const data = await groqResponse.json();
        const suggestion = data.choices[0]?.message?.content || "Não foi possível gerar uma sugestão.";
        res.json({ suggestion });
    } catch (e) {
        console.error("Error generating AI suggestion:", e);
        res.status(500).json({ error: "Failed to generate suggestion" });
    }
});

/* patch status */
r.patch("/:id/status", async (req, res) => {
    try {
        const doc = await Incident.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        if (doc.status === "closed") {
            return res.status(400).json({ error: "Não é possível modificar um incidente fechado" });
        }

        const status = norm.status(req.body.status);
        const updates = { status };
        if (status === "closed") updates["sla.resolvedAt"] = new Date();
        const pushTimeline = { $push: { timeline: { at: new Date(), action: "status_change", note: status } } };

        const updatedDoc = await Incident.findByIdAndUpdate(
            req.params.id,
            { ...updates, ...pushTimeline },
            { new: true, runValidators: true }
        );
        res.json(updatedDoc);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/* patch genérico (incluindo status) */
r.patch("/:id", authenticateToken, async (req, res) => {
    try {
        const current = await Incident.findById(req.params.id);
        if (!current) return res.status(404).json({ error: "Not found" });

        if (current.status === "closed") {
            return res.status(400).json({ error: "Não é possível modificar um incidente fechado" });
        }

        const previousAssignedTo = current.assignedTo?.toString() ?? null;
        const body = preprocessPatchBody(req.body);

        if (body.assignedTo) {
            body.assignedTo = await validateAssignment(req.user, body.assignedTo);
        }

        const timelineUpdate = buildTimelineUpdate(current.status, body.status);

        const doc = await Incident.findByIdAndUpdate(
            req.params.id,
            { ...body, ...timelineUpdate },
            { new: true, runValidators: true }
        );

        await handleAssignmentNotification(body.assignedTo, previousAssignedTo, doc);
        await handleUpdateNotifications(doc, body);

        res.json(doc);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/* attachments upload */
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

r.post("/:id/attachments", upload.array("files"), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const attachments = req.files.map(f => {
            const b64 = f.buffer.toString("base64");
            const dataURI = `data:${f.mimetype};base64,${b64}`;
            return {
                filename: f.originalname,
                url: dataURI,
                base64: b64,
                mimeType: f.mimetype,
                size: f.size
            };
        });

        const doc = await Incident.findByIdAndUpdate(
            req.params.id,
            { $push: { attachments: { $each: attachments } } },
            { new: true }
        );

        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/* delete attachment */
r.delete("/:id/attachments/:filename", async (req, res) => {
    try {
        const { id, filename } = req.params;
        const doc = await Incident.findByIdAndUpdate(
            id,
            { $pull: { attachments: { filename } } },
            { new: true }
        );

        if (!doc) return res.status(404).json({ error: "Incident not found" });
        res.json(doc);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

module.exports = r;