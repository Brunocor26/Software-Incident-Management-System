// dashboard.js

// Lista de incidentes
const incidents = [
  {
    title: "Database connection timeout",
    category: "Software",
    priority: "High",
    status: "Open"
  },
  {
    title: "Network latency issues",
    category: "Network",
    priority: "Medium",
    status: "In Progress"
  },
  {
    title: "Printer not responding",
    category: "Hardware",
    priority: "Low",
    status: "Closed"
  }
];

// Função que cria uma linha de tabela para cada incidente
function createIncidentRow(incident) {
  const tr = document.createElement("tr");

  const titleCell = document.createElement("td");
  titleCell.textContent = incident.title;

  const categoryCell = document.createElement("td");
  categoryCell.textContent = incident.category;

  const priorityCell = document.createElement("td");
  const prioritySpan = document.createElement("span");
  prioritySpan.textContent = incident.priority;

  if (incident.priority === "High") prioritySpan.className = "priority-high";
  else if (incident.priority === "Medium") prioritySpan.className = "priority-medium";
  else prioritySpan.className = "priority-low";

  priorityCell.appendChild(prioritySpan);

  const statusCell = document.createElement("td");
  const statusSpan = document.createElement("span");
  statusSpan.textContent = incident.status;

  if (incident.status === "Open") statusSpan.className = "status-open";
  else if (incident.status === "In Progress") statusSpan.className = "status-progress";
  else statusSpan.className = "status-closed";

  statusCell.appendChild(statusSpan);

  tr.appendChild(titleCell);
  tr.appendChild(categoryCell);
  tr.appendChild(priorityCell);
  tr.appendChild(statusCell);

  return tr;
}

// Inserir incidentes na tabela
const tableBody = document.querySelector("#incidentsTable tbody");
incidents.forEach(incident => {
  tableBody.appendChild(createIncidentRow(incident));
});

// Atualizar contadores
const openCount = incidents.filter(i => i.status === "Open").length;
const closedCount = incidents.filter(i => i.status === "Closed").length;

document.getElementById("openCount").textContent = openCount;
document.getElementById("closedCount").textContent = closedCount;

// Quando clicares em "Incidents" na sidebar → abre a página do amigo
document.getElementById("incidents-link").addEventListener("click", () => {
  window.location.href = "../incidents/incidents.html"; // muda o nome se o ficheiro do teu amigo for diferente
});
