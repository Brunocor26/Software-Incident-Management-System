const { Router } = require("express");
const mongoose = require("mongoose");
const { Incident } = require("../models/incidentModel");
const User = require("../models/userModel");
const r = Router();

// Mapping external severity to internal priority
const severityMap = {
    "critical": "high",
    "error": "high",
    "warning": "medium",
    "info": "low",
    "high": "high",
    "medium": "medium",
    "low": "low"
};

/* 
  POST /webhook
  RF 10: Integração bidirecional com ferramentas de monitorização.
  Receives alerts and creates incidents.
*/
r.post("/webhook", async (req, res) => {
    try {
        const { title, description, source, severity, details } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const priority = severityMap[String(severity).toLowerCase()] || "low";

        // Find a system user to attribute the incident to
        // We try to find an admin, or fallback to any user
        let systemUser = await User.findOne({ email: "admin@example.com" });
        if (!systemUser) systemUser = await User.findOne({});

        if (!systemUser) {
            return res.status(500).json({ error: "No system user found to create incident." });
        }

        const newIncident = await Incident.create({
            title: `[Alert] ${title}`,
            description: `${description || "No description provided."}\n\nSource: ${source || "Unknown"}\nDetails: ${details ? JSON.stringify(details, null, 2) : "N/A"}`,
            category: "software", // Default category
            status: "open",
            priority: priority,
            createdBy: systemUser._id,
            tags: ["monitoring", "automated"]
        });

        console.log(`[Monitoring] Created incident ${newIncident._id} from source: ${source}`);

        res.status(201).json({
            message: "Incident created successfully",
            incidentId: newIncident._id
        });

    } catch (e) {
        console.error("Monitoring webhook error:", e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = r;
