import fetch from "node-fetch";

const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";

export async function sendSlackNotification(incident) {
  const message = {
    text: "🚨 *Novo Incidente Criado*",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*Título:* ${incident.title}\n` +
            `*Categoria:* ${incident.category}\n` +
            `*Prioridade:* ${incident.priority}\n` +
            `*Estado:* ${incident.status}`
        }
      }
    ]
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    });
  } catch (err) {
    console.error("Erro ao enviar notificação Slack:", err);
  }
}
