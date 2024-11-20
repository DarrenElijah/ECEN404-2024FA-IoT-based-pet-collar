// auth.js
document.addEventListener('DOMContentLoaded', function () {
    // Fetch user info from the server
    fetch('/api/user', {
        method: 'GET',
        credentials: 'include', // Include cookies
    })
    .then(response => {
        if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
        } else {
            return response.json();
        }
    })
    .then(data => {
        if (data) {
            console.log('Authenticated user:', data);
            // Optionally, set user-specific data in localStorage or elsewhere
            localStorage.setItem('userEmail', data.email);
        }
    })
    .catch(error => {
        console.error('Authentication check error:', error);
        window.location.href = 'login.html';
    });
});
