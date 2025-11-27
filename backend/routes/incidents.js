const { Router } = require("express");
const { Incident } = require("../models/incidentModel");

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
r.post("/", async (req, res) => {
    try {
        const b = req.body;
        const doc = await Incident.create({
            title: b.title,
            description: b.description ?? "",
            category: norm.category(b.category),
            status: norm.status(b.status ?? "open"),
            priority: norm.priority(b.priority ?? "low"),
            assignedTo: b.assignedTo ?? null,
            createdBy: b.createdBy,
            tags: b.tags ?? []
        });
        res.status(201).json(doc);
    } catch (e) {
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

/* patch status */
r.patch("/:id/status", async (req, res) => {
    try {
        const status = norm.status(req.body.status);
        const updates = { status };
        if (status === "closed") updates["sla.resolvedAt"] = new Date();
        const pushTimeline = { $push: { timeline: { at: new Date(), action: "status_change", note: status } } };

        const doc = await Incident.findByIdAndUpdate(
            req.params.id,
            { ...updates, ...pushTimeline },
            { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/* patch genérico (incluindo status) */
r.patch("/:id", async (req, res) => {
    try {
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
            const current = await Incident.findById(req.params.id);
            if (current && current.status !== body.status) {
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