
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear token
            localStorage.removeItem('token');
            // Redirect to login
            window.location.href = '../login/login.html';
        });
    }
});
