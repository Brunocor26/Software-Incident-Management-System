// dashboard.js
const API_BASE = globalThis.location.hostname === 'localhost' || globalThis.location.hostname === '127.0.0.1' 
  ? 'http://127.0.0.1:3000' 
  : '';


// Função para verificar token
async function verifyToken() {
  const token = localStorage.getItem('token'); // pega o token guardado no login

  if (!token) {
    // Se não houver token, redireciona para login
    alert("Precisa de fazer login primeiro.");
    globalThis.location.href = "../login/login.html";
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/protected`, { // rota protegida no backend
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.status === 200) {
      return true; // token válido
    } else {
      // Token inválido ou expirado
      alert("Token inválido ou expirado. Faça login novamente.");
      globalThis.location.href = "../login/login.html";
      return false;
    }
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    globalThis.location.href = "../login/login.html";
    return false;
  }
}

async function fetchDashboardData() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      globalThis.location.href = "../login/login.html";
      return;
    }

    const response = await fetch(`${API_BASE}/api/incidents/summary`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        globalThis.location.href = "../login/login.html";
      }
      throw new Error("Failed to fetch dashboard data");
    }

    const data = await response.json();
    updateDashboard(data);
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

function updateDashboard(data) {
  // Update stats
  document.getElementById("totalCount").textContent = data.total || 0;
  document.getElementById("openCount").textContent = data.open || 0;
  document.getElementById("closedCount").textContent = data.closed || 0;

  const avgTime = data.averageResolutionTime || 0;
  let timeDisplay = avgTime + " min";
  if (avgTime > 60) {
    timeDisplay = (avgTime / 60).toFixed(1) + " h";
  }
  document.getElementById("avgTime").textContent = timeDisplay;

  // Update table
  const tableBody = document.querySelector("#incidentsTable tbody");
  tableBody.innerHTML = ""; // Clear existing

  data.timeline.forEach(incident => {
    const tr = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.dataset.label = 'Title';
    titleCell.textContent = incident.title;

    const categoryCell = document.createElement("td");
    categoryCell.dataset.label = 'Category';
    categoryCell.textContent = incident.category;

    const priorityCell = document.createElement("td");
    priorityCell.dataset.label = 'Priority';
    const prioritySpan = document.createElement("span");
    prioritySpan.textContent = incident.priority;
    let priorityClass = 'pill-low';
    if (incident.priority === "high") {
      priorityClass = 'pill-high';
    } else if (incident.priority === "medium") {
      priorityClass = 'pill-medium';
    }
    prioritySpan.className = 'pill ' + priorityClass;
    priorityCell.appendChild(prioritySpan);

    const dateCell = document.createElement("td");
    dateCell.dataset.label = 'CreationDate';
    dateCell.textContent = new Date(incident.createdAt).toLocaleDateString();

    const statusCell = document.createElement("td");
    statusCell.dataset.label = 'Status';
    const statusSpan = document.createElement("span");
    statusSpan.textContent = incident.status;
    let statusClass = 'status-closed';
    if (incident.status === "open") {
      statusClass = 'status-open';
    } else if (incident.status === "in-progress") {
      statusClass = 'status-progress';
    }
    statusSpan.className = 'status ' + statusClass;
    statusCell.appendChild(statusSpan);

    tr.appendChild(titleCell);
    tr.appendChild(categoryCell);
    tr.appendChild(priorityCell);
    tr.appendChild(statusCell);
    tr.appendChild(dateCell);
    

    tableBody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const isValid = await verifyToken();
  if (isValid) {
    fetchDashboardData();
  }
});

const incidentsLink = document.getElementById("incidents-link");
if (incidentsLink) {
  incidentsLink.addEventListener("click", (e) => {
    e.preventDefault();
    globalThis.location.href = "../incidents/incidents.html";
  });
}
