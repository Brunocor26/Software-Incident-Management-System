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
    titleCell.setAttribute('data-label', 'Title');
    titleCell.textContent = incident.title;

    const categoryCell = document.createElement("td");
    categoryCell.setAttribute('data-label', 'Category');
    categoryCell.textContent = incident.category;

    const priorityCell = document.createElement("td");
    priorityCell.setAttribute('data-label', 'Priority');
    const prioritySpan = document.createElement("span");
    prioritySpan.textContent = incident.priority;
    // use the same pill classes as `incidents.css`
    prioritySpan.className = 'pill ' + (incident.priority === "High" ? 'pill-high' :
                                      incident.priority === "Medium" ? 'pill-medium' :
                                      'pill-low');
    priorityCell.appendChild(prioritySpan);

    const statusCell = document.createElement("td");
    statusCell.setAttribute('data-label', 'Status');
    const statusSpan = document.createElement("span");
    statusSpan.textContent = incident.status;
    // include the base `status` class so styles like the pulse apply
    statusSpan.className = 'status ' + (incident.status === "Open" ? 'status-open' :
                                        incident.status === "In Progress" ? 'status-progress' :
                                        'status-closed');
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

  const incidentsLink = document.getElementById("incidents-link");
  if (incidentsLink) {
    incidentsLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "../incidents/incidents.html";
    });
  }
});
