// Função para buscar incidentes (por enquanto dá dados fixos)
function getIncidents() {
  return [
    {
      id: 1,
      title: 'Database connection timeout',
      priority: 'high',
      category: 'software',
      status: 'open'
    },
    {
      id: 2,
      title: 'Network latency issues',
      priority: 'medium',
      category: 'network',
      status: 'in-progress'
    },
    {
      id: 3,
      title: 'Printer not responding',
      priority: 'low',
      category: 'hardware',
      status: 'closed'
    }
  ];
}

// Função para primeira letra capitalizada
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Função para mostrar status
function formatStatus(status) {
  if (status === 'in-progress') return 'In Progress';
  if (status === 'open') return 'Open';
  if (status === 'closed') return 'Closed';
  return status;
}

// Quando o DOM estiver carregado, renderiza os incidentes na tabela
document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('.incidents-table tbody');
  if (!tableBody) return;

  const incidents = getIncidents();

  tableBody.innerHTML = incidents.map(incident => `
    <tr>
      <td><strong>${incident.title}</strong></td>
      <td><span class="pill pill-${incident.priority}">${capitalize(incident.priority)}</span></td>
      <td>${capitalize(incident.category)}</td>
      <td><span class="status status-${incident.status.replace('in-progress', 'progress')}">${formatStatus(incident.status)}</span></td>
    </tr>
  `).join('');
});