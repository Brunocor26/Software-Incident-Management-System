import { Router } from "express";
import { Incident } from "../models/Incident.js";

const r = Router();

/* helpers de normalização (alinhado com o HTML) */
const norm = {
  status:   v => ({ "open":"open", "in-progress":"in-progress", "in_progress":"in-progress", "closed":"closed" }[String(v || "").toLowerCase()]),
  priority: v => ({ "low":"low", "medium":"medium", "high":"high" }[String(v || "").toLowerCase()]),
  category: v => ({ "software":"software", "network":"network", "hardware":"hardware",
                    "aplicacao":"software", "rede":"network", "infra":"hardware" }[String(v || "").toLowerCase()])
};

/* summary (cards + timeline) */
r.get("/__summary/cards", async (_req, res) => {
  const [open, closed] = await Promise.all([
    Incident.countDocuments({ status: "open" }),
    Incident.countDocuments({ status: "closed" })
  ]);
  const timeline = await Incident.find().sort({ createdAt: -1 }).limit(10)
    .select("title category priority status createdAt");
  res.json({ open, closed, timeline });
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
  if (req.query.status)     q.status     = norm.status(req.query.status);
  if (req.query.priority)   q.priority   = norm.priority(req.query.priority);
  if (req.query.category)   q.category   = norm.category(req.query.category);
  if (req.query.assignedTo) q.assignedTo = req.query.assignedTo;
  if (req.query.search)     q.$text      = { $search: String(req.query.search) };

  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip  = (page - 1) * limit;

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

/* patch genérico */
r.patch("/:id", async (req, res) => {
  try {
    const allowed = ["title","description","category","priority","assignedTo","tags"];
    const body = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (body.category) body.category = norm.category(body.category);
    if (body.priority) body.priority = norm.priority(body.priority);

    const doc = await Incident.findByIdAndUpdate(
      req.params.id, body, { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* attachments desativados (stub) */
r.post("/:id/attachments", (_req, res) => {
  res.status(501).json({ error: "Attachments feature is disabled" });
});

export default r;
