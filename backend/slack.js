const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "https://hooks.slack.com/services/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";

async function sendSlackNotification(incident) {
  const message = {
    text: "Novo Incidente Criado",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*Titulo:* ${incident.title}\n` +
            `*Categoria:* ${incident.category}\n` +
            `*Prioridade:* ${incident.priority}\n` +
            `*Estado:* ${incident.status}`
        }
      }
    ]
  };

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
        console.error("Slack API returned error:", response.status, await response.text());
    }
  } catch (err) {
    console.error("Erro ao enviar notificacao Slack:", err);
  }
}

module.exports = { sendSlackNotification };
