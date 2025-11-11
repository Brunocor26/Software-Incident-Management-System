// dashboard.js

// Função para verificar token
async function verifyToken() {
  const token = localStorage.getItem('token'); // pega o token guardado no login

  if (!token) {
    // Se não houver token, redireciona para login
    alert("Você precisa fazer login primeiro.");
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

// Verifica token antes de continuar
verifyToken().then(isValid => {
  if (!isValid) return;

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

  function createIncidentRow(incident) {
    const tr = document.createElement("tr");
    const titleCell = document.createElement("td");
    titleCell.textContent = incident.title;

    const categoryCell = document.createElement("td");
    categoryCell.textContent = incident.category;

    const priorityCell = document.createElement("td");
    const prioritySpan = document.createElement("span");
    prioritySpan.textContent = incident.priority;
    prioritySpan.className = incident.priority === "High" ? "priority-high" :
                             incident.priority === "Medium" ? "priority-medium" :
                             "priority-low";
    priorityCell.appendChild(prioritySpan);

    const statusCell = document.createElement("td");
    const statusSpan = document.createElement("span");
    statusSpan.textContent = incident.status;
    statusSpan.className = incident.status === "Open" ? "status-open" :
                           incident.status === "In Progress" ? "status-progress" :
                           "status-closed";
    statusCell.appendChild(statusSpan);

    tr.appendChild(titleCell);
    tr.appendChild(categoryCell);
    tr.appendChild(priorityCell);
    tr.appendChild(statusCell);

    return tr;
  }

  const tableBody = document.querySelector("#incidentsTable tbody");
  incidents.forEach(incident => tableBody.appendChild(createIncidentRow(incident)));

  const openCount = incidents.filter(i => i.status === "Open").length;
  const closedCount = incidents.filter(i => i.status === "Closed").length;

  document.getElementById("openCount").textContent = openCount;
  document.getElementById("closedCount").textContent = closedCount;

  document.getElementById("incidents-link").addEventListener("click", () => {
    window.location.href = "../incidents/incidents.html";
  });
});
