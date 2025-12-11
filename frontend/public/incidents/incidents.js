// ---------- DATA ----------
async function getIncidents() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "../login/login.html";
    return [];
  }

  try {
    const res = await fetch('http://localhost:3000/api/incidents?limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "../login/login.html";
        return [];
      }
      throw new Error('Failed to fetch incidents');
    }

    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// ---------- HELPERS ----------
const capitalize = s => (!s ? '' : String(s)[0].toUpperCase() + String(s).slice(1).toLowerCase());
const formatStatus = st => ({ open: 'Open', 'in-progress': 'In Progress', closed: 'Closed' }[st] || st);
const statusClass = st => (st === 'in-progress' ? 'progress' : st);
const escapeHtml = str => String(str)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const priorityIcon = {
  high: `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 1a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V1.75A.75.75 0 0110 1zM5.05 6.05a.75.75 0 011.06 0L10 9.94l3.89-3.89a.75.75 0 111.06 1.06L11.06 11l3.89 3.89a.75.75 0 11-1.06 1.06L10 12.06l-3.89 3.89a.75.75 0 01-1.06-1.06L8.94 11 5.05 7.11a.75.75 0 010-1.06z" clip-rule="evenodd"/></svg>`,
  medium: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 3.5a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V4.25a.75.75 0 01.75-.75zM10 1a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H10z"/></svg>`,
  low: `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-5.464a.75.75 0 10-1.072-1.072L10 11.94l-2.464-2.464a.75.75 0 00-1.072 1.072L8.94 13 6.464 15.464a.75.75 0 101.072 1.072L10 14.06l2.464 2.464a.75.75 0 101.072-1.072L11.06 13l2.464-2.464z" clip-rule="evenodd"/></svg>`
};

// ---------- ROW TEMPLATE ----------
function createRow(inc) {
  return `
        <tr>
          <td data-label="Title">
            <div class="title"><strong>${escapeHtml(inc.title)}</strong>
              <div class="muted">#${inc._id.slice(-6)}</div>
            </div>
          </td>
          <td data-label="Priority">
            <span class="pill pill-${inc.priority}">
              ${priorityIcon[inc.priority]} ${capitalize(inc.priority)}
            </span>
          </td>
          <td data-label="Category">${capitalize(inc.category)}</td>
          <td data-label="Status">
            <span class="status status-${statusClass(inc.status)}">${formatStatus(inc.status)}</span>
          </td>
          <td data-label="Assigned To">
            ${inc.assignedTo ? `<span class="badge badge-secondary" style="background: #e0f2fe; color: #0369a1;">${inc.assignedTo.name}</span>` : '-'}
          </td>
          <td class="action-cell" data-label="Actions">
            <button class="btn btn-ghost btn-icon assign-btn" data-id="${inc._id}" aria-label="Assign incident ${inc._id}">
               <span>Assign</span>
            </button>
            <a class="btn btn-ghost btn-icon"
               href="view_incident.html?id=${inc._id}"
               aria-label="Edit incident ${inc._id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 12.5V15h2.5L15 7.5 12.5 5 5 12.5z"/>
              </svg>
              <span>Editar</span>
            </a>
          </td>
        </tr>`;
}

let allIncidents = [];

// ---------- INIT ----------
async function initIncidents() {
  const tableBody = document.querySelector('.incidents-table tbody');
  if (!tableBody) return;
  tableBody.setAttribute('aria-live', 'polite');
  tableBody.innerHTML = '<tr class="skeleton"><td colspan="5">Loading…</td></tr>';

  try {
    let incidents = await getIncidents();
    allIncidents = incidents; // guardar lista completa
    renderTable(incidents);


    //  Filtragem 
    const filterSelect = document.getElementById('filters-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', async (e) => {
        const value = e.target.value;
        if (!value) {
          incidents = await getIncidents();
        } else {
          const [key, val] = value.split(':');
          const all = await getIncidents();
          incidents = all.filter(i => i[key] === val);
        }
        renderTable(incidents);
      });
    }

  } catch (err) {
    console.error(err);
    tableBody.innerHTML = '<tr class="error"><td colspan="5">Could not load incidents.</td></tr>';
  }

  //  função para renderizar os incidentes
  function renderTable(list) {
    tableBody.innerHTML = list.length
      ? list.map(createRow).join('')
      : '<tr class="empty"><td colspan="5">No incidents found.</td></tr>';
  }

    // --- PESQUISA ---
  const searchForm = document.querySelector(".search");
  const searchInput = document.getElementById("search-input");

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        renderTable(allIncidents);
        return;
      }

      const filtered = allIncidents.filter(inc =>
        inc.title.toLowerCase().includes(query) ||
        inc.category.toLowerCase().includes(query) ||
        inc.priority.toLowerCase().includes(query) ||
        inc.status.toLowerCase().includes(query) ||
        inc._id.toLowerCase().includes(query)
      );

      renderTable(filtered);
    });
  }

    // --- ASSIGNMENT ---
    const assignModal = document.getElementById('assign-modal');
    const closeModal = document.querySelector('.close-modal');
    const assignForm = document.getElementById('assign-form');
    const assignSelect = document.getElementById('assign-user');
    const assignInputId = document.getElementById('assign-incident-id');

    // Fetch users for dropdown
    try {
        const res = await fetch('http://localhost:3000/users');
        if (res.ok) {
            const users = await res.json();
            users.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u._id;
                opt.textContent = u.name;
                assignSelect.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Failed to load users", e);
    }

    // Open modal
    document.addEventListener('click', (e) => {
        if (e.target.closest('.assign-btn')) {
            const btn = e.target.closest('.assign-btn');
            const id = btn.dataset.id;
            assignInputId.value = id;
            assignModal.classList.remove('hidden');
        }
    });

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            assignModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === assignModal) {
            assignModal.classList.add('hidden');
        }
    });

    // Submit assignment
    if (assignForm) {
        assignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const incidentId = assignInputId.value;
            const userId = assignSelect.value;
            const token = localStorage.getItem('token');

            try {
                const res = await fetch(`http://localhost:3000/api/incidents/${incidentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ assignedTo: userId })
                });

                if (res.ok) {
                    assignModal.classList.add('hidden');
                    initIncidents(); // Refresh table
                } else {
                    alert('Failed to assign incident');
                }
            } catch (err) {
                console.error(err);
                alert('Error assigning incident');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initIncidents);
