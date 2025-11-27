// dashboard.js

// Função para verificar token
async function verifyToken() {
  const token = localStorage.getItem('token'); // pega o token guardado no login

  if (!token) {
    // Se não houver token, redireciona para login
    alert("Precisa de fazer login primeiro.");
    window.location.href = "../login/login.html";
    return false;
  }

  try {
    const res = await fetch("http://localhost:3000/protected", { // rota protegida no backend
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
      window.location.href = "../login/login.html";
      return false;
    }
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    window.location.href = "../login/login.html";
    return false;
  }
}

async function fetchDashboardData() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "../login/login.html";
      return;
    }

    const response = await fetch("http://localhost:3000/api/incidents/summary", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "../login/login.html";
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
    titleCell.setAttribute('data-label', 'Title');
    titleCell.textContent = incident.title;

    const categoryCell = document.createElement("td");
    categoryCell.setAttribute('data-label', 'Category');
    categoryCell.textContent = incident.category;

    const priorityCell = document.createElement("td");
    priorityCell.setAttribute('data-label', 'Priority');
    const prioritySpan = document.createElement("span");
    prioritySpan.textContent = incident.priority;
    prioritySpan.className = 'pill ' + (incident.priority === "high" ? 'pill-high' :
      incident.priority === "medium" ? 'pill-medium' :
        'pill-low');
    priorityCell.appendChild(prioritySpan);

    const dateCell = document.createElement("td");
    dateCell.setAttribute('data-label','CreationDate');
    dateCell.textContent = new Date(incident.createdAt).toLocaleDateString();

    const statusCell = document.createElement("td");
    statusCell.setAttribute('data-label', 'Status');
    const statusSpan = document.createElement("span");
    statusSpan.textContent = incident.status;
    statusSpan.className = 'status ' + (incident.status === "open" ? 'status-open' :
      incident.status === "in-progress" ? 'status-progress' :
        'status-closed');
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
    window.location.href = "../incidents/incidents.html";
  });
}
