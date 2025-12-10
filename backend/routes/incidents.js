const { Router } = require("express");
const { Incident } = require("../models/incidentModel");

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

/* summary (cards + timeline) */
r.get("/summary", async (_req, res) => {
    const [open, closed, total, closedIncidents] = await Promise.all([
        Incident.countDocuments({ status: "open" }),
        Incident.countDocuments({ status: "closed" }),
        Incident.countDocuments({}), // Total count of all incidents
        Incident.find({ status: "closed", "sla.resolvedAt": { $exists: true } }).select("createdAt sla.resolvedAt")
    ]);

    let totalResolutionTime = 0;
    let countWithResolutionTime = 0;

    closedIncidents.forEach(inc => {
        if (inc.createdAt && inc.sla && inc.sla.resolvedAt) {
            const diff = new Date(inc.sla.resolvedAt) - new Date(inc.createdAt);
            if (diff > 0) {
                totalResolutionTime += diff;
                countWithResolutionTime++;
            }
        }
    });

    // Average in minutes
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
        console.log("Creating incident. User:", req.user);
        console.log("Body:", req.body);
        const b = req.body;
        // AI Priority Assignment
        if (!b.priority) {
            try {
                console.log("Auto-detecting priority with Groq AI...");
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
                    console.log("AI suggested priority:", aiPriority);
                    if (["low", "medium", "high"].includes(aiPriority)) {
                        b.priority = aiPriority;
                    } else {
                        console.warn("AI returned invalid priority, defaulting to low.");
                        b.priority = "low";
                    }
                } else {
                    console.error("Groq API error:", await groqResponse.text());
                    b.priority = "low";
                }
            } catch (error) {
                console.error("Error calling Groq AI:", error);
                b.priority = "low";
            }
        }

        const doc = await Incident.create({
            title: b.title,
            description: b.description ?? "",
            category: norm.category(b.category),
            status: norm.status(b.status ?? "open"),
            priority: norm.priority(b.priority ?? "low"),
            assignedTo: b.assignedTo ?? null,
            createdBy: req.user._id,
            tags: b.tags ?? []
        });
        console.log("Incident created:", doc._id);
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
    if (req.query.assignedTo) q.assignedTo = req.query.assignedTo;
    if (req.query.search) q.$text = { $search: String(req.query.search) };

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        Incident.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Incident.countDocuments(q)
    ]);
    res.json({ page, limit, total, items });
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

        console.log("Generating AI suggestion for incident:", doc._id);
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

        if (!groqResponse.ok) {
            throw new Error(await groqResponse.text());
        }

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
        
        // Prevent modification if incident is already closed
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
r.patch("/:id", async (req, res) => {
    try {
        // Check if incident is closed
        const current = await Incident.findById(req.params.id);
        if (!current) return res.status(404).json({ error: "Not found" });
        
        if (current.status === "closed") {
            return res.status(400).json({ error: "Não é possível modificar um incidente fechado" });
        }
        
        const allowed = ["title", "description", "category", "priority", "assignedTo", "tags", "status"];
        const body = Object.fromEntries(
            Object.entries(req.body).filter(([k]) => allowed.includes(k))
        );
        if (body.category) body.category = norm.category(body.category);
        if (body.priority) body.priority = norm.priority(body.priority);

        let pushTimeline = {};
        if (body.status) {
            body.status = norm.status(body.status);
            if (body.status === "closed") body["sla.resolvedAt"] = new Date();

            // Check if status actually changed (optional optimization, but good for timeline)
            if (current.status !== body.status) {
                pushTimeline = { $push: { timeline: { at: new Date(), action: "status_change", note: body.status } } };
            }
        }

        const doc = await Incident.findByIdAndUpdate(
            req.params.id,
            { ...body, ...pushTimeline },
            { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/* attachments upload */
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

r.post("/:id/attachments", upload.array("files"), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const attachments = req.files.map(f => ({
            filename: f.originalname,
            url: `/uploads/${f.filename}`,
            mimeType: f.mimetype,
            size: f.size
        }));

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

        // 1. Remove from DB
        const doc = await Incident.findByIdAndUpdate(
            id,
            { $pull: { attachments: { filename: filename } } },
            { new: true }
        );

        if (!doc) return res.status(404).json({ error: "Incident not found" });

        // 2. Remove from filesystem
        // Note: In a real app, we might want to store the full path or ID to be safer, 
        // but here we rely on the filename being unique enough (it has a timestamp prefix).
        // Also, we should check if the file is actually used by other incidents if we were deduplicating,
        // but here files are unique per upload.
        const filePath = path.join(__dirname, "../uploads", filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json(doc);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

module.exports = r;