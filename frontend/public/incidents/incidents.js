    // ---------- DATA ----------
    function getIncidents() {
      // swap for fetch('/api/incidents') later
      return Promise.resolve([
        { id: 1, title: 'Database connection timeout', priority: 'high',  category: 'software', status: 'open' },
        { id: 2, title: 'Network latency issues',      priority: 'medium',category: 'network', status: 'in-progress' },
        { id: 3, title: 'Printer not responding',      priority: 'low',   category: 'hardware',status: 'closed' }
      ]);
    }

    // ---------- HELPERS ----------
    const capitalize = s => (!s ? '' : String(s)[0].toUpperCase() + String(s).slice(1).toLowerCase());
    const formatStatus = st => ({ open: 'Open', 'in-progress': 'In Progress', closed: 'Closed' }[st] || st);
    const statusClass  = st => (st === 'in-progress' ? 'progress' : st);
    const escapeHtml = str => String(str)
                                .replace(/&/g,'&amp;').replace(/</g,'&lt;')
                                .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const priorityIcon = {
      high:   `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 1a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V1.75A.75.75 0 0110 1zM5.05 6.05a.75.75 0 011.06 0L10 9.94l3.89-3.89a.75.75 0 111.06 1.06L11.06 11l3.89 3.89a.75.75 0 11-1.06 1.06L10 12.06l-3.89 3.89a.75.75 0 01-1.06-1.06L8.94 11 5.05 7.11a.75.75 0 010-1.06z" clip-rule="evenodd"/></svg>`,
      medium: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 3.5a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V4.25a.75.75 0 01.75-.75zM10 1a.75.75 0 000 1.5h.008a.75.75 0 000-1.5H10z"/></svg>`,
      low:    `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-5.464a.75.75 0 10-1.072-1.072L10 11.94l-2.464-2.464a.75.75 0 00-1.072 1.072L8.94 13 6.464 15.464a.75.75 0 101.072 1.072L10 14.06l2.464 2.464a.75.75 0 101.072-1.072L11.06 13l2.464-2.464z" clip-rule="evenodd"/></svg>`
    };

    // ---------- ROW TEMPLATE ----------
    function createRow(inc) {
      return `
        <tr>
          <td data-label="Title">
            <div class="title"><strong>${escapeHtml(inc.title)}</strong>
              <div class="muted">#${inc.id}</div>
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
          <td class="action-cell" data-label="Actions">
            <a class="btn btn-ghost btn-icon"
               href="view_incident.html?id=${inc.id}"
               aria-label="Edit incident ${inc.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 12.5V15h2.5L15 7.5 12.5 5 5 12.5z"/>
              </svg>
              <span>Editar</span>
            </a>
          </td>
        </tr>`;
    }

    // ---------- INIT ----------
    async function initIncidents() {
      const tableBody = document.querySelector('.incidents-table tbody');
      if (!tableBody) return;
      tableBody.setAttribute('aria-live','polite');
      tableBody.innerHTML = '<tr class="skeleton"><td colspan="5">Loading…</td></tr>';

      try {
        const incidents = await getIncidents();
        tableBody.innerHTML = incidents.length
          ? incidents.map(createRow).join('')
          : '<tr class="empty"><td colspan="5">No incidents found.</td></tr>';
      } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr class="error"><td colspan="5">Could not load incidents.</td></tr>';
      }
    }

    document.addEventListener('DOMContentLoaded', initIncidents);