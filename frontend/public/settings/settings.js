document.addEventListener('DOMContentLoaded', () => {
    const teamBody = document.getElementById('team-members-body');

    fetchUsers();

    async function fetchUsers() {
        try {
            const response = await fetch('http://localhost:3000/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error:', error);
            if (teamBody) {
                teamBody.innerHTML = '<tr><td colspan="3">Error loading users</td></tr>';
            }
        }
    }

    function renderUsers(users) {
        if (!teamBody) return;
        
        teamBody.innerHTML = '';
        if (users.length === 0) {
            teamBody.innerHTML = '<tr><td colspan="3">No users found</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge badge-secondary">${user.papel || 'User'}</span></td>
            `;
            teamBody.appendChild(row);
        });
    }
});
