const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:3000' 
    : '';

document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('report-filters');
    const exportPdfBtn = document.getElementById('export-pdf');
    const tableBody = document.getElementById('reports-body');

    // Load initial data (optional, or wait for user to filter)
    fetchReports();

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchReports();
    });

    exportPdfBtn.addEventListener('click', () => {
        exportPDF();
    });

    async function fetchReports() {
        const params = new URLSearchParams(new FormData(filterForm));
        
        try {
            const response = await fetch(`${API_BASE}/api/incidents?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch reports');
            
            const data = await response.json();
            renderTable(data.items);
        } catch (error) {
            console.error('Error:', error);
            tableBody.innerHTML = '<tr><td colspan="6">Error loading reports</td></tr>';
        }
    }

    function renderTable(items) {
        tableBody.innerHTML = '';
        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No incidents found</td></tr>';
            return;
        }

        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.title}</td>
                <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                <td><span class="badge badge-${getBadgeClass(item.status)}">${item.status}</span></td>
                <td>${item.priority}</td>
                <td>${item.category}</td>
                <td>${item.assignedTo || '-'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    async function exportPDF() {
        const params = new URLSearchParams(new FormData(filterForm));
        
        try {
            const response = await fetch(`${API_BASE}/api/incidents/report/pdf?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to generate PDF');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'incident_report.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF');
        }
    }

    function getBadgeClass(status) {
        switch (status) {
            case 'open': return 'danger';
            case 'in-progress': return 'warning';
            case 'closed': return 'success';
            default: return 'secondary';
        }
    }
});
