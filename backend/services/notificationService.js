const User = require("../models/userModel");
const nodemailer = require("nodemailer");

// ---- Fila em memória (simples e suficiente para frequência) ----
let queue = [];
const sent = new Set();

// ---- Transporter ----
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NOTIFY_EMAIL,
        pass: process.env.NOTIFY_EMAIL_PASS
    }
});

// ---- RF5: obter utilizadores relevantes ----
async function getRelevantUsers(incident) {
    const ids = new Set();

    if (incident.createdBy) ids.add(String(incident.createdBy));
    if (incident.assignedTo) ids.add(String(incident.assignedTo));

    return User.find({ _id: { $in: [...ids] } });
}

// ---- evitar duplicados ----
function alreadySent(userId, incidentId, action) {
    const key = `${userId}-${incidentId}-${action}`;
    if (sent.has(key)) return true;
    sent.add(key);
    return false;
}

// ---- colocar na fila ----
function queueNotification(user, incident, action) {
    console.log(`Queueing notification: User=${user.email}, Action=${action}`);
    queue.push({
        userId: user._id,
        email: user.email,
        priority: incident.priority,
        title: incident.title,
        action,
        time: new Date()
    });
}

// ---- RF6 / RF15: agrupar ----
function groupNotifications() {
    const grouped = {};

    for (const n of queue) {
        const key = `${n.userId}-${n.priority}`;
        if (!grouped[key]) {
            grouped[key] = {
                email: n.email,
                priority: n.priority,
                items: []
            };
        }
        grouped[key].items.push(`${n.action}: ${n.title}`);
    }

    queue = [];
    return Object.values(grouped);
}

// ---- HTML Generator ----
function generateEmailHtml(groups) {
    const priorityColors = {
        high: "#ef4444",
        medium: "#f97316",
        low: "#3bf641ff"
    };

    let itemsHtml = "";

    // Flatten groups into a single list or keep grouped
    // Here we'll iterate through groups and list items
    for (const g of groups) {
        const color = priorityColors[g.priority] || "#6b7280";
        itemsHtml += `
            <div style="margin-bottom: 20px; border-left: 4px solid ${color}; padding-left: 15px;">
                <h3 style="margin: 0 0 5px 0; color: #1f2937;">Prioridade: <span style="color: ${color}; text-transform: capitalize;">${g.priority}</span></h3>
                <ul style="padding-left: 20px; color: #4b5563;">
                    ${g.items.map(item => `<li style="margin-bottom: 5px;">${item}</li>`).join("")}
                </ul>
            </div>
        `;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background-color: #111827; color: #ffffff; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .footer { background-color: #f9fafb; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">Gestão de Incidentes</h1>
            </div>
            <div class="content">
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Olá,</p>
                <p style="color: #374151; margin-bottom: 20px;">Você tem novas notificações de incidentes:</p>
                ${itemsHtml}
                <div style="margin-top: 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5500/frontend/public/incidents/incidents.html'}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Aceder à Plataforma</a>
                </div>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Software Incident Management System.
            </div>
        </div>
    </body>
    </html>
    `;
}

// ---- envio de email ----
async function sendGroupedEmails() {
    const groups = groupNotifications();

    if (groups.length === 0) return;
    console.log(`Sending grouped emails to ${groups.length} groups...`);

    // In this grouped structure, each 'g' is for a specific user+priority, but typically we want to group by USER for the email really,
    // or send multiple emails if we keep this structure.
    // The current structure is: key = `${n.userId}-${n.priority}`. So one user might receive multiple emails if they have incidents of different priorities.
    // To make it nicer, we could regroup by user, but let's stick to the current logic for now but beautify the content.
    // Ideally, we'd refactor to group by User -> [List of Incidents], but let's respect the current "groups" behavior which is 1 call per group object.

    for (const g of groups) {
        try {
            await transporter.sendMail({
                to: g.email,
                subject: `📢 Notificações de Incidentes (${g.priority})`,
                text: g.items.map(i => `- ${i}`).join("\n"), // Fallback
                html: generateEmailHtml([g]) // We pass generic array to reuse the generator logic
            });
            console.log(`Email sent to ${g.email}`);
        } catch (error) {
            console.error(`Failed to send email to ${g.email}:`, error);
        }
    }
}

// ---- Process queue periodicamente (ex: 30 segundos) ----
setInterval(() => {
    sendGroupedEmails().catch(err => console.error("Error in notification interval:", err));
}, 30 * 1000);

module.exports = { getRelevantUsers, alreadySent, queueNotification, sendGroupedEmails };
