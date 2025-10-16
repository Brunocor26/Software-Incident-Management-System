import { Router } from "express";
import { Incident } from "../models/Incident.js";

const r = Router();

// Criar incidente
r.post("/", async (req, res) => {
  try {
    const { title, description, category, severity, createdBy, assignee, tags=[] } = req.body;
    const doc = await Incident.create({ title, description, category, severity, createdBy, assignee, tags });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Listar (filtros simples)
r.get("/", async (req, res) => {
  const q = {};
  if (req.query.status)   q.status = req.query.status;
  if (req.query.assignee) q.assignee = req.query.assignee;
  if (req.query.search)   q.$text = { $search: String(req.query.search) };
  const data = await Incident.find(q).sort({ createdAt: -1 }).limit(50);
  res.json(data);
});


r.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // "new" | "ack" | "in_progress" | "resolved" | "closed"
    const updates = { status };

    if (status === "resolved" || status === "closed") {
      updates["sla.resolvedAt"] = new Date();
    }

    const doc = await Incident.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


r.get("/:id", async (req, res) => {
  const doc = await Incident.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});


export default r;
